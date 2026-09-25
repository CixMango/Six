#!/usr/bin/env bash
# Runs trainer/nnue_train.py to completion around pauses: starts only when nothing asks for a pause, and restarts
# after it exits with code 3 to free the GPU (it resumes from resume.pt).
#   bash trainer/nnue_train.sh --data data/nnue --out runs/nnue/v1
set -u
cd "$(dirname "$0")/.."
py=.venv/Scripts/python.exe
while true; do
  until "$py" -c "import sys; sys.path.insert(0, 'trainer'); from pause import pause_reason; sys.exit(1 if pause_reason() else 0)"; do
    sleep 30
  done
  "$py" -u trainer/nnue_train.py "$@"
  code=$?
  [ "$code" -ne 3 ] && exit "$code"
done
