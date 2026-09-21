#!/bin/sh
# Rebuild full-resolution frames. Requires ffmpeg, cwebp and python3.
set -eu
mkdir -p dist/assets/machine-v7
ffmpeg -y -hide_banner -loglevel error -i video/Machine.mp4 -vf 'unsharp=5:5:0.45:3:3:0,format=rgb24' -fps_mode passthrough -c:v png dist/assets/machine-v7/frame-%04d.png
python3 - <<'PY'
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess
frames=sorted(Path('dist/assets/machine-v7').glob('*.png'))
assert len(frames)==419

def convert(frame):
    subprocess.run(['cwebp','-quiet','-lossless','-m','3',str(frame),'-o',str(frame.with_suffix('.webp'))],check=True)
    frame.unlink()

with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(convert,frames))
print('Prepared 419 full-resolution lossless WebP frames.')
PY
