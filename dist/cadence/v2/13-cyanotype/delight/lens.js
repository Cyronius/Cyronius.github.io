// Delight lens: features and drawing parts light each other up; submitting stamps the title block.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const link = document.querySelector('.link');
  if (link) {
    const wrap = link.querySelector('.art-wrap');
    const art = link.querySelector('.dwg-art');
    const parts = {
      hist: '.d-range',
      dens: '.d-density',
      rates: '.d-tbl > .p:not(.f)',
      rep: '.d-tbl > .t',
      appr: '.dw-sub > *',
    };
    const hots = [...link.querySelectorAll('.hot')];
    const feats = [...link.querySelectorAll('.feat')];
    const pad = 5;

    const place = () => {
      const base = wrap.getBoundingClientRect();
      for (const hot of hots) {
        const els = [...art.querySelectorAll(parts[hot.dataset.part])].filter((e) => e.getClientRects().length);
        hot.hidden = !els.length;
        if (!els.length) continue;
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        for (const e of els) {
          const q = e.getBoundingClientRect();
          l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
        }
        hot.style.left = `${l - base.left - pad}px`;
        hot.style.top = `${t - base.top - pad}px`;
        hot.style.width = `${r - l + 2 * pad}px`;
        hot.style.height = `${b - t + 2 * pad}px`;
      }
    };
    new ResizeObserver(place).observe(wrap);
    document.fonts?.ready.then(place);
    place();

    let pinned = null;
    let hovered = null;
    const show = () => {
      const on = hovered ?? pinned;
      link.classList.toggle('has-on', on !== null);
      for (const h of hots) {
        h.classList.toggle('is-on', h.dataset.part === on);
        h.setAttribute('aria-pressed', String(h.dataset.part === pinned));
      }
      for (const f of feats) {
        f.classList.toggle('is-on', f.dataset.part === on);
        f.querySelector('.feat-btn').setAttribute('aria-pressed', String(f.dataset.part === pinned));
      }
    };
    const inView = (el) => {
      const q = el.getBoundingClientRect();
      return q.top >= 0 && q.bottom <= innerHeight;
    };
    const hover = (el, part) => {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovered = part; show(); } });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovered = null; show(); } });
    };
    const press = (btn, part, partner) => {
      btn.addEventListener('focus', () => { hovered = part; show(); });
      btn.addEventListener('blur', () => { hovered = null; show(); });
      btn.addEventListener('click', () => {
        pinned = pinned === part ? null : part;
        show();
        const other = partner();
        if (pinned && other && !inView(other)) other.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      });
    };

    for (const f of feats) {
      const part = f.dataset.part;
      hover(f, part);
      press(f.querySelector('.feat-btn'), part, () => hots.find((h) => h.dataset.part === part && !h.hidden));
    }
    for (const h of hots) {
      const part = h.dataset.part;
      hover(h, part);
      press(h, part, () => feats.find((f) => f.dataset.part === part));
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pinned) { pinned = null; show(); }
    });
  }

  const submit = document.querySelector('.submit-btn');
  if (submit) {
    const chip = document.querySelector('.submit .status');
    const note = document.querySelector('.submit-note');
    const field = document.getElementById('tb-status');
    const stamp = document.querySelector('.stamp');
    const block = document.querySelector('.tblock');
    const live = document.getElementById('live');
    let submitted = false;

    submit.addEventListener('click', () => {
      submitted = !submitted;
      chip.textContent = field.textContent = submitted ? 'Pending approval' : 'Open';
      chip.classList.toggle('is-pending', submitted);
      note.textContent = submitted ? 'This week is waiting for approval.' : 'This week is not submitted yet.';
      submit.querySelector('use').setAttribute('href', submitted ? '#i-undo' : '#i-send');
      submit.querySelector('span').textContent = submitted ? 'Undo submit' : 'Submit this week for approval';
      stamp.classList.remove('is-in', 'is-out');
      block.classList.remove('is-stamped');
      void stamp.offsetWidth;
      if (submitted) {
        stamp.hidden = false;
        stamp.classList.add('is-in');
        block.classList.add('is-stamped');
      } else {
        stamp.classList.add('is-out');
        setTimeout(() => { if (!submitted) stamp.hidden = true; }, 240);
      }
      live.textContent = submitted
        ? 'Submitted · Ada · Oct 28. Status: Pending approval.'
        : 'Submission undone. Status: Open.';
    });
  }
})();
