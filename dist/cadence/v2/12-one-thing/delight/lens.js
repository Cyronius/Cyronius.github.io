// 12 One Thing · Delight: Track time opens a composer in place, the page dims, saving lands the hours (2026-10-28).
(() => {
  const opener = document.querySelector('[data-composer-open]');
  const composer = document.getElementById('composer');
  if (!opener || !composer) return;
  const form = composer.querySelector('form');
  const wash = composer.querySelector('.c-wash');
  const hours = composer.querySelector('#c-hours');
  const note = composer.querySelector('#c-note');
  const hint = note.textContent;
  const live = document.getElementById('live');
  const dimmed = [...document.querySelectorAll('[data-dim]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const page = document.body.dataset.page;
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const OPEN_CLIP = 'inset(-64px round 88px)';
  const names = [...composer.querySelectorAll('.opt')].map((o) =>
    `${o.querySelector('b').textContent} · ${o.querySelector('.opt-t > span').textContent.split(' · ')[0]}`);

  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  function parse(raw) {
    const v = raw.trim().toLowerCase().replace(/\s+/g, '');
    let m;
    if ((m = /^(\d{1,2}):([0-5]\d)$/.exec(v))) return +m[1] * 60 + +m[2];
    if ((m = /^(\d{1,2})h(?:([0-5]?\d)m?)?$/.exec(v))) return +m[1] * 60 + +(m[2] || 0);
    if ((m = /^(\d{1,4})m(?:in)?$/.exec(v))) return +m[1];
    if (v && /^\d{0,2}(?:[.,]\d+)?$/.test(v)) return Math.round(parseFloat(v.replace(',', '.')) * 60);
    return NaN;
  }
  const minutes = (text) => { const m = parse(text); return Number.isFinite(m) ? m : 0; };

  let open = false, anim = null;
  const clipTo = (el) => {
    const c = composer.getBoundingClientRect(), b = el.getBoundingClientRect();
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    return `inset(${b.top - c.top}px ${c.right - b.right}px ${c.bottom - b.bottom}px ${b.left - c.left}px round ${r}px)`;
  };
  const stopMotion = () => {
    anim?.cancel();
    wash.getAnimations().forEach((a) => a.cancel());
  };

  function clearError() {
    hours.removeAttribute('aria-invalid');
    note.textContent = hint;
    note.classList.remove('err');
  }

  function show() {
    if (open) return;
    open = true;
    stopMotion();
    composer.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    document.body.classList.add('focusing');
    for (const el of dimmed) el.inert = true;
    hours.value = '';
    clearError();
    // The wash is the opener's own fill, so the composer grows out of the button it replaces.
    wash.style.background = getComputedStyle(opener).backgroundColor;
    if (reduce.matches) {
      anim = composer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
    } else {
      anim = composer.animate([{ clipPath: clipTo(opener) }, { clipPath: OPEN_CLIP }], { duration: 560, easing: EASE });
      wash.animate([{ opacity: 1 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 480, easing: 'ease-out' });
    }
    (form.querySelector('input[name="entry"]:checked') || form.querySelector('input[name="entry"]')).focus({ preventScroll: true });
    // Phones keep the gallery bar near the bottom, so leave room for it under Save.
    const r = composer.getBoundingClientRect(), room = innerWidth <= 640 ? 160 : 24;
    if (r.bottom > innerHeight - room) {
      scrollBy({ top: Math.min(r.top - 12, r.bottom - innerHeight + room), behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  }

  function hide() {
    if (!open) return;
    open = false;
    opener.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('focusing');
    for (const el of dimmed) el.inert = false;
    stopMotion();
    if (reduce.matches) {
      composer.hidden = true;
    } else {
      wash.style.background = getComputedStyle(opener).backgroundColor;
      anim = composer.animate([{ clipPath: OPEN_CLIP }, { clipPath: clipTo(opener) }], { duration: 260, easing: EASE });
      wash.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
      anim.onfinish = () => { composer.hidden = true; wash.getAnimations().forEach((a) => a.cancel()); };
    }
    opener.focus({ preventScroll: true });
  }

  // Timesheet: every total is recounted from the cells, so typed edits and saved entries agree.
  function recount() {
    const day = Array(7).fill(0);
    let week = 0;
    for (const tr of document.querySelectorAll('.sheet tbody tr')) {
      let sum = 0;
      for (const c of tr.querySelectorAll('.cell')) {
        const m = minutes(c.value);
        day[+c.dataset.day] += m;
        sum += m;
      }
      tr.querySelector('.row-total').textContent = fmt(sum);
      week += sum;
    }
    document.querySelectorAll('.strip li[data-day]').forEach((li, j) => {
      const f = li.querySelector('.fig');
      f.textContent = day[j] ? fmt(day[j]) : '–';
      f.classList.toggle('nil', !day[j]);
    });
    document.getElementById('f-wk').textContent = fmt(week);
    return { today: fmt(day[2]), week: fmt(week) };
  }
  function landInSheet(row, mins) {
    const cell = document.querySelector(`.sheet tbody tr[data-row="${row}"] .cell[data-day="2"]`);
    cell.value = fmt(minutes(cell.value) + mins);
    return { el: cell, ...recount() };
  }

  // Landing: the demo week is a plain table, so recount from its text.
  function landInFrag(row, mins) {
    const tr = document.querySelector(`.frag tbody tr[data-row="${row}"]`);
    const td = tr.querySelector('td.now');
    td.textContent = fmt(minutes(td.textContent) + mins);
    td.classList.remove('nil');
    let sum = 0;
    tr.querySelectorAll('td:not(.tot)').forEach((c) => { sum += minutes(c.textContent); });
    tr.querySelector('.tot').textContent = fmt(sum);
    let today = 0, week = 0;
    document.querySelectorAll('.frag tbody tr').forEach((r) => {
      today += minutes(r.querySelector('td.now').textContent);
      week += minutes(r.querySelector('.tot').textContent);
    });
    document.getElementById('f-now').textContent = fmt(today);
    document.getElementById('f-wk').textContent = fmt(week);
    return { el: td, today: fmt(today), week: fmt(week) };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const mins = parse(hours.value);
    if (!(mins >= 1 && mins <= 24 * 60)) {
      hours.setAttribute('aria-invalid', 'true');
      note.textContent = hours.value.trim() ? 'Enter a time like 1:30, up to 24 hours' : 'Enter a time like 1:30';
      note.classList.add('err');
      hours.focus();
      return;
    }
    const row = +form.elements.entry.value;
    hide();
    const res = page === 'time' ? landInSheet(row, mins) : landInFrag(row, mins);
    res.el.classList.remove('landed');
    void res.el.offsetWidth;
    res.el.classList.add('landed');
    res.el.addEventListener('animationend', () => res.el.classList.remove('landed'), { once: true });
    const at = res.el.getBoundingClientRect(), floor = innerHeight - (innerWidth <= 640 ? 170 : 24);
    res.el.scrollIntoView({ block: at.top < 60 || at.bottom > floor ? 'center' : 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    if (live) live.textContent = `Added ${fmt(mins)} to ${names[row]}, Wednesday. Today ${res.today}, week ${res.week}.`;
  });

  hours.addEventListener('input', () => { if (hours.hasAttribute('aria-invalid')) clearError(); });
  opener.addEventListener('click', show);
  composer.querySelector('.c-cancel').addEventListener('click', hide);
  document.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') {
      e.preventDefault();
      hide();
    }
  });
  // Dimmed regions are inert, so a press on them lands on an ancestor like main or body.
  document.addEventListener('pointerdown', (e) => {
    if (!open || composer.contains(e.target)) return;
    const t = e.target;
    if (t === document.body || t === document.documentElement || t.closest('main, header, footer, .peer-tabs')) hide();
  });

  if (page === 'time') document.querySelector('.sheet')?.addEventListener('change', recount);
})();
