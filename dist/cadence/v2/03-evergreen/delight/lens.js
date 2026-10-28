// 03 Evergreen · Delight (2026-10-28): the timer's pill moves between the bar and today's cell, in both directions.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canMorph = 'startViewTransition' in document && !reduce;
  const START = 47 * 60 + 12;
  const TODAY = 2;
  const isApp = document.body.classList.contains('app');

  const fmt = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const clock = s => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const parse = raw => {
    const t = (raw || '').trim();
    if (t === '' || t === '–') return 0;
    let m = t.match(/^(\d{1,2}):([0-5]\d)$/);
    if (m) return +m[1] * 60 + +m[2];
    m = t.match(/^\d{1,2}(?:[.,]\d+)?$/);
    if (m) return Math.round(parseFloat(t.replace(',', '.')) * 60);
    return null;
  };

  const bar = document.querySelector('.timer');
  const pill = bar.querySelector('.timer-pill');
  const digits = bar.querySelector('.timer-digits');
  const label = bar.querySelector('.timer-label');
  const stopBtn = bar.querySelector('.timer-stop');
  const startBtn = bar.querySelector('.timer-start');
  const status = document.getElementById('status');

  // Each row: its seven day fields, its total, and a "Project · Task" label.
  const rows = [...document.querySelectorAll(isApp ? '.grid tbody tr' : '.mini tbody tr')].map(tr => {
    const name = isApp ? tr.querySelector('.task-name').textContent : tr.querySelector('.proj > span:last-child').firstChild.textContent;
    const meta = (isApp ? tr.querySelector('.task-meta') : tr.querySelector('small')).textContent;
    const days = isApp ? [...tr.querySelectorAll('.cell input')] : [...tr.querySelectorAll('td')].slice(0, 7);
    return {
      days,
      total: isApp ? tr.querySelector('td.total') : tr.querySelector('td:last-child b'),
      label: `${name.trim()} · ${meta.split(' · ')[0].trim()}`,
      field: isApp ? days[TODAY] : days[TODAY].querySelector('.v'),
      box: days[TODAY].closest('td').querySelector('.cell, .mcell'),
      go: days[TODAY].closest('td').querySelector('.cell-go'),
    };
  });
  const foot = [...document.querySelectorAll(isApp ? '.grid tfoot td' : '.mini tfoot td')].slice(1, 9);
  const tiles = [...document.querySelectorAll(isApp ? '.strip > div' : '.days > div')];

  const read = el => (el.tagName === 'INPUT' ? el.value : (el.querySelector('.v') || el).textContent);
  const write = (el, mins, running = false) => {
    const text = mins || running ? fmt(mins) : '';
    if (el.tagName === 'INPUT') { el.value = text; return; }
    el.textContent = text || '–';
    const td = el.closest('td');
    td.classList.toggle('nil', !text);
    td.classList.toggle('num', !!text);
  };

  function totals() {
    const m = rows.map(r => r.days.map(d => parse(read(d)) ?? 0));
    const day = m[0].map((_, d) => m.reduce((a, row) => a + row[d], 0));
    rows.forEach((r, i) => { r.total.textContent = fmt(m[i].reduce((a, b) => a + b, 0)); });
    day.forEach((v, d) => {
      const tile = tiles[d];
      const dd = tile.querySelector('dd');
      tile.classList.toggle('is-empty', !v && !tile.classList.contains('is-today'));
      dd.innerHTML = v ? fmt(v) : '<span aria-hidden="true">–</span><span class="sr">no time</span>';
      foot[d].textContent = v ? fmt(v) : '–';
      foot[d].classList.toggle('nil', !v);
    });
    const week = day.reduce((a, b) => a + b, 0);
    tiles[7].querySelector('dd').textContent = fmt(week);
    foot[7].textContent = fmt(week);
  }

  // Timer state: which row runs, when it started, and the minutes its cell held before.
  let run = 0;
  let last = 0;
  let zero = performance.now() - START * 1000;
  let before = parse(read(rows[0].field)) - 47;
  let shownMin = 47;
  let busy = false;
  let tickId = 0;

  const elapsed = () => Math.max(0, Math.floor((performance.now() - zero) / 1000));

  function paint() {
    if (run === null) return;
    const s = elapsed();
    digits.textContent = clock(s);
    digits.setAttribute('aria-label', `Elapsed ${Math.floor(s / 60)} minutes ${s % 60} seconds`);
    const m = Math.floor(s / 60);
    if (m !== shownMin) {
      shownMin = m;
      write(rows[run].field, before + m, true);
      totals();
    }
  }
  function loop() {
    clearTimeout(tickId);
    if (document.hidden || run === null) return;
    paint();
    tickId = setTimeout(loop, 1000 - ((performance.now() - zero) % 1000) + 8);
  }
  document.addEventListener('visibilitychange', loop);

  function setRunning(i) {
    rows.forEach((r, k) => {
      r.box.classList.toggle('running', k === i);
      if (isApp) r.field.setAttribute('aria-label', r.field.getAttribute('aria-label').replace(/, timer running$/, '') + (k === i ? ', timer running' : ''));
    });
    bar.classList.toggle('is-running', i !== null);
    bar.classList.toggle('is-stopped', i === null);
    bar.setAttribute('aria-label', i === null ? 'Timer, stopped' : 'Timer, running');
    stopBtn.hidden = i === null;
    startBtn.hidden = i !== null;
    label.textContent = rows[i ?? last].label;
    startBtn.setAttribute('aria-label', `Start timer on ${rows[last].label}`);
  }

  // Horizontal only: bring the cell into its scroller so the pill has somewhere visible to land.
  function reveal(row) {
    const sc = row.field.closest('.sheet-scroll, .mini-scroll');
    if (!sc) return;
    const r = row.field.getBoundingClientRect();
    const s = sc.getBoundingClientRect();
    const first = row.field.closest('tr').firstElementChild;
    const sticky = getComputedStyle(first).position === 'sticky' ? first.getBoundingClientRect().width : 0;
    if (r.left < s.left + sticky) sc.scrollLeft -= s.left + sticky - r.left + 12;
    else if (r.right > s.right) sc.scrollLeft += r.right - s.right + 12;
  }

  function morph(from, to, update) {
    return new Promise(done => {
      if (!canMorph) {
        update();
        done();
        return;
      }
      from.style.viewTransitionName = 'evg-pill';
      const vt = document.startViewTransition(() => {
        from.style.viewTransitionName = '';
        update();
        to.style.viewTransitionName = 'evg-pill';
      });
      vt.finished.finally(() => {
        to.style.viewTransitionName = '';
        done();
      });
    });
  }

  function land(el) {
    el.classList.remove('landed');
    void el.offsetWidth;
    el.classList.add('landed');
  }

  async function stop() {
    if (run === null) return;
    const row = rows[run];
    const hadFocus = bar.contains(document.activeElement);
    paint();
    const kept = before + Math.floor(elapsed() / 60);
    reveal(row);
    await morph(pill, row.field, () => {
      last = run;
      run = null;
      clearTimeout(tickId);
      write(row.field, kept);
      totals();
      setRunning(null);
      if (hadFocus) startBtn.focus();
    });
    land(row.field);
    status.textContent = `Timer stopped. ${row.label}, today ${kept ? fmt(kept) : 'no time'}.`;
  }

  async function start(i) {
    const row = rows[i];
    const fromRow = document.activeElement === row.go;
    reveal(row);
    if (canMorph) row.box.classList.add('lifting');
    await morph(row.field, pill, () => {
      row.box.classList.remove('lifting');
      run = i;
      last = i;
      before = parse(read(row.field)) ?? 0;
      zero = performance.now();
      shownMin = 0;
      write(row.field, before, true);
      digits.textContent = clock(0);
      setRunning(i);
      totals();
      if (fromRow || bar.contains(document.activeElement) || document.activeElement === document.body) stopBtn.focus();
    });
    land(pill);
    status.textContent = `Timer started on ${row.label}.`;
    loop();
  }

  async function guard(fn) {
    if (busy) return;
    busy = true;
    try { await fn(); } finally { busy = false; }
  }

  stopBtn.addEventListener('click', () => guard(stop));
  startBtn.addEventListener('click', () => guard(() => start(last)));
  rows.forEach((r, i) => r.go.addEventListener('click', () => guard(async () => {
    if (run !== null && run !== i) await stop();
    if (run === null) await start(i);
  })));

  if (isApp) {
    document.querySelector('.grid').addEventListener('change', e => {
      const input = e.target.closest('.cell input');
      if (!input) return;
      const v = parse(input.value);
      if (v === null) return;
      input.value = v ? fmt(v) : '';
      if (run !== null && input === rows[run].field) before = v - Math.floor(elapsed() / 60);
      totals();
    });
  }

  loop();
})();
