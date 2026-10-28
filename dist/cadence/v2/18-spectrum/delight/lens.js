// 18 Spectrum · Delight — hover, focus or tap a project to light its hours across the week (2026-10-28)
(() => {
  const PROJECTS = ['c-red', 'c-teal', 'c-violet', 'c-amber'];
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const projectOf = (el) => PROJECTS.find((p) => el.classList.contains(p));
  const sum = (els) => els.reduce((a, el) => a + +el.style.getPropertyValue('--m'), 0);
  const isMouse = (e) => e.pointerType === 'mouse';

  // Hover and keyboard focus preview a project; a click or tap pins it until the next one.
  function lightUp(root, keys, keyProject, show) {
    let pinned = null;
    let preview = null;
    const update = () => {
      const p = preview || pinned;
      if (p) root.dataset.active = p;
      else delete root.dataset.active;
      keys.forEach((k) => k.setAttribute('aria-pressed', String(keyProject(k) === pinned)));
      show(p);
    };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (pinned || preview)) { pinned = null; preview = null; update(); }
    });
    return {
      preview(p) { if (preview !== p) { preview = p; update(); } },
      clear() { if (preview) { preview = null; update(); } },
      toggle(p) { pinned = pinned === p ? null : p; update(); },
    };
  }
  const hoverable = (els, ctl) => els.forEach((el) => {
    const p = projectOf(el);
    el.addEventListener('pointerenter', (e) => { if (isMouse(e)) ctl.preview(p); });
    el.addEventListener('pointerleave', (e) => { if (isMouse(e)) ctl.clear(); });
    el.addEventListener('click', () => ctl.toggle(p));
  });

  const fig = document.querySelector('.spectrum');
  if (fig) {
    const days = [...fig.querySelectorAll('.band-day')];
    const dayNames = [...fig.querySelectorAll('.band-axis b')].map((b) => b.textContent);
    const parts = [...fig.querySelectorAll('.band-axis .part')];
    const keys = [...fig.querySelectorAll('.legend .key')];
    const keyProject = (k) => projectOf(k.closest('li'));
    const readout = fig.querySelector('.readout');
    const [name, total, of, dayList] = ['.r-name', '.r-total', '.r-of', '.r-days'].map((s) => readout.querySelector(s));
    const week = sum([...fig.querySelectorAll('.seg')]);
    const ctl = lightUp(fig, keys, keyProject, (p) => {
      keys.forEach((k) => k.closest('li').classList.toggle('on', keyProject(k) === p));
      readout.className = p ? `readout ${p}` : 'readout';
      if (!p) {
        name.textContent = '';
        total.textContent = fmt(week);
        of.textContent = 'in all';
        dayList.textContent = '';
        return;
      }
      const perDay = days.map((d) => sum([...d.querySelectorAll(`.seg.${p}`)]));
      parts.forEach((el, i) => {
        el.className = `part ${p}`;
        el.textContent = perDay[i] ? fmt(perDay[i]) : '–';
      });
      name.textContent = keys.find((k) => keyProject(k) === p).querySelector('b').textContent;
      total.textContent = fmt(perDay.reduce((a, b) => a + b, 0));
      of.textContent = `of ${fmt(week)}`;
      dayList.textContent = `. ${dayNames.map((d, i) => `${d} ${perDay[i] ? fmt(perDay[i]) : 'none'}`).join(', ')}`;
    });
    keys.forEach((k) => {
      k.addEventListener('focus', () => { if (k.matches(':focus-visible')) ctl.preview(keyProject(k)); });
      k.addEventListener('blur', () => ctl.clear());
    });
    hoverable(keys.map((k) => k.closest('li')), ctl);
    hoverable([...fig.querySelectorAll('.seg')], ctl);
  }

  const strip = document.querySelector('.strip');
  const grid = document.querySelector('.grid');
  if (strip && grid) {
    const tbody = grid.tBodies[0];
    const rows = [...tbody.rows];
    const keys = rows.map((tr) => tr.querySelector('.proj'));
    const keyProject = (k) => projectOf(k.closest('tr'));
    const dayLis = [...strip.querySelectorAll('.day')];
    const dayNames = [...grid.tHead.rows[0].cells].slice(1, 8).map((th) => th.textContent.trim());
    const names = Object.fromEntries(rows.map((tr) => [projectOf(tr), tr.querySelector('.pn b').textContent]));
    const live = document.getElementById('lit');
    const ctl = lightUp(strip.closest('.week'), keys, keyProject, (p) => {
      rows.forEach((tr) => tr.classList.toggle('lit', projectOf(tr) === p));
      if (!p) return;
      const perDay = [];
      dayLis.forEach((li, i) => {
        const part = li.querySelector('.part');
        const m = sum([...li.querySelectorAll(`.stack i.${p}`)]);
        part.className = `part ${p}`;
        if (li.classList.contains('total')) {
          part.innerHTML = `<span>${names[p]}</span><b>${fmt(m)}</b>`;
          live.textContent = `${names[p]}: ${fmt(m)} this week. ${perDay.join(', ')}`;
        } else {
          part.textContent = m ? fmt(m) : '–';
          if (m) perDay.push(`${dayNames[i]} ${fmt(m)}`);
        }
      });
    });
    keys.forEach((k) => k.addEventListener('click', () => ctl.toggle(keyProject(k))));
    tbody.addEventListener('pointerover', (e) => {
      const tr = isMouse(e) && e.target.closest('tr');
      if (tr) ctl.preview(projectOf(tr));
    });
    tbody.addEventListener('pointerleave', (e) => { if (isMouse(e)) ctl.clear(); });
    tbody.addEventListener('focusin', (e) => {
      if (e.target.matches(':focus-visible')) ctl.preview(projectOf(e.target.closest('tr')));
    });
    tbody.addEventListener('focusout', (e) => { if (!tbody.contains(e.relatedTarget)) ctl.clear(); });
    hoverable([...strip.querySelectorAll('.stack i')], ctl);
  }
})();
