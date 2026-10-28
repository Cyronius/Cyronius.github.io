// 17 Poster · Animate: starts the poster sequence and runs the live timer on the timesheet (2026-10-28).
document.documentElement.classList.add('play');

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const sync = () => html.classList.toggle('is-hidden', document.hidden);
  document.addEventListener('visibilitychange', sync);
  sync();

  const timer = document.querySelector('.timer');
  const grid = document.querySelector('.grid');
  if (!timer || !grid) return;

  const digits = timer.querySelector('.timer-digits');
  const stopBtn = timer.querySelector('.timer-stop');
  const act = stopBtn.querySelector('.timer-act');
  const icon = stopBtn.querySelector('use');
  const announce = document.getElementById('announce');
  const rows = [...grid.tBodies[0].rows];
  const inputs = rows.map((r) => [...r.querySelectorAll('input.cell')]);
  const rowTotals = rows.map((r) => r.querySelector('.row-total'));
  const stripDays = [...document.querySelectorAll('.strip .day:not(.total)')];
  const stripWeek = document.querySelector('.strip .day.total .day-total');
  const footCells = [...grid.tFoot.rows[0].cells].slice(1, 8);
  const footWeek = grid.tFoot.querySelector('.grand');
  const DAYS = ['Mon 26', 'Tue 27', 'Wed 28', 'Thu 29', 'Fri 30', 'Sat 31', 'Sun 1'];
  const RUN = { row: 0, day: 2 };
  const runWrap = inputs[RUN.row][RUN.day].parentElement;
  const AMBER = getComputedStyle(html).getPropertyValue('--amber-text').trim();
  const BLUE = getComputedStyle(html).getPropertyValue('--blue').trim();

  const fmt = (m) => (m > 0 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : '–');
  const clock = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const parse = (raw) => {
    const v = raw.trim().toLowerCase();
    let m;
    if (!v || v === '–' || v === '-') return 0;
    if ((m = v.match(/^(\d{1,2}):([0-5]\d)$/))) return +m[1] * 60 + +m[2];
    if ((m = v.match(/^(\d{1,2}(?:\.\d+)?)\s*h?$/))) return Math.round(parseFloat(m[1]) * 60);
    if ((m = v.match(/^(\d{1,4})\s*m$/))) return +m[1];
    return null;
  };

  const minutes = inputs.map((row) => row.map((el) => parse(el.value) ?? 0));
  let acc = 47 * 60 + 12;
  let startedAt = Date.now();
  let running = true;
  const elapsed = () => Math.floor(acc + (running ? (Date.now() - startedAt) / 1000 : 0));
  let runBase = minutes[RUN.row][RUN.day] * 60 - elapsed();
  const runMinutes = () => Math.max(0, Math.floor((runBase + elapsed()) / 60));

  const bump = (el, color) => el.animate([{ color }, {}], { duration: 1400, easing: 'cubic-bezier(.16,1,.3,1)' });
  const setText = (el, text, color) => {
    if (el.textContent === text) return false;
    el.textContent = text;
    if (color) bump(el, color);
    return true;
  };

  function render(color) {
    minutes[RUN.row][RUN.day] = runMinutes();
    const runInput = inputs[RUN.row][RUN.day];
    if (document.activeElement !== runInput) runInput.value = fmt(minutes[RUN.row][RUN.day]).replace('–', '');
    rows.forEach((_, r) => setText(rowTotals[r], fmt(minutes[r].reduce((a, b) => a + b, 0)), color));
    let week = 0;
    DAYS.forEach((_, d) => {
      const sum = minutes.reduce((a, row) => a + row[d], 0);
      week += sum;
      const day = stripDays[d];
      const total = day.querySelector('.day-total');
      setText(total, fmt(sum), color);
      day.classList.toggle('empty', sum === 0 && !day.classList.contains('today'));
      if (sum === 0) total.setAttribute('aria-label', 'No time'); else total.removeAttribute('aria-label');
      setText(footCells[d], fmt(sum), color);
      footCells[d].classList.toggle('nil', sum === 0);
    });
    setText(stripWeek, fmt(week), color);
    setText(footWeek, fmt(week), color);
    return week;
  }

  function tick() {
    const s = elapsed();
    digits.textContent = clock(s);
    if (s % 60 === 0 || !running) {
      digits.setAttribute('aria-label', `Elapsed ${Math.floor(s / 3600) ? Math.floor(s / 3600) + ' hours ' : ''}${Math.floor(s / 60) % 60} minutes ${s % 60} seconds`);
    }
    render(AMBER);
  }

  let loop = null;
  const startLoop = () => { if (!loop && running && !document.hidden) { tick(); loop = setInterval(tick, 1000); } };
  const stopLoop = () => { clearInterval(loop); loop = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stopLoop() : startLoop()));
  startLoop();

  stopBtn.addEventListener('click', () => {
    if (running) {
      acc = elapsed();
      running = false;
      stopLoop();
      tick();
    } else {
      startedAt = Date.now();
      running = true;
      startLoop();
    }
    timer.classList.toggle('is-stopped', !running);
    runWrap.classList.toggle('is-stopped', !running);
    timer.setAttribute('aria-label', running ? 'Timer, running' : 'Timer, stopped');
    act.textContent = running ? 'Stop' : 'Start';
    icon.setAttribute('href', running ? '#i-stop' : '#i-play');
    announce.textContent = running ? 'Timer running' : `Timer stopped at ${clock(elapsed())}`;
  });

  inputs.forEach((row, r) => row.forEach((el, d) => {
    const commit = () => {
      const m = parse(el.value);
      if (m === null || m > 24 * 60) {
        el.setAttribute('aria-invalid', 'true');
        el.value = fmt(minutes[r][d]).replace('–', '');
        announce.textContent = 'Use hours and minutes, like 1:30';
        return;
      }
      el.removeAttribute('aria-invalid');
      if (m === minutes[r][d]) { el.value = fmt(m).replace('–', ''); return; }
      if (r === RUN.row && d === RUN.day) runBase = m * 60 - elapsed();
      minutes[r][d] = m;
      el.value = fmt(m).replace('–', '');
      const week = render(BLUE);
      const day = minutes.reduce((a, rw) => a + rw[d], 0);
      announce.textContent = `${DAYS[d]} total ${fmt(day)}. Week ${fmt(week)}.`;
    };
    el.addEventListener('change', commit);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { commit(); el.select(); } });
  }));
});
