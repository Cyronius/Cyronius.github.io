// 16 Greenhouse · Animate — Day ↔ Week density morph and a live timer (2026-10-28).
(() => {
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const MORPH = 560;
  const TODAY = 2;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DATES = ['October 26', 'October 27', 'October 28', 'October 29', 'October 30', 'October 31', 'November 1'];
  const SHORT = ['Mon Oct 26', 'Tue Oct 27', 'Wed Oct 28', 'Thu Oct 29', 'Fri Oct 30', 'Sat Oct 31', 'Sun Nov 1'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => !reduce.matches && typeof Element.prototype.animate === 'function';

  const fmt = (m) => (m > 0 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : '');
  const dash = (m) => fmt(m) || '–';
  const spoken = (m) => fmt(m) || 'no time';
  const parse = (v) => {
    v = v.trim().toLowerCase();
    if (!v || v === '–' || v === '-') return 0;
    let m = v.match(/^(\d{1,2}):([0-5]\d)$/);
    if (m) return +m[1] * 60 + +m[2];
    m = v.match(/^(\d+)\s*m$/);
    if (m) return +m[1];
    m = v.match(/^(\d*\.?\d+)\s*h?$/);
    return m ? Math.round(parseFloat(m[1]) * 60) : null;
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const rel = (el, box) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
  };
  const keyOf = (el) => ('cell' in el.dataset ? 'c' + el.dataset.cell : 'label' in el.dataset ? 'l' + el.dataset.label : 'f' + el.dataset.foot);
  const partners = (view) => {
    const map = new Map();
    for (const el of view.querySelectorAll('[data-cell],[data-label],[data-foot]')) map.set(keyOf(el), el);
    return map;
  };

  // One sheet, two densities: the week view and the day view share partners keyed by row and day.
  function Sheet(area, o) {
    const bg = area.querySelector('.sheet-bg');
    const band = area.querySelector('.morph-band');
    const weekV = area.querySelector('.week-view');
    const dayV = area.querySelector('.day-view');
    const state = { density: 'week', day: TODAY };
    let anims = [];
    let finish = null;
    const run = (a) => (anims.push(a), a);

    function settle() {
      const f = finish;
      finish = null;
      anims.forEach((a) => a.cancel());
      anims = [];
      if (f) f();
    }
    function done(fn) {
      finish = fn;
      Promise.all(anims.map((a) => a.finished)).then(() => { if (finish === fn) settle(); }, () => {});
    }
    function radius() {
      return parseFloat(getComputedStyle(bg).borderTopLeftRadius) || 0;
    }

    // Card edge, the green band and the content below all travel together.
    function frame(A1, H1, src, dst, fade) {
      const H2 = area.offsetHeight;
      const maxH = Math.max(H1, H2);
      const W = area.clientWidth;
      const R = radius();
      const opt = { duration: MORPH, easing: EASE };
      bg.style.height = band.style.height = maxH + 'px';
      if (H1 !== H2) {
        run(area.animate([{ clipPath: `inset(0 0 ${H2 - H1}px 0 round ${R}px)` }, { clipPath: `inset(0 0 0 0 round ${R}px)` }], opt));
        for (const el of o.followers || []) run(el.animate([{ transform: `translateY(${H1 - H2}px)` }, { transform: 'none' }], opt));
      }
      const br = o.bandRadius || 22;
      const ins = (r) => `inset(${r.y}px ${W - r.x - r.w}px ${maxH - r.y - r.h}px ${r.x}px round ${br}px)`;
      const kf = [{ clipPath: ins(src), opacity: fade[0] }, { clipPath: ins(dst), opacity: fade[1] }];
      if (fade[0] < 1) kf.splice(1, 0, { opacity: 1, offset: 0.3 });
      else if (fade[1] < 1) kf.splice(1, 0, { opacity: 1, offset: 0.6 });
      band.hidden = false;
      run(band.animate(kf, opt));
    }

    function morph(toDay, day) {
      const from = toDay ? weekV : dayV;
      const to = toDay ? dayV : weekV;
      if (toDay) o.renderDay(day);
      if (!canMove()) {
        from.hidden = true;
        to.hidden = false;
        if (reduce.matches && to.animate) run(to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }));
        return;
      }
      if (toDay && o.reveal) o.reveal(day);
      const A1 = area.getBoundingClientRect();
      const H1 = area.offsetHeight;
      const fromP = partners(from);
      const first = new Map();
      fromP.forEach((el, k) => first.set(k, rel(el, A1)));
      const src = toDay ? o.colRect(day, A1) : rel(dayV.querySelector('.day-panel'), A1);
      // Mark travellers before the veil applies, or they inherit its delayed fade.
      const toP = partners(to);
      toP.forEach((el, k) => { if (first.has(k)) el.classList.add('fly'); });

      const top = from.offsetTop;
      from.classList.add('leaving');
      from.style.top = top + 'px';
      to.classList.add('veil');
      to.hidden = false;
      area.classList.add('morphing');
      if (!toDay && o.reveal) o.reveal(day);

      const A2 = area.getBoundingClientRect();
      const flights = [];
      toP.forEach((el, k) => {
        if (first.has(k)) flights.push([el, first.get(k), rel(el, A2), fromP.get(k), k[0] === 'c']);
      });
      const dst = toDay ? rel(dayV.querySelector('.day-panel'), A2) : o.colRect(day, A2);
      const lit = day === TODAY ? 1 : 0;
      frame(A1, H1, src, dst, toDay ? [lit, 1] : [1, lit]);

      for (const [el, f, l, twin, scale] of flights) {
        twin.style.visibility = 'hidden';
        const t = `translate(${f.x - l.x}px, ${f.y - l.y}px)` + (scale ? ` scale(${f.w / l.w}, ${f.h / l.h})` : '');
        run(el.animate([{ transformOrigin: '0 0', transform: t }, { transformOrigin: '0 0', transform: 'none' }], { duration: MORPH, easing: EASE }));
      }
      run(from.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' }));
      requestAnimationFrame(() => requestAnimationFrame(() => to.classList.remove('veil')));
      done(() => {
        from.hidden = true;
        from.classList.remove('leaving');
        from.style.top = '';
        to.classList.remove('veil');
        area.classList.remove('morphing');
        for (const [el, , , twin] of flights) {
          el.classList.remove('fly');
          twin.style.visibility = '';
        }
        band.hidden = true;
        bg.style.height = band.style.height = '';
      });
    }

    // Day to day: the list slides toward the chosen day; the band reshapes to the new list.
    function swap(day, dir) {
      const panel = dayV.querySelector('.day-panel');
      if (!canMove()) {
        o.renderDay(day);
        const fresh = dayV.querySelector('.day-panel');
        if (reduce.matches && fresh.animate) run(fresh.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }));
        return;
      }
      const A1 = area.getBoundingClientRect();
      const H1 = area.offsetHeight;
      const src = rel(panel, A1);
      const ghost = panel.cloneNode(true);
      ghost.classList.add('ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      Object.assign(ghost.style, { position: 'absolute', left: panel.offsetLeft + 'px', top: panel.offsetTop + 'px', width: panel.offsetWidth + 'px', margin: '0' });
      o.renderDay(day);
      dayV.append(ghost);
      area.classList.add('morphing');
      const fresh = dayV.querySelector('.day-panel:not(.ghost)');
      frame(A1, H1, src, rel(fresh, area.getBoundingClientRect()), [1, 1]);
      const x = 32 * dir;
      run(ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-x}px)` }], { duration: 130, easing: 'ease-in', fill: 'forwards' }));
      for (const el of fresh.children) {
        run(el.animate([{ opacity: 0, transform: `translateX(${x}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 110, easing: EASE, fill: 'backwards' }));
      }
      done(() => {
        ghost.remove();
        area.classList.remove('morphing');
        band.hidden = true;
        bg.style.height = band.style.height = '';
      });
    }

    function set(density, day = state.day) {
      if (density === state.density && (density === 'week' || day === state.day)) return;
      settle();
      const prev = state.day;
      const wasDay = state.density === 'day';
      state.density = density;
      state.day = day;
      if (density === 'day' && wasDay) swap(day, day > prev ? 1 : -1);
      else morph(density === 'day', day);
      o.onChange(state);
    }
    return { set, state, dayV, weekV, settle };
  }

  // Segmented toggle: the white thumb slides to the chosen option.
  function thumb(tray) {
    const update = () => {
      const lab = tray.querySelector('input:checked')?.closest('label');
      if (!lab) return;
      const pad = parseFloat(getComputedStyle(tray).paddingLeft) || 0;
      tray.style.setProperty('--l', lab.offsetLeft - pad + 'px');
      tray.style.setProperty('--r', tray.clientWidth - pad - lab.offsetLeft - lab.offsetWidth + 'px');
    };
    tray.classList.add('has-thumb');
    update();
    requestAnimationFrame(() => requestAnimationFrame(() => tray.classList.add('thumb-ready')));
    addEventListener('resize', update);
    return update;
  }

  function colRectOf(table) {
    return (d, A) => {
      const t = table.tHead.rows[0].cells[d + 1].getBoundingClientRect();
      const f = table.tFoot.rows[0].cells[d + 1].getBoundingClientRect();
      return { x: t.left - A.left, y: t.top - A.top, w: t.width, h: f.bottom - t.top };
    };
  }

  /* ---------- Timesheet ---------- */
  function timesheet(area) {
    const table = area.querySelector('table.week');
    const tiles = [...document.querySelectorAll('.strip .tile')];
    const weekTile = tiles.find((t) => t.dataset.day === 'week');
    const radios = [...document.querySelectorAll('input[name="density"]')];
    const announce = document.getElementById('announce');
    const grand = table.querySelector('.grand-pill');
    const timer = document.querySelector('.bar .timer');
    const digits = timer.querySelector('.timer-digits');
    const stopBtn = timer.querySelector('.timer-stop');

    const rows = [...table.tBodies[0].rows].map((tr, r) => {
      const [task, client] = tr.querySelector('.proj-sub').textContent.split(' · ');
      const inputs = [...tr.querySelectorAll('input.well')];
      inputs.forEach((i, d) => Object.assign(i.dataset, { r, d }));
      return {
        name: tr.querySelector('.proj-name').textContent, task, client,
        sw: tr.querySelector('.swatch').getAttribute('style'),
        mins: inputs.map((i) => parse(i.value) || 0),
        total: tr.querySelector('.row-total'),
      };
    });
    const dayTotal = (d) => rows.reduce((s, row) => s + row.mins[d], 0);
    const weekTotal = () => rows.reduce((s, row) => s + row.mins.reduce((a, b) => a + b, 0), 0);

    let running = true;
    let elapsed0 = 2832;
    let t0 = performance.now();
    let frozen = elapsed0;
    let baseSec = rows[0].mins[TODAY] * 60 - elapsed0;
    const elapsed = () => (running ? elapsed0 + Math.floor((performance.now() - t0) / 1000) : frozen);
    const clock = (e) => `${Math.floor(e / 3600)}:${String(Math.floor(e / 60) % 60).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`;

    function paintTotals(r, d) {
      rows[r].total.textContent = dash(rows[r].mins.reduce((a, b) => a + b, 0));
      const dt = dayTotal(d);
      for (const f of area.querySelectorAll(`[data-foot="${d}"]`)) f.textContent = dash(dt);
      const td = table.tFoot.rows[0].cells[d + 1];
      if (d !== TODAY) td.classList.toggle('empty', !dt);
      const tile = tiles[d];
      const tt = tile.querySelector('.tile-total');
      tt.textContent = dash(dt);
      if (dt) tt.removeAttribute('aria-label');
      else tt.setAttribute('aria-label', 'No time');
      if (d !== TODAY) tile.classList.toggle('is-empty', !dt);
      const wt = weekTotal();
      weekTile.querySelector('.tile-total').textContent = dash(wt);
      grand.textContent = dash(wt);
    }
    function setMins(r, d, v, src) {
      rows[r].mins[d] = v;
      for (const i of area.querySelectorAll(`input.well[data-r="${r}"][data-d="${d}"]`)) {
        if (i !== src && i !== document.activeElement) i.value = fmt(v);
      }
      paintTotals(r, d);
    }
    function commit(i) {
      const r = +i.dataset.r;
      const d = +i.dataset.d;
      const v = parse(i.value);
      if (v === null) { i.value = fmt(rows[r].mins[d]); return; }
      i.value = fmt(v);
      if (v === rows[r].mins[d]) return;
      if (r === 0 && d === TODAY) baseSec = v * 60 - elapsed();
      setMins(r, d, v, i);
      announce.textContent = `${DAYS[d]} ${spoken(dayTotal(d))}. Week ${spoken(weekTotal())}.`;
    }
    area.addEventListener('change', (e) => { if (e.target.matches('input.well')) commit(e.target); });
    area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input.well')) commit(e.target); });

    function renderDay(d) {
      const live = (r) => r === 0 && d === TODAY;
      const entries = rows.map((row, r) => [row, r]).filter(([row]) => row.mins[d] > 0);
      const items = entries.map(([row, r]) => {
        const label = `${row.name}, ${row.task}, ${SHORT[d]}${live(r) ? ', timer running' : ''}`;
        const input = `<input class="well" value="${fmt(row.mins[d])}" inputmode="numeric" placeholder="–" aria-label="${esc(label)}" data-r="${r}" data-d="${d}"${live(r) ? '' : ` data-cell="${r}:${d}"`}>`;
        return `<li class="day-row">` +
          `<span class="proj-k" data-label="${r}"><span class="proj-line"><span class="swatch" style="${row.sw}"></span><span class="proj-name">${esc(row.name)}</span></span><span class="proj-sub">${esc(row.task)} · ${esc(row.client)}</span></span>` +
          (live(r) ? `<span class="day-run"><span class="run-dot" aria-hidden="true"></span><span class="day-run-digits">${clock(elapsed())}</span></span>` : '<span class="day-gap"></span>') +
          (live(r) ? `<span class="well-live" data-cell="${r}:${d}"><span class="run-dot" aria-hidden="true"></span>${input}</span>` : input) +
          `</li>`;
      }).join('');
      area.querySelector('.day-view').innerHTML =
        `<div class="day-panel">` +
        `<div class="day-head"><h2 class="day-title">${DAYS[d]}, ${DATES[d]}</h2>${d === TODAY ? '<span class="day-tag">Today</span>' : ''}</div>` +
        (entries.length ? `<ul class="day-list" role="list">${items}</ul>` : `<p class="day-empty">Nothing tracked on ${DAYS[d]}.</p>`) +
        `<div class="day-foot"><span class="day-foot-label">Total</span><span class="day-foot-cell"><span class="foot-k" data-foot="${d}">${dash(dayTotal(d))}</span></span></div>` +
        `</div>`;
    }

    const weekV = area.querySelector('.week-view');
    function reveal(d) {
      if (weekV.scrollWidth <= weekV.clientWidth + 1) return;
      const th = table.tHead.rows[0].cells[d + 1].getBoundingClientRect();
      const first = table.tHead.rows[0].cells[0];
      const stick = getComputedStyle(first).position === 'sticky' ? first.offsetWidth : 0;
      const v = weekV.getBoundingClientRect();
      weekV.scrollLeft += th.left + th.width / 2 - (v.left + stick + (v.width - stick) / 2);
    }

    const moveThumb = thumb(document.querySelector('.density'));
    const sheet = Sheet(area, {
      colRect: colRectOf(table),
      renderDay,
      reveal,
      followers: [document.querySelector('.below'), document.querySelector('.submit')],
      onChange(st) {
        radios.forEach((r) => (r.checked = r.value === st.density));
        tiles.forEach((t) => {
          const on = t.dataset.day === 'week' ? st.density === 'week' : st.density === 'day' && +t.dataset.day === st.day;
          t.setAttribute('aria-pressed', String(on));
        });
        area.setAttribute('aria-label', st.density === 'week' ? 'Week grid' : `Day list, ${DAYS[st.day]}, ${DATES[st.day]}`);
        announce.textContent = st.density === 'week'
          ? `Week view. ${spoken(weekTotal())} this week.`
          : `Day view, ${DAYS[st.day]}, ${DATES[st.day]}. ${spoken(dayTotal(st.day))}.`;
        moveThumb();
      },
    });
    radios.forEach((r) => r.addEventListener('change', () => sheet.set(r.value)));
    tiles.forEach((t) => t.addEventListener('click', () => {
      if (t.dataset.day === 'week') sheet.set('week');
      else sheet.set('day', +t.dataset.day);
    }));

    function tick() {
      const e = elapsed();
      const text = clock(e);
      digits.textContent = text;
      digits.setAttribute('aria-label', `Elapsed ${Math.floor(e / 3600)} hours ${Math.floor(e / 60) % 60} minutes ${e % 60} seconds`);
      const chip = area.querySelector('.day-run-digits');
      if (chip) chip.textContent = text;
      const m = Math.floor((baseSec + e) / 60);
      if (m !== rows[0].mins[TODAY]) setMins(0, TODAY, m);
    }
    let iv = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => {
      document.documentElement.classList.toggle('tab-hidden', document.hidden);
      clearInterval(iv);
      if (!document.hidden) { tick(); iv = setInterval(tick, 1000); }
    });
    stopBtn.addEventListener('click', () => {
      if (running) { frozen = elapsed(); running = false; }
      else { elapsed0 = frozen; t0 = performance.now(); running = true; }
      document.body.classList.toggle('timer-off', !running);
      timer.setAttribute('aria-label', running ? 'Timer, running' : 'Timer, stopped');
      stopBtn.querySelector('use').setAttribute('href', running ? '#i-stop' : '#i-play');
      stopBtn.querySelector('span').textContent = running ? 'Stop' : 'Start';
      tick();
    });
  }

  /* ---------- Landing: the densities card drives a small sheet ---------- */
  function miniSheet(area) {
    const table = area.querySelector('table.mini-week');
    const tray = area.closest('.pt').querySelector('.mini-toggle');
    const radios = [...tray.querySelectorAll('input')];
    const dayV = area.querySelector('.day-view');
    const weekV = area.querySelector('.week-view');

    function renderDay(d) {
      const items = [...table.tBodies[0].rows].map((tr, r) => {
        const cell = tr.cells[d + 1].querySelector('[data-cell]');
        if (!cell) return '';
        const sw = tr.querySelector('.swatch').getAttribute('style');
        const { name, task, client } = tr.dataset;
        return `<li class="day-row">` +
          `<span class="proj-k"><span class="proj-line"><span class="swatch" data-label="${r}" style="${sw}"></span><span class="proj-name">${name}</span></span><span class="proj-sub">${task} · ${client}</span></span>` +
          cell.outerHTML +
          `</li>`;
      }).join('');
      const total = table.tFoot.querySelector(`[data-foot="${d}"]`).textContent;
      dayV.innerHTML =
        `<div class="day-panel">` +
        `<div class="day-head"><h3 class="day-title">${DAYS[d]}, ${DATES[d]}</h3><span class="day-tag">Today</span></div>` +
        `<ul class="day-list" role="list">${items}</ul>` +
        `<div class="day-foot"><span class="day-foot-label">Total</span><span class="day-foot-cell"><span class="foot-k" data-foot="${d}">${total}</span></span></div>` +
        `</div>`;
    }

    // The card keeps one height in both densities so the page below never moves.
    function fit() {
      area.style.minHeight = '';
      const showing = dayV.hidden ? weekV : dayV;
      const other = showing === weekV ? dayV : weekV;
      if (other === dayV) renderDay(TODAY);
      const h1 = area.offsetHeight;
      showing.hidden = true;
      other.hidden = false;
      const h2 = area.offsetHeight;
      other.hidden = true;
      showing.hidden = false;
      area.style.minHeight = Math.max(h1, h2) + 'px';
    }
    renderDay(TODAY);
    fit();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { sheet.settle(); fit(); moveThumb(); }, 120); });

    const moveThumb = thumb(tray);
    const sheet = Sheet(area, {
      colRect: colRectOf(table),
      renderDay,
      bandRadius: 14,
      onChange(st) {
        radios.forEach((r) => (r.checked = r.value === st.density));
        area.setAttribute('aria-label', st.density === 'week'
          ? 'Sample timesheet, Ada, Oct 26 – Nov 1, 2026'
          : 'Sample timesheet, Ada, Wednesday, October 28');
        moveThumb();
      },
    });
    radios.forEach((r) => r.addEventListener('change', () => sheet.set(r.value, TODAY)));
  }

  const sheetArea = document.getElementById('sheet');
  if (sheetArea) timesheet(sheetArea);
  const mini = document.querySelector('.sheet-area.mini');
  if (mini) miniSheet(mini);
})();
