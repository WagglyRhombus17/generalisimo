// The event dialog that sits over the scene: a question with numbered choices, then the result.

const box = () => document.getElementById('dlg');

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function focusFirst(root) {
  const b = root.querySelector('button:not([disabled])');
  if (b) b.focus({ preventScroll: true });
}

// choices: [{ t: label, h: hint, dis: reason it is unavailable }]. Resolves with the chosen index.
export function ask({ title, text, choices }) {
  return new Promise(resolve => {
    const d = box();
    d.hidden = false;
    d.replaceChildren();
    const list = el('div', 'choices');
    choices.forEach((c, i) => {
      const b = el('button', 'choice');
      b.type = 'button';
      b.dataset.key = String(i + 1);
      b.disabled = !!c.dis;
      b.append(el('b', null, `${i + 1}.`), document.createTextNode(c.t));
      if (c.dis || c.h) b.append(el('span', null, c.dis || c.h));
      b.addEventListener('click', () => { if (!b.disabled) resolve(i); });
      list.append(b);
    });
    d.append(el('h2', 'ttl', title), el('p', 'txt', text), list);
    d.scrollTop = 0;
    focusFirst(list);
  });
}

// A result or report, with coloured chips showing what changed.
export function tell({ title, text, chips = [], btn = 'CONTINUE' }) {
  return new Promise(resolve => {
    const d = box();
    d.hidden = false;
    d.replaceChildren();
    d.append(el('h2', 'ttl', title), el('p', 'txt', text));
    if (chips.length) {
      const row = el('div', 'chips');
      chips.forEach(c => row.append(el('span', `chip ${c.c}`, c.t)));
      d.append(row);
    }
    const go = el('button', 'go', `${btn} ▶`);
    go.type = 'button';
    go.dataset.key = 'enter';
    go.addEventListener('click', () => resolve(), { once: true });
    d.append(go);
    d.scrollTop = 0;
    go.focus({ preventScroll: true });
  });
}

export function hideDlg() { const d = box(); d.hidden = true; d.replaceChildren(); }
