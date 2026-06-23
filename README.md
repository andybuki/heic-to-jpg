# HEIC to JPG Converter

Free browser-based HEIC to JPG converter. Batch convert iPhone photos with quality control. 100% client-side — your files never leave your device.

## Features

- **Drag & drop** or click to select HEIC/HEIF files
- **Batch conversion** — convert hundreds of files at once
- **Quality slider** — control JPG compression (10–100%)
- **Individual or ZIP download** — download one file or all as ZIP
- **100% private** — runs entirely in your browser, nothing is uploaded
- **No limits** — no file size limits, no watermarks, no sign-up
- **Mobile friendly** — works on any modern browser

## Tech Stack

- Vanilla HTML/CSS/JS (no framework)
- [heic2any](https://github.com/nicolo-ribaudo/heic2any) — HEIC decoding
- [JSZip](https://stuk.github.io/jszip/) — ZIP generation
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) — file downloads

## Deploy

This is a static site. Host it anywhere:

### GitHub Pages
1. Go to repo **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Select **main** branch, **/ (root)** folder
4. Click **Save** — your site will be live in ~1 minute

### Other
Upload `index.html`, `style.css`, and `app.js` to any static host (Netlify, Vercel, Cloudflare Pages, etc.).

## License

MIT
