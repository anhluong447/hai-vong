"""Build a validated local web artifact; no upload or publication."""
import argparse,json,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent/'pipeline'))
from local_environment import ROOT,configure
configure()
from release import run_release
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--profile',default='production');args=parser.parse_args()
    result=run_release(ROOT,profile=args.profile);print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
