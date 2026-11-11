const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.goto('http://localhost:8771/'); await p.waitForTimeout(800);
  const list = process.argv.slice(2);
  for (const id of list) {
    await p.evaluate(id => CC.open(id), id); await p.waitForTimeout(200);
    const st = await p.$('#objhost [data-a=step]'); if (st) { for (let i = 0; i < 3; i++) { await st.click(); } await p.waitForTimeout(900); }
    if (id === 'enigma') { for (const k of 'HELLO') await p.click('.key[data-c=' + k + ']'); }
    if (id === 'fleissner') { await p.click('#tgo'); await p.click('#tgo'); await p.waitForTimeout(1000); }
    if (id === 'scytale') { await p.click('[data-t="1"]'); }
    await (await p.$('#objhost')).screenshot({ path: 'shots/' + id + '.png' });
  }
  await b.close();
})();
