"""Isolated authoring safety tests; never writes repository content."""
import hashlib
import http.client
import importlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch


class WriterFixture:
    def setUp(self):
        self.assertIsNotNone(importlib.util.find_spec('tools.authoring_write'), 'authoring writer is not implemented')
        self.mod = importlib.import_module('tools.authoring_write')
        temporary_root = Path(__file__).resolve().parents[1] / 'tmp' / 'authoring-tests'
        temporary_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temporary_root)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'content/ui/menu-layout.json'
        self.source.parent.mkdir(parents=True)
        self.source.write_bytes(b'{"schemaVersion":1,"value":1}\n')
        self.before = self.source.read_bytes()
        self.output = self.root / 'content/ui/menu-layout-data.js'
        self.output.write_bytes(b'previous-good-output')
        self.validators = {'menu-layout': self.validate}
        self.writer = self.mod.AuthoringWriter(self.root, validators=self.validators, builders={})
        self.request = {'resourceId': 'menu-layout', 'schemaVersion': 1,
                        'baseHash': hashlib.sha256(self.before).hexdigest(),
                        'payload': {'schemaVersion': 1, 'value': 2}}

    @staticmethod
    def validate(payload):
        if payload.get('value', 0) < 0:
            raise ValueError('invalid fixture')


class WriterTests(WriterFixture, unittest.TestCase):
    def test_valid_write_returns_hash_of_actual_source(self):
        result = self.writer.save(self.request)
        self.assertTrue(result['sourceSaved'])
        self.assertFalse(result['applied'])
        self.assertEqual(json.loads(self.source.read_bytes())['value'], 2)
        self.assertEqual(result['hash'], hashlib.sha256(self.source.read_bytes()).hexdigest())
        self.assertEqual(self.writer.read('menu-layout')['hash'], result['hash'])

    def test_conflict_keeps_external_edit(self):
        self.source.write_bytes(b'{"schemaVersion":1,"value":9}')
        with self.assertRaises(self.mod.AuthoringError) as caught:
            self.writer.save(self.request)
        self.assertEqual(caught.exception.code, 'CONFLICT')
        self.assertEqual(json.loads(self.source.read_bytes())['value'], 9)

    def test_rejects_unknown_resources_paths_and_prototype_keys(self):
        for resource in ['../menu-layout', 'scene/../../archive', '__proto__', 'constructor', 'scene/home/extra', 'archive/clb-hoi', '/content/ui/menu-layout.json']:
            with self.subTest(resource=resource), self.assertRaises(self.mod.AuthoringError):
                self.writer.save({**self.request, 'resourceId': resource})
        for key in ['__proto__', 'constructor', 'prototype']:
            with self.subTest(key=key), self.assertRaises(self.mod.AuthoringError):
                self.writer.save({**self.request, 'payload': {'schemaVersion': 1, 'nested': {key: {}}}})
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_rejects_schema_invalid_payload_and_unknown_request_fields(self):
        for change in [{'schemaVersion': 2}, {'schemaVersion': True}, {'payload': {'schemaVersion': 2}},
                       {'payload': {'schemaVersion': 1, 'value': -1}}, {'path': 'runtime.js'},
                       {'payload': {'schemaVersion': 1, 'value': float('nan')}}]:
            with self.subTest(change=change), self.assertRaises(self.mod.AuthoringError):
                self.writer.save({**self.request, **change})
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_missing_validator_fails_closed(self):
        writer = self.mod.AuthoringWriter(self.root, validators={}, builders={})
        with self.assertRaises(self.mod.AuthoringError):
            writer.save(self.request)
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_interrupted_atomic_replace_preserves_source(self):
        with patch.object(self.mod.os, 'replace', side_effect=OSError('interrupted')):
            with self.assertRaises(self.mod.AuthoringError):
                self.writer.save(self.request)
        self.assertEqual(self.source.read_bytes(), self.before)
        self.assertEqual(list(self.source.parent.glob('*.tmp')), [])

    def test_symlink_source_cannot_write_outside_root(self):
        outside = self.root / 'outside.json'
        outside.write_bytes(self.before)
        self.source.unlink()
        try:
            self.source.symlink_to(outside)
        except OSError:
            self.skipTest('symlink creation unavailable')
        with self.assertRaises(self.mod.AuthoringError):
            self.writer.save(self.request)
        self.assertEqual(outside.read_bytes(), self.before)

    @unittest.skipUnless(__import__('os').name == 'nt', 'Windows junction fixture')
    def test_junction_parent_cannot_redirect_allowlisted_source(self):
        import _winapi
        real = self.root / 'outside-ui'
        self.source.parent.rename(real)
        _winapi.CreateJunction(str(real), str(self.source.parent))
        self.addCleanup(self.source.parent.rmdir)
        with self.assertRaises(self.mod.AuthoringError):
            self.writer.save(self.request)
        self.assertEqual((real / 'menu-layout.json').read_bytes(), self.before)

    def test_compile_failure_preserves_previous_generated_output_and_reports_source_saved(self):
        def broken(payload):
            raise ValueError('compile interrupted')
        writer = self.mod.AuthoringWriter(self.root, validators=self.validators, builders={'menu-layout': broken})
        result = writer.save(self.request)
        self.assertTrue(result['sourceSaved'])
        self.assertFalse(result['applied'])
        self.assertEqual(result['buildError'], 'BUILD_FAILED')
        self.assertEqual(self.output.read_bytes(), b'previous-good-output')
        self.assertEqual(json.loads(self.source.read_bytes())['value'], 2)

    def test_successful_compiler_applies_generated_output(self):
        writer = self.mod.AuthoringWriter(self.root, validators=self.validators,
            builders={'menu-layout': lambda payload: {'content/ui/menu-layout-data.js': b'new-compiled-output'}})
        result = writer.save(self.request)
        self.assertTrue(result['applied'])
        self.assertIsNone(result['buildError'])
        self.assertEqual(self.output.read_bytes(), b'new-compiled-output')

    def test_generated_write_failure_rolls_back_previous_outputs(self):
        regions = self.output.with_name('menu-layout-regions.js')
        regions.write_bytes(b'previous-regions')
        writer = self.mod.AuthoringWriter(self.root, validators=self.validators,
            builders={'menu-layout': lambda payload: {'content/ui/menu-layout-data.js': b'new',
                'content/ui/menu-layout-regions.js': b'new-regions'}})
        original_replace = self.mod.os.replace
        def fail_generated(src, dst):
            if Path(dst) == regions:
                raise OSError('output unavailable')
            return original_replace(src, dst)
        with patch.object(self.mod.os, 'replace', side_effect=fail_generated):
            result = writer.save(self.request)
        self.assertTrue(result['sourceSaved'])
        self.assertFalse(result['applied'])
        self.assertEqual(self.output.read_bytes(), b'previous-good-output')
        self.assertEqual(regions.read_bytes(), b'previous-regions')

    def test_compiler_cannot_write_runtime_code_or_archive(self):
        runtime = self.root / 'runtime.js'
        runtime.write_bytes(b'original-runtime')
        writer = self.mod.AuthoringWriter(self.root, validators=self.validators,
            builders={'menu-layout': lambda payload: {'runtime.js': b'overwritten'}})
        result = writer.save(self.request)
        self.assertTrue(result['sourceSaved'])
        self.assertFalse(result['applied'])
        self.assertEqual(runtime.read_bytes(), b'original-runtime')

    def test_second_conflict_check_keeps_edit_made_during_validation(self):
        def edit_source(payload):
            self.source.write_bytes(b'{"schemaVersion":1,"value":8}')
        writer = self.mod.AuthoringWriter(self.root,
            validators={'menu-layout': edit_source}, builders={})
        with self.assertRaises(self.mod.AuthoringError) as caught:
            writer.save(self.request)
        self.assertEqual(caught.exception.code, 'CONFLICT')
        self.assertEqual(json.loads(self.source.read_bytes())['value'], 8)


