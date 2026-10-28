// 18 Spectrum · Animate — day totals tally as the week stacks in; timesheet edits flow to every total (2026-10-28)
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const easeOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  // Landing: timings mirror lens.css (start 360ms, 440ms per day, 80ms per entry, 640ms rise)
  const axis = document.querySelectorAll('.band-axis li');
  if (axis.length && !still) {
    // Labels fade in by transition, not animation, so a re-layout cannot restart them hidden.
    const band = document.querySelector('.band');
    band.classList.add('pending');
    requestAnimationFrame(() => requestAnimationFrame(() => band.classList.remove('pending')));
    axis.forEach((li) => {
      const span = li.querySelector('span');
      const to = +li.style.getPropertyValue('--m');
      const d = +li.style.getPropertyValue('--d');
      const n = +li.style.getPropertyValue('--n');
      const t0 = performance.now() + 360 + d * 440;
      const dur = (n - 1) * 80 + 640;
      span.textContent = fmt(0);
      const step = (now) => {
        const t = Math.min(1, Math.max(0, (now - t0) / dur));
        span.textContent = fmt(Math.round(easeOut(t) * to));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const grid = document.querySelector('.grid');
  const strip = document.querySelector('.strip');
  if (!grid || !strip) return;

  const order = ['c-red', 'c-teal', 'c-violet', 'c-amber'];
  const days = [...strip.querySelectorAll('.day:not(.total)')];
  const week = strip.querySelector('.day.total');
  const dayNames = [...grid.tHead.rows[0].cells].slice(1, 8).map((th) => th.textContent.trim());
  const foot = [...grid.tFoot.rows[0].cells].slice(1, 8);
  const grand = grid.querySelector('.grand');
  const tally = document.getElementById('tally');
  const rows = [...grid.tBodies[0].rows].map((tr) => ({
    p: order.find((c) => tr.classList.contains(c)),
    h: tr.style.getPropertyValue('--h'),
    cells: [...tr.querySelectorAll('.cell')],
    total: tr.querySelector('.row-total'),
  }));

  const parse = (raw) => {
    const v = raw.trim();
    if (!v) return 0;
    let m = /^(\d{1,2}):([0-5]\d)$/.exec(v);
    let mins = m ? +m[1] * 60 + +m[2] : null;
    if (mins === null && /^\d{1,2}([.,]\d{1,2})?$/.test(v)) mins = Math.round(parseFloat(v.replace(',', '.')) * 60);
    return mins !== null && mins <= 1440 ? mins : null;
  };
  const minutes = new Map();
  rows.forEach((r) => r.cells.forEach((c) => minutes.set(c, parse(c.value) ?? 0)));

  const place = (stack, perProject) => {
    for (const p of order) {
      let seg = stack.querySelector(`i.${p}`);
      const m = perProject[p] || 0;
      if (m && !seg) {
        seg = document.createElement('i');
        seg.className = p;
        const next = order.slice(order.indexOf(p) + 1).map((q) => stack.querySelector(`i.${q}`)).find(Boolean);
        stack.insertBefore(seg, next || null);
      }
      if (m) seg.style.setProperty('--m', m);
      else if (seg) seg.remove();
    }
  };

  const timers = new WeakMap();
  const bump = (el, hue) => {
    el.style.setProperty('--fh', hue);
    el.classList.add('bump');
    clearTimeout(timers.get(el));
    timers.set(el, setTimeout(() => el.classList.remove('bump'), 650));
  };
  const setText = (el, text, hue) => {
    if (el.textContent === text) return;
    el.textContent = text;
    bump(el, hue);
  };

  let dayTotals = [];
  let weekTotal = 0;

  function render(hue) {
    const segs = [...strip.querySelectorAll('.stack i')];
    const before = new Map(segs.map((el) => [el, el.getBoundingClientRect()]));
    strip.classList.add('settled');
    segs.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));

    const perDay = days.map(() => ({}));
    const perWeek = {};
    dayTotals = days.map(() => 0);
    rows.forEach((r) => {
      let rowTotal = 0;
      r.cells.forEach((c, i) => {
        const m = minutes.get(c);
        rowTotal += m;
        dayTotals[i] += m;
        perDay[i][r.p] = (perDay[i][r.p] || 0) + m;
        perWeek[r.p] = (perWeek[r.p] || 0) + m;
      });
      setText(r.total, rowTotal ? fmt(rowTotal) : '–', hue);
    });
    weekTotal = dayTotals.reduce((a, b) => a + b, 0);
    const max = Math.max(...dayTotals, 1);

    days.forEach((li, i) => {
      const t = dayTotals[i];
      const total = li.querySelector('.day-total');
      place(li.querySelector('.stack'), perDay[i]);
      li.querySelector('.stack').style.setProperty('--w', `${(t / max) * 100}%`);
      li.classList.toggle('empty', !t);
      setText(total, t ? fmt(t) : '–', hue);
      if (t) total.removeAttribute('aria-label');
      else total.setAttribute('aria-label', 'No time');
      setText(foot[i], t ? fmt(t) : '–', hue);
      foot[i].classList.toggle('nil', !t);
    });
    place(week.querySelector('.stack'), perWeek);
    setText(week.querySelector('.day-total'), fmt(weekTotal), hue);
    setText(grand, fmt(weekTotal), hue);

    if (still) return;
    for (const el of strip.querySelectorAll('.stack i')) {
      const a = el.getBoundingClientRect();
      const b = before.get(el);
      if (!a.width) continue;
      if (b && Math.abs(b.left - a.left) < 0.5 && Math.abs(b.width - a.width) < 0.5) continue;
      const from = b && b.width ? `translateX(${b.left - a.left}px) scaleX(${b.width / a.width})` : 'scaleX(0)';
      el.animate([{ transform: from }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
  }

  const rowOf = (c) => rows.find((r) => r.cells.includes(c));
  const apply = (c, m) => {
    if (m === minutes.get(c)) return;
    minutes.set(c, m);
    render(rowOf(c).h);
  };
  const commit = (c) => {
    const m = parse(c.value);
    const i = rowOf(c).cells.indexOf(c);
    if (m === null) {
      const kept = minutes.get(c);
      c.value = kept ? fmt(kept) : '';
      tally.textContent = `Not a time. Kept ${kept ? fmt(kept) : 'blank'}.`;
      return;
    }
    apply(c, m);
    c.value = m ? fmt(m) : '';
    tally.textContent = `${dayNames[i]} ${dayTotals[i] ? fmt(dayTotals[i]) : 'no time'}. Week ${fmt(weekTotal)}.`;
  };

  grid.addEventListener('focusin', (e) => {
    if (e.target.matches('.cell')) e.target.dataset.was = e.target.value;
  });
  grid.addEventListener('input', (e) => {
    if (!e.target.matches('.cell')) return;
    const m = parse(e.target.value);
    if (m !== null) apply(e.target, m);
  });
  grid.addEventListener('change', (e) => {
    if (e.target.matches('.cell')) commit(e.target);
  });
  grid.addEventListener('keydown', (e) => {
    const c = e.target;
    if (!c.matches('.cell')) return;
    if (e.key === 'Enter') commit(c);
    if (e.key === 'Escape' && c.dataset.was !== undefined) {
      c.value = c.dataset.was;
      commit(c);
    }
  });
  setTimeout(() => strip.classList.add('settled'), 2400);
})();
