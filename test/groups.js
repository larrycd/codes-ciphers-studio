// Checks the Groups setting: every cipher, groups of 3, 4 and 5, enciphered, used as the message and deciphered again.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8771/'); await p.waitForTimeout(800);
  const ids = await p.evaluate(() => CC.list.filter(d => d.kind === 'cipher').map(d => d.id));
  let ok = 0, bad = [];
  for (const n of ['3', '4', '5']) for (const id of ids) {
    await p.evaluate(id => CC.open(id), id);
    if (id === 'otp') await p.click('#pnew');
    if (id === 'rsa') { await p.click('#rgen'); await p.waitForTimeout(1200); }
    await p.evaluate(() => CC.open(CC.list.find(d => d.id === location.hash.slice(1)).id));
    await p.evaluate(id => { const d = CC.byId[id]; document.querySelector('#inp').value = d.sample; document.querySelector('#inp').dispatchEvent(new Event('input')); }, id);
    await p.selectOption('#gsz', n);
    const plain = await p.inputValue('#inp');
    await p.click('#enc'); await p.waitForTimeout(id === 'aes' ? 1200 : 60);
    const shown = await p.textContent('#out');
    await p.click('#swap'); await p.click('#dec'); await p.waitForTimeout(id === 'aes' ? 1200 : 60);
    const back = await p.textContent('#out');
    const norm = s => s.toUpperCase().replace(/J/g, 'I').replace(/U/g, 'V').replace(/[^A-Z0-9]/g, '').replace(/X/g, '');
    const good = norm(back).replace(/H/g, '').startsWith(norm(plain).replace(/H/g, '').replace(/[05-9]/g, '').slice(0, 8)) || norm(back) === norm(plain);
    if (good) ok++; else bad.push(n + ' ' + id + ' | ' + shown.slice(0, 40) + ' | ' + back.slice(0, 40));
    if (id === 'caesar') console.log('caesar groups of ' + n + ':', shown);
  }
  console.log(ok + ' passed'); console.log(bad.join('\n') || 'no failures'); console.log('errors', errs);
  await b.close();
})();
