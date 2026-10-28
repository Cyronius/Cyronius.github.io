// Reviewer chrome for the Cadence variant gallery: a small pill that names the variant and moves
// between its two pages and its neighbours. It belongs to the gallery, not to any design.
(() => {
  const VARIANTS = [
    ['01', 'turned-up', 'Turned Up'],
    ['02', 'signal', 'Signal'],
    ['03', 'evergreen', 'Evergreen'],
    ['04', 'blue-hour', 'Blue Hour'],
    ['05', 'ledger', 'Ledger'],
    ['06', 'mint-block', 'Mint Block'],
    ['07', 'swiss', 'Swiss'],
    ['08', 'chronograph', 'Chronograph'],
    ['09', 'tempo', 'Tempo'],
    ['10', 'almanac', 'Almanac'],
    ['11', 'dial', 'Dial'],
    ['12', 'one-thing', 'One Thing'],
    ['13', 'cyanotype', 'Cyanotype'],
    ['14', 'scoreboard', 'Scoreboard'],
    ['15', 'monolith', 'Monolith'],
    ['16', 'greenhouse', 'Greenhouse'],
    ['17', 'poster', 'Poster'],
    ['18', 'spectrum', 'Spectrum'],
    ['19', 'wide', 'Wide'],
    ['20', 'split', 'Split'],
  ];
  const script = document.currentScript;
  const id = script?.dataset.variant;
  const pageKind = script?.dataset.page === 'time' ? 'time' : 'landing';
  const index = VARIANTS.findIndex(([n]) => n === id);
  if (index < 0) return;
  const [num, , name] = VARIANTS[index];
  const href = (i, kind) => `../${VARIANTS[i][0]}-${VARIANTS[i][1]}/${kind}.html`;
  const prev = (index + VARIANTS.length - 1) % VARIANTS.length;
  const next = (index + 1) % VARIANTS.length;
  const other = pageKind === 'time' ? 'landing' : 'time';
  const svg = (d) =>
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const root = document.createElement('nav');
  root.id = 'cadence-review';
  root.setAttribute('aria-label', 'Variant gallery');
  root.innerHTML = `
    <style>
      #cadence-review{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:2px;
        padding:4px;border-radius:999px;background:#16161a;color:#f4f4f5;font:500 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;
        box-shadow:0 2px 6px rgb(0 0 0/.25),0 10px 30px rgb(0 0 0/.25);-webkit-font-smoothing:antialiased}
      #cadence-review a,#cadence-review button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:999px;color:inherit;white-space:nowrap}
      #cadence-review a:hover,#cadence-review button:hover{background:#2a2a31}
      #cadence-review a:focus-visible,#cadence-review button:focus-visible{outline:2px solid #fff;outline-offset:1px}
      #cadence-review .cr-num{font-variant-numeric:tabular-nums;color:#a1a1aa}
      #cadence-review .cr-sep{width:1px;height:18px;background:#3f3f46;margin:0 2px}
      #cadence-review[data-collapsed] .cr-full{display:none}
      @media (max-width:640px){#cadence-review{bottom:88px}#cadence-review .cr-name,#cadence-review .cr-swap-label{display:none}}
    </style>
    <a class="cr-full" href="../index.html" title="All variants">${svg('<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>')}<span class="cr-name">Gallery</span></a>
    <span class="cr-sep cr-full"></span>
    <a class="cr-full" href="${href(prev, pageKind)}" title="Previous variant" aria-label="Previous variant">${svg('<path d="m15 18-6-6 6-6"/>')}</a>
    <button type="button" class="cr-toggle" aria-expanded="true" title="Hide or show the gallery controls"><span class="cr-num">${num}</span><span class="cr-name">${name}</span></button>
    <a class="cr-full" href="${href(next, pageKind)}" title="Next variant" aria-label="Next variant">${svg('<path d="m9 18 6-6-6-6"/>')}</a>
    <span class="cr-sep cr-full"></span>
    <a class="cr-full" href="${href(index, other)}">${svg('<path d="M7 16 3 12l4-4M17 8l4 4-4 4M3 12h18"/>')}<span class="cr-swap-label">${other === 'time' ? 'Timesheet' : 'Landing'}</span></a>`;
  const toggle = root.querySelector('.cr-toggle');
  toggle.addEventListener('click', () => {
    const collapsed = root.toggleAttribute('data-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });
  document.body.append(root);
})();
