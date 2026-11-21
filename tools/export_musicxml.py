#!/usr/bin/env python3
"""Export the game's music (data/music.json) to MusicXML files for MuseScore, Finale, Sibelius, etc.

Each theme becomes music/<theme>.musicxml with up to four parts: Lead, Harmony, Bass and Drums.
Held notes become tied notes; tempo, time signature and General MIDI instruments are included.
A zip of all files is written to music/generalisimo-music.zip.

Usage: python3 tools/export_musicxml.py
"""
import json
import pathlib
import re
import zipfile
from xml.sax.saxutils import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "music"
DIV = 2  # divisions per quarter note: one eighth note = 1
BAR = 8  # eighth notes per 4/4 bar
VALUES = [(8, "whole", 0), (6, "half", 1), (4, "half", 0), (3, "quarter", 1), (2, "quarter", 0), (1, "eighth", 0)]
DRUMS = {  # token: (name, General MIDI note, display step, display octave, notehead)
    "k": ("Bass Drum", 36, "F", 4, "normal"),
    "s": ("Snare", 38, "C", 5, "normal"),
    "h": ("Closed Hi-Hat", 42, "G", 5, "x"),
    "t": ("Low Tom", 45, "A", 4, "normal"),
    "c": ("Crash Cymbal", 49, "A", 5, "x"),
}
# part key: (label, General MIDI program 1-128, clef)
PARTS = {"lead": ("Lead", 81, "G"), "harm": ("Harmony", 82, "G"), "bass": ("Bass", 39, "F")}


def tokens(bars):
    return " ".join(bars or []).split()


def split_len(n):
    """Break a length (in eighths) into standard note values."""
    out = []
    while n > 0:
        for v, typ, dots in VALUES:
            if v <= n:
                out.append((v, typ, dots))
                n -= v
                break
    return out


def pitch_xml(name):
    m = re.fullmatch(r"([A-G])(#?)(\d)", name)
    step, sharp, octave = m.groups()
    alter = "<alter>1</alter>" if sharp else ""
    return f"<pitch><step>{step}</step>{alter}<octave>{octave}</octave></pitch>", bool(sharp)


def melodic_events(toks):
    """Turn tokens into (start, length, pitch or None) events, split at bar lines."""
    events, i = [], 0
    while i < len(toks):
        j = i + 1
        if toks[i] in (".", "-"):
            while j < len(toks) and toks[j] in (".", "-"):
                j += 1
            events.append((i, j - i, None))
        else:
            while j < len(toks) and toks[j] == "-":
                j += 1
            events.append((i, j - i, toks[i]))
        i = j
    # split at bar lines, marking ties
    split = []
    for start, length, p in events:
        pos, left = start, length
        pieces = []
        while left > 0:
            room = BAR - pos % BAR
            take = min(room, left)
            pieces.append((pos, take))
            pos += take
            left -= take
        for k, (pos, take) in enumerate(pieces):
            split.append((pos, take, p, k > 0, k < len(pieces) - 1))
    return split


def note_xml(length, p, tie_in, tie_out, voice=1):
    xml = []
    parts = split_len(length)
    for k, (v, typ, dots) in enumerate(parts):
        t_in = tie_in or k > 0
        t_out = tie_out or k < len(parts) - 1
        dot = "<dot/>" * dots
        if p is None:
            full = length == BAR and len(parts) == 1
            rest = '<rest measure="yes"/>' if full else "<rest/>"
            xml.append(f"<note>{rest}<duration>{v}</duration><voice>{voice}</voice>{'' if full else f'<type>{typ}</type>{dot}'}</note>")
            continue
        pitch, sharp = pitch_xml(p)
        ties = ("<tie type=\"stop\"/>" if t_in else "") + ("<tie type=\"start\"/>" if t_out else "")
        tied = ("<tied type=\"stop\"/>" if t_in else "") + ("<tied type=\"start\"/>" if t_out else "")
        acc = "<accidental>sharp</accidental>" if sharp and not t_in else ""
        notations = f"<notations>{tied}</notations>" if tied else ""
        xml.append(f"<note>{pitch}<duration>{v}</duration>{ties}<voice>{voice}</voice><type>{typ}</type>{dot}{acc}{notations}</note>")
    return xml


