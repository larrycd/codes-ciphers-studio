// node test/exhaustive.js
// Every code and cipher x many messages x many key settings x groups off/3/4/5:
// encipher, put into groups exactly as the studio shows it, decipher that, and compare with the message.
const CC = require('./load.js')();
const MSGS = ['Attack at dawn', 'The quick brown fox jumps over the lazy dog', 'Meet me at 10:30, not 11!', 'Hello',
  'Sphinx of black quartz judge my vow', 'ZZZ AAA QQQ XXX', 'Larry Dalton', 'We are looking at taking some leave in December', 'abcdefghijklmnopqrstuvwxyz'];
const WORDS = ['KEY', 'Johnson', 'SECRET', 'zebras', 'MONARCHY', 'Lighthouse', 'q'];
const rnd = CC.seeded(2026);
function variants(d) {
  const base = {}; d.keys.forEach(k => base[k.id] = k.def);
  const out = [base];
  d.keys.forEach(k => {
    if (k.type === 'select') k.options.forEach(o => out.push(Object.assign({}, base, { [k.id]: o[0] })));
    else if (k.type === 'number') { const lo = k.min !== undefined ? k.min : 0, hi = k.max !== undefined ? Math.min(k.max, lo + 30) : lo + 12; [lo, Math.round((lo + hi) / 2), hi, (k.def | 0) + 1].forEach(v => { if (k.step === 2) v -= v % 2; out.push(Object.assign({}, base, { [k.id]: v })); }); }
    else if (k.type === 'text' && !/pins|lugs|plugboard|rotors|start|pos|rings|fourthPos|^n$|^d$|^e$|index|starts|nulls|filler|alpha|cover|pass/.test(k.id)) WORDS.forEach(w => out.push(Object.assign({}, base, { [k.id]: w })));
  });
  return out;
}
const extra = {
  enigma: [{ model: 'M3', rotors: 'V I IV', reflector: 'C', rings: 'QZB', pos: 'XYZ', plugboard: 'AQ BW CE DR FT GY' }, { model: 'M4', rotors: 'VIII VI VII', reflector: 'C-thin', fourth: 'Gamma', fourthPos: 'R', rings: 'ABC', pos: 'MNO', plugboard: 'PO IU' }],
  m209: [{ start: 'QWERTY', pins: 'ACEGIKMOQSUWY BDFHJLNPRTVX ABCDEFGHIJ KLMNOPQRS ACEGIKMOQS ABCDEFGHI', lugs: '1-2 1-3 1-4 1-5 1-6 2-3 2-4 2-5 2-6 3-4 3-5 3-6 4-5 4-6 5-6 1-0 2-0 3-0 4-0 5-0 6-0 0-1 0-2 0-3 0-4 0-5 0-6' }],
  lorenz: [{ start: '40 30 28 25 22 42 46 50 52 58 60 36', seed: 7 }, { start: '0 0 0 0 0 0 0 0 0 0 0 0', seed: 123456 }],
  alberti: [{ index: 'g', starts: 'ABCD', every: 1, disk: 'hist' }, { index: 'q', starts: 'XYZ', every: 3, disk: 'modern' }],
  trithemius: [{ start: 'Q', step: -3, alpha: 'GALLIA' }, { start: 'Z', step: 25, alpha: '' }],
  fleissner: [{ size: 8, key: 'VERNE', read: 'row', pad: 'x' }, { size: 4, key: 'A', read: 'col', pad: 'random' }],
  rsa: [], aes: [{ pass: 'pässwörd ✓' }], otp: []
};
const norm = s => String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9א-ת+]/g, '');
const letters = s => norm(s).replace(/[0-9+]/g, '');
function expected(d, m, k) {
  let e = norm(m);
  if (d.id === 'alberti' && k.disk !== 'modern') e = CC.albertiFix(norm(m).replace(/[05-9]/g, ''));
  if (d.id === 'm209') e = e.replace(/Z/g, '');
  if (/^book(word|letter)$/.test(d.id)) { const ini = new Set(CC.bookWords(k.book).map(w => w[0].toUpperCase())); e = letters(m).split('').filter(c => ini.has(c)).join(''); }
  if (d.id === 'cooke') e = letters(m).replace(/[CJQUXZ]/g, c => CC.cwSub[c]);
  if (d.id === 'nomenclator') e = letters(m).replace(/J/g, 'I').replace(/U/g, 'V');
  if (d.id === 'bacon' && k.alpha !== '26') e = letters(m).replace(/J/g, 'I').replace(/V/g, 'U');
  if (/^(polybius)$/.test(d.id) && k.size !== '6') e = e.replace(/J/g, 'I').replace(/[0-9]/g, '');
  if (/^(bifid|playfair|twosquare|foursquare)$/.test(d.id)) e = letters(m).replace(/J/g, 'I');
  if (d.id === 'tapcode') e = letters(m).replace(/K/g, 'C');
  if (d.id === 'onetimecode') e = norm(m.replace(/\d/g, x => ' ' + ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][x] + ' '));
  if (d.id === 'baudot' || d.id === 'cooke') e = e.replace(/[0-9]/g, '');
  if (d.id === 'semaphore' || d.id === 'chappe') e = e.replace(/[^A-Z0-9]/g, '');
  return e;
}
function compare(d, e, got, k) {
  let g = norm(got);
  if (/^(avgad|albam)$/.test(d.id) && k.alpha !== 'lat') return true; // Hebrew-only: Latin passes through, checked separately
  if (d.id === 'playfair') { g = g.replace(/[XQ]/g, ''); e = e.replace(/[XQ]/g, ''); }
  if (/^(twosquare|foursquare)$/.test(d.id) && g.endsWith('X') && !e.endsWith('X')) g = g.slice(0, -1);
  if (/^(scytale|route|trellis|fleissner|crossword)$/.test(d.id) || (/^(columnar|double|myszkowski)$/.test(d.id) && k.pad !== 'blank')) return g.startsWith(e) || g.startsWith(e.replace(/[0-9+]/g, ''));
  if (d.id === 'bacon') return [e, e.replace(/[0-9+]/g, '')].some(x => g.replace(/A+$/, '') === x.replace(/A+$/, ''));
  const digitsDropped = e.replace(/[0-9+]/g, '');
  return g === e || g === digitsDropped || g === e.replace(/\+/g, '');
}
(async () => {
  let runs = 0, pass = 0, refused = 0, ambiguous = 0; const fails = {};
  for (const d of CC.list) {
    if (/^(pigpen|imagestego|hash)$/.test(d.id)) continue;
    let vs = variants(d).concat(extra[d.id] || []);
    if (d.id === 'rsa') { const kp = CC.rsaGenerate(512); vs = [{ n: kp.n.toString(), e: '65537', d: kp.d.toString() }]; }
    for (const k0 of vs) for (const m of MSGS) for (const n of [0, 3, 4, 5]) {
      const k = Object.assign({}, k0);
      if (d.id === 'otp') k.key = CC.randLetters(80);
      runs++;
      let c, shown, p;
      try { c = await d.enc(m, k); }
      catch (e) { if (/needs at least|runs out|too long|shorter than/.test(e.message)) { refused++; pass++; continue; } (fails[d.id] = fails[d.id] || []).push('enc threw ' + e.message + ' ' + JSON.stringify(k) + ' ' + m); continue; }
      shown = CC.groupOut(c, d, n, k).text;
      try { p = await d.dec(shown, k); } catch (e) { (fails[d.id] = fails[d.id] || []).push('dec threw ' + e.message); continue; }
      const e = expected(d, m, k);
      const ambiguousButValid = d.id === 'disrupted' && /different messages give exactly the same ciphertext/.test(d.lastNote || '') && d.enc(p, k) === c;
      if (ambiguousButValid) ambiguous++;
      if (compare(d, e, p, k) || ambiguousButValid) pass++; else (fails[d.id] = fails[d.id] || []).push(`groups ${n} key ${JSON.stringify(k).slice(0, 90)} msg "${m}" -> "${String(shown).slice(0, 50)}" -> "${String(p).slice(0, 60)}"`);
    }
  }
  // Hebrew round trips
  for (const id of ['avgad', 'albam']) for (const n of [0, 3, 4, 5]) { const d = CC.byId[id], m = 'שלומ עליכמ', k = { alpha: 'heb' }; runs++; const p = d.dec(CC.groupOut(d.enc(m, k), d, n, k).text, k); if (p.replace(/\s/g, '') === m.replace(/\s/g, '')) pass++; else (fails[id] = fails[id] || []).push('hebrew ' + n + ' ' + p); }
  const ids = Object.keys(fails);
  console.log(`${runs} round trips over ${CC.list.length - 3} codes and ciphers: ${pass} passed${refused ? ' (' + refused + ' correctly refused: message too long for the cover text or book)' : ''}${ambiguous ? ', ' + ambiguous + ' disrupted-transposition results where several messages give the same ciphertext (reported to the user, and the answer shown re-enciphers exactly)' : ''}, ${runs - pass} failed`);
  ids.forEach(id => { console.log('\n' + id + ' (' + fails[id].length + ')'); fails[id].slice(0, 4).forEach(f => console.log('   ' + f)); });
  process.exit(ids.length ? 1 : 0);
})();
