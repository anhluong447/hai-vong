"""Start read-only loopback development hosting; Ctrl+C closes cleanly."""
import argparse
from pathlib import Path
from pipeline.local_environment import configure
configure()
from pipeline.server import create_server

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--port',type=int,default=8080); parser.add_argument('--authoring',action='store_true'); args=parser.parse_args()
    if args.authoring:
        from pipeline.authoring_server import create_authoring_server
        server=create_authoring_server(Path(__file__).resolve().parents[1],args.port)
    else: server=create_server(Path(__file__).resolve().parents[1],args.port)
    print(f'http://127.0.0.1:{server.server_port}',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
if __name__=='__main__': main()
