// Keep navigation native, readable, and usable without JavaScript.
// Reset the one-time lettering animation after it completes so it uses no layers.
for (const letter of document.querySelectorAll('.keep span')) {
  letter.addEventListener('animationend', () => { letter.style.animation = 'none'; }, { once: true });
}
