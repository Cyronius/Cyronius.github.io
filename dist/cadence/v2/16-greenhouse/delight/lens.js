// 16 Greenhouse · Delight — copy the most recent timesheet's rows into an empty week, with undo (2026-10-28).
(() => {
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const moving = () => !reduce.matches && typeof Element.prototype.animate === 'function';
  const fmt = (m) => (m > 0 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : '');
  const dash = (m) => fmt(m) || '–';
  const sum = (a) => a.reduce((x, y) => x + y, 0);
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
  const SOURCE = 'Oct 26 – Nov 1, 2026';
  const announce = document.getElementById('announce');

  // The copy button: one control that becomes its own undo.
  function copyButton(btn, onCopy, onUndo) {
    const icon = btn.querySelector('use');
    const label = btn.querySelector('.copy-label');
    const idle = label.textContent;
    let mode = 'idle';
    let flashTimer;
    function set(next, text) {
      mode = next;
      clearTimeout(flashTimer);
      icon.setAttribute('href', next === 'idle' ? '#i-copy' : '#i-check');
      btn.classList.toggle('is-done', next === 'done');
      if (next === 'done') {
        label.innerHTML = `${esc(text)}<span class="copy-sep" aria-hidden="true"> · </span><span class="copy-undo">Undo</span>`;
        btn.setAttribute('aria-label', `${text}. Undo`);
      } else {
        label.textContent = text || idle;
        btn.removeAttribute('aria-label');
      }
      if (moving()) label.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
      if (next === 'note') flashTimer = setTimeout(() => set('idle'), 2400);
    }
    btn.addEventListener('click', () => (mode === 'done' ? onUndo() : onCopy()));
    return { done: (n) => set('done', `Copied ${n} rows`), note: (t) => set('note', t), reset: () => mode !== 'idle' && set('idle') };
  }

  // Rows arrive from the left, the side the previous week sits on.
  function arrive(els) {
    if (!moving()) return;
    els.forEach((el, i) => el.animate(
      [{ opacity: 0, transform: 'translateX(-40px)' }, { opacity: 1, transform: 'none' }],
      { duration: 560, delay: 70 * i, easing: EASE, fill: 'backwards' }));
  }
  function leave(els) {
    if (!moving()) return Promise.resolve();
    return Promise.all(els.map((el, i) => el.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-28px)' }],
      { duration: 200, delay: 35 * (els.length - 1 - i), easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {})));
  }
  // Content under a table that grew or shrank glides to its new place instead of jumping.
  function glide(els, change) {
    const before = els.map((el) => el.getBoundingClientRect().top);
    change();
    if (!moving()) return;
    els.forEach((el, i) => {
      const dy = before[i] - el.getBoundingClientRect().top;
      if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 560, easing: EASE });
    });
  }
  function countUp(targets, delay) {
    if (!moving()) { targets.forEach(([el, m, f]) => (el.textContent = f(m))); return; }
    targets.forEach(([el, , f]) => (el.textContent = f(0)));
    const t0 = performance.now() + delay;
    const step = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 700));
      const e = 1 - Math.pow(1 - p, 4);
      targets.forEach(([el, m, f]) => (el.textContent = f(Math.round(m * e))));
      if (p < 1) requestAnimationFrame(step);
      else targets.forEach(([el, m, f]) => (el.textContent = f(m)));
    };
    requestAnimationFrame(step);
  }

  /* ---------- Timesheet ---------- */
  function timesheet(table) {
    const tiles = [...document.querySelectorAll('.strip .tile')];
    const weekTile = tiles[7];
    const head = [...table.tHead.rows[0].cells].slice(1, 8);
    const foot = [...table.tFoot.rows[0].cells].slice(1, 8);
    const grand = table.querySelector('.grand-pill');
    const range = document.querySelector('.range');
    const [prevBtn, nextBtn] = document.querySelectorAll('.datenav .round');
    const chip = document.querySelector('.chip');
    const include = document.querySelector('.check input');
    const below = [document.querySelector('.below'), document.querySelector('.submit')];
    const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const readRow = (tr) => {
      const [task, client] = tr.querySelector('.proj-sub').textContent.split(' · ');
      return {
        tr, name: tr.querySelector('.proj-name').textContent, task, client,
        sw: tr.querySelector('.swatch').getAttribute('style'),
        mins: [...tr.querySelectorAll('input.well')].map((i) => parse(i.value) || 0),
      };
    };
    const weeks = {
      cur: {
        range: SOURCE, today: 2, body: table.tBodies[0],
        dates: ['Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31', 'Nov 1'],
        head: ['Mon 26', 'Tue 27', 'Wed 28', 'Thu 29', 'Fri 30', 'Sat 31', 'Sun 1'],
      },
      next: {
        range: 'Nov 2 – 8, 2026', today: -1, body: document.createElement('tbody'), rows: [],
        dates: ['Nov 2', 'Nov 3', 'Nov 4', 'Nov 5', 'Nov 6', 'Nov 7', 'Nov 8'],
        head: ['Mon 2', 'Tue 3', 'Wed 4', 'Thu 5', 'Fri 6', 'Sat 7', 'Sun 8'],
      },
    };
    weeks.cur.rows = [...weeks.cur.body.rows].map(readRow);
    let wk = 'cur';
    let copied = null;

    const emptyRow = () => {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      tr.innerHTML = `<td colspan="10"><span class="empty-note">No rows on this timesheet yet.</span></td>`;
      return tr;
    };
    weeks.next.body.append(emptyRow());

    function buildRow(row, w) {
      const tr = document.createElement('tr');
      const cells = row.mins.map((m, d) => `<td><input class="well" value="${fmt(m)}" inputmode="numeric" placeholder="–" aria-label="${esc(`${row.name}, ${row.task}, ${DAY[d]} ${w.dates[d]}`)}"></td>`).join('');
      tr.innerHTML =
        `<th scope="row" class="proj"><span class="proj-line"><span class="swatch" style="${row.sw}"></span><span class="proj-name">${esc(row.name)}</span></span><span class="proj-sub">${esc(row.task)} · ${esc(row.client)}</span></th>` +
        cells +
        `<td class="row-total">${dash(sum(row.mins))}</td>` +
        `<td><button class="del-btn" type="button" aria-label="Delete row: ${esc(row.name)}, ${esc(row.task)}"><svg class="i" aria-hidden="true"><use href="#i-trash"/></svg></button></td>`;
      return tr;
    }

    function dayTotals(w) {
      return [0, 1, 2, 3, 4, 5, 6].map((d) => w.rows.reduce((s, r) => s + r.mins[d], 0));
    }
    function paint(count) {
      const w = weeks[wk];
      const days = dayTotals(w);
      const total = sum(days);
      w.rows.forEach((r) => (r.tr.querySelector('.row-total').textContent = dash(sum(r.mins))));
      const targets = [];
      days.forEach((m, d) => {
        foot[d].classList.toggle('empty', !m && d !== w.today);
        const tile = tiles[d];
        tile.classList.toggle('is-today', d === w.today);
        tile.classList.toggle('is-empty', !m && d !== w.today);
        if (d === w.today) tile.setAttribute('aria-current', 'date');
        else tile.removeAttribute('aria-current');
        tile.querySelector('.tile-day').textContent = d === w.today ? 'Today' : DAY[d];
        tile.querySelector('.tile-date').textContent = w.dates[d];
        const tt = tile.querySelector('.tile-total');
        if (m) tt.removeAttribute('aria-label');
        else tt.setAttribute('aria-label', 'No time');
        targets.push([tt, m, dash], [foot[d], m, dash]);
      });
      const wkFmt = (m) => fmt(m) || '0:00';
      targets.push([weekTile.querySelector('.tile-total'), total, wkFmt], [grand, total, wkFmt]);
      if (count && total) countUp(targets, 260);
      else targets.forEach(([el, m, f]) => (el.textContent = f(m)));
    }

    function show(key) {
      if (key === wk) return;
      wk = key;
      const w = weeks[key];
      table.replaceChild(w.body, table.tBodies[0]);
      range.querySelector('span').textContent = w.range;
      range.setAttribute('aria-label', `Choose week, ${w.range}`);
      table.caption.textContent = `Time by project and task, ${w.range}`;
      chip.setAttribute('aria-pressed', String(key === 'cur'));
      head.forEach((th, d) => { th.textContent = w.head[d]; th.classList.toggle('today', d === w.today); });
      foot.forEach((td, d) => td.classList.toggle('today', d === w.today));
      btn.reset();
      copied = null;
      paint(false);
      announce.textContent = `Week of ${w.range}. ${w.rows.length ? `${w.rows.length} rows.` : 'No rows yet.'}`;
    }
    nextBtn.addEventListener('click', () => show('next'));
    prevBtn.addEventListener('click', () => { if (wk === 'next') show('cur'); });
    chip.addEventListener('click', () => show('cur'));

    table.addEventListener('change', (e) => {
      const i = e.target;
      if (!i.matches('input.well')) return;
      const w = weeks[wk];
      const row = w.rows.find((r) => r.tr === i.closest('tr'));
      const d = i.closest('td').cellIndex - 1;
      const v = parse(i.value);
      if (!row || v === null) { if (row) i.value = fmt(row.mins[d]); return; }
      row.mins[d] = v;
      i.value = fmt(v);
      paint(false);
    });

    const btn = copyButton(document.querySelector('.copy-btn'), () => {
      const w = weeks[wk];
      if (wk === 'cur') { btn.note('No new rows to copy'); announce.textContent = 'No new rows to copy.'; return; }
      const missing = weeks.cur.rows.filter((s) => !w.rows.some((r) => r.name === s.name && r.task === s.task));
      if (!missing.length) { btn.note('No new rows to copy'); return; }
      const withHours = include.checked;
      const added = missing.map((s) => {
        const row = { name: s.name, task: s.task, client: s.client, sw: s.sw, mins: withHours ? [...s.mins] : [0, 0, 0, 0, 0, 0, 0] };
        row.tr = buildRow(row, w);
        return row;
      });
      glide(below, () => {
        w.body.querySelector('.empty-row')?.remove();
        added.forEach((r) => w.body.append(r.tr));
      });
      w.rows.push(...added);
      copied = { w, rows: added };
      arrive(added.map((r) => r.tr));
      paint(withHours);
      btn.done(added.length);
      announce.textContent = `Copied ${added.length} rows from ${SOURCE}${withHours ? ', with hours' : ''}.`;
    }, () => {
      if (!copied) return;
      const { w, rows } = copied;
      copied = null;
      w.rows = w.rows.filter((r) => !rows.includes(r));
      paint(false);
      btn.reset();
      announce.textContent = `Removed the ${rows.length} copied rows.`;
      leave(rows.map((r) => r.tr)).then(() => glide(below, () => {
        rows.forEach((r) => r.tr.remove());
        if (!w.rows.length && !w.body.querySelector('.empty-row')) w.body.append(emptyRow());
      }));
    });
  }

  /* ---------- Landing: next week, filled from the sample week above ---------- */
  function landing(demo) {
    const list = demo.querySelector('.cd-rows');
    const empty = list.querySelector('.cd-empty');
    const source = [...document.querySelectorAll('.frag .week tbody tr')].map((tr) => ({
      name: tr.querySelector('.proj-name').textContent,
      sub: tr.querySelector('.proj-sub').textContent,
      sw: tr.querySelector('.swatch').getAttribute('style'),
    }));
    let items = [];
    const btn = copyButton(demo.querySelector('.copy-btn'), () => {
      if (items.length) return;
      empty.remove();
      items = source.map((s) => {
        const li = document.createElement('li');
        li.className = 'cd-row';
        li.innerHTML = `<span class="swatch" style="${s.sw}"></span><span class="cd-name">${esc(s.name)}</span><span class="cd-sub">${esc(s.sub)}</span><span class="cd-hours" aria-label="No time">–</span>`;
        list.append(li);
        return li;
      });
      arrive(items);
      btn.done(items.length);
      announce.textContent = `Copied ${items.length} rows from ${SOURCE}.`;
    }, () => {
      const gone = items;
      items = [];
      btn.reset();
      announce.textContent = `Removed the ${gone.length} copied rows.`;
      leave(gone).then(() => {
        gone.forEach((li) => li.remove());
        if (!items.length && !list.contains(empty)) list.append(empty);
      });
    });
  }

  const sheet = document.querySelector('table.sheet');
  if (sheet) timesheet(sheet);
  const demo = document.querySelector('.copy-demo');
  if (demo) landing(demo);
})();
