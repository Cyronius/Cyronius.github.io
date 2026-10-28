// Signal · Delight: keyboard mastery on the week grid. A gliding focus, forgiving hour entry, a shortcut sheet (2026-10-28).
(() => {
  const grid = document.querySelector('.grid');
  const scroller = grid?.closest('.grid-scroll');
  const glide = scroller?.querySelector('.glide');
  if (!grid || !glide) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const rows = [...grid.querySelectorAll('tbody tr')];
  const cells = rows.map((r) => [...r.querySelectorAll('input.cell')]);
  const rowTot = rows.map((r) => r.querySelector('td.rt'));
  const foot = [...grid.querySelectorAll('tfoot td.d')];
  const footWeek = grid.querySelector('tfoot td.rt');
  const week = grid.closest('.week, .frag');
  const tiles = [...week.querySelectorAll('.strip .tile:not(.tile-week)')];
  const weekTile = week.querySelector('.tile-week .tile-hours');
  const hint = document.querySelector('.grid-hint');
  const live = document.getElementById('totals-live');
  const sheet = document.getElementById('keys');

  const fmt = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
  const parse = (raw) => {
    const s = raw.trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
    let m;
    if (!s || s === '–' || s === '-') return 0;
    if ((m = s.match(/^(\d{1,2}):([0-5]\d)$/))) return +m[1] * 60 + +m[2];
    if ((m = s.match(/^(\d+)m(in)?$/))) return +m[1];
    if ((m = s.match(/^(\d+(?:\.\d+)?)h(?:(\d+)m?)?$/))) return Math.round(+m[1] * 60 + (+m[2] || 0));
    if (/^\d*\.?\d+$/.test(s)) return +s <= 24 ? Math.round(+s * 60) : Math.round(+s);
    return null;
  };
  const value = (input) => parse(input.value) ?? 0;
  const pos = (input) => {
    for (let r = 0; r < cells.length; r++) {
      const d = cells[r].indexOf(input);
      if (d >= 0) return [r, d];
    }
    return null;
  };

  // ---- the gliding focus ----
  function place(input, instant) {
    const a = input.getBoundingClientRect();
    const b = scroller.getBoundingClientRect();
    const x = a.left - b.left + scroller.scrollLeft - scroller.clientLeft;
    const y = a.top - b.top + scroller.scrollTop - scroller.clientTop;
    glide.style.width = `${a.width}px`;
    glide.style.height = `${a.height}px`;
    if (instant) glide.style.transition = 'none';
    glide.style.transform = `translate(${x}px, ${y}px)`;
    glide.classList.toggle('on-today', input.closest('td').classList.contains('is-today'));
    if (instant) { glide.getBoundingClientRect(); glide.style.transition = ''; }
  }
  // At rest the cursor waits, dimmed, on today's first empty cell: where the next hours go.
  let last = cells.flat().find((c) => c.closest('td').classList.contains('is-today') && !c.value) || cells[0][0];
  let touched = false;
  const rest = () => { if (!touched) place(last, true); };
  requestAnimationFrame(rest);
  document.fonts?.ready.then(rest);
  glide.classList.add('is-on', 'is-idle');

  let before = '';
  let fresh = null;
  grid.addEventListener('focusin', (e) => {
    const input = e.target.closest('input.cell');
    if (!input) return;
    touched = true;
    last = input;
    before = input.value;
    place(input, false);
    glide.classList.remove('is-idle');
    grid.classList.add('has-glide');
    input.select();
    fresh = input;
  });
  // Keep the whole value selected after a click, so typing replaces it.
  grid.addEventListener('mouseup', (e) => {
    if (e.target === fresh) e.preventDefault();
    fresh = null;
  });
  grid.addEventListener('focusout', (e) => {
    if (e.relatedTarget?.closest?.('.grid')) return;
    setTimeout(() => {
      if (!grid.contains(document.activeElement)) glide.classList.add('is-idle');
    }, 0);
  });
  addEventListener('resize', () => place(last, true));

  function move(input, dr, dd) {
    const [r, d] = pos(input);
    const next = cells[r + dr]?.[d + dd];
    if (!next) return false;
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    return true;
  }

  // ---- forgiving entry: 1.5, 90m and 1h30 become 1:30 ----
  function morph(input, from, to) {
    if (reduce.matches && !to) return;
    const wrap = input.parentElement;
    wrap.querySelector('.morph')?.remove();
    const box = document.createElement('span');
    const a = document.createElement('span');
    const b = document.createElement('span');
    box.className = 'morph';
    box.setAttribute('aria-hidden', 'true');
    a.textContent = from;
    b.textContent = to || '–';
    box.append(a, b);
    wrap.append(box);
    input.classList.add('is-morphing');
    const o = { duration: reduce.matches ? 200 : 420, easing: EASE, fill: 'both' };
    a.animate(reduce.matches
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, filter: 'blur(0)', transform: 'scale(1)' }, { opacity: 0, filter: 'blur(3px)', transform: 'scale(0.86)' }], o);
    b.animate(reduce.matches
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 0, filter: 'blur(3px)', transform: 'scale(1.14)' }, { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' }], o)
      .finished.then(() => { box.remove(); input.classList.remove('is-morphing'); }, () => {});
  }

  function swap(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('is-changed');
    void el.offsetWidth;
    el.classList.add('is-changed');
  }

  function totals(day) {
    const byDay = DAYS.map((_, d) => cells.reduce((sum, r) => sum + value(r[d]), 0));
    const total = byDay.reduce((a, b) => a + b, 0);
    rowTot.forEach((el, r) => swap(el, fmt(cells[r].reduce((sum, c) => sum + value(c), 0))));
    tiles.forEach((tile, d) => {
      tile.classList.toggle('is-empty', !byDay[d]);
      swap(tile.querySelector('.tile-hours'), byDay[d] ? fmt(byDay[d]) : '–');
    });
    foot.forEach((el, d) => {
      el.classList.toggle('is-blank', !byDay[d]);
      swap(el, byDay[d] ? fmt(byDay[d]) : '–');
    });
    if (weekTile) swap(weekTile, fmt(total));
    swap(footWeek, fmt(total));
    if (live && day != null) live.textContent = `${DAYS[day]} ${byDay[day] ? fmt(byDay[day]) : 'empty'}, week ${fmt(total)}`;
  }

  function commit(input) {
    const raw = input.value.trim();
    const v = parse(raw);
    if (v == null || v > 24 * 60) {
      input.value = before;
      glide.classList.remove('is-error');
      void glide.offsetWidth;
      glide.classList.add('is-error');
      if (hint) hint.textContent = `“${raw}” isn’t a time. Type hours like 1:30, 1.5 or 90m.`;
      requestAnimationFrame(() => input.select());
      return false;
    }
    const text = v ? fmt(v) : '';
    if (hint) hint.textContent = '';
    if (raw !== text && raw) morph(input, raw, text);
    input.value = text;
    input.classList.toggle('is-empty', !v);
    if (text !== before) {
      before = text;
      totals(pos(input)[1]);
    }
    return true;
  }

  const openSheet = () => {
    if (!sheet || sheet.matches(':popover-open')) return;
    sheet.showPopover();
  };
  let returnTo = null;
  sheet?.addEventListener('toggle', (e) => {
    if (e.newState === 'open') {
      returnTo = document.activeElement;
      sheet.querySelector('.keys-close').focus();
    } else if (returnTo?.isConnected) {
      returnTo.focus({ preventScroll: true });
    }
  });

  grid.addEventListener('keydown', (e) => {
    const input = e.target.closest('input.cell');
    fresh = null;
    if (!input || e.altKey || e.ctrlKey || e.metaKey) return;
    const all = input.selectionStart === 0 && input.selectionEnd === input.value.length;
    const atStart = all || (input.selectionStart === 0 && input.selectionEnd === 0);
    const atEnd = all || input.selectionStart === input.value.length;
    let dr = 0;
    let dd = 0;
    switch (e.key) {
      case 'ArrowUp': dr = -1; break;
      case 'ArrowDown': dr = 1; break;
      case 'ArrowLeft': if (!atStart) return; dd = -1; break;
      case 'ArrowRight': if (!atEnd) return; dd = 1; break;
      case 'Enter': dr = e.shiftKey ? -1 : 1; break;
      case 'Escape':
        if (input.value === before) return;
        e.preventDefault();
        input.value = before;
        if (hint) hint.textContent = '';
        input.select();
        return;
      case '?':
        e.preventDefault();
        openSheet();
        return;
      default: return;
    }
    e.preventDefault();
    if (!commit(input)) return;
    if (!move(input, dr, dd)) input.select();
  });
  grid.addEventListener('change', (e) => {
    const input = e.target.closest('input.cell');
    if (input && input.value.trim() !== before) commit(input);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== '?' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.matches?.('input:not([type=checkbox]), textarea, [contenteditable]')) return;
    e.preventDefault();
    if (sheet?.matches(':popover-open')) sheet.hidePopover();
    else openSheet();
  });
})();
