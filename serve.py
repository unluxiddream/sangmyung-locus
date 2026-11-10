#!/usr/bin/env python3
"""Serve dist/ at http://localhost:8000 with browser caching turned off.

python3 -m http.server lets browsers keep old HTML for a while, so after a build Chrome can
show a stale page that loads new scripts and breaks. Sending Cache-Control: no-store makes
every reload fetch the latest build.
"""

from __future__ import annotations

import functools
import http.server
import sys
from pathlib import Path

DIST_DIR = Path(__file__).resolve().parent / "dist"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    if not DIST_DIR.is_dir():
        raise SystemExit("dist/ 폴더가 없습니다. 먼저 npm run build를 실행하세요.")
    handler = functools.partial(NoCacheHandler, directory=str(DIST_DIR))
    with http.server.ThreadingHTTPServer(("", port), handler) as server:
        print(f"LOCUS: http://localhost:{port}  (끄려면 Ctrl+C)")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
