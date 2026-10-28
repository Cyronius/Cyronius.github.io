// Reviewer chrome for the v2 gallery: names the candidate and lens, and moves between candidates,
// lenses and the two pages. It belongs to the gallery, not to any design.
(() => {
  const CANDIDATES = [
    ['02', 'signal', 'Signal'],
    ['03', 'evergreen', 'Evergreen'],
    ['11', 'dial', 'Dial'],
    ['12', 'one-thing', 'One Thing'],
    ['13', 'cyanotype', 'Cyanotype'],
    ['16', 'greenhouse', 'Greenhouse'],
    ['17', 'poster', 'Poster'],
    ['18', 'spectrum', 'Spectrum'],
  ];
  const LENSES = [
    ['bolder', 'Bolder'],
    ['distill', 'Distill'],
    ['animate', 'Animate'],
    ['delight', 'Delight'],
  ];
  const ACCENTS = [
    ['blue', 'Logo blue', '#3d5bff'],
    ['vermilion', 'Vermilion', '#d43a12'],
    ['violet', 'Violet', '#6d3ef0'],
  ];
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  const script = document.currentScript;
  const id = script?.dataset.candidate;
  const lens = script?.dataset.lens;
  const page = script?.dataset.page === 'time' ? 'time' : 'landing';
  const index = CANDIDATES.findIndex(([n]) => n === id);
  if (index < 0 || !LENSES.some(([l]) => l === lens)) return;
  const [num, , name] = CANDIDATES[index];
  const lensName = LENSES.find(([l]) => l === lens)[1];
  const themed = num === '12';
  const html = document.documentElement;

  if (themed) {
    const t = store.get('cadence-v2:theme');
    const a = store.get('cadence-v2:accent');
    if (t) html.dataset.theme = t;
    if (a && a !== 'blue') html.dataset.accent = a;
  }

  const folder = (i) => `${CANDIDATES[i][0]}-${CANDIDATES[i][1]}`;
  const href = (i, l, p) => `../../${folder(i)}/${l}/${p}.html`;
  const prev = (index + CANDIDATES.length - 1) % CANDIDATES.length;
  const next = (index + 1) % CANDIDATES.length;
  const other = page === 'time' ? 'landing' : 'time';
  const svg = (d) =>
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const lensLinks = LENSES.map(([l, label]) =>
    `<a class="cr-lens" href="${href(index, l, page)}"${l === lens ? ' aria-current="page"' : ''} title="${label}"><span class="cr-lens-full">${label}</span><span class="cr-lens-short" aria-hidden="true">${label[0]}</span></a>`,
  ).join('');
  const themeControls = themed
    ? `<span class="cr-sep cr-full"></span>
       <button type="button" class="cr-full cr-theme" title="Switch light or dark" aria-label="Switch light or dark">${svg('<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>')}</button>
       <span class="cr-full cr-swatches" role="group" aria-label="Accent colour">${ACCENTS.map(([a, label, hex]) =>
         `<button type="button" class="cr-swatch" data-accent="${a}" title="${label}" aria-label="${label}" style="--sw:${hex}"></button>`).join('')}</span>`
    : '';
  const replay = lens === 'animate'
    ? `<button type="button" class="cr-full cr-replay" title="Play the motion again">${svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')}<span class="cr-replay-label">Replay</span></button>`
    : '';

  const root = document.createElement('nav');
  root.id = 'cadence-review';
  root.setAttribute('aria-label', 'Variant gallery');
  root.innerHTML = `
    <style>
      #cadence-review{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;flex-wrap:wrap;align-items:center;gap:2px;
        max-width:calc(100vw - 24px);padding:4px;border-radius:22px;background:#16161a;color:#f4f4f5;
        font:500 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;font-variant-numeric:tabular-nums;
        box-shadow:0 2px 6px rgb(0 0 0/.25),0 10px 30px rgb(0 0 0/.25);-webkit-font-smoothing:antialiased;color-scheme:dark}
      #cadence-review a,#cadence-review button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 10px;border-radius:999px;color:inherit;white-space:nowrap}
      #cadence-review a:hover,#cadence-review button:hover{background:#2a2a31}
      #cadence-review a:focus-visible,#cadence-review button:focus-visible{outline:2px solid #fff;outline-offset:1px}
      #cadence-review .cr-num{color:#a1a1aa}
      #cadence-review .cr-sep{width:1px;height:18px;background:#3f3f46;margin:0 2px}
      #cadence-review .cr-lenses{display:inline-flex;gap:2px}
      #cadence-review .cr-lens{color:#a1a1aa;padding:0 9px}
      #cadence-review .cr-lens[aria-current]{background:#f4f4f5;color:#16161a}
      #cadence-review .cr-lens-short{display:none}
      #cadence-review .cr-swatches{display:inline-flex;gap:4px;padding:0 4px}
      #cadence-review .cr-swatch{width:22px;height:22px;padding:0;border-radius:50%;background:var(--sw);box-shadow:inset 0 0 0 2px #16161a}
      #cadence-review .cr-swatch[aria-pressed="true"]{box-shadow:inset 0 0 0 2px #16161a,0 0 0 2px #f4f4f5}
      #cadence-review[data-collapsed] .cr-full{display:none}
      @media (max-width:900px){#cadence-review .cr-lens-full,#cadence-review .cr-replay-label{display:none}#cadence-review .cr-lens-short{display:inline}#cadence-review .cr-lens{width:30px;padding:0}}
      #cadence-review .cr-current{color:#a1a1aa}
      #cadence-review:not([data-collapsed]) .cr-current{display:none}
      @media (max-width:640px){#cadence-review{bottom:88px;left:8px;max-width:calc(100vw - 16px)}#cadence-review .cr-name,#cadence-review .cr-swap-label,#cadence-review .cr-gallery-label,#cadence-review .cr-current-full{display:none}#cadence-review a,#cadence-review button{padding:0 8px}#cadence-review .cr-lens{width:28px;padding:0}#cadence-review .cr-sep{margin:0}}
      @media (min-width:641px){#cadence-review .cr-current-short{display:none}}
    </style>
    <a class="cr-full" href="../../index.html#c${num}" title="All variants">${svg('<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>')}<span class="cr-gallery-label">Gallery</span></a>
    <span class="cr-sep cr-full"></span>
    <a class="cr-full" href="${href(prev, lens, page)}" title="Previous candidate" aria-label="Previous candidate">${svg('<path d="m15 18-6-6 6-6"/>')}</a>
    <button type="button" class="cr-toggle" aria-expanded="true" title="Hide or show the gallery controls"><span class="cr-num">${num}</span><span class="cr-name">${name}</span><span class="cr-current"><span class="cr-current-full">· ${lensName}</span><span class="cr-current-short">${lensName[0]}</span></span></button>
    <a class="cr-full" href="${href(next, lens, page)}" title="Next candidate" aria-label="Next candidate">${svg('<path d="m9 18 6-6-6-6"/>')}</a>
    <span class="cr-sep cr-full"></span>
    <span class="cr-full cr-lenses" role="group" aria-label="Experiment">${lensLinks}</span>
    <span class="cr-sep cr-full"></span>
    <a class="cr-full" href="${href(index, lens, other)}">${svg('<path d="M7 16 3 12l4-4M17 8l4 4-4 4M3 12h18"/>')}<span class="cr-swap-label">${other === 'time' ? 'Timesheet' : 'Landing'}</span></a>
    ${replay}${themeControls}`;

  const toggle = root.querySelector('.cr-toggle');
  const setCollapsed = (collapsed) => {
    root.toggleAttribute('data-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
  };
  let savedCollapse = null;
  try { savedCollapse = sessionStorage.getItem('cadence-v2:collapsed'); } catch {}
  // Phones start collapsed so the bar does not sit on the page's own content.
  setCollapsed(savedCollapse ? savedCollapse === '1' : matchMedia('(max-width: 640px)').matches);
  toggle.addEventListener('click', () => {
    const collapsed = !root.hasAttribute('data-collapsed');
    setCollapsed(collapsed);
    try { sessionStorage.setItem('cadence-v2:collapsed', collapsed ? '1' : '0'); } catch {}
  });
  root.querySelector('.cr-replay')?.addEventListener('click', () => location.reload());

  if (themed) {
    const isDark = () => html.dataset.theme
      ? html.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const themeBtn = root.querySelector('.cr-theme');
    const syncTheme = () => themeBtn.setAttribute('aria-pressed', String(isDark()));
    themeBtn.addEventListener('click', () => {
      html.dataset.theme = isDark() ? 'light' : 'dark';
      store.set('cadence-v2:theme', html.dataset.theme);
      syncTheme();
    });
    syncTheme();
    const swatches = [...root.querySelectorAll('.cr-swatch')];
    const syncAccent = () => {
      const current = html.dataset.accent || 'blue';
      for (const s of swatches) s.setAttribute('aria-pressed', String(s.dataset.accent === current));
    };
    for (const s of swatches) s.addEventListener('click', () => {
      if (s.dataset.accent === 'blue') delete html.dataset.accent; else html.dataset.accent = s.dataset.accent;
      store.set('cadence-v2:accent', s.dataset.accent);
      syncAccent();
    });
    syncAccent();
  }

  document.body.append(root);
})();
