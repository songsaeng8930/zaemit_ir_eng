// WEVEN IR 개발 서버
// 정적 파일 서빙 + 인쇄 미리보기 텍스트 편집 저장 API
//
//   node server.js          → http://127.0.0.1:8080
//   node server.js 3000     → 포트 지정
//
// POST /api/save-ir  { ir: "260806_kakao", html: "<!DOCTYPE html>..." }
//   → ir/<ir>/index.html 에 저장 (기존 파일은 index.html.bak 으로 백업)

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = parseInt(process.argv[2], 10) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function handleSaveIr(req, res) {
  let body = '';
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > 10 * 1024 * 1024) { // 10MB limit
      sendJson(res, 413, { ok: false, error: 'payload too large' });
      req.destroy();
      return;
    }
    body += chunk;
  });
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'invalid JSON' });
    }

    const ir = String(data.ir || '');
    const html = String(data.html || '');

    // IR 버전명 검증 (경로 조작 방지)
    if (!/^[A-Za-z0-9_-]+$/.test(ir)) {
      return sendJson(res, 400, { ok: false, error: 'invalid ir version' });
    }
    if (!html.startsWith('<!DOCTYPE html>') || html.length < 1000) {
      return sendJson(res, 400, { ok: false, error: 'html content looks invalid' });
    }

    const target = path.join(ROOT, 'ir', ir, 'index.html');
    if (!fs.existsSync(target)) {
      return sendJson(res, 404, { ok: false, error: `ir/${ir}/index.html not found` });
    }

    try {
      // 덮어쓰기 전 백업
      fs.copyFileSync(target, target + '.bak');
      fs.writeFileSync(target, html, 'utf8');
      console.log(`[save] ir/${ir}/index.html (${html.length.toLocaleString()} bytes, backup: index.html.bak)`);
      return sendJson(res, 200, { ok: true, path: `ir/${ir}/index.html`, bytes: html.length });
    } catch (e) {
      console.error('[save] failed:', e.message);
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  });
}

function serveStatic(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  } catch (e) {
    res.writeHead(400); return res.end('Bad Request');
  }

  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (err2, buf) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found: ' + urlPath);
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(buf);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && (req.url === '/api/save-ir' || req.url === '/api/save-ir/')) {
    return handleSaveIr(req, res);
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res);
  }
  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`WEVEN IR dev server: http://127.0.0.1:${PORT}`);
  console.log(`  Viewer:        http://127.0.0.1:${PORT}/app/viewer.html?ir=260806_kakao`);
  console.log(`  Print Preview: http://127.0.0.1:${PORT}/app/print-preview.html?ir=260806_kakao`);
  console.log(`  저장 API:      POST /api/save-ir (인쇄 미리보기 "원본 저장" 버튼이 사용)`);
});
