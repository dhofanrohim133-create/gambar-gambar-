# Gambar Bareng

Kanvas gambar realtime: buka link yang sama, gambar bersama teman.

**Fitur:** kuas, pensil, airbrush, penghapus, garis, kotak, elips, ember cat (fill), warna + palet, ukuran & opasitas, undo/redo per orang (Ctrl+Z / Ctrl+Y), kursor teman terlihat, ruangan lewat link `?room=nama`, simpan PNG.

## Jalankan
```bash
npm install
npm start        # http://localhost:3000
```
Buka `http://localhost:3000`, klik **Salin link ruangan**, kirim ke teman.
Untuk teman di luar jaringanmu, deploy ke Render / Railway / Fly.io (start command: `npm start`; port dibaca dari `PORT`).

## Struktur
- `server.js` – server HTTP + WebSocket, menyimpan goresan per ruangan di memori
- `public/index.html` – seluruh aplikasi klien

## Catatan
Gambar disimpan di memori server, jadi hilang kalau server restart. Ide lanjutan: layer, teks, zoom/pan, simpan ke database.
