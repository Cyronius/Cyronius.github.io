// 11 Dial · Animate: the hand lays the week down day by day; the timesheet then runs live.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = (m) => `${Math.floor(m / 60)}:${String(Math.round(m) % 60).padStart(2, '0')}`;

  const run = (duration, frame, done) => {
    const t0 = performance.now();
    const step = (now) => {
      const t = now - t0;
      frame(t);
      if (t < duration) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  };

  // Landing: the hand sweeps from the top of the week and each day's arc follows it to its hours.
  const dial = document.querySelector('.week-dial');
  if (dial && !still) {
    const hand = dial.querySelector('.sweep-hand');
    const fills = [...dial.querySelectorAll('.seg-fill')];
    const figs = [...dial.querySelectorAll('.df')].slice(0, 3);
    const total = document.querySelector('.wk-total');
    const MINS = [465, 540, 330];
    const G = 0.03, C = 0.098, V = 0.94;
    const dashMax = MINS.map((m) => V * m / 720 - 2 * C);
    // Hand stops: the tip of each day's arc, in week units (one unit per day).
    const stops = MINS.map((m, i) => i + G + C + dashMax[i]);
    const legs = [[0, stops[0], 560], [stops[0], stops[1], 640], [stops[1], stops[2], 620]];
    const PAUSE = 90;
    const timeline = [];
    let at = 220;
    for (const [from, to, dur] of legs) { timeline.push({ from, to, start: at, dur }); at += dur + PAUSE; }
    const END = at;

    const paint = (u) => {
      hand.setAttribute('transform', `rotate(${(u / 7) * 360} 360 360)`);
      let sum = 0;
      fills.forEach((f, i) => {
        const start = i + G + C;
        const d = clamp(u - start, 0, dashMax[i]);
        f.style.strokeDasharray = `${d} 7`;
        f.style.opacity = clamp((u - (i + G)) / C, 0, 1);
        const m = dashMax[i] > 0 ? (d / dashMax[i]) * MINS[i] : 0;
        const shown = Math.round(m / 5) * 5;
        figs[i].textContent = fmt(u >= stops[i] ? MINS[i] : shown);
        sum += u >= stops[i] ? MINS[i] : shown;
      });
      total.textContent = fmt(sum);
    };
    paint(0);
    run(END, (t) => {
      let u = 0;
      for (const leg of timeline) {
        if (t >= leg.start) u = leg.from + (leg.to - leg.from) * easeOut(clamp((t - leg.start) / leg.dur, 0, 1));
      }
      paint(u);
    }, () => {
      paint(stops[2]);
      hand.setAttribute('transform', 'rotate(121 360 360)');
      fills.forEach((f) => { f.style.strokeDasharray = ''; f.style.opacity = ''; });
    });
  }

  // Timesheet
  const strip = document.querySelector('.strip');
  if (!strip) return;

  const rows = [...document.querySelectorAll('.sheet tbody tr')];
  const cells = rows.map((r) => [...r.querySelectorAll('.cell')]);
  const rowTotals = rows.map((r) => r.querySelector('.row-total'));
  const dayItems = [...strip.querySelectorAll('li')].slice(0, 7);
  const dayArcs = dayItems.map((li) => li.querySelector('.arc'));
  const dayFigs = dayItems.map((li) => li.querySelector('.fig'));
  const weekArcs = [...strip.querySelectorAll('.week .arc')];
  const weekFig = strip.querySelector('.week .fig');
  const running = document.querySelector('.running .cell');
  const live = document.querySelector('.sheet-live');
  const DAY_C = 0.152, WEEK_C = 0.0886, WEEK_V = 0.94;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const parse = (v) => {
    v = v.trim();
    if (!v) return 0;
    let m = v.match(/^(\d{1,2}):([0-5]\d)$/);
    if (m) return +m[1] * 60 + +m[2];
    m = v.match(/^(\d{1,2})(?:[.,](\d+))?$/);
    if (m) return Math.round(parseFloat(`${m[1]}.${m[2] || 0}`) * 60);
    m = v.match(/^(\d{1,3})m$/);
    if (m) return +m[1];
    return null;
  };
  const value = (input) => parse(input.value) ?? 0;

  const dayDash = (m) => Math.max(0, m / 60 - 2 * DAY_C);
  const weekDash = (m) => Math.max(0, (WEEK_V * m) / 720 - 2 * WEEK_C);
  const setDayArc = (i, m) => {
    const a = dayArcs[i];
    if (!a) return;
    a.style.strokeDasharray = `${dayDash(m)} 12`;
    a.style.opacity = clamp(m / 18, 0, 1);
  };
  const setWeekArc = (i, m) => {
    const a = weekArcs[i];
    if (!a) return;
    a.style.strokeDasharray = `${weekDash(m)} 7`;
    a.style.opacity = clamp(m / 18, 0, 1);
  };
  const flash = (el) => {
    el.classList.remove('tick');
    void el.getBoundingClientRect();
    el.classList.add('tick');
  };
  const setText = (el, text) => {
    if (el.textContent === text) return false;
    el.textContent = text;
    flash(el);
    return true;
  };

  // Days 3 to 6 have no arc in the markup; give each an empty one so edits there can draw.
  dayItems.forEach((li, i) => {
    if (dayArcs[i]) return;
    const svg = li.querySelector('svg');
    const arc = dayArcs[0].cloneNode();
    arc.style.strokeDasharray = '0 12';
    arc.style.opacity = 0;
    svg.append(arc);
    dayArcs[i] = arc;
  });
  const weekGroup = weekArcs[0].parentNode;
  for (let i = weekArcs.length; i < 7; i++) {
    const arc = weekArcs[0].cloneNode();
    arc.setAttribute('stroke-dashoffset', String(-(i + 0.1186)));
    arc.style.strokeDasharray = '0 7';
    arc.style.opacity = 0;
    weekGroup.append(arc);
    weekArcs[i] = arc;
  }

  const totals = () => {
    const days = Array(7).fill(0);
    const byRow = cells.map((row) => row.reduce((s, c, d) => { const m = value(c); days[d] += m; return s + m; }, 0));
    return { days, byRow, week: days.reduce((a, b) => a + b, 0) };
  };

  const render = (announce) => {
    const t = totals();
    t.byRow.forEach((m, r) => setText(rowTotals[r], fmt(m)));
    t.days.forEach((m, d) => {
      setDayArc(d, m);
      setWeekArc(d, m);
      const fig = dayFigs[d];
      fig.classList.toggle('empty', m === 0);
      setText(fig, m ? fmt(m) : '–');
    });
    setText(weekFig, fmt(t.week));
    if (announce !== undefined) live.textContent = `${DAYS[announce]} ${t.days[announce] ? fmt(t.days[announce]) : 'empty'}, week ${fmt(t.week)}`;
  };

  // Intro: arcs sweep to their values Mon → Wed while the week ring fills in step.
  const intro = (done) => {
    const start = totals();
    const order = start.days.map((m, d) => ({ m, d })).filter((x) => x.m > 0);
    const DUR = 900, GAP = 260, LEAD = 200;
    const END = LEAD + GAP * (order.length - 1) + DUR;
    const paint = (t) => {
      let week = 0;
      order.forEach(({ m, d }, k) => {
        const p = easeOut(clamp((t - LEAD - k * GAP) / DUR, 0, 1));
        const shown = m * p;
        setDayArc(d, shown);
        setWeekArc(d, shown);
        dayFigs[d].textContent = fmt(Math.round(shown));
        week += Math.round(shown);
      });
      weekFig.textContent = fmt(week);
    };
    paint(0);
    run(END, paint, () => { paint(END); done(); });
  };

  const goLive = () => { document.body.classList.add('live'); render(); };
  if (still) goLive(); else intro(goLive);

  cells.flat().forEach((c) => {
    c.dataset.prev = c.value;
    c.addEventListener('change', () => {
      const m = parse(c.value);
      if (m === null) { c.value = c.dataset.prev; return; }
      c.value = m ? fmt(m) : '';
      c.dataset.prev = c.value;
      render(cells.find((row) => row.includes(c)).indexOf(c));
    });
  });

  // Timer: the ring is the current minute's lap; each completed lap lands in today's cell and the totals.
  const digits = document.querySelector('.timer .digits');
  const lap = document.querySelector('.timer .run .a');
  const START = 47 * 60 + 12;
  const loaded = Date.now();
  let lastMinute = Math.floor(START / 60);
  let owed = 0;
  const tick = () => {
    const sec = START + Math.floor((Date.now() - loaded) / 1000);
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    digits.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (s === 0) {
      lap.style.transition = 'none';
      lap.style.strokeDasharray = '0 60';
      void lap.getBoundingClientRect();
      lap.style.transition = '';
    } else {
      lap.style.strokeDasharray = `${s} 60`;
    }
    const minute = Math.floor(sec / 60);
    owed += minute - lastMinute;
    lastMinute = minute;
    if (owed > 0 && document.activeElement !== running) {
      running.value = fmt(value(running) + owed);
      running.dataset.prev = running.value;
      owed = 0;
      if (document.body.classList.contains('live')) render();
    }
  };
  setInterval(() => { if (!document.hidden) tick(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();
