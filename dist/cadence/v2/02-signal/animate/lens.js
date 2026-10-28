// Signal · Animate: the mark keeps the visitor's time, the demo week fills, totals advance with the timer (2026-10-28).
(() => {
  window.cadenceLens = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const toMin = (s) => {
    const m = String(s).trim().match(/^(\d+):(\d\d)$/);
    return m ? +m[1] * 60 + +m[2] : 0;
  };
  const fmt = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  function roll(el, text, delay = 0) {
    const old = el.dataset.v ?? el.textContent;
    el.dataset.v = text;
    if (old === text) return Promise.resolve();
    if (reduce.matches) { el.textContent = text; return Promise.resolve(); }
    const same = old.length === text.length;
    const pairs = same
      ? [...text].map((ch, i) => (ch === old[i] ? ch : [old[i], ch]))
      : [[old, text]];
    el.textContent = '';
    const runs = [];
    for (const p of pairs) {
      if (typeof p === 'string') { el.append(p); continue; }
      const box = document.createElement('span');
      const a = document.createElement('span');
      const b = document.createElement('span');
      box.className = 'roll';
      a.textContent = p[0];
      b.textContent = p[1];
      box.append(a, b);
      el.append(box);
      const o = { duration: 520, easing: EASE, delay, fill: 'both' };
      a.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-75%)', opacity: 0 }], o);
      runs.push(b.animate([{ transform: 'translateY(75%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], o).finished);
    }
    return Promise.all(runs).then(() => { if (el.dataset.v === text) el.textContent = text; }, () => {});
  }

  function rollInput(input, text, delay = 0) {
    const old = input.dataset.v ?? input.value;
    input.dataset.v = text;
    if (old === text) return;
    if (document.activeElement === input) return;
    if (reduce.matches) { input.value = text; return; }
    const ov = document.createElement('span');
    ov.className = 'cell-roll';
    ov.setAttribute('aria-hidden', 'true');
    ov.dataset.v = old;
    ov.textContent = old;
    input.after(ov);
    input.classList.add('is-rolling');
    input.value = text;
    roll(ov, text, delay).then(() => { ov.remove(); input.classList.remove('is-rolling'); });
  }

  // ---------- Landing ----------
  function landing() {
    const mark = document.querySelector('.hero-mark');
    const frag = document.querySelector('.frag.week');
    if (!mark || !frag) return;
    const root = document.documentElement;
    const motion = root.classList.contains('motion');

    const angles = (d) => {
      const m = d.getMinutes() + d.getSeconds() / 60;
      return [m * 6, ((d.getHours() % 12) + m / 60) * 30];
    };
    let [lastM, lastH] = angles(new Date());
    let minRot = parseFloat(root.style.getPropertyValue('--min-rot')) || 0;
    let hrRot = parseFloat(root.style.getPropertyValue('--hr-rot')) || 0;
    const fwd = (a, b) => (((b - a) % 360) + 360) % 360;
    const tick = () => {
      const [m, h] = angles(new Date());
      minRot += fwd(lastM, m);
      hrRot += fwd(lastH, h);
      lastM = m;
      lastH = h;
      root.style.setProperty('--min-rot', `${minRot}deg`);
      root.style.setProperty('--hr-rot', `${hrRot}deg`);
    };
    let clock;
    const schedule = () => {
      clearTimeout(clock);
      clock = setTimeout(() => { tick(); schedule(); }, 60000 - (Date.now() % 60000) + 30);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(clock);
      else { tick(); schedule(); }
    });
    schedule();

    const settle = () => mark.classList.add('settled');
    if (motion) {
      mark.querySelector('.hand-min').addEventListener('animationend', settle, { once: true });
      setTimeout(settle, 2600);
    } else settle();

    if (!motion) return;

    const tiles = [...frag.querySelectorAll('.strip .tile:not(.tile-week) .tile-hours')].slice(0, 3);
    const weekTile = frag.querySelector('.tile-week .tile-hours');
    const rows = [...frag.querySelectorAll('tbody tr')];
    const cells = rows.map((r) => [...r.querySelectorAll('td.d .cell')].slice(0, 3));
    const vals = cells.map((r) => r.map((c) => toMin(c.textContent)));
    const rowTot = rows.map((r) => r.querySelector('td.rt'));
    const foot = [...frag.querySelectorAll('tfoot td.d')].slice(0, 3);
    const footWeek = frag.querySelector('tfoot td.rt');
    const dayVals = [0, 1, 2].map((d) => sum(vals.map((r) => r[d])));
    const DAY_GAP = 300;
    const COUNT = 820;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    function fill() {
      for (const r of cells) for (const c of r) if (!c.classList.contains('is-empty')) c.classList.add('pre');
      for (const el of [...tiles, ...foot, ...rowTot, weekTile, footWeek]) el.textContent = '0:00';
      frag.classList.add('is-filled');
      const t0 = performance.now();
      cells.forEach((r, ri) => r.forEach((c, d) => {
        setTimeout(() => c.classList.remove('pre'), d * DAY_GAP + ri * 70);
      }));
      const frame = (now) => {
        const p = [0, 1, 2].map((d) => easeOut(Math.min(1, Math.max(0, (now - t0 - d * DAY_GAP) / COUNT))));
        tiles.forEach((el, d) => { el.textContent = fmt(Math.round(dayVals[d] * p[d])); });
        foot.forEach((el, d) => { el.textContent = fmt(Math.round(dayVals[d] * p[d])); });
        rowTot.forEach((el, r) => { el.textContent = fmt(sum(vals[r].map((v, d) => Math.round(v * p[d])))); });
        const week = fmt(Math.round(sum(dayVals.map((v, d) => v * p[d]))));
        weekTile.textContent = week;
        footWeek.textContent = week;
        if (p[2] < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    const markDrawn = new Promise((r) => setTimeout(r, 1150));
    const seen = new Promise((r) => {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { io.disconnect(); r(); }
      }, { threshold: 0.6 });
      io.observe(frag.querySelector('.strip'));
    });
    Promise.all([markDrawn, seen]).then(fill);
  }

  // ---------- Timesheet ----------
  function timesheet() {
    const digits = document.querySelector('.timer-digits');
    const runTd = document.querySelector('td.is-running');
    if (!digits || !runTd) return;
    const timer = document.querySelector('.timer');
    const stopBtn = timer.querySelector('.timer-stop');
    const runInput = runTd.querySelector('input');
    const bar = runTd.querySelector('.min-bar');
    const live = document.getElementById('totals-live');
    const rows = [...document.querySelectorAll('.grid tbody tr')];
    const inputs = rows.map((r) => [...r.querySelectorAll('input.cell')]);
    const rowTot = rows.map((r) => r.querySelector('td.rt'));
    const foot = [...document.querySelectorAll('.grid tfoot td.d')];
    const tiles = [...document.querySelectorAll('.strip .tile:not(.tile-week)')];
    const weekTile = document.querySelector('.tile-week .tile-hours');
    const footWeek = document.querySelector('.grid tfoot td.rt');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const runRow = rows.indexOf(runTd.parentElement);
    const runDay = inputs[runRow].indexOf(runInput);
    const runLabel = runInput.getAttribute('aria-label');

    let timerSec = 47 * 60 + 12;
    // Earlier entries today add 58:40, so the cell reads 1:45 and its next minute lands 8 s after load.
    let base = toMin(runInput.value) * 60 + 52 - timerSec;
    let running = true;
    let anchor = performance.now();
    let anchorSec = timerSec;
    let loopId;

    const store = inputs.map((r) => r.map((i) => toMin(i.value)));
    const cellMin = (r, d) => (r === runRow && d === runDay ? Math.floor((base + timerSec) / 60) : store[r][d]);

    const showTimer = () => {
      const h = Math.floor(timerSec / 3600);
      const m = Math.floor(timerSec / 60) % 60;
      const s = timerSec % 60;
      digits.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      digits.setAttribute('aria-label', `${h ? `${h} hours ` : ''}${m} minutes ${s} seconds`);
    };
    const showBar = (instant) => {
      if (!bar) return;
      const f = ((base + timerSec) % 60) / 60;
      bar.style.transition = instant || f === 0 ? 'none' : '';
      bar.style.transform = `scaleX(${f})`;
    };

    function render(announceDay) {
      const day = days.map((_, d) => sum(rows.map((__, r) => cellMin(r, d))));
      const week = sum(day);
      rollInput(runInput, fmt(cellMin(runRow, runDay)), 0);
      rowTot.forEach((el, r) => roll(el, fmt(sum(days.map((_, d) => cellMin(r, d)))), 110));
      tiles.forEach((t, d) => {
        t.classList.toggle('is-empty', !day[d]);
        roll(t.querySelector('.tile-hours'), day[d] ? fmt(day[d]) : '–', 110);
      });
      foot.forEach((el, d) => {
        el.classList.toggle('is-blank', !day[d]);
        roll(el, day[d] ? fmt(day[d]) : '–', 110);
      });
      if (weekTile) roll(weekTile, fmt(week), 220);
      roll(footWeek, fmt(week), 220);
      if (announceDay != null) live.textContent = `${days[announceDay]} ${fmt(day[announceDay])}, week ${fmt(week)}`;
    }

    function loop() {
      clearTimeout(loopId);
      if (!running || document.hidden) return;
      const now = performance.now();
      const sec = anchorSec + Math.floor((now - anchor) / 1000);
      if (sec !== timerSec) {
        const before = Math.floor((base + timerSec) / 60);
        timerSec = sec;
        showTimer();
        showBar();
        if (Math.floor((base + timerSec) / 60) !== before) render();
      }
      loopId = setTimeout(loop, 1000 - ((now - anchor) % 1000) + 8);
    }

    stopBtn.addEventListener('click', () => {
      running = !running;
      if (running) { anchor = performance.now(); anchorSec = timerSec; }
      timer.classList.toggle('is-stopped', !running);
      runTd.classList.toggle('is-stopped', !running);
      timer.setAttribute('aria-label', running ? 'Timer, running' : 'Timer, stopped');
      runInput.setAttribute('aria-label', running ? runLabel : runLabel.replace(', timer running', ''));
      stopBtn.querySelector('span').textContent = running ? 'Stop' : 'Start';
      stopBtn.querySelector('use').setAttribute('href', running ? '#i-stop' : '#i-play');
      loop();
    });

    const parse = (raw) => {
      const s = raw.trim().toLowerCase().replace(',', '.');
      let m;
      if (!s || s === '–' || s === '-') return 0;
      if ((m = s.match(/^(\d{1,2}):([0-5]\d)$/))) return +m[1] * 60 + +m[2];
      if ((m = s.match(/^(\d+)\s*m$/))) return +m[1];
      if ((m = s.match(/^(?:(\d+(?:\.\d+)?)\s*h)\s*(?:(\d+)\s*m?)?$/))) return Math.round(+m[1] * 60 + (+m[2] || 0));
      if (/^\d*\.?\d+$/.test(s)) return +s <= 24 ? Math.round(+s * 60) : Math.round(+s);
      return null;
    };

    inputs.forEach((row, r) => row.forEach((input, d) => {
      input.addEventListener('change', () => {
        const v = parse(input.value);
        if (v == null || v > 24 * 60) {
          input.value = input.dataset.v ?? (cellMin(r, d) ? fmt(cellMin(r, d)) : '');
          live.textContent = 'Type hours like 1:30, 1.5 or 90m';
          return;
        }
        if (r === runRow && d === runDay) base = v * 60 + ((base + timerSec) % 60) - timerSec;
        else store[r][d] = v;
        input.value = v ? fmt(v) : '';
        input.dataset.v = input.value;
        input.classList.toggle('is-empty', !v);
        render(d);
      });
    }));
    runInput.addEventListener('blur', () => {
      const v = fmt(cellMin(runRow, runDay));
      if (runInput.value !== v) { runInput.value = v; runInput.dataset.v = v; }
    });

    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    showBar(true);
    loop();
  }

  landing();
  timesheet();
})();
