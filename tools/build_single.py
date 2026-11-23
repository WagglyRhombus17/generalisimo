#!/usr/bin/env python3
"""Build the whole game as ONE html file that runs offline: double-click it, no server needed.

Bundles src/ with esbuild (fetched with npx), packs the JSON data and the stylesheet into the
page, and embeds the pixel fonts. Writes dist/generalisimo-offline.html.

Needs Node.js (for npx) and an internet connection while building. If the fonts can't be
downloaded, the page links to Google Fonts instead, so it still works online.

Usage: python3 tools/build_single.py
"""
import base64
import json
import pathlib
import re
import subprocess
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "generalisimo-offline.html"
FONTS_URL = "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&family=Silkscreen&family=VT323&display=swap"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
DATA = ["events", "generals", "chapters", "tribunal", "music"]


def bundle():
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp) / "game.js"
        subprocess.run(["npx", "--yes", "esbuild@0.24.2", "src/main.js", "--bundle", "--format=iife",
                        "--minify", "--target=es2020", f"--outfile={out}"], cwd=ROOT, check=True)
        return out.read_text(encoding="utf-8")


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")


def embedded_fonts():
    """Google Fonts CSS with each Latin font file inlined as a data URI (Cyrillic subsets dropped)."""
    css = fetch(FONTS_URL)
    blocks = re.findall(r"(/\* ([\w-]+) \*/\s*@font-face \{.*?\})", css, re.S)
    out, cache = [], {}
    for block, subset in blocks:
        if subset not in ("latin", "latin-ext"):
            continue
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        if url not in cache:
            cache[url] = base64.b64encode(fetch(url, binary=True)).decode("ascii")
        out.append(block.replace(url, f"data:font/woff2;base64,{cache[url]}"))
    return "\n".join(out)


def script_safe(text):
    return text.replace("</", "<\\/")


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles" / "game.css").read_text(encoding="utf-8")
    data = {n: json.loads((ROOT / "data" / f"{n}.json").read_text(encoding="utf-8")) for n in DATA}
    js = bundle()
    try:
        fonts = f"<style>\n{embedded_fonts()}\n</style>"
        html = re.sub(r'<link rel="preconnect"[^>]*>\n', "", html)
        html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', lambda m: fonts, html)
    except OSError as err:
        print(f"Fonts not embedded ({err}); the page will load them from Google Fonts when online.")
    html = html.replace('<link rel="stylesheet" href="styles/game.css">', f"<style>\n{css}\n</style>")
    packed = f"<script>window.GENERALISIMO_DATA = {script_safe(json.dumps(data, ensure_ascii=False, separators=(',', ':')))};</script>"
    html = html.replace('<script type="module" src="src/main.js"></script>', f"{packed}\n<script>\n{script_safe(js)}\n</script>")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")



if __name__ == "__main__":
    main()
