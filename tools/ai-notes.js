#!/usr/bin/env node
// AI 수정 요청 메모(data-ai-note) 목록 출력
//
// 인쇄 미리보기(app/print-preview.html) 편집 모드에서 "AI 수정 요청" 말풍선을 달면
// 해당 요소에 data-ai-note="..." 속성이 붙어 원본 ir/<버전>/index.html에 저장된다.
// 이 스크립트는 그 메모를 페이지 번호·줄 번호·요소 태그와 함께 나열한다.
//
// 사용법:
//   node tools/ai-notes.js                          # ir/*/index.html 전체
//   node tools/ai-notes.js ir/260904_dmoa_lecture   # 특정 덱 (폴더 또는 index.html 경로)
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let files = process.argv.slice(2).map(a => {
  const p = path.resolve(a);
  return fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
});
if (!files.length) {
  const irDir = path.join(root, 'ir');
  files = fs.readdirSync(irDir)
    .map(d => path.join(irDir, d, 'index.html'))
    .filter(f => fs.existsSync(f));
}

const decode = s => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const slideRe = /<(?:div|section)\b[^>]*\bclass="slide(?=[\s"])/g;

let totalN = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.error(`파일 없음: ${f}`); continue; }
  const html = fs.readFileSync(f, 'utf8');
  const re = /data-ai-note="([^"]*)"/g;
  const hits = [];
  let m;
  while ((m = re.exec(html))) {
    const before = html.slice(0, m.index);
    const page = (before.match(slideRe) || []).length;
    const line = before.split('\n').length;
    const tagStart = before.lastIndexOf('<');
    const tagEnd = html.indexOf('>', m.index);
    let tag = html.slice(tagStart, tagEnd + 1).replace(/\s+/g, ' ');
    if (tag.length > 140) tag = tag.slice(0, 137) + '...';
    hits.push({ page, line, note: decode(m[1]).replace(/\s*\n\s*/g, ' / '), tag });
  }
  if (!hits.length) continue;
  const rel = path.relative(root, f).replace(/\\/g, '/');
  console.log(`\n${rel}  (${hits.length}건)`);
  hits.forEach((h, i) => {
    console.log(`  ${i + 1}. p.${h.page}  L${h.line}  ${h.note}`);
    console.log(`     ${h.tag}`);
  });
  totalN += hits.length;
}
console.log(totalN ? `\n총 ${totalN}건` : 'AI 수정 요청 메모 없음');
