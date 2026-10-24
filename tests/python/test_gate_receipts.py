import json,sys,tempfile,unittest
from pathlib import Path
from project_environment import ROOT
sys.path.insert(0,str(ROOT/'tools/pipeline'))

class GateReceiptsTests(unittest.TestCase):
    def test_real_gate_proof_is_invalidated_by_changed_report_or_source(self):
        from gates import execute_gate,read_receipt
        from test_release import ReleaseTests
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);ReleaseTests().fixture(root)
            # The executable gate lives in the actual checkout. Its source tree is
            # the fingerprint input; this is not a claimed fixture-wide gate set.
            result=execute_gate(ROOT,'architecture',report_root=root/'proofs')
            self.assertTrue(result['ok'],result)
            proof=read_receipt(ROOT,'architecture',report_root=root/'proofs');self.assertIsNotNone(proof)
            report=Path(proof['report']);report.write_text('{}',encoding='utf-8')
            self.assertIsNone(read_receipt(ROOT,'architecture',report_root=root/'proofs'))
            changed=execute_gate(ROOT,'unregistered-fixture-suite',report_root=root/'proofs')
            self.assertFalse(changed['ok']);self.assertIsNone(read_receipt(ROOT,'unregistered-fixture-suite',report_root=root/'proofs'))
