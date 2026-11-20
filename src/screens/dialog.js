// The event panel in the bottom right: a question with numbered choices, then the result.
// Text types itself out; a click or Enter finishes it at once.

const box = () => document.getElementById('dlg');
const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let typing = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// Types text into p without moving the layout: the untyped rest is present but invisible.
function typeInto(p, text) {
  finishTyping();
  if (reduceMotion() || !text) { p.textContent = text; return; }
  const shown = el('span'), rest = el('span', 'ghost', text);
  p.replaceChildren(shown, rest);
  let i = 0;
  const done = () => { clearInterval(id); p.textContent = text; typing = null; };
  const id = setInterval(() => {
    i = Math.min(text.length, i + 3);
    shown.textContent = text.slice(0, i);
    rest.textContent = text.slice(i);
    if (i >= text.length) done();
  }, 16);
  typing = { done };
}

export function finishTyping() {
  if (!typing) return false;
  typing.done();
  return true;
}

function open(d) {
  d.hidden = false;
  d.replaceChildren();
  d.classList.remove('anim'); void d.offsetWidth; d.classList.add('anim');
  d.onclick = e => { if (!e.target.closest('button')) finishTyping(); };
}

// choices: [{ t: label, h: hint, dis: reason it is unavailable }]. Resolves with the chosen index.
export function ask({ title, text, choices }) {
  return new Promise(resolve => {
    const d = box();
    open(d);
    const list = el('div', 'choices');
    choices.forEach((c, i) => {
      const b = el('button', 'choice');
      b.type = 'button';
      b.dataset.key = String(i + 1);
      b.disabled = !!c.dis;
      b.append(el('b', null, `${i + 1}.`), document.createTextNode(c.t));
      if (c.dis || c.h) b.append(el('span', null, c.dis || c.h));
      b.addEventListener('click', () => { if (!b.disabled) { finishTyping(); resolve(i); } });
      list.append(b);
    });
    const p = el('p', 'txt');
    d.append(el('h2', 'ttl', title), p, list);
    typeInto(p, text);
    d.scrollTop = 0;
    const first = list.querySelector('button:not([disabled])');
    if (first) first.focus({ preventScroll: true });
  });
}

// A result or report, with coloured chips showing what changed.
export function tell({ title, text, chips = [], btn = 'CONTINUE' }) {
  return new Promise(resolve => {
    const d = box();
    open(d);
    const p = el('p', 'txt');
    d.append(el('h2', 'ttl', title), p);
    typeInto(p, text);
    if (chips.length) {
      const row = el('div', 'chips');
      chips.forEach((c, i) => { const s = el('span', `chip ${c.c}`, c.t); s.style.animationDelay = `${0.15 + i * 0.06}s`; row.append(s); });
      d.append(row);
    }
    const go = el('button', 'go', `${btn} ▶`);
    go.type = 'button';
    go.dataset.key = 'enter';
    go.addEventListener('click', () => { finishTyping(); resolve(); }, { once: true });
    d.append(go);
    d.scrollTop = 0;
    go.focus({ preventScroll: true });
  });
}

export function hideDlg() { finishTyping(); const d = box(); d.hidden = true; d.replaceChildren(); }
