#!/usr/bin/env python3
"""Package the game for hosts other than GitHub Pages.

GitHub Pages serves the repository root as-is, so no build is needed for the live site.
This script makes:
  dist/                      a clean copy of just the game files
  generalisimo-web.zip       that copy zipped, ready to upload to itch.io or Netlify
  dist/claude-artifact.html  the page without its <html>/<head>/<body> skeleton, for
                             republishing the Claude artifact link (that host adds its own)

Usage: python3 tools/build.py
"""
import pathlib
import re
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
ZIP = ROOT / "generalisimo-web.zip"

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
shutil.copy2(ROOT / "index.html", DIST / "index.html")
for folder in ("src", "data", "styles"):
    shutil.copytree(ROOT / folder, DIST / folder)

with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(DIST.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(DIST))

# Fragment for the Claude artifact host: keep the <title> and stylesheet links, drop the skeleton.
page = (ROOT / "index.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", page, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", page, re.S).group(1)
keep = [l for l in head.splitlines() if l.strip().startswith(("<title", "<link"))]
(DIST / "claude-artifact.html").write_text("\n".join(keep) + "\n" + body.strip() + "\n", encoding="utf-8")

count = sum(1 for f in DIST.rglob("*") if f.is_file())
print(f"Built {count} files into dist/ and {ZIP.name} ({ZIP.stat().st_size // 1024} KB)")
