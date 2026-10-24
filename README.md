# Cyrus Attoun's homepage

Static personal website at https://cyronius.github.io, highlighting desktop tools, local AI, NPU work, and experiments.

## Preview

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. There is no dependency installation or build step.

## Publish

Push to `main`. The GitHub Actions workflow publishes only `dist/` to GitHub Pages.

Project descriptions and links are in `dist/index.html`; styling and reduced-motion behavior are in `dist/style.css`. The page needs no JavaScript. Windowsill and smoosh intentionally carry Coming soon labels without private repository links. Replace these as those projects become public.

The Bricolage and Archivo fonts are self-hosted; their licenses are in `dist/assets/FONT-LICENSE.txt` and `dist/assets/ARCHIVO-LICENSE.txt`. Image sources are recorded in `ASSET-SOURCES.json` and embedded into each PNG. Product and design context stay outside the published directory.
