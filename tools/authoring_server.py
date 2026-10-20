"""Opt-in loopback authoring server. The ordinary tools/serve.py is unchanged."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import secrets
import socket
import sys
from urllib.parse import parse_qs, urlsplit

if __package__:
    from .authoring_write import AuthoringError, AuthoringWriter, MAX_BODY
    from .serve import DevelopmentHandler
else:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from tools.authoring_write import AuthoringError, AuthoringWriter, MAX_BODY
    from tools.serve import DevelopmentHandler


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate key')
        result[key] = value
    return result


class AuthoringHandler(DevelopmentHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *_args):
        pass

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=True, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.end_headers()
        self.wfile.write(body)

    def _policy(self, *, writing=False):
        port = self.server.server_port
        hosts = {f'127.0.0.1:{port}', f'localhost:{port}'}
        host = self.headers.get('Host')
        if len(self.headers.get_all('Host', [])) != 1 or host not in hosts:
            raise AuthoringError('HOST_REJECTED', 403)
        origins = self.headers.get_all('Origin', [])
        if len(origins) > 1 or (origins and origins[0] != f'http://{host}') or (writing and not origins):
            raise AuthoringError('ORIGIN_REJECTED', 403)
        if self.headers.get('Sec-Fetch-Site') not in (None, 'same-origin', 'none'):
            raise AuthoringError('ORIGIN_REJECTED', 403)
        if writing:
            token = self.headers.get('X-Authoring-Token', '')
            if len(self.headers.get_all('X-Authoring-Token', [])) != 1 or not secrets.compare_digest(token.encode('utf-8'), self.server.token.encode('ascii')):
                raise AuthoringError('TOKEN_REJECTED', 403)

    def _error(self, error):
        self.close_connection = True
        if self.command == 'POST' and not getattr(self, '_body_consumed', False):
            try:
                length = int(self.headers.get('Content-Length', '-1'))
                if 0 <= length <= MAX_BODY + 1:
                    self.connection.settimeout(2)
                    self.rfile.read(length)
            except (OSError, ValueError):
                pass
        self._json(error.status, {'error': error.code, 'sourceSaved': False, 'applied': False, **error.details})
        self.wfile.flush()
        # An unread rejected POST body otherwise makes Windows discard the JSON
        # response while resetting the connection. Send a clean response EOF first.
        try:
            self.connection.shutdown(socket.SHUT_WR)
        except OSError:
            pass

    def do_GET(self):
        parsed = urlsplit(self.path)
        if not parsed.path.startswith('/__authoring/'):
            return super().do_GET()
        try:
            self._policy()
            if parsed.path == '/__authoring/session' and not parsed.query:
                self._json(200, {'token': self.server.token})
            elif parsed.path == '/__authoring/resource':
                query = parse_qs(parsed.query, keep_blank_values=True)
                if set(query) != {'id'} or len(query['id']) != 1:
                    raise AuthoringError('INVALID_REQUEST')
                self._json(200, self.server.writer.read(query['id'][0]))
            else:
                raise AuthoringError('NOT_FOUND', 404)
        except AuthoringError as error:
            self._error(error)
        except (OSError, ValueError, RecursionError):
            self._error(AuthoringError('READ_FAILED', 500))

    def do_POST(self):
        try:
            self._policy(writing=True)
            if self.path != '/__authoring/save':
                raise AuthoringError('NOT_FOUND', 404)
            if self.headers.get('Content-Type', '').split(';', 1)[0].strip().lower() != 'application/json':
                raise AuthoringError('CONTENT_TYPE_REJECTED', 415)
            if self.headers.get('Transfer-Encoding') or len(self.headers.get_all('Content-Length', [])) != 1:
                raise AuthoringError('INVALID_LENGTH')
            try:
                length = int(self.headers['Content-Length'])
            except (ValueError, TypeError):
                raise AuthoringError('INVALID_LENGTH') from None
            if length < 0:
                raise AuthoringError('INVALID_LENGTH')
            if length > MAX_BODY:
                raise AuthoringError('PAYLOAD_TOO_LARGE', 413)
            body = self.rfile.read(length)
            self._body_consumed = True
            if len(body) != length:
                raise AuthoringError('INVALID_LENGTH')
            try:
                request = json.loads(body, object_pairs_hook=_unique_object,
                    parse_constant=lambda _value: (_ for _ in ()).throw(ValueError('nonfinite')))
            except (ValueError, UnicodeError, RecursionError):
                raise AuthoringError('INVALID_JSON') from None
            self._json(200, self.server.writer.save(request))
        except AuthoringError as error:
            self._error(error)
        except (OSError, ValueError, RecursionError):
            self._error(AuthoringError('WRITE_FAILED', 500))


def create_server(root, *, enabled=False, host='127.0.0.1', port=0, writer=None):
    if not enabled:
        raise ValueError('AUTHORING_OPT_IN_REQUIRED')
    if host not in ('127.0.0.1', 'localhost'):
        raise ValueError('LOOPBACK_REQUIRED')
    root = Path(root).resolve(strict=True)
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(AuthoringHandler, directory=str(root)))
    server.token = secrets.token_urlsafe(32)
    server.writer = writer if writer is not None else AuthoringWriter(root)
    return server


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--enable-authoring', action='store_true', required=True)
    parser.add_argument('--port', type=int, default=8097)
    parser.add_argument('--host', choices=('127.0.0.1', 'localhost'), default='127.0.0.1')
    args = parser.parse_args(argv)
    root = Path(__file__).resolve().parents[1]
    with create_server(root, enabled=args.enable_authoring, host=args.host, port=args.port) as server:
        print(f'http://127.0.0.1:{server.server_port}/')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
