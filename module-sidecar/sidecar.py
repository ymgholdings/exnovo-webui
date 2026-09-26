"""Exnovo Module Library sidecar for Hermes WebUI.

Runs in the WebUI container's network namespace (loopback only) and is reached
exclusively through WebUI's consented extension proxy:
    /api/extensions/exnovo/sidecar/<path>

It exposes a small, whitelisted slice of the Hermes skills hub, reusing Hermes'
own code (search sources, trust levels, and the install-time security scan):

    GET  /health                       (no auth; liveness only)
    GET  /skills/search?q=&limit=      search the hub (bounded time; partial results OK)
    GET  /skills/preview?identifier=   metadata + SKILL.md preview, no install
    GET  /skills/installed             hub-installed skills
    POST /skills/install  {identifier} start `hermes skills install <id> --yes` (security scan runs)
    POST /skills/uninstall {name}      start `hermes skills uninstall <name> --yes`
    GET  /jobs/<id>                    status + tail of an install/uninstall job

Auth: token-v1 per the WebUI sidecar contract. Every route except /health requires
the X-Hermes-Sidecar-Token header to match the WebUI-minted token file:
401 on missing/mismatch, 503 when the token file is absent/unreadable.
"""

import hmac
import json
import os
import re
import subprocess
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

HOST = "127.0.0.1"
PORT = int(os.environ.get("EXNOVO_SIDECAR_PORT", "17901"))
EXT_ID = "exnovo"
SEARCH_TIMEOUT = float(os.environ.get("EXNOVO_SEARCH_TIMEOUT", "7"))  # WebUI's proxy gives up at 10s
HERMES_BIN = os.environ.get("HERMES_BIN", "/opt/hermes/.venv/bin/hermes")
MAX_BODY = 16 * 1024
IDENT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:/@+-]{0,199}$")  # hub identifiers: source/owner/name[@ref]
NAME_RE = re.compile(r"^[a-z][a-z0-9_-]{0,63}$")

JOBS = {}
JOBS_LOCK = threading.Lock()
MAX_JOBS = 50


# ---------- auth (token-v1) ----------

def _token_path():
    explicit = os.environ.get("HERMES_EXT_SIDECAR_TOKEN_FILE")
    if explicit:
        return explicit
    state = os.environ.get("HERMES_WEBUI_STATE_DIR")
    if state:
        return os.path.join(state, "sidecar-auth", f"{EXT_ID}.token")
    home = os.environ.get("HERMES_HOME") or os.path.expanduser("~/.hermes")
    return os.path.join(home, "webui", "sidecar-auth", f"{EXT_ID}.token")


def _read_token():
    try:
        with open(_token_path(), "r", encoding="utf-8") as fh:
            tok = fh.read().strip()
        return tok or None
    except OSError:
        return None


def check_auth(header_value):
    """Return None when authorised, else (status, message)."""
    expected = _read_token()
    if expected is None:
        return 503, "sidecar token unavailable"
    if not header_value or not hmac.compare_digest(header_value.encode(), expected.encode()):
        return 401, "unauthorized"
    return None


# ---------- hub operations (Hermes code) ----------

def _meta_payload(m):
    return {
        "identifier": m.identifier, "name": m.name, "description": m.description or "",
        "source": m.source, "trust": m.trust_level, "tags": list(m.tags or [])[:8],
        "provider": (m.extra or {}).get("provider") if getattr(m, "extra", None) else None,
    }


def installed():
    from tools.skills_hub import HubLockFile
    try:
        data = HubLockFile().load() or {}
    except Exception:
        data = {}
    entries = data.get("installed", data) if isinstance(data, dict) else {}
    out = {}
    if isinstance(entries, dict):
        for key, entry in entries.items():
            if isinstance(entry, dict):
                ident = entry.get("identifier") or key
                out[ident] = {"name": entry.get("name") or key, "trust": entry.get("trust_level"),
                              "scan_verdict": entry.get("scan_verdict")}
    return out


def search(q, limit):
    from hermes_cli.skills_hub import _sources
    from tools.skills_hub_search import parallel_search_sources
    rank = {"builtin": 3, "trusted": 2, "community": 1}
    results, counts, timed_out = parallel_search_sources(
        _sources(), query=q, source_filter="all", overall_timeout=SEARCH_TIMEOUT)
    seen = {}
    for r in results:
        prev = seen.get(r.identifier)
        if prev is None or rank.get(r.trust_level, 0) > rank.get(prev.trust_level, 0):
            seen[r.identifier] = r
    ordered = sorted(seen.values(), key=lambda r: -rank.get(r.trust_level, 0))[:limit]
    return {"results": [_meta_payload(m) for m in ordered], "source_counts": counts,
            "timed_out": timed_out, "installed": installed()}


def preview(identifier):
    from hermes_cli.skills_hub import inspect_skill
    return inspect_skill(identifier)


# ---------- jobs ----------

