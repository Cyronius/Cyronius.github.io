// 11 Dial · Delight: turn the dial. The hand snaps to a day and the page reads that day back.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAYS = [
    ['Monday', 'Oct 26'], ['Tuesday', 'Oct 27'], ['Wednesday', 'Oct 28'], ['Thursday', 'Oct 29'],
    ['Friday', 'Oct 30'], ['Saturday', 'Oct 31'], ['Sunday', 'Nov 1'],
  ];
  const ROWS = [
    { p: 'Website redesign', t: 'Design', c: '--p-red', m: [210, 135, 105, 0, 0, 0, 0], run: 2 },
    { p: 'Website redesign', t: 'Development', c: '--p-red', m: [120, 180, 150, 0, 0, 0, 0] },
    { p: 'Annual audit', t: 'Fieldwork', c: '--p-teal', m: [90, 120, 0, 0, 0, 0, 0] },
    { p: 'Mobile app', t: 'QA', c: '--p-violet', m: [0, 75, 60, 0, 0, 0, 0] },
    { p: 'Internal', t: 'Planning', c: '--p-amber', m: [45, 30, 15, 0, 0, 0, 0] },
  ];
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const dayTotal = (d) => ROWS.reduce((s, r) => s + r.m[d], 0);
  const valueText = (d) => {
    const n = ROWS.filter((r) => r.m[d]).length;
    const [name, date] = DAYS[d];
    return n ? `${name}, ${date}: ${fmt(dayTotal(d))} over ${n} tasks` : `${name}, ${date}: no time tracked`;
  };
  const STEP = 360 / 7;
  const centre = (d) => (d + 0.5) * STEP;

  // A dial control: pointer drag, tap, and slider keys. `tip` maps an angle to the hand tip within the dial box (0–1).
  const makeDial = ({ el, hand, grip, tip, onPick }) => {
    let sel = Number(el.getAttribute('aria-valuenow'));
    let angle = centre(sel);
    let pressed = false;
    let moved = false;

    const place = (a, glide) => {
      el.classList.toggle('gliding', glide && !still);
      const delta = ((((a - angle) % 360) + 540) % 360) - 180;
      angle += delta;
      hand.style.transform = `rotate(${angle}deg)`;
      const rad = (angle * Math.PI) / 180;
      const [x, y] = tip(rad);
      grip.style.left = `${x * 100}%`;
      grip.style.top = `${y * 100}%`;
    };
    const pick = (d, glide = true) => {
      d = Math.max(0, Math.min(6, d));
      place(centre(d), glide);
      if (d === sel) return;
      sel = d;
      el.setAttribute('aria-valuenow', String(d));
      el.setAttribute('aria-valuetext', valueText(d));
      onPick(d);
    };
    const angleAt = (e) => {
      const r = el.querySelector('svg').getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    };
    const dayAt = (a) => Math.min(6, Math.floor(a / STEP));

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      pressed = true;
      moved = false;
      el.setPointerCapture(e.pointerId);
      const a = angleAt(e);
      place(a, true);
      const d = dayAt(a);
      if (d !== sel) { sel = d; el.setAttribute('aria-valuenow', String(d)); el.setAttribute('aria-valuetext', valueText(d)); onPick(d); }
    });
    el.addEventListener('pointermove', (e) => {
      if (!pressed) return;
      moved = true;
      el.classList.add('dragging');
      const a = angleAt(e);
      place(a, false);
      const d = dayAt(a);
      if (d !== sel) { sel = d; el.setAttribute('aria-valuenow', String(d)); el.setAttribute('aria-valuetext', valueText(d)); onPick(d); }
    });
    const release = () => {
      if (!pressed) return;
      pressed = false;
      el.classList.remove('dragging');
      place(centre(sel), true);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('keydown', (e) => {
      const next = { ArrowRight: sel + 1, ArrowUp: sel + 1, PageUp: sel + 1, ArrowLeft: sel - 1, ArrowDown: sel - 1, PageDown: sel - 1, Home: 0, End: 6 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      pick(next);
    });
    place(angle, false);
    return { pick };
  };

  // Landing: the hero dial and its readout.
  const turn = document.querySelector('.week-dial .turn');
  if (turn) {
    const tracks = [...turn.querySelectorAll('.seg-track')];
    const fills = [...turn.querySelectorAll('.seg-fill')];
    const labels = [...turn.querySelectorAll('.labels > g')];
    const head = document.querySelector('.ro-head');
    const list = document.querySelector('.ro-list');
    const empty = document.querySelector('.ro-empty');

    const read = (d) => {
      tracks.forEach((t, i) => t.classList.toggle('sel', i === d));
      fills.forEach((f, i) => f.classList.toggle('sel', i === d));
      labels.forEach((l, i) => l.classList.toggle('sel', i === d));
      const [name, date] = DAYS[d];
      const total = dayTotal(d);
      head.querySelector('.ro-day').textContent = `${name}, ${date}`;
      head.querySelector('.ro-total').textContent = total ? fmt(total) : '0:00';
      list.replaceChildren(...ROWS.filter((r) => r.m[d]).map((r) => {
        const li = document.createElement('li');
        li.style.setProperty('--c', `var(${r.c})`);
        li.innerHTML = `<span class="ro-name">${r.p} <span>${r.t}</span></span>${r.run === d ? '<span class="ro-run">Timer running</span>' : ''}<span class="ro-h">${fmt(r.m[d])}</span>`;
        return li;
      }));
      empty.hidden = total > 0;
      empty.textContent = total ? '' : `No time tracked on ${name}.`;
      document.querySelector('.readout').classList.remove('swap');
      void list.offsetWidth;
      document.querySelector('.readout').classList.add('swap');
    };

    makeDial({
      el: turn,
      hand: turn.querySelector('.turn-hand'),
      grip: turn.querySelector('.grip'),
      tip: (rad) => [(360 + 100 * Math.sin(rad) - 84) / 552, (360 - 100 * Math.cos(rad) - 84) / 552],
      onPick: read,
    });
  }

  // Timesheet: the week dial's knob picks a day; a frame slides to that column and the strip marks it.
  const knobDial = document.querySelector('.strip .turn');
  if (knobDial) {
    const items = [...document.querySelectorAll('.strip li')].slice(0, 7);
    const wrap = document.querySelector('.grid-wrap');
    const frame = document.querySelector('.col-frame');
    const heads = [...document.querySelectorAll('.sheet thead th')].slice(1, 8);
    const live = document.querySelector('.turn-live');
    let current = 2;

    const fit = (glide) => {
      const th = heads[current];
      frame.classList.toggle('gliding', glide && !still);
      frame.style.width = `${th.offsetWidth}px`;
      frame.style.height = `${wrap.querySelector('.sheet').offsetHeight}px`;
      frame.style.transform = `translateX(${th.offsetLeft}px)`;
    };
    const show = (d) => {
      current = d;
      items.forEach((li, i) => li.classList.toggle('sel', i === d));
      heads.forEach((th, i) => th.classList.toggle('sel', i === d));
      fit(true);
      const th = heads[d];
      const sticky = wrap.querySelector('.sheet thead th').getBoundingClientRect().width;
      const left = th.offsetLeft, right = left + th.offsetWidth;
      if (left < wrap.scrollLeft + sticky || right > wrap.scrollLeft + wrap.clientWidth) {
        const stuck = getComputedStyle(wrap.querySelector('.sheet thead th')).position === 'sticky';
        wrap.scrollTo({ left: left - (stuck ? sticky : 0) - 12, behavior: still ? 'auto' : 'smooth' });
      }
      const total = dayTotal(d);
      live.textContent = `${DAYS[d][0]}, ${DAYS[d][1]}: ${total ? fmt(total) : 'no time tracked'}`;
    };

    makeDial({
      el: knobDial,
      hand: knobDial.querySelector('.knob-g'),
      grip: knobDial.querySelector('.grip'),
      tip: (rad) => [(50 + 44 * Math.sin(rad)) / 100, (50 - 44 * Math.cos(rad)) / 100],
      onPick: show,
    });
    fit(false);
    frame.classList.add('ready');
    addEventListener('resize', () => fit(false));
    document.fonts?.ready.then(() => fit(false));
  }

})();
