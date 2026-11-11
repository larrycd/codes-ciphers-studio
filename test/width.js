// Finds any page wider than the window at several window widths.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
for (const w of [1500, 1200, 1060, 1000, 800]) { const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto('http://localhost:8771/'); await p.waitForTimeout(600);
const ids = await p.evaluate(() => CC.list.map(d => d.id)); const over = [];
for (const id of ids) { await p.evaluate(id => CC.open(id), id); await p.waitForTimeout(60);
  const r = await p.evaluate(() => { const W = document.documentElement.clientWidth; if (document.documentElement.scrollWidth <= W + 1) return null; let deep = null; document.querySelectorAll('#work *').forEach(e => { const b = e.getBoundingClientRect(); if (b.right > W + 1 && b.width > W * 0.5) deep = e.tagName + '.' + (e.id || e.className); }); return document.documentElement.scrollWidth + ' ' + deep; });
  if (r) over.push(id + ':' + r); }
console.log(w, over.length ? over.join(' | ') : 'all fit'); await p.close(); }
await b.close(); })();
