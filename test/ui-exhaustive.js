// node test/ui-exhaustive.js  (serve app/ on port 8771 first)
// In a real browser, for every code and cipher: groups off/3/4/5 -> Encipher -> check the groups on screen ->
// Use result as message -> Decipher -> compare; then Play every step of its model; check notes, errors and page width.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8771/'); await p.waitForTimeout(900);
  const ids = await p.evaluate(() => CC.list.map(d => d.id));
  const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9א-ת]/g, '');
  let checks = 0; const bad = [];
  const fail = (id, what) => bad.push(id + ': ' + what);
  for (const id of ids) {
    if (id === 'imagestego') continue;
    for (const n of ['0', '3', '4', '5']) {
      const e0 = errs.length;
      await p.evaluate(id => CC.open(id), id);
      await p.evaluate(id => { const d = CC.byId[id]; const i = document.querySelector('#inp'); i.value = d.sample; i.dispatchEvent(new Event('input')); }, id);
      if (id === 'otp') await p.click('#pnew');
      if (id === 'rsa') { await p.click('#rgen'); await p.waitForFunction(() => document.querySelector('#k_d').value.length > 10); }
      await p.selectOption('#gsz', n);
      const sample = await p.inputValue('#inp');
      await p.click('#enc'); await p.waitForTimeout(id === 'aes' ? 900 : 40);
      const shown = await p.textContent('#out'), note1 = await p.textContent('#msg'), mode = await p.evaluate(id => { const d = CC.byId[id], k = {}; d.keys.forEach(x => { const el = document.querySelector('#k_' + x.id); k[x.id] = el ? el.value : x.def; }); return CC.groupMode(d, k); }, id);
      checks++;
      const groupable = /^(upper|case|digits|bits|hebrew|chars)$/.test(mode) && !(id === 'onetimecode' && /\[/.test(shown));
      if (n !== '0' && groupable && shown) {
        const parts = shown.trim().split(' ');
        if (!parts.slice(0, -1).every(x => [...x].length === +n) || [...parts[parts.length - 1]].length > +n) fail(id, 'groups of ' + n + ' not shown: "' + shown.slice(0, 40) + '"');
      }
      if (n !== '0' && !groupable && !note1) fail(id, 'groups ' + n + ' not applied and no explanation shown');
      if (/^(pigpen|hash)$/.test(id)) continue;
      await p.click('#swap'); await p.click('#dec'); await p.waitForTimeout(id === 'aes' ? 900 : 40);
      const back = await p.textContent('#out'), note2 = await p.innerHTML('#msg');
      checks++;
      let want = norm(sample), got = norm(back);
      const ok = got === want || got.startsWith(want) || got === want.replace(/[0-9]/g, '') || got.replace(/X/g, '') === want.replace(/X/g, '') ||
        (id === 'alberti' && got === norm(sample).replace(/J/g, 'I').replace(/U/g, 'V').replace(/W/g, 'VV').replace(/H/g, '').replace(/K/g, 'C').replace(/Y/g, 'I')) ||
        (id === 'cooke' && got === norm(sample).replace(/[CJQUXZ]/g, c => ({ C: 'K', J: 'G', Q: 'K', U: 'V', X: 'S', Z: 'S' })[c])) ||
        (id === 'nomenclator' && got.replace(/U/g, 'V') === want.replace(/U/g, 'V').replace(/J/g, 'I')) ||
        (id === 'tapcode' && got === want.replace(/K/g, 'C')) || (/avgad|albam/.test(id) && got === want.replace(/ם/g, 'מ'));
      if (!ok) fail(id, 'groups ' + n + ': "' + sample + '" -> "' + shown.slice(0, 40) + '" -> "' + back.slice(0, 40) + '" ' + note2);
      if (/class="err"/.test(note2)) fail(id, 'error shown: ' + note2);
      if (errs.length > e0) fail(id, 'browser error: ' + errs.slice(e0).join(' | '));
    }
    // play every step of the model, forwards then backwards
    await p.evaluate(id => CC.open(id), id);
    await p.evaluate(id => { const d = CC.byId[id]; const i = document.querySelector('#inp'); i.value = d.sample; i.dispatchEvent(new Event('input')); }, id);
    const has = await p.$('#objhost [data-a=step]');
    if (has) {
      const e0 = errs.length; let steps = 0, prev = null, stuck = 0;
      for (let i = 0; i < 400; i++) {
        await p.click('#objhost [data-a=step]'); steps++;
        const line = await p.textContent('#objhost .step');
        if (line === prev) { stuck++; if (stuck > 1) break; } else stuck = 0; prev = line;
      }
      await p.click('#objhost [data-a=back]'); await p.click('#objhost [data-a=reset]');
      checks++;
      if (errs.length > e0) fail(id, 'error while playing: ' + errs.slice(e0).join(' | '));
      if (!prev) fail(id, 'Play shows nothing');
    }
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    checks++; if (wide) fail(id, 'page wider than the window');
  }
  console.log(checks + ' browser checks over ' + ids.length + ' codes and ciphers; ' + bad.length + ' problems');
  console.log(bad.join('\n'));
  await b.close(); process.exit(bad.length ? 1 : 0);
})();
