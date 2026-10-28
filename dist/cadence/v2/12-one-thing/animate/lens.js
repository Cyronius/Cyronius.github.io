// 12 One Thing · Animate: one accent shape travels to whichever action is the one action now (2026-10-28).
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const live = document.getElementById('live');
  const say = (text) => { if (live) live.textContent = text; };
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  // cubic-bezier(.16, 1, .3, 1), solved per frame so the shape can follow live element positions
  const ease = (() => {
    const cx = 0.48, bx = 3 * (0.3 - 0.16) - cx, ax = 1 - cx - bx;
    const cy = 3, by = 3 * (1 - 1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x, d = dx(t);
        if (Math.abs(e) < 1e-5 || !d) break;
        t -= e / d;
      }
      return sy(clamp01(t));
    };
  })();

  const COPY = ['display', 'alignItems', 'justifyContent', 'justifyItems', 'flexDirection', 'gap', 'paddingTop', 'paddingRight',
    'paddingBottom', 'paddingLeft', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'whiteSpace'];
  function ghost(el) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const g = document.createElement('div');
    g.className = 'ghost-lab';
    g.innerHTML = el.innerHTML;
    for (const p of COPY) g.style[p] = cs[p];
    Object.assign(g.style, { boxSizing: 'border-box', width: `${r.width}px`, height: `${r.height}px` });
    const from = el.querySelectorAll('svg'), to = g.querySelectorAll('svg');
    from.forEach((s, i) => {
      const c = getComputedStyle(s);
      Object.assign(to[i].style, { width: c.width, height: c.height, strokeWidth: c.strokeWidth, transform: 'none', transition: 'none' });
    });
    return g;
  }
  const radius = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;

  let layer = null, flight = null;
  function travel(from, to, change) {
    flight?.finish();
    if (reduce.matches) {
      from.classList.remove('is-one');
      change?.();
      to.classList.add('is-one');
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'travel';
      layer.setAttribute('aria-hidden', 'true');
      document.body.append(layer);
    }
    const root = document.documentElement;
    const gA = ghost(from), rA = radius(from), wA = from.getBoundingClientRect().width, hA = from.getBoundingClientRect().height;
    root.classList.add('travelling');
    from.classList.remove('is-one');
    change?.();
    const gB = ghost(to), rB = radius(to), wB = to.getBoundingClientRect().width, hB = to.getBoundingClientRect().height;
    layer.replaceChildren(gA, gB);
    layer.classList.add('on');

    const t0 = performance.now(), D = 720;
    let raf = 0, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      to.classList.add('is-one');
      layer.classList.remove('on');
      layer.replaceChildren();
      root.classList.remove('travelling');
      flight = null;
    };
    const step = (now) => {
      const p = clamp01((now - t0) / D), e = ease(p);
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      const x = a.left + (b.left - a.left) * e, y = a.top + (b.top - a.top) * e;
      const w = a.width + (b.width - a.width) * e, h = a.height + (b.height - a.height) * e;
      const vw = layer.clientWidth, vh = layer.clientHeight;
      layer.style.clipPath = `inset(${y}px ${vw - x - w}px ${vh - y - h}px ${x}px round ${rA + (rB - rA) * e}px)`;
      gA.style.transform = `translate(${x + Math.max(0, w - wA) / 2}px, ${y + (h - hA) / 2}px)`;
      gB.style.transform = `translate(${x + Math.max(0, w - wB) / 2}px, ${y + (h - hB) / 2}px)`;
      gA.style.opacity = String(1 - clamp01(e / 0.4));
      gB.style.opacity = String(clamp01((e - 0.6) / 0.35));
      if (p < 1) raf = requestAnimationFrame(step);
      else finish();
    };
    flight = { finish };
    step(t0);
  }

  const page = document.body.dataset.page;

  if (page === 'landing') {
    const hero = document.querySelector('.hero .go');
    const trial = document.querySelector('.site-nav .trial');
    const bar = document.querySelector('.site-head');
    if (!hero || !trial || !bar) return;
    const current = () => {
      const r = hero.getBoundingClientRect();
      return r.top + r.height / 2 > bar.getBoundingClientRect().bottom ? hero : trial;
    };
    let holder = hero;
    const first = current();
    if (first !== hero) {
      hero.classList.remove('is-one');
      trial.classList.add('is-one');
      holder = trial;
    }
    let queued = false;
    const check = () => {
      queued = false;
      const want = current();
      if (want === holder) return;
      const from = holder;
      holder = want;
      travel(from, want);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    return;
  }

  if (page !== 'time') return;
  const track = document.querySelector('.head .go.track');
  const timer = document.querySelector('.timer');
  const stop = timer?.querySelector('.stop');
  const runWrap = document.querySelector('.running');
  if (!track || !timer || !stop || !runWrap) return;
  const use = stop.querySelector('use');
  const digits = timer.querySelector('.digits');
  const runCell = runWrap.querySelector('.cell');
  const rows = [...document.querySelectorAll('.sheet tbody tr')];
  const days = [...document.querySelectorAll('.strip li[data-day]')];
  const weekFig = document.getElementById('f-wk');

  // The page opens with the timer at 0:47:12 and the running cell at 1:45, which already includes it.
  const START = 47 * 60 + 12;
  const CELL_AT_START = 105;
  let banked = START * 1000, since = performance.now(), running = true, offset = 0, shown = CELL_AT_START, tick = 0;

  const secs = () => Math.floor((banked + (running ? performance.now() - since : 0)) / 1000);
  const hms = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const parse = (v) => {
    const t = /^\s*(\d{1,2}):([0-5]\d)\s*$/.exec(v);
    if (t) return +t[1] * 60 + +t[2];
    const d = /^\s*(\d{0,2}(?:\.\d+)?)\s*$/.exec(v);
    return d && d[1] ? Math.round(parseFloat(d[1]) * 60) : 0;
  };

  function totals() {
    const day = Array(7).fill(0);
    let week = 0;
    for (const tr of rows) {
      let sum = 0;
      for (const c of tr.querySelectorAll('.cell')) {
        const m = parse(c.value);
        day[+c.dataset.day] += m;
        sum += m;
      }
      tr.querySelector('.row-total').textContent = fmt(sum);
      week += sum;
    }
    days.forEach((li, j) => {
      const f = li.querySelector('.fig');
      f.textContent = day[j] ? fmt(day[j]) : '–';
      f.classList.toggle('nil', !day[j]);
    });
    weekFig.textContent = fmt(week);
  }

  function render() {
    const s = secs();
    digits.textContent = hms(s);
    const m = Math.max(0, CELL_AT_START + offset + Math.floor((s - START) / 60));
    if (m !== shown && document.activeElement !== runCell) {
      shown = m;
      runCell.value = fmt(m);
      totals();
    }
  }
  function loop() {
    clearTimeout(tick);
    render();
    if (running && !document.hidden) {
      const ms = (banked + performance.now() - since) % 1000;
      tick = setTimeout(loop, 1000 - ms + 8);
    }
  }
  document.addEventListener('visibilitychange', loop);

  function setRunning(on) {
    if (on) since = performance.now();
    else banked += performance.now() - since;
    running = on;
    loop();
  }
  function showState() {
    timer.dataset.state = running ? 'running' : 'stopped';
    timer.setAttribute('aria-label', running ? 'Timer, running' : 'Timer, stopped');
    stop.setAttribute('aria-label', running ? 'Stop timer' : 'Start timer');
    use.setAttribute('href', running ? '#i-stop' : '#i-play');
    runWrap.classList.toggle('is-stopped', !running);
    runCell.setAttribute('aria-label', `Website redesign, Design, Wednesday${running ? ', timer running' : ''}`);
  }
  const startTimer = () => {
    setRunning(true);
    travel(track, stop, showState);
    say('Timer started on Website redesign · Design.');
  };

  stop.addEventListener('click', () => {
    if (!running) return startTimer();
    setRunning(false);
    travel(stop, track, showState);
    say(`Timer stopped at ${hms(secs())}.`);
  });
  track.addEventListener('click', () => {
    if (!running) return startTimer();
    timer.classList.remove('nudge');
    void timer.offsetWidth;
    timer.classList.add('nudge');
    say('A timer is already running on Website redesign · Design. Stop it first.');
  });
  stop.addEventListener('animationend', () => timer.classList.remove('nudge'));

  runCell.addEventListener('change', () => {
    offset = parse(runCell.value) - CELL_AT_START - Math.floor((secs() - START) / 60);
    shown = -1;
    render();
    totals();
  });
  document.querySelector('.sheet').addEventListener('change', (e) => { if (e.target !== runCell) totals(); });

  loop();
})();
