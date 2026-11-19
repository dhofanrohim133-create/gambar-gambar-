const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000, PUB = path.join(__dirname, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const f = decodeURIComponent(req.url.split('?')[0]);
  const p = path.join(PUB, f === '/' ? 'index.html' : f);
  if (!p.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(d);
  });
});

const rooms = new Map();
const getRoom = n => { if (!rooms.has(n)) rooms.set(n, { strokes: [], clients: new Set() }); return rooms.get(n); };
const send = (c, m) => c.readyState === 1 && c.send(JSON.stringify(m));
let seq = 0;

new WebSocketServer({ server, maxPayload: 1e6 }).on('connection', (ws, req) => {
  const name = (new URL(req.url, 'http://x').searchParams.get('room') || 'lobby').slice(0, 40);
  const r = getRoom(name);
  ws.cid = 'u' + (++seq); ws.redo = []; r.clients.add(ws);
  const all = (m, skip) => r.clients.forEach(c => c !== skip && send(c, m));
  send(ws, { t: 'init', cid: ws.cid, strokes: r.strokes });
  all({ t: 'users', n: r.clients.size });

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    switch (m.t) {
      case 'begin': m.s.cid = ws.cid; r.strokes.push(m.s); ws.redo = []; all({ t: 'begin', s: m.s }, ws); break;
      case 'pts': { const s = r.strokes.find(s => s.id === m.id && s.cid === ws.cid);
        if (s) { s.pts.push(...m.pts); all({ t: 'pts', id: m.id, pts: m.pts }, ws); } break; }
      case 'end': all({ t: 'end', id: m.id }, ws); break;
      case 'undo': { const i = r.strokes.map(s => s.cid).lastIndexOf(ws.cid);
        if (i >= 0) { const [s] = r.strokes.splice(i, 1); ws.redo.push(s); all({ t: 'remove', id: s.id }); } break; }
      case 'redo': { const s = ws.redo.pop(); if (s) { r.strokes.push(s); all({ t: 'restore', s }); } break; }
      case 'clear': r.strokes.length = 0; all({ t: 'clear' }); break;
      case 'cur': all({ t: 'cur', cid: ws.cid, x: m.x, y: m.y, name: String(m.name || '').slice(0, 20), color: m.color }, ws); break;
    }
  });
  ws.on('close', () => {
    r.clients.delete(ws);
    all({ t: 'gone', cid: ws.cid }); all({ t: 'users', n: r.clients.size });
    if (!r.clients.size) setTimeout(() => { if (rooms.get(name) === r && !r.clients.size) rooms.delete(name); }, 3600e3);
  });
});

server.listen(PORT, () => console.log(`Gambar Bareng jalan di http://localhost:${PORT}`));
