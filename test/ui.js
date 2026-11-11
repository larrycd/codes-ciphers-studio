// Opens every cipher in the studio, plays its object, runs encipher and decipher, and reports console errors.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://localhost:8771/'); await p.waitForTimeout(800);
  const ids = await p.evaluate(() => CC.list.map(d => d.id));
  const bad = [];
  for (const id of ids) {
    const before = errs.length;
    await p.evaluate(id => CC.open(id), id); await p.waitForTimeout(120);
    if (id === 'otp') await p.click('#pnew');
    if (id === 'rsa') { await p.click('#rgen'); await p.waitForTimeout(1500); }
    const play = await p.$('#objhost [data-a=step]'); if (play) { for (let i = 0; i < 3; i++) await play.click(); }
    await p.click('#enc'); await p.waitForTimeout(id === 'aes' ? 1500 : 150);
    const out = await p.textContent('#out'), msg = await p.textContent('#msg');
    if (id !== 'imagestego' && id !== 'pigpen' && id !== 'hash') { await p.click('#swap'); await p.click('#dec'); await p.waitForTimeout(id === 'aes' ? 1500 : 150); }
    const back = await p.textContent('#out'), msg2 = await p.textContent('#msg');
    const e = errs.slice(before);
    if (e.length || /err/i.test(await p.innerHTML('#msg'))) bad.push(id + ': ' + e.join(' | ') + ' ' + msg + ' ' + msg2);
    console.log(id.padEnd(12), JSON.stringify(out.slice(0, 50)), '->', JSON.stringify(back.slice(0, 50)));
  }
  await p.evaluate(() => CC.show('test')); await p.waitForTimeout(6000);
  console.log('SELFTEST', await p.evaluate(() => JSON.stringify(CC.selfTest)));
  console.log('PROBLEMS', bad.length ? '\n' + bad.join('\n') : 'none');
  for (const v of ['break', 'about', 'chal']) { await p.evaluate(v => CC.show(v), v); await p.waitForTimeout(400); }
  await p.click('#crsa'); await p.click('#cbeale'); console.log('RSA129', (await p.textContent('#orsa')).slice(-45));
  console.log('PROBLEMS', bad.length ? '\n' + bad.join('\n') : 'none'); console.log('ALL ERRORS', errs.length, errs.slice(0, 10));
  await b.close();
})();
