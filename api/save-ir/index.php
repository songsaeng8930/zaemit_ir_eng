<?php
// WEVEN IR — 인쇄 미리보기 "원본 저장" API (실서버용)
//
// POST /api/save-ir  본문: { "ir": "<버전>", "html": "<!DOCTYPE html>..." }
// 헤더: X-Save-Token: <저장 비밀번호>
//
// node server.js 의 /api/save-ir 와 동일한 계약 — app/print-preview.js 가 사용한다.
// 성공: 200 { ok:true, path, bytes } / 실패: 4xx·5xx { ok:false, error }
// 덮어쓰기 전 index.html.bak 자동 백업.
//
// 비밀번호 변경법: 아래 TOKEN_HASH 를 새 비밀번호의 SHA-256 으로 교체
//   php -r "echo hash('sha256','새비밀번호');"

const TOKEN_HASH = 'ce9c6584a2cd7e452269ccc1f3b8657d60624bf04834dc709f7ce31e6196e7a8';
const MAX_BYTES = 10485760; // 10MB

header('Content-Type: application/json; charset=utf-8');

function out(int $status, array $arr): void {
  http_response_code($status);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  out(405, ['ok' => false, 'error' => 'method not allowed']);
}

$token = $_SERVER['HTTP_X_SAVE_TOKEN'] ?? '';
if ($token === '' || !hash_equals(TOKEN_HASH, hash('sha256', $token))) {
  out(401, ['ok' => false, 'error' => 'unauthorized']);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BYTES) {
  out(413, ['ok' => false, 'error' => 'payload too large']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
  out(400, ['ok' => false, 'error' => 'invalid JSON']);
}

$ir = (string)($data['ir'] ?? '');
$html = (string)($data['html'] ?? '');

// IR 버전명 검증 (경로 조작 방지)
if (!preg_match('/^[A-Za-z0-9_-]+$/', $ir)) {
  out(400, ['ok' => false, 'error' => 'invalid ir version']);
}
if (strncmp($html, '<!DOCTYPE html>', 15) !== 0 || strlen($html) < 1000) {
  out(400, ['ok' => false, 'error' => 'html content looks invalid']);
}

$root = dirname(__DIR__, 2); // api/save-ir/index.php → 서버 루트
$target = $root . '/ir/' . $ir . '/index.html';
if (!is_file($target)) {
  out(404, ['ok' => false, 'error' => "ir/$ir/index.html not found"]);
}

// 덮어쓰기 전 백업
if (!copy($target, $target . '.bak')) {
  out(500, ['ok' => false, 'error' => 'backup failed (permission?)']);
}
if (file_put_contents($target, $html) === false) {
  out(500, ['ok' => false, 'error' => 'write failed (permission?)']);
}

out(200, ['ok' => true, 'path' => "ir/$ir/index.html", 'bytes' => strlen($html)]);
