// node test/vectors.js : checks every published test vector and a round trip for every cipher
const CC = require('./load.js')();
const norm = s => String(s).toUpperCase().replace(/J/g, 'I').replace(/[^A-Z0-9+֐-׿]/g, '');
const exact = s => String(s).trim();
let pass = 0, fail = 0; const lines = [];
function check(name, ok, info) { if (ok) pass++; else fail++; lines.push((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); }
(async () => {
  for (const d of CC.list) {
    const def = {}; d.keys.forEach(k => def[k.id] = k.def);
    for (const v of d.vectors || []) {
      const k = Object.assign({}, def, v.k);
      const textual = /ascii|polybius|tapcode|morse|baudot|ita2|hash|bacon/.test(d.id);
      const cmp = textual ? exact : norm;
      try {
        if (v.dir !== 'dec') { const c = await d.enc(v.p, k); check(d.id + ' enc ' + (v.src || ''), cmp(c) === cmp(v.c), cmp(c) === cmp(v.c) ? '' : 'got ' + c + ' want ' + v.c); }
        const nx = /playfair|square/.test(d.id) ? (x => norm(x).replace(/X/g, '')) : norm;
        if (v.dir !== 'enc') { const p = await d.dec(v.c, k); check(d.id + ' dec ' + (v.src || ''), nx(p) === nx(v.p), norm(p) === norm(v.p) ? '' : 'got ' + p + ' want ' + v.p); }
      } catch (e) { check(d.id + ' vector', false, e.message); }
    }
    // round trip on the sample
    if (['pigpen', 'imagestego', 'hash'].includes(d.id)) continue;
    try {
      const k = Object.assign({}, def);
      if (d.id === 'otp') k.key = CC.randLetters(200);
      if (d.id === 'rsa') { const kp = CC.rsaGenerate(256); k.n = kp.n.toString(); k.e = kp.e.toString(); k.d = kp.d.toString(); }
      const c = await d.enc(d.sample, k), p = await d.dec(c, k);
      let want = d.sample;
      let ok;
      if (['ascii', 'aes', 'rsa', 'zerowidth', 'vernam', 'lorenz', 'ita2'].includes(d.id)) ok = exact(p).toUpperCase() === exact(want).toUpperCase();
      else if (d.id === 'alberti') ok = norm(p) === norm(CC.albertiFix(norm(want)));
      else if (d.id === 'cooke') ok = norm(p) === norm(want.toUpperCase().replace(/[CJQUXZ]/g, c => CC.cwSub[c]));
      else if (d.id === 'nomenclator') ok = norm(p).replace(/U/g, 'V') === norm(want).replace(/U/g, 'V');
      else if (['avgad', 'albam'].includes(d.id)) ok = p === want.replace(/[\u05da\u05dd\u05df\u05e3\u05e5]/g, c => ({ '\u05da': '\u05db', '\u05dd': '\u05de', '\u05df': '\u05e0', '\u05e3': '\u05e4', '\u05e5': '\u05e6' })[c]);
      else if (d.id === 'onetimecode') ok = norm(p) === norm(want);
      else if (['trellis', 'fleissner', 'crossword', 'route', 'scytale'].includes(d.id)) ok = norm(p).startsWith(norm(want));
      else if (d.id === 'playfair') ok = norm(p).replace(/X/g, '') === norm(want).replace(/X/g, '');
      else if (['twosquare', 'foursquare'].includes(d.id)) ok = norm(p).startsWith(norm(want));
      else if (d.id === 'bacon') ok = norm(p).startsWith(norm(want));
      else ok = norm(p) === norm(want);
      check(d.id + ' round trip', ok, ok ? '' : JSON.stringify({ c: String(c).slice(0, 80), p }));
    } catch (e) { check(d.id + ' round trip', false, e.message); }
  }
  // extra checks
  check('rsa129 squeamish ossifrage', CC.rsa129Solve() === 'THE MAGIC WORDS ARE SQUEAMISH OSSIFRAGE');
  const words = CC.bookWords(CC.beale.doi), dec = CC.beale.beale2.map(n => words[n - 1][0].toUpperCase()).join('');
  const sol = CC.letters(CC.beale.solution); const L = Array(sol.length + 1).fill(0);
  for (let i = 1; i <= dec.length; i++) { let prev = 0; for (let j = 1; j <= sol.length; j++) { const tmp = L[j]; L[j] = dec[i - 1] === sol[j - 1] ? prev + 1 : Math.max(L[j], L[j - 1]); prev = tmp; } }
  const same = L[sol.length];
  check('beale 2 with the Declaration', same / sol.length > 0.75, same + '/' + sol.length + ' letters agree in order; Beale miscounted some words of the Declaration, which accounts for the rest');
  { const e = new CC.Enigma({ rotors: ['I', 'II', 'III'], pos: 'ADU' }); const ps = ['A', 'A', 'A', 'A'].map(c => e.press(c).pos).join(' '); check('enigma double step ADU -> ADV AEW BFX BFY', ps === 'ADV AEW BFX BFY', ps); }
  // M4 = M3 equivalence on random text
  const t = CC.randLetters(300);
  check('enigma M4(Beta A, B-thin) = M3(B)', CC.byId.enigma.enc(t, { model: 'M4', rotors: 'IV II V', reflector: 'B-thin', fourth: 'Beta', fourthPos: 'A', rings: 'CDE', pos: 'QWE' }) === CC.byId.enigma.enc(t, { model: 'M3', rotors: 'IV II V', reflector: 'B', rings: 'CDE', pos: 'QWE' }));
  const e1 = CC.byId.enigma.enc(t, { model: 'M3', rotors: 'III I II', reflector: 'C', rings: 'XYZ', pos: 'ABC', plugboard: 'AB CD EF' });
  check('enigma never maps a letter to itself', e1.split('').every((c, i) => c !== t[i]));
  // M-209 reciprocity
  const m = 'ATTACKATDAWNZTHEBRIDGE'; const mc = CC.byId.m209.enc(m, {}); check('m209 same setting deciphers', CC.m209Run(mc, {}) === m);
  // codebreakers
  const ct = CC.byId.caesar.enc('It was the best of times it was the worst of times it was the age of wisdom', { shift: 11 });
  check('codebreaker finds Caesar shift', CC.solveCaesar(ct)[0].shift === 11);
  const vt = CC.byId.vigenere.enc('We hold these truths to be self evident that all men are created equal that they are endowed by their creator with certain unalienable rights that among these are life liberty and the pursuit of happiness', { key: 'LIBERTY' });
  const vs = CC.solveVigenere(vt); check('codebreaker finds Vigenere key', vs.key === 'LIBERTY', vs.period + ' ' + vs.key);
  const st = CC.byId.keyword.enc(CC.beale.solution.slice(0, 600), { key: 'BEDFORD' });
  const ss = CC.solveSubstitution(st, { restarts: 6, iters: 1500 }); const ref = CC.letters(CC.beale.solution.slice(0, 600));
  let agree = 0; for (let i = 0; i < ref.length; i++) if (ss.text[i] === ref[i]) agree++;
  check('codebreaker solves keyword substitution', agree / ref.length > 0.9, agree + '/' + ref.length);
  // image stego round trip
  const px = new Uint8ClampedArray(64 * 64 * 4).map((_, i) => (i * 37) & 255); const msg = new TextEncoder().encode('hidden ✓');
  CC.stegoEmbed(px, msg, 1); check('picture hides and gives back the message', new TextDecoder().decode(CC.stegoExtract(px, 1)) === 'hidden ✓');
  // signatures
  const kp = await CC.signPair(); const sig = await CC.sign(kp.privateKey, 'pay 10'); check('signature verifies', await CC.verify(kp.publicKey, 'pay 10', sig)); check('altered message fails', !(await CC.verify(kp.publicKey, 'pay 90', sig)));
  console.log(lines.join('\n')); console.log('\n' + CC.list.length + ' ciphers and codes; ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
