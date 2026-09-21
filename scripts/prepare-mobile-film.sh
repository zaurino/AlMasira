#!/bin/sh
# Encode the full-resolution sequence for mobile; preserve frame numbering.
set -eu
mkdir -p dist/assets/machine-mobile
python3 - <<'PYTHON'
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess
frames=sorted(Path('dist/assets/machine-v7').glob('frame-*.webp'))
assert len(frames)==419

def convert(frame):
    subprocess.run(['cwebp','-quiet','-resize','960','0','-q','76','-m','4',str(frame),'-o',str(Path('dist/assets/machine-mobile')/frame.name)],check=True)

with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(convert,frames))
print('Prepared 419 mobile WebP frames.')
PYTHON