def _start_job(kind, args):
    job_id = uuid.uuid4().hex[:12]
    job = {"id": job_id, "kind": kind, "args": args, "status": "running", "started": time.time(),
           "finished": None, "exit_code": None, "output": ""}
    with JOBS_LOCK:
        if len(JOBS) >= MAX_JOBS:  # drop the oldest finished job
            done = sorted((j for j in JOBS.values() if j["status"] != "running"), key=lambda j: j["started"])
            for j in done[: len(JOBS) - MAX_JOBS + 1]:
                JOBS.pop(j["id"], None)
        JOBS[job_id] = job

    def run():
        try:
            proc = subprocess.run([HERMES_BIN, "skills", *args], capture_output=True, text=True,
                                  timeout=600, env={**os.environ, "NO_COLOR": "1", "TERM": "dumb"})
            out = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
            ok = proc.returncode == 0
            # The CLI can exit 0 after the security scan refuses a skill, so confirm against the lock file.
            if ok and kind == "install":
                ident = args[1]
                have = installed()
                ok = any(k == ident or k.endswith("/" + ident) or k.endswith(ident) for k in have)
            elif ok and kind == "uninstall":
                ok = not any(v.get("name") == args[1] for v in installed().values())
            job.update(exit_code=proc.returncode, status="succeeded" if ok else "failed",
                       output=_clean(out)[-4000:])
        except subprocess.TimeoutExpired:
            job.update(status="failed", output="timed out after 10 minutes")
        except Exception as exc:  # noqa: BLE001
            job.update(status="failed", output=f"{type(exc).__name__}: {exc}")
        job["finished"] = time.time()

    threading.Thread(target=run, daemon=True).start()
    return job


_ANSI = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")


def _clean(text):
    return _ANSI.sub("", text)


# ---------- HTTP ----------

class Handler(BaseHTTPRequestHandler):
    server_version = "exnovo-sidecar/1"

    def log_message(self, fmt, *args):  # quiet, structured
        sys.stderr.write(json.dumps({"ts": int(time.time()), "method": self.command,
                                     "path": urlparse(self.path).path, "msg": fmt % args}) + "\n")

    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _auth(self):
        denied = check_auth(self.headers.get("X-Hermes-Sidecar-Token"))
        if denied:
            self._send(denied[0], {"error": denied[1]})
            return False
        return True

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            raise ValueError("body too large")
        raw = self.rfile.read(n) if n else b"{}"
        data = json.loads(raw or b"{}")
        if not isinstance(data, dict):
            raise ValueError("JSON object expected")
        return data

    def do_GET(self):
        url = urlparse(self.path)
        q = parse_qs(url.query)
        if url.path == "/health":
            return self._send(200, {"ok": True, "service": "exnovo-modules"})
        if not self._auth():
            return
        try:
            if url.path == "/skills/search":
                query = (q.get("q", [""])[0] or "").strip()[:120]
                if not query:
                    return self._send(200, {"results": [], "source_counts": {}, "timed_out": [], "installed": installed()})
                limit = max(1, min(int(q.get("limit", ["24"])[0] or 24), 50))
                return self._send(200, search(query, limit))
            if url.path == "/skills/preview":
                ident = (q.get("identifier", [""])[0] or "").strip()
                if not IDENT_RE.match(ident):
                    return self._send(400, {"error": "invalid identifier"})
                info = preview(ident)
                return self._send(200 if info else 404, info or {"error": "not found"})
            if url.path == "/skills/installed":
                return self._send(200, {"installed": installed()})
            if url.path.startswith("/jobs/"):
                job = JOBS.get(url.path.rsplit("/", 1)[-1])
                return self._send(200 if job else 404, job or {"error": "no such job"})
            return self._send(404, {"error": "unknown route"})
        except Exception as exc:  # noqa: BLE001
            return self._send(502, {"error": f"{type(exc).__name__}: {exc}"[:300]})

    def do_POST(self):
        url = urlparse(self.path)
        if not self._auth():
            return
        try:
            body = self._body()
        except (ValueError, json.JSONDecodeError) as exc:
            return self._send(400, {"error": str(exc)})
        if url.path == "/skills/install":
            ident = str(body.get("identifier") or "").strip()
            if not IDENT_RE.match(ident):
                return self._send(400, {"error": "invalid identifier"})
            return self._send(202, _start_job("install", ["install", ident, "--yes"]))
        if url.path == "/skills/uninstall":
            name = str(body.get("name") or "").strip()
            if not NAME_RE.match(name):
                return self._send(400, {"error": "invalid skill name"})
            return self._send(202, _start_job("uninstall", ["uninstall", name, "--yes"]))
        return self._send(404, {"error": "unknown route"})


def main():
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    sys.stderr.write(f"exnovo-modules sidecar on http://{HOST}:{PORT} (token file: {_token_path()})\n")
    srv.serve_forever()


if __name__ == "__main__":
    main()
