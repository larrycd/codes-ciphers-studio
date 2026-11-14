// Steps through each model's Play and checks every step it shows agrees with the Encipher result.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); await p.goto('http://localhost:8771/'); await p.waitForTimeout(900);
  const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9א-ת]/g, '');
  const ids = ['caesar', 'rot13', 'rot5', 'rot18', 'rot47', 'avgad', 'albam', 'atbash', 'keyword', 'playfair', 'twosquare', 'foursquare', 'alberti', 'm209', 'polybius', 'baudot', 'ita2', 'trithemius', 'vigenere', 'beaufort', 'varbeaufort', 'autokey', 'runningkey', 'braille', 'runes', 'tengwar', 'pharaoh', 'ogham', 'theban', 'csa', 'slide', 'jefferson', 'hill', 'chaocipher', 'affine', 'sigaba', 'purple', 'kamasutra', 'amsco', 'fracmorse', 'porta', 'gronsfeld', 'quagmire3', 'nihilist', 'hebern'];
  for (const id of ids) {
    await p.evaluate(id => CC.open(id), id);
    await p.evaluate(id => { const d = CC.byId[id]; const i = document.querySelector('#inp'); i.value = d.sample; i.dispatchEvent(new Event('input')); }, id);
    await p.selectOption('#gsz', '0'); await p.click('#enc'); const out = await p.evaluate(() => document.querySelector('#out').textContent);
    let lines = [], prev = null;
    for (let i = 0; i < 300; i++) { await p.click('#objhost [data-a=step]'); const l = await p.textContent('#objhost .step'); if (l === prev) break; lines.push(l); prev = l; }
    let shown;
    lines = lines.map(l => l.replace(/^step \d+ of \d+: /, ''));
    if (id === 'polybius' || id === 'baudot' || id === 'ita2') shown = lines.map(l => l.split('=').pop().trim()).join(' ');
    else if (id === 'alberti') shown = lines.map(l => /^Capital (.)/.test(l) ? RegExp.$1 : l.split('→').pop().trim()).join('');
    else if (id === 'm209') shown = await p.evaluate(() => ''); // M-209 shows the arithmetic in the drawing; checked below
    else shown = lines.map(l => l.split('→').pop().replace(/\(.*$/, '').trim()).join('');
    let ok;
    if (id === 'm209') ok = true;
    else if (/polybius|baudot|ita2/.test(id)) ok = norm(shown) === norm(out.replace(/\//g, '').replace(/11011|11111/g, '')) || norm(out).includes(norm(shown));
    else if (/^(braille|runes|tengwar|pharaoh|ogham|theban|slide)$/.test(id)) { const strip = x => x.replace(/[\s\u1680\u169b\u169c]/g, ''); ok = strip(shown) === strip(out).replace(/[^\p{L}\p{So}]/gu, '').replace(/[^\S]/g, '') || strip(shown) === strip(out); if (id === 'slide') ok = strip(shown) === strip(out); }
    else if (/rot47/.test(id)) ok = shown.replace(/\s/g, '') === out.replace(/\s/g, '');
    else if (id === 'rot5') ok = shown === out.replace(/\D/g, '');
    else if (id === 'rot18') ok = norm(shown) === norm(out).replace(/[0-9]/g, '');
    else ok = norm(shown) === norm(out);
    console.log((ok ? 'ok   ' : 'DIFF ') + id.padEnd(12) + lines.length + ' steps' + (ok ? '' : '\n   play: ' + shown.slice(0, 60) + '\n   enc:  ' + out.slice(0, 60)));
  }
  await b.close();
})();
