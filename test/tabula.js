// For every cipher drawn on a square: step through each letter and check the highlighted cell agrees with Encipher.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://localhost:8771/'); await p.waitForTimeout(800);
  for (const id of ['trithemius', 'vigenere', 'beaufort', 'varbeaufort', 'autokey', 'runningkey']) {
    await p.evaluate(id => CC.open(id), id); await p.waitForTimeout(100);
    await p.click('#enc'); const out = (await p.evaluate(() => CC.letters(document.querySelector('#out').textContent)));
    const n = out.length; let ok = 0, bad = [];
    for (let i = 0; i < n; i++) {
      await p.click('#objhost [data-a=step]');
      const r = await p.evaluate(id => {
        const cell = document.querySelector('#objhost rect.tc.hit'); if (!cell) return null;
        const t = cell.nextElementSibling.textContent, c = +cell.dataset.c;
        return { cell: t, head: document.querySelectorAll('#objhost text.th')[c].textContent };
      }, id);
      const shown = id === 'varbeaufort' ? r && r.head : r && r.cell;
      if (shown === out[i]) ok++; else bad.push(i + ':' + JSON.stringify(r) + ' want ' + out[i]);
    }
    console.log(id.padEnd(12), ok + '/' + n, bad.slice(0, 3).join(' '));
  }
  await b.close();
})();
