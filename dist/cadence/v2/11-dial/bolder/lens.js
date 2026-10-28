// Points the week hand at now: Wednesday of the sample week, at the visitor's own clock time.
(() => {
  const hand = document.querySelector('.dial-box .hand');
  if (!hand) return;
  const set = () => {
    const now = new Date();
    const angle = ((2 + (now.getHours() * 60 + now.getMinutes()) / 1440) / 7) * 360;
    hand.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
  };
  set();
  setInterval(() => { if (!document.hidden) set(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) set(); });
})();
