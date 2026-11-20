#!/usr/bin/env python3
"""Build a standalone copy of the game for any static web host (itch.io, GitHub Pages, Netlify).

index.html in the project root is a page fragment (the Claude artifact host adds the
<!doctype>/<head>/<body> skeleton itself). This script wraps it in a full HTML document,
copies the game files into dist/, and zips them as generalisimo-web.zip.

Usage: python3 tools/build.py
"""
import pathlib
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
ZIP = ROOT / "generalisimo-web.zip"

fragment = (ROOT / "index.html").read_text(encoding="utf-8")
head, sep, body = fragment.partition("<main")
if not sep:
    raise SystemExit("index.html: expected a <main> element")
head = "\n".join(line for line in head.splitlines() if "claude:" not in line).strip()

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="A pixel-art strategy game about the first months of the Spanish Civil War.">
{head}
</head>
<body>
<main{body.rstrip()}
</body>
</html>
"""

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
(DIST / "index.html").write_text(page, encoding="utf-8")
for folder in ("src", "data", "styles"):
    shutil.copytree(ROOT / folder, DIST / folder)

with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(DIST.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(DIST))

count = sum(1 for f in DIST.rglob("*") if f.is_file())
print(f"Built {count} files into dist/ and {ZIP.name} ({ZIP.stat().st_size // 1024} KB)")
