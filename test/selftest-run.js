const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8771/'); await p.waitForTimeout(900);
  await p.click('nav.main button[data-v=test]'); await p.waitForFunction(() => CC.selfTest, null, { timeout: 60000 });
  const r = await p.evaluate(() => CC.selfTest); console.log(JSON.stringify(r));
  const fails = await p.$$eval('#v-test tr', rows => rows.filter(r => /FAIL/.test(r.textContent)).map(r => r.textContent)); console.log(fails.join('\n'));
  await p.click('nav.main button[data-v=about]'); await p.waitForTimeout(300);
  await (await p.$('#v-about section')).screenshot({ path: 'shots11/about.png' });
  console.log(await p.textContent('#ver'), errs);
  await b.close();
})();
