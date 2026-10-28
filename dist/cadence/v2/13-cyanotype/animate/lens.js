// Animate lens: draft the drawing once, count the week up along its measure line, keep the timer live.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const parse = (v) => {
    v = v.trim();
    if (!v || v === '–') return 0;
    let m = v.match(/^(\d{1,2}):([0-5]\d)$/);
    if (m) return +m[1] * 60 + +m[2];
    m = v.match(/^(\d+(?:\.\d+)?|\.\d+)h?$/);
    if (m) return Math.round(parseFloat(m[1]) * 60);
    m = v.match(/^(\d+)m$/);
    return m ? +m[1] : null;
  };

  function countUp(el, target, delay, dur, done) {
    el.textContent = fmt(0);
    const start = performance.now() + delay;
    const step = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      el.textContent = fmt(Math.round(target() * (1 - Math.pow(1 - t, 4))));
      if (t < 1) requestAnimationFrame(step);
      else if (done) done();
    };
    requestAnimationFrame(step);
  }

  const dwg = document.getElementById('dwg');
  if (dwg && !reduce) {
    const total = dwg.querySelector('.wk-total');
    const target = parse(total.textContent);
    const run = () => {
      dwg.classList.remove('held');
      countUp(total, () => target, 1330, 1000);
      setTimeout(() => dwg.classList.remove('drafting'), 2500);
    };
    dwg.classList.add('drafting');
    const r = dwg.getBoundingClientRect();
    if (r.top < innerHeight * 0.85 && r.bottom > 0) {
      run();
    } else {
      dwg.classList.add('held');
      total.textContent = fmt(0);
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); run(); }
      }, { threshold: 0.3 });
      io.observe(dwg);
    }
  }

  const ts = document.querySelector('main.ts');
  if (!ts) return;

  const rows = [...ts.querySelectorAll('.wk tbody tr')];
  const days = [...ts.querySelectorAll('.days > .day')];
  const foot = [...ts.querySelectorAll('.wk tfoot td')].slice(0, 7);
  const grand = ts.querySelector('.wk tfoot .grand');
  const week = ts.querySelector('.week-dim .wk-total');
  const live = document.getElementById('live');
  const runIn = ts.querySelector('.cell.is-running input');
  const timer = document.querySelector('.timer');
  const digits = timer.querySelector('.timer-digits');
  const stopBtn = timer.querySelector('.timer-stop');
  let elapsed = 47 * 60 + 12;
  let since = Date.now() - elapsed * 1000;
  let running = true;
  let runBase = parse(runIn.value) - Math.floor(elapsed / 60);
  let weekMin = 0;
  let counting = false;

  const set = (el, text, flash) => {
    if (el.textContent === text) return;
    el.textContent = text;
    if (flash) { el.classList.remove('settle'); void el.offsetWidth; el.classList.add('settle'); }
  };

  function recompute(flash) {
    const day = Array(7).fill(0);
    for (const tr of rows) {
      let sum = 0;
      tr.querySelectorAll('input').forEach((input, i) => {
        const m = parse(input.value) ?? 0;
        day[i] += m;
        sum += m;
      });
      set(tr.querySelector('.row-tot'), fmt(sum), flash);
    }
    day.forEach((m, i) => {
      foot[i].classList.toggle('muted', !m);
      set(foot[i], m ? fmt(m) : '–', flash);
      const out = days[i].lastElementChild;
      days[i].classList.toggle('is-empty', !m);
      out.className = m ? 'day-total' : 'empty';
      if (m) out.removeAttribute('aria-label'); else out.setAttribute('aria-label', 'No time');
      set(out, m ? fmt(m) : '–', flash);
    });
    weekMin = day.reduce((a, b) => a + b, 0);
    set(grand, fmt(weekMin), flash);
    if (!counting) set(week, fmt(weekMin), flash);
  }

  const hms = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  function tick() {
    const now = Math.floor((Date.now() - since) / 1000);
    if (!running || now === elapsed) return;
    const newMinute = Math.floor(now / 60) !== Math.floor(elapsed / 60);
    elapsed = now;
    digits.textContent = hms(elapsed);
    digits.setAttribute('datetime', `PT${Math.floor(elapsed / 60)}M${elapsed % 60}S`);
    if (newMinute && document.activeElement !== runIn) {
      runIn.value = fmt(runBase + Math.floor(elapsed / 60));
      recompute(true);
    }
  }
  let loopId = 0;
  const loop = () => {
    clearInterval(loopId);
    if (running && !document.hidden) { tick(); loopId = setInterval(tick, 250); }
  };
  document.addEventListener('visibilitychange', loop);

  stopBtn.addEventListener('click', () => {
    running = !running;
    if (running) since = Date.now() - elapsed * 1000;
    timer.classList.toggle('is-stopped', !running);
    timer.setAttribute('aria-label', running ? 'Timer, running' : 'Timer, stopped');
    runIn.closest('.cell').classList.toggle('is-running', running);
    runIn.setAttribute('aria-label', `Website redesign, Design, Wednesday${running ? ', timer running' : ''}`);
    stopBtn.innerHTML = `<svg class="i" aria-hidden="true"><use href="#i-${running ? 'stop' : 'play'}"/></svg>${running ? 'Stop' : 'Start'}`;
    live.textContent = running ? 'Timer started' : `Timer stopped at ${hms(elapsed)}`;
    loop();
  });

  ts.querySelector('.wk tbody').addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;
    const m = parse(input.value);
    if (m === null) input.setAttribute('aria-invalid', 'true');
    else {
      input.removeAttribute('aria-invalid');
      input.value = m ? fmt(m) : '';
      if (input === runIn) runBase = m - Math.floor(elapsed / 60);
    }
    recompute(true);
    live.textContent = `Week total ${fmt(weekMin)}`;
  });

  recompute(false);
  if (!reduce) {
    ts.classList.add('drafting');
    counting = true;
    countUp(week, () => weekMin, 1080, 1000, () => { counting = false; set(week, fmt(weekMin)); });
    setTimeout(() => ts.classList.remove('drafting'), 2300);
  }
  loop();
})();