def drum_events(toks, pid):
    events, i = [], 0
    while i < len(toks):
        t = toks[i]
        if t in DRUMS:
            events.append((i, 1, t))
            i += 1
        else:
            j = i
            while j < len(toks) and toks[j] not in DRUMS and (j == i or j % BAR != 0):
                j += 1
            events.append((i, j - i, None))
            i = j
    xml_by_bar = {}
    for start, length, t in events:
        bar = start // BAR
        if t is None:
            # rests: split at bar lines
            pos, left = start, length
            while left > 0:
                take = min(BAR - pos % BAR, left)
                xml_by_bar.setdefault(pos // BAR, []).extend(note_xml(take, None, False, False))
                pos += take
                left -= take
        else:
            name, midi, step, octave, head = DRUMS[t]
            xml_by_bar.setdefault(bar, []).append(
                f"<note><unpitched><display-step>{step}</display-step><display-octave>{octave}</display-octave></unpitched>"
                f"<duration>1</duration><instrument id=\"{pid}-I{midi}\"/><voice>1</voice><type>eighth</type>"
                f"<stem>up</stem><notehead>{head}</notehead></note>")
    return xml_by_bar


def attributes(clef, first, bpm):
    if not first:
        return ""
    clef_xml = "<clef><sign>percussion</sign></clef>" if clef == "perc" else (
        "<clef><sign>F</sign><line>4</line></clef>" if clef == "F" else "<clef><sign>G</sign><line>2</line></clef>")
    tempo = (f"<direction placement=\"above\"><direction-type><metronome><beat-unit>quarter</beat-unit>"
             f"<per-minute>{bpm}</per-minute></metronome></direction-type><sound tempo=\"{bpm}\"/></direction>")
    return (f"<attributes><divisions>{DIV}</divisions><key><fifths>0</fifths><mode>minor</mode></key>"
            f"<time><beats>4</beats><beat-type>4</beat-type></time>{clef_xml}</attributes>{tempo}")


def theme_xml(tid, th):
    bars = max(len(th.get(k, [])) for k in ("lead", "harm", "bass", "drum"))
    part_list, parts = [], []
    n = 0
    for key, (label, program, clef) in PARTS.items():
        toks = tokens(th.get(key))
        if not toks:
            continue
        n += 1
        pid = f"P{n}"
        part_list.append(
            f"<score-part id=\"{pid}\"><part-name>{label}</part-name>"
            f"<score-instrument id=\"{pid}-I1\"><instrument-name>{label}</instrument-name></score-instrument>"
            f"<midi-instrument id=\"{pid}-I1\"><midi-channel>{n}</midi-channel><midi-program>{program}</midi-program><volume>80</volume></midi-instrument></score-part>")
        by_bar = {}
        for start, length, p, t_in, t_out in melodic_events(toks):
            by_bar.setdefault(start // BAR, []).extend(note_xml(length, p, t_in, t_out))
        measures = "".join(
            f"<measure number=\"{b + 1}\">{attributes(clef, b == 0, th['bpm'])}{''.join(by_bar.get(b, note_xml(BAR, None, False, False)))}</measure>"
            for b in range(bars))
        parts.append(f"<part id=\"{pid}\">{measures}</part>")
    toks = tokens(th.get("drum"))
    if toks:
        n += 1
        pid = f"P{n}"
        insts = "".join(f"<score-instrument id=\"{pid}-I{m}\"><instrument-name>{nm}</instrument-name></score-instrument>" for nm, m, *_ in DRUMS.values())
        midis = "".join(f"<midi-instrument id=\"{pid}-I{m}\"><midi-channel>10</midi-channel><midi-unpitched>{m + 1}</midi-unpitched><volume>80</volume></midi-instrument>" for nm, m, *_ in DRUMS.values())
        part_list.append(f"<score-part id=\"{pid}\"><part-name>Drums</part-name>{insts}{midis}</score-part>")
        by_bar = drum_events(toks, pid)
        measures = "".join(
            f"<measure number=\"{b + 1}\">{attributes('perc', b == 0, th['bpm'])}{''.join(by_bar.get(b, note_xml(BAR, None, False, False)))}</measure>"
            for b in range(bars))
        parts.append(f"<part id=\"{pid}\">{measures}</part>")
    title = escape(f"Generalísimo: {th.get('name', tid)}")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
            '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n'
            f'<score-partwise version="4.0"><work><work-title>{title}</work-title></work>'
            '<identification><creator type="composer">Generalísimo</creator><encoding><software>tools/export_musicxml.py</software></encoding></identification>'
            f"<part-list>{''.join(part_list)}</part-list>{''.join(parts)}</score-partwise>\n")


def main():
    data = json.loads((ROOT / "data" / "music.json").read_text(encoding="utf-8"))
    OUT.mkdir(exist_ok=True)
    files = []
    for tid, th in data.items():
        if tid.startswith("_"):
            continue
        f = OUT / f"{tid}.musicxml"
        f.write_text(theme_xml(tid, th), encoding="utf-8")
        files.append(f)
    with zipfile.ZipFile(OUT / "generalisimo-music.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, f.name)
    print(f"Wrote {len(files)} MusicXML files to music/ and music/generalisimo-music.zip")


if __name__ == "__main__":
    main()
