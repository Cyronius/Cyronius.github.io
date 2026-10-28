// 03 Evergreen · Animate (2026-10-28): odometer figures, a live timer, and totals that roll when time changes.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const H = 1.1;
  const START = 47 * 60 + 12;
  const reels = new WeakMap();

  const fmt = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const clock = s => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const digitsOf = t => [...t].filter(c => c >= '0' && c <= '9').map(Number);
  const shapeOf = t => t.replace(/\d/g, '#');
  const parse = raw => {
    const t = (raw || '').trim();
    if (t === '' || t === '–') return 0;
    let m = t.match(/^(\d{1,2}):([0-5]\d)$/);
    if (m) return +m[1] * 60 + +m[2];
    m = t.match(/^\d{1,2}(?:[.,]\d+)?$/);
    if (m) return Math.round(parseFloat(t.replace(',', '.')) * 60);
    return null;
  };

  function build(host, text) {
    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = text;
    const odo = document.createElement('span');
    odo.className = 'odo';
    odo.setAttribute('aria-hidden', 'true');
    const list = [];
    for (const ch of text) {
      const col = document.createElement('span');
      if (ch >= '0' && ch <= '9') {
        const reel = document.createElement('span');
        reel.className = 'reel';
        reel.textContent = '01234567890123456789'.split('').join('\n');
        reel.style.transform = `translateY(${-ch * H}em)`;
        col.append(reel);
        list.push(reel);
      } else {
        col.textContent = ch;
      }
      odo.append(col);
    }
    host.replaceChildren(sr, odo);
    host.classList.add('odo-host');
    const st = { shape: shapeOf(text), list, sr, digits: digitsOf(text) };
    reels.set(host, st);
    return st;
  }

  function turn(reel, from, to, delay, dur) {
    reel.getAnimations().forEach(a => a.cancel());
    reel.style.transform = `translateY(${-(to % 10) * H}em)`;
    if (from === to) return;
    reel.animate(
      [{ transform: `translateY(${-from * H}em)` }, { transform: `translateY(${-to * H}em)` }],
      { duration: dur, delay, easing: EASE, fill: 'backwards' }
    );
  }

  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  // Intro spins each digit a full turn from 0; later changes roll forward from the digit shown.
  function show(host, text, { intro = false, delay = 0, dur = 800, step = 45 } = {}) {
    if (reduce) {
      const before = host.textContent;
      host.textContent = text;
      if (!intro && before !== text) flash(host);
      return;
    }
    let st = reels.get(host);
    if (!st) {
      const now = host.textContent.trim();
      st = build(host, shapeOf(now) === shapeOf(text) && !intro ? now : text.replace(/\d/g, '0'));
    } else if (st.shape !== shapeOf(text)) {
      st = build(host, text.replace(/\d/g, '0'));
    }
    const next = digitsOf(text);
    st.list.forEach((reel, i) => {
      const a = intro ? 0 : st.digits[i];
      const b = intro ? next[i] + 10 : next[i] >= a ? next[i] : next[i] + 10;
      turn(reel, a, b, delay + i * step, dur);
    });
    st.digits = next;
    st.sr.textContent = text;
  }

  function showEmpty(host) {
    reels.delete(host);
    host.classList.remove('odo-host');
    host.innerHTML = '<span aria-hidden="true">–</span><span class="sr">no time</span>';
  }

  // Inputs cannot hold reels, so a figure rolls over the input and is removed when it lands.
  function rollInput(input, from, to, opts) {
    const cell = input.closest('.cell');
    cell.querySelector('.odo-over')?.remove();
    clearTimeout(cell.dataset.t);
    input.value = to;
    if (reduce || !to || document.activeElement === input) {
      if (reduce && from !== to) flash(input);
      cell.classList.remove('is-rolling');
      return;
    }
    const over = document.createElement('span');
    over.className = 'odo-over';
    over.setAttribute('aria-hidden', 'true');
    const cs = getComputedStyle(input);
    over.style.color = cs.color;
    over.style.fontWeight = cs.fontWeight;
    over.textContent = from || to;
    cell.append(over);
    cell.classList.add('is-rolling');
    show(over, to, opts);
    const n = digitsOf(to).length;
    cell.dataset.t = setTimeout(() => {
      over.remove();
      cell.classList.remove('is-rolling');
    }, (opts.delay || 0) + (opts.dur || 800) + n * (opts.step ?? 45) + 60);
  }

  // The timer: one tick per second, paused while the tab is hidden.
  function runTimer(onSecond, startAfter) {
    const t0 = performance.now() + startAfter;
    const base = performance.now();
    let id = 0;
    let last = START;
    const tick = () => {
      const s = START + Math.max(0, Math.floor((performance.now() - base) / 1000));
      if (s !== last && performance.now() >= t0) {
        onSecond(s, last);
        last = s;
      }
      schedule();
    };
    const schedule = () => {
      clearTimeout(id);
      if (document.hidden) return;
      const into = (performance.now() - base) % 1000;
      id = setTimeout(tick, Math.max(1000 - into + 8, performance.now() < t0 ? t0 - performance.now() : 0));
    };
    document.addEventListener('visibilitychange', () => (document.hidden ? clearTimeout(id) : tick()));
    schedule();
  }

  const isApp = document.body.classList.contains('app');

  if (!isApp) {
    const tiles = [...document.querySelectorAll('.days > div')];
    const readout = document.querySelector('.readout .num');
    const today = document.querySelector('.days .is-today dd');
    const week = document.querySelector('.days .is-week dd');
    const miniCell = document.querySelector('.mini td.run');
    const miniRow = miniCell?.closest('tr').querySelector('td:last-child b');
    const miniFoot = document.querySelectorAll('.mini tfoot td');
    const miniDay = miniFoot[3];
    const miniWeek = miniFoot[miniFoot.length - 1];
    const base = { today: parse(today.textContent), week: parse(week.textContent), cell: parse(miniCell.textContent), row: parse(miniRow.textContent) };

    tiles.forEach((tile, i) => {
      if (tile.classList.contains('is-empty')) return;
      const dd = tile.querySelector('dd');
      show(dd, dd.textContent.trim(), { intro: true, delay: 160 + i * 90 });
    });
    show(readout, clock(START), { intro: true, delay: 160 + 2 * 90, step: 40 });

    runTimer((s, prev) => {
      show(readout, clock(s), { dur: 420, step: 0 });
      const m = Math.floor(s / 60) - 47;
      if (Math.floor(prev / 60) - 47 === m) return;
      const opts = { dur: 700, step: 40 };
      show(today, fmt(base.today + m), opts);
      show(week, fmt(base.week + m), opts);
      show(miniCell, fmt(base.cell + m), opts);
      show(miniRow, fmt(base.row + m), opts);
      show(miniDay, fmt(base.today + m), opts);
      show(miniWeek, fmt(base.week + m), opts);
    }, 1900);
    return;
  }

  const rows = [...document.querySelectorAll('.grid tbody tr')];
  const inputs = rows.map(r => [...r.querySelectorAll('.cell input')]);
  const rowTotals = rows.map(r => r.querySelector('td.total'));
  const foot = [...document.querySelectorAll('.grid tfoot td')].slice(1, 9);
  const tiles = [...document.querySelectorAll('.strip > div')];
  const timer = document.querySelector('.timer-digits');
  const status = document.getElementById('status');
  const running = document.querySelector('.cell.running input');
  let runBase = parse(running.value) - 47;
  let minutes = 47;

  const sums = () => {
    const m = inputs.map(row => row.map(i => parse(i.value) ?? 0));
    const day = m[0].map((_, d) => m.reduce((a, row) => a + row[d], 0));
    return { row: m.map(r => r.reduce((a, b) => a + b, 0)), day, week: day.reduce((a, b) => a + b, 0) };
  };
  let shown = sums();

  const setDay = (d, mins, opts) => {
    const tile = tiles[d];
    const dd = tile.querySelector('dd');
    tile.classList.toggle('is-empty', mins === 0 && !tile.classList.contains('is-today'));
    foot[d].classList.toggle('nil', mins === 0);
    if (mins === 0) {
      showEmpty(dd);
      reels.delete(foot[d]);
      foot[d].textContent = '–';
      return;
    }
    show(dd, fmt(mins), opts);
    show(foot[d], fmt(mins), opts);
  };

  function settle(opts) {
    const next = sums();
    next.row.forEach((v, r) => { if (v !== shown.row[r]) show(rowTotals[r], fmt(v), opts); });
    next.day.forEach((v, d) => { if (v !== shown.day[d]) setDay(d, v, opts); });
    if (next.week !== shown.week) {
      show(tiles[7].querySelector('dd'), fmt(next.week), opts);
      show(foot[7], fmt(next.week), opts);
    }
    shown = next;
    return next;
  }

  for (let c = 0; c < 8; c++) {
    const delay = 140 + c * 90;
    const tile = tiles[c];
    if (!tile.classList.contains('is-empty')) {
      const dd = tile.querySelector('dd');
      show(dd, dd.textContent.trim(), { intro: true, delay });
    }
    rows.forEach((_, r) => {
      const d = delay + (r + 1) * 28;
      if (c < 7) {
        const input = inputs[r][c];
        if (input.value) rollInput(input, input.value, input.value, { intro: true, delay: d });
      } else {
        show(rowTotals[r], rowTotals[r].textContent.trim(), { intro: true, delay: d });
      }
    });
    if (!foot[c].classList.contains('nil')) show(foot[c], foot[c].textContent.trim(), { intro: true, delay: delay + 6 * 28 });
  }
  show(timer, clock(START), { intro: true, delay: 140 + 2 * 90, step: 40 });

  runTimer((s, prev) => {
    show(timer, clock(s), { dur: 420, step: 0 });
    timer.setAttribute('aria-label', `Elapsed ${Math.floor(s / 60)} minutes ${s % 60} seconds`);
    const m = Math.floor(s / 60);
    if (m === minutes) return;
    minutes = m;
    const before = running.value;
    rollInput(running, before, fmt(runBase + m), { dur: 700, step: 40 });
    settle({ dur: 700, step: 40 });
  }, 1900);

  document.querySelector('.grid').addEventListener('focusin', e => {
    const cell = e.target.closest('.cell');
    cell?.querySelector('.odo-over')?.remove();
    cell?.classList.remove('is-rolling');
  });

  document.querySelector('.grid').addEventListener('change', e => {
    const input = e.target.closest('.cell input');
    if (!input) return;
    const v = parse(input.value);
    if (v === null) return;
    input.value = v ? fmt(v) : '';
    if (input === running) runBase = v - minutes;
    const next = settle({ dur: 700, step: 40 });
    status.textContent = `Week total ${fmt(next.week)}`;
  });
})();
