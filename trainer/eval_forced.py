"""How well does a network see forced wins? On solver-labelled records (trainer/solver_records.py) from games it
wasn't trained on: at each of the winning side's rows, is its top policy cell one of the solver's winning stones,
how much policy it puts there, and the win chance its value head gives. Split by games the winner went on to lose.

  .venv/Scripts/python.exe trainer/eval_forced.py runs/mine/gen451-records.jsonl runs/rl/gen-0455/net.pt ...
"""
import json
import sys
from pathlib import Path

import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "trainer"))
from dataset import RowDataset, load_rl  # noqa: E402
from model import load_checkpoint  # noqa: E402

records_path, *nets = sys.argv[1:]
records = load_rl([Path(records_path)])
missed = []
for line in open(records_path, encoding="utf-8"):
    r = json.loads(line)
    missed.append(len(r["rows"]) > 4)  # full lines are written for games that left the winning line
data = RowDataset(records, augment=False)
rows = [(i, g, n) for i, (g, n) in enumerate(data.rows.tolist())]
device = "cuda" if torch.cuda.is_available() else "cpu"
for net in nets:
    model, _ = load_checkpoint(net, device)
    model.eval()
    stats = {k: [0, 0.0, 0.0, 0.0] for k in ("all", "missed", "kept")}  # rows, top1 hits, mass, win chance
    for start in range(0, len(rows), 256):
        chunk = rows[start:start + 256]
        items = [data[i] for i, _, _ in chunk]
        keep = [j for j, it in enumerate(items) if int(it["value"]) == 0]  # the winning side's rows
        if not keep:
            continue
        planes = torch.stack([items[j]["planes"] for j in keep]).to(device)
        target = torch.stack([items[j]["policy"] for j in keep]).to(device)
        with torch.no_grad():
            policy, _, value, *_ = model(planes)
        legal = planes[:, 3].flatten(1) > 0.5
        probs = F.softmax(policy.float().masked_fill(~legal, -1e4), dim=1)
        top1 = (target.gather(1, probs.argmax(dim=1, keepdim=True)).squeeze(1) > 0).float()
        mass = (probs * (target > 0)).sum(dim=1)
        win = F.softmax(value.float(), dim=1)[:, 0]
        for j, k in enumerate(keep):
            group = "missed" if missed[chunk[k][1]] else "kept"
            for g in ("all", group):
                s = stats[g]
                s[0] += 1
                s[1] += float(top1[j])
                s[2] += float(mass[j])
                s[3] += float(win[j])
    print(net)
    for g, (n, hits, mass, win) in stats.items():
        if n:
            print(f"  {g:>6}: {n} rows, top move on a winning stone {hits / n:.1%}, policy on winning stones "
                  f"{mass / n:.1%}, value's win chance {win / n:.1%}")
