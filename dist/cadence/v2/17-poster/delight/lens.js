// 17 Poster · Delight: places the sun by local time of day and keeps the greeting in agreement (2026-10-28).
(() => {
  const html = document.documentElement;
  const sky = document.querySelector('.stage, .masthead');
  const disc = sky && sky.querySelector('.disc, .masthead-disc');
  const range = document.getElementById('tod');
  if (!sky || !disc || !range) return;
  const out = document.querySelector('.sunclock output');
  const nowBtn = document.querySelector('.sunclock .now');
  const greeting = document.getElementById('greeting');
  const announce = document.getElementById('announce');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const clockNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const label = (m) => {
    const h = Math.floor(m / 60) % 24, mm = String(m % 60).padStart(2, '0');
    return `${h % 12 || 12}:${mm} ${h < 12 ? 'am' : 'pm'}`;
  };
  const part = (m) => (m >= 300 && m < 720 ? 'morning' : m >= 720 && m < 1020 ? 'afternoon' : 'evening');

  // The sun rides an ellipse: 6:00 on the left horizon, noon at the top, 18:00 on the right.
  function geometry(m) {
    const d = disc.offsetWidth, W = sky.clientWidth, H = sky.clientHeight;
    const a = ((m / 60 - 6) / 24) * 2 * Math.PI;
    const reach = Math.max(H - d * 0.56, d * 0.2);
    const lift = Math.max(Math.sin(a) * reach, -d * 0.32);
    const x = W * (0.52 - 0.36 * Math.cos(a));
    const s = Math.max(-1, Math.min(1, lift / reach));
    // Warmer and deeper near the horizon, but never below 3:1 for the blue display type.
    const warm = s >= 0
      ? `oklch(${(0.77 + 0.05 * s).toFixed(3)} ${(0.16 - 0.01 * s).toFixed(3)} ${(60 + 14 * s).toFixed(1)})`
      : `oklch(${(0.77 + 0.012 * s).toFixed(3)} 0.155 ${(60 + 10 * s).toFixed(1)})`;
    return { x: x - d / 2, y: d / 2 - lift, d, warm };
  }

  let live = true;
  let minutes = clockNow();
  let shownPart = null;

  function place(m) {
    const g = geometry(m);
    html.style.setProperty('--sun-t', `translate(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px)`);
    html.style.setProperty('--sun', g.warm);
    out.textContent = label(m);
    range.value = String(Math.min(1425, Math.round(m / 15) * 15));
    range.setAttribute('aria-valuetext', `${label(m)}, ${part(m)}${live ? ', now' : ''}`);
    html.classList.toggle('is-live', live);
    nowBtn.setAttribute('aria-pressed', String(live));
    const p = part(m);
    if (greeting && p !== shownPart) {
      greeting.textContent = `Good ${p}, Ada`;
      if (shownPart && announce) announce.textContent = greeting.textContent;
    }
    shownPart = p;
  }

  // First placement rises from below the horizon to the current hour.
  html.classList.add('sun-ready', 'no-travel');
  place(minutes);
  if (!reduce.matches) {
    const g = geometry(minutes);
    html.style.setProperty('--sun-t', `translate(${g.x.toFixed(1)}px, ${g.d}px)`);
  }
  disc.getBoundingClientRect();
  requestAnimationFrame(() => {
    html.classList.remove('no-travel');
    place(minutes);
  });

  let scrubTimer = null;
  range.addEventListener('input', () => {
    live = false;
    minutes = +range.value;
    html.classList.add('scrubbing');
    clearTimeout(scrubTimer);
    scrubTimer = setTimeout(() => html.classList.remove('scrubbing'), 260);
    place(minutes);
  });
  nowBtn.addEventListener('click', () => {
    live = true;
    minutes = clockNow();
    place(minutes);
    range.focus();
  });

  let loop = null;
  const tick = () => { if (live && clockNow() !== minutes) { minutes = clockNow(); place(minutes); } };
  const start = () => { if (!loop) { tick(); loop = setInterval(tick, 20000); } };
  const stop = () => { clearInterval(loop); loop = null; };
  document.addEventListener('visibilitychange', () => {
    html.classList.toggle('is-hidden', document.hidden);
    document.hidden ? stop() : start();
  });
  if (!document.hidden) start();

  let size = `${sky.clientWidth}x${sky.clientHeight}`;
  new ResizeObserver(() => {
    const next = `${sky.clientWidth}x${sky.clientHeight}`;
    if (next === size) return;
    size = next;
    place(minutes);
  }).observe(sky);
})();