class ServerTests(WriterFixture, unittest.TestCase):
    def setUp(self):
        super().setUp()
        self.assertIsNotNone(importlib.util.find_spec('tools.authoring_server'), 'authoring server is not implemented')
        self.server_mod = importlib.import_module('tools.authoring_server')
        self.server = self.server_mod.create_server(self.root, writer=self.writer, enabled=True, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop_server)
        self.origin = f'http://127.0.0.1:{self.server.server_port}'

    def stop_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request_http(self, method, path, payload=None, headers=None, raw=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        body = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
        defaults = {'Origin': self.origin, 'Content-Type': 'application/json', 'X-Authoring-Token': self.server.token}
        defaults.update(headers or {})
        connection.request(method, path, body=body, headers=defaults)
        response = connection.getresponse()
        data = response.read()
        status = response.status
        connection.close()
        return status, json.loads(data)

    def test_opt_in_required_and_nonloopback_binding_rejected(self):
        with self.assertRaises(ValueError):
            self.server_mod.create_server(self.root)
        with self.assertRaises(ValueError):
            self.server_mod.create_server(self.root, enabled=True, host='0.0.0.0')

    def test_session_read_and_save_over_real_http(self):
        status, session = self.request_http('GET', '/__authoring/session')
        self.assertEqual(status, 200)
        self.assertEqual(session['token'], self.server.token)
        status, resource = self.request_http('GET', '/__authoring/resource?id=menu-layout')
        self.assertEqual(status, 200)
        self.assertEqual(resource['payload']['value'], 1)
        status, result = self.request_http('POST', '/__authoring/save', self.request)
        self.assertEqual(status, 200)
        self.assertTrue(result['sourceSaved'])

    def test_http_policy_rejections_never_write(self):
        for headers, expected in [({'X-Authoring-Token': 'wrong'}, 403),
                                  ({'Origin': 'https://evil.example'}, 403),
                                  ({'Origin': ''}, 403),
                                  ({'Host': 'evil.example'}, 403),
                                  ({'Host': '127.0.0.1:1'}, 403),
                                  ({'Content-Type': 'text/plain'}, 415),
                                  ({'X-Authoring-Token': '\u00a3'}, 403),
                                  ({'Sec-Fetch-Site': 'cross-site'}, 403)]:
            with self.subTest(headers=headers):
                status, _ = self.request_http('POST', '/__authoring/save', self.request, headers=headers)
                self.assertEqual(status, expected)
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_oversize_and_invalid_json_rejected(self):
        status, _ = self.request_http('POST', '/__authoring/save', raw=b'x' * (1024 * 1024 + 1))
        self.assertEqual(status, 413)
        for body in [b'{', b'{"resourceId":"menu-layout","resourceId":"scene/home"}', b'NaN']:
            with self.subTest(body=body):
                status, _ = self.request_http('POST', '/__authoring/save', raw=body)
                self.assertEqual(status, 400)
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_session_token_not_returned_to_cross_origin_or_bad_host(self):
        for headers in [{'Origin': 'http://evil.example'}, {'Host': 'evil.example'}, {'Sec-Fetch-Site': 'cross-site'}]:
            status, response = self.request_http('GET', '/__authoring/session', headers=headers)
            self.assertEqual(status, 403)
            self.assertNotIn('token', response)

    def test_unknown_resource_and_conflict_status(self):
        status, _ = self.request_http('GET', '/__authoring/resource?id=../runtime.js')
        self.assertEqual(status, 404)
        status, _ = self.request_http('POST', '/__authoring/save', {**self.request, 'baseHash': '0' * 64})
        self.assertEqual(status, 409)

    def test_static_assets_use_existing_no_cache_development_handler(self):
        script = self.root / 'example.js'
        script.write_text('export const value = 1;', encoding='utf-8')
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        self.addCleanup(connection.close)
        connection.request('GET', '/example.js')
        response = connection.getresponse()
        self.assertIn('no-store', response.getheader('Cache-Control', ''))
        self.assertIn('javascript', response.getheader('Content-Type', ''))
        self.assertEqual(response.read(), b'export const value = 1;')


class ClientTests(unittest.TestCase):
    def test_client_bootstrap_wire_conflict_and_build_failure(self):
        client = Path(__file__).resolve().parent / 'authoring/SourceSaveClient.js'
        self.assertTrue(client.is_file(), 'SourceSaveClient is not implemented')
        if not shutil.which('node'):
            self.skipTest('Node unavailable')
        script = '''
import assert from 'node:assert/strict';
const { SourceSaveClient } = await import(process.argv[1]);
const calls = [];
let saveStatus = 200;
const fetch = async (url, options) => {
  calls.push({url, options});
  const payload = url.endsWith('/session') ? {token:'session-secret'} :
    url.includes('/resource?') ? {payload:{schemaVersion:1,value:1},hash:'base'} :
    saveStatus === 409 ? {error:'CONFLICT',hash:'current'} :
    {sourceSaved:true,applied:false,buildError:'BUILD_FAILED',hash:'next'};
  return {ok:saveStatus===200 || !url.endsWith('/save'),
    status:url.endsWith('/save')?saveStatus:200,json:async()=>payload};
};
const client = new SourceSaveClient({fetch});
assert.equal((await client.getResource('scene/home')).hash,'base');
assert.equal(calls[0].url,'/__authoring/resource?id=scene%2Fhome');
const request = {schemaVersion:1,baseHash:'base',payload:{schemaVersion:1,value:2}};
const result = await client.saveResource('menu-layout',request);
assert.equal(result.sourceSaved,true);
assert.equal(result.applied,false);
assert.equal(result.buildError,'BUILD_FAILED');
assert.equal(calls[1].url,'/__authoring/session');
const saved = calls[2];
assert.equal(saved.url,'/__authoring/save');
assert.equal(saved.options.method,'POST');
assert.equal(saved.options.headers['X-Authoring-Token'],'session-secret');
assert.equal(saved.options.headers['Content-Type'],'application/json');
assert.equal(saved.options.credentials,'same-origin');
assert.deepEqual(JSON.parse(saved.options.body),{resourceId:'menu-layout',...request});
saveStatus = 409;
await assert.rejects(client.saveResource('menu-layout',request),error=>error.code==='CONFLICT' && error.status===409);
assert.equal(calls.filter(call=>call.url.endsWith('/session')).length,1);
const unavailable = new SourceSaveClient({fetch:async()=>{throw Error('offline');}});
await assert.rejects(unavailable.getResource('menu-layout'),error=>error.code==='NETWORK_ERROR');
'''
        result = subprocess.run(['node', '--input-type=module', '--eval', script, client.as_uri()],
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class CompilerIntegrationTests(WriterFixture, unittest.TestCase):
    def test_default_menu_compiler_validates_and_applies_only_fixture_outputs(self):
        repository = Path(__file__).resolve().parents[1]
        payload = json.loads((repository / 'content/ui/menu-layout.json').read_bytes())
        for name in ['menu-layout.json', 'menu-layout-data.js', 'menu-layout-regions.js']:
            shutil.copyfile(repository / 'content/ui' / name, self.root / 'content/ui' / name)
        writer = self.mod.AuthoringWriter(self.root)
        result = writer.save({'resourceId': 'menu-layout', 'schemaVersion': 1,
            'baseHash': writer.read('menu-layout')['hash'], 'payload': payload})
        self.assertTrue(result['sourceSaved'])
        self.assertTrue(result['applied'], result)
        rendered = importlib.import_module('tools.build_menu_layout').render_outputs(payload)
        self.assertEqual(self.output.read_text(encoding='utf-8'), rendered['content/ui/menu-layout-data.js'])

    def test_default_world_compiler_source_and_generated_hash_match(self):
        repository = Path(__file__).resolve().parents[1]
        maps = self.root / 'content/maps'
        shutil.copytree(repository / 'content/maps/scenes', maps / 'scenes')
        for name in ['scene-contract.json', 'prefabs.json', 'scenes-data.js']:
            shutil.copyfile(repository / 'content/maps' / name, maps / name)
        (self.root / 'content/locales').mkdir()
        shutil.copyfile(repository / 'content/locales/vi.js', self.root / 'content/locales/vi.js')
        writer = self.mod.AuthoringWriter(self.root)
        resource = writer.read('scene/home')
        result = writer.save({'resourceId': 'scene/home', 'schemaVersion': 1,
            'baseHash': resource['hash'], 'payload': resource['payload']})
        self.assertTrue(result['applied'], result)
        self.assertEqual(result['hash'], hashlib.sha256((maps / 'scenes/home.json').read_bytes()).hexdigest())
        self.assertIn(result['hash'], (maps / 'scenes-data.js').read_text(encoding='utf-8'))


class ReviewToolTests(unittest.TestCase):
    def test_review_server_overlays_fixture_and_preserves_repository(self):
        self.assertIsNotNone(importlib.util.find_spec('tools.review_authoring_source'),
                             'isolated browser review tool is not implemented')
        review = importlib.import_module('tools.review_authoring_source')
        repository = Path(__file__).resolve().parents[1]
        original = (repository / 'content/ui/menu-layout.json').read_bytes()
        with review.source_fixture(repository) as fixture:
            server = review.create_review_server(repository, fixture)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                writer = server.writer
                resource = writer.read('menu-layout')
                resource['payload']['regions']['resources']['x'] += 1
                result = writer.save({'resourceId': 'menu-layout', 'schemaVersion': 1,
                    'baseHash': resource['hash'], 'payload': resource['payload']})
                self.assertTrue(result['applied'], result)
                connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=3)
                try:
                    connection.request('GET', '/content/ui/menu-layout-data.js')
                    response = connection.getresponse()
                    self.assertEqual(response.read(), (fixture / 'content/ui/menu-layout-data.js').read_bytes())
                    connection.request('GET', '/tools/authoring/SourceSaveClient.js')
                    response = connection.getresponse()
                    self.assertEqual(response.read(), (repository / 'tools/authoring/SourceSaveClient.js').read_bytes())
                finally:
                    connection.close()
                self.assertEqual((repository / 'content/ui/menu-layout.json').read_bytes(), original)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == '__main__':
    unittest.main()
