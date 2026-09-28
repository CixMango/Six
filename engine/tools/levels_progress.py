"""Writes the level measurement's progress (engine/tools/measure_levels.py) as JSON for the Training screen on this PC.

  py -3.12 engine/tools/levels_progress.py web/dist/client/levels-progress.json
"""
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOG = ROOT / "runs/levels/measure.log"
TIMES_MS = [500, 1000, 2500, 5000, 10000, 20000, 45000]


def view():
    if not LOG.exists():
        return {"running": False}
    lines = LOG.read_text(encoding="utf-8").splitlines()
    positions = int(lines[0].split()[0]) if lines and lines[0].split()[0].isdigit() else 24
    done = [json.loads(l) for l in lines[1:] if l.startswith("{")]
    total = sum(t * positions for t in TIMES_MS) / 1000
    finished = sum(TIMES_MS[i] * positions for i in range(len(done))) / 1000
    since = time.time() - LOG.stat().st_mtime  # the log gets a line at each finished level
    current = TIMES_MS[len(done)] * positions / 1000 if len(done) < len(TIMES_MS) else 0
    elapsed = finished + min(since, current * 0.99)
    complete = len(done) == len(TIMES_MS)
    return {
        "running": not complete,
        "levels": done,
        "level": min(len(done) + 1, len(TIMES_MS)),
        "share": 1 if complete else elapsed / total,
        "minutesLeft": 0 if complete else round((total - elapsed) / 60),
        "updated": int(time.time()),
    }


def main():
    out = Path(sys.argv[1])
    while True:
        v = view()
        tmp = out.with_suffix(".tmp")
        tmp.write_text(json.dumps(v), encoding="utf-8")
        os.replace(tmp, out)
        if not v.get("running"):
            break
        time.sleep(5)


if __name__ == "__main__":
    main()
