/* Codes & Ciphers Studio engine - by Larry Dalton
   Chapter 7 (polyalphabetic and the M-209), Chapter 8 (Enigma), Chapter 9 (Vernam, one-time pad, Lorenz) */
(function (G) {
'use strict';
var CC = G.CC, AZ = CC.AZ, mod = CC.mod;

/* a key-stream substitution over letters, keeping spaces and punctuation */
CC.streamText = function (s, keyFn, keepAll) {
  var j = 0, src = keepAll ? String(s) : CC.letters(s);
  return CC.mapText(src, function (c, i) { return AZ[mod(keyFn(i, j++), 26)]; });
};

/* ---------- Alberti cipher disk ---------- */
CC.alberti = {
  outer: 'ABCDEFGILMNOPQRSTVXZ1234',   /* Alberti's stationary ring: 20 letters and the digits 1-4 */
  inner: 'gklnprtvz&xysomqihfdbace',   /* his movable ring, mixed, in lower case */
  outer26: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', inner26: 'qwertyuiopasdfghjklzxcvbnm'
};
CC.albertiFix = function (t) { return t.replace(/J/g, 'I').replace(/U/g, 'V').replace(/W/g, 'VV').replace(/H/g, '').replace(/K/g, 'C').replace(/Y/g, 'I'); };
CC.reg({ id: 'alberti', ch: 7, name: 'Alberti cipher disk', kind: 'cipher', object: 'alberti',
  keys: [{ id: 'index', label: 'Index letter on the inner disk', type: 'text', def: 'k' },
         { id: 'starts', label: 'Disk settings in turn (capital letters)', type: 'text', def: 'DQMR' },
         { id: 'every', label: 'Turn the disk after this many letters', type: 'number', def: 6, min: 1, max: 50 },
         { id: 'disk', label: 'Disk', type: 'select', def: 'hist', options: [['hist', 'Alberti\'s 24-place disk (no H, J, K, U, W, Y)'], ['modern', '26-letter disk']] }],
  about: 'Two concentric disks. A capital letter in the message tells the reader which outer letter to turn the inner index letter to; a new capital means the disk has been turned.',
  rings: function (k) { return k.disk === 'modern' ? [CC.alberti.outer26, CC.alberti.inner26] : [CC.alberti.outer, CC.alberti.inner]; },
  enc: function (s, k) {
    var R = this.rings(k), O = R[0], I = R[1], t = String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (k.disk !== 'modern') t = CC.albertiFix(t).replace(/[05-9]/g, '');
    var starts = (String(k.starts || 'A').toUpperCase().replace(/[^A-Z]/g, '').split('').filter(function (c) { return O.indexOf(c) >= 0; }));
    if (!starts.length) starts = [O[0]];
    var idx = I.indexOf(String(k.index || I[1])[0]); if (idx < 0) idx = 1;
    var every = Math.max(1, +k.every || 6), out = '', n = O.length;
    for (var i = 0; i < t.length; i++) {
      if (i % every === 0) { var cap = starts[(i / every) % starts.length]; out += cap; var off = mod(idx - O.indexOf(cap), n); }
      var p = O.indexOf(t[i]); if (p < 0) continue; out += I[mod(p + off, n)];
    }
    return out;
  },
  dec: function (s, k) {
    var R = this.rings(k), O = R[0], I = R[1], idx = I.indexOf(String(k.index || I[1])[0]), out = '', off = 0, n = O.length; if (idx < 0) idx = 1;
    Array.from(String(s)).forEach(function (c) {
      if (/[A-Z]/.test(c) && O.indexOf(c) >= 0) off = mod(idx - O.indexOf(c), n);
      else { var q = I.indexOf(c); if (q >= 0) out += O[mod(q - off, n)]; }
    });
    return out;
  },
  sample: 'LA GVERRA E FINITA'
});

/* ---------- Tabula recta family ---------- */
var keyLetters = function (k) { var t = CC.letters(k.key || ''); return t.length ? t : 'A'; };
CC.trithemiusAlpha = function (k) { return CC.letters(k.alpha || '') ? CC.keyAlpha(k.alpha) : AZ; };
CC.trithemiusShift = function (k, j) { return AZ.indexOf((CC.letters(k.start || 'A') || 'A')[0]) + j * (k.step === undefined || k.step === '' ? 1 : +k.step); };
CC.reg({ id: 'trithemius', ch: 7, name: 'Trithemius (tabula recta)', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'start', label: 'Start on row', type: 'text', def: 'A' }, { id: 'step', label: 'Rows to move each letter (1 = Trithemius)', type: 'number', def: 1, min: -25, max: 25 },
         { id: 'alpha', label: 'Mixed alphabet keyword (blank = A to Z)', type: 'text', def: '' }],
  about: 'Trithemius\'s own method (1508) has no key at all: the first letter uses row A (unchanged), the second row B, the third row C, and so on, so anyone who knows the method can read it. The settings let you start on another row, move by a different step or use a mixed alphabet, which turns it into a keyed cipher; A, 1 and blank give the original.',
  enc: function (s, k) { var A = CC.trithemiusAlpha(k); return CC.mapText(CC.letters(s), (function () { var j = 0; return function (c) { return A[mod(A.indexOf(c) + CC.trithemiusShift(k, j++), 26)]; }; })()); },
  dec: function (s, k) { var A = CC.trithemiusAlpha(k); return CC.mapText(CC.letters(s), (function () { var j = 0; return function (c) { return A[mod(A.indexOf(c) - CC.trithemiusShift(k, j++), 26)]; }; })()); },
  vectors: [{ k: { start: 'A', step: 1, alpha: '' }, p: 'AAAA', c: 'ABCD' }, { k: { start: 'D', step: 2, alpha: '' }, p: 'AAAA', c: 'DFHJ' }], sample: 'Trithemius wrote Polygraphia'
});
CC.reg({ id: 'vigenere', ch: 7, name: 'Vigenère', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'DIEGO' }],
  about: 'The keyword is written over the message again and again; each key letter picks a row of the Vigenère square.',
  enc: function (s, k) { var K = keyLetters(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) + AZ.indexOf(K[j % K.length]); }); },
  dec: function (s, k) { var K = keyLetters(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) - AZ.indexOf(K[j % K.length]); }); },
  vectors: [{ k: { key: 'DIEGO' }, p: 'WE QUELL THE STORM AND RIDE THE THUNDER', c: 'ZMUASOTXNSVBSXADVHXWGMXNSWPYTRHZ', src: 'book' },
            { k: { key: 'LEMON' }, p: 'ATTACKATDAWN', c: 'LXFOPVEFRNHR' }],
  sample: 'We quell the storm and ride the thunder'
});
CC.reg({ id: 'beaufort', ch: 7, name: 'Beaufort', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'DIEGO' }],
  about: 'Ciphertext = key - plaintext. The same operation enciphers and deciphers.',
  enc: function (s, k) { var K = keyLetters(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(K[j % K.length]) - AZ.indexOf(t[j]); }); },
  dec: function (s, k) { return this.enc(s, k); },
  vectors: [{ k: { key: 'FORTIFICATION' }, p: 'DEFENDTHEEASTWALLOFTHECASTLE', c: 'CKMPVCPVWPIWUJOGIUAPVWRIWUUK' }],
  sample: 'Defend the east wall of the castle'
});
CC.reg({ id: 'varbeaufort', ch: 7, name: 'Variant Beaufort', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'DIEGO' }],
  about: 'Ciphertext = plaintext - key: Vigenère run backwards.',
  enc: function (s, k) { var K = keyLetters(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) - AZ.indexOf(K[j % K.length]); }); },
  dec: function (s, k) { var K = keyLetters(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) + AZ.indexOf(K[j % K.length]); }); },
  sample: 'Defend the east wall of the castle'
});
CC.reg({ id: 'autokey', ch: 7, name: 'Autokey (ACA)', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'key', label: 'Primer', type: 'text', def: 'DIEGO' }],
  about: 'A short primer starts the key; after that the message itself is the key.',
  enc: function (s, k) { var t = CC.letters(s), K = keyLetters(k) + t; return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) + AZ.indexOf(K[j]); }); },
  dec: function (s, k) {
    var t = CC.letters(s), K = keyLetters(k), out = '';
    for (var j = 0; j < t.length; j++) { var p = AZ[mod(AZ.indexOf(t[j]) - AZ.indexOf(K[j]), 26)]; out += p; K += p; }
    var q = 0; return CC.mapText(CC.letters(s), function () { return out[q++]; });
  },
  vectors: [{ k: { key: 'QUEENLY' }, p: 'ATTACKATDAWN', c: 'QNXEPVYTWTWP' }],
  sample: 'We quell the storm and ride the thunder'
});

/* ---------- Hagelin M-209 ---------- */
CC.m209 = {
  wheels: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ABCDEFGHIJKLMNOPQRSTUVXYZ', 'ABCDEFGHIJKLMNOPQRSTUVX', 'ABCDEFGHIJKLMNOPQRSTU', 'ABCDEFGHIJKLMNOPQRS', 'ABCDEFGHIJKLMNOPQ'],
  offsets: [15, 14, 13, 12, 11, 10],   /* the pin that acts is this many places ahead of the letter in the window */
  /* an example key list (pins and lugs), made for this studio */
  example: {
    pins: ['ABDHIKMNSTVW', 'ADEGJKLORSUX', 'ABGHJLMNRSTUX', 'CEFHIMNPSTU', 'BDEFHIJLOPS', 'ABDHKNOQ'],
    lugs: '3-6 0-6 1-6 1-5 4-5 0-4 0-4 0-4 0-4 2-0 2-0 2-0 2-0 2-0 2-0 2-0 2-0 2-0 2-0 2-5 2-5 0-5 0-5 0-5 0-5 0-5 0-5'
  }
};
CC.m209Parse = function (k) {
  var pins = (k.pins || CC.m209.example.pins.join(' ')).toUpperCase().split(/[\s,;|]+/).filter(Boolean);
  while (pins.length < 6) pins.push('');
  var act = CC.m209.wheels.map(function (w, i) { return w.split('').map(function (c) { return pins[i].indexOf(c) >= 0; }); });
  var bars = (k.lugs || CC.m209.example.lugs).trim().split(/\s+/).map(function (b) { return b.split('-').map(Number).filter(function (n) { return n > 0 && n <= 6; }).map(function (n) { return n - 1; }); });
  var pos = String(k.start || 'AAAAAA').toUpperCase().replace(/[^A-Z]/g, '');
  var p = CC.m209.wheels.map(function (w, i) { var j = w.indexOf(pos[i]); return j < 0 ? 0 : j; });
  return { act: act, bars: bars, pos: p };
};
CC.m209Run = function (text, k, trace) {
  var st = CC.m209Parse(k), out = '', W = CC.m209.wheels;
  for (var i = 0; i < text.length; i++) {
    var c = text[i]; if (AZ.indexOf(c) < 0) continue;
    var active = st.pos.map(function (p, w) { return st.act[w][(p + CC.m209.offsets[w]) % W[w].length]; });
    var shift = 0; st.bars.forEach(function (b) { if (b.some(function (w) { return active[w]; })) shift++; });
    var o = AZ[mod(25 + shift - AZ.indexOf(c), 26)];
    if (trace) trace.push({ window: st.pos.map(function (p, w) { return W[w][p]; }).join(''), active: active, shift: shift, inp: c, out: o });
    out += o;
    st.pos = st.pos.map(function (p, w) { return (p + 1) % W[w].length; });
  }
  return out;
};
CC.reg({ id: 'm209', ch: 7, name: 'Hagelin M-209', kind: 'cipher', object: 'm209',
  keys: [{ id: 'start', label: 'Wheel start letters (6)', type: 'text', def: 'AAAAAA' },
         { id: 'pins', label: 'Active pins on each wheel (6 groups)', type: 'text', def: CC.m209.example.pins.join(' ') },
         { id: 'lugs', label: 'Lug settings on the 27 bars', type: 'text', def: CC.m209.example.lugs }],
  about: 'Six pin wheels of 26, 25, 23, 21, 19 and 17 letters and a cage of 27 bars. The number of bars kicked out by active pins sets the shift; ciphertext = 25 + shift - plaintext. Spaces are sent as Z. The same setting enciphers and deciphers.',
  enc: function (s, k) { var t = String(s).toUpperCase(); this.lastNote = /Z/.test(t.replace(/[^A-Z]/g, '')) ? 'On the M-209 the letter Z stands for a space, so a real Z in the message comes out as a space when deciphered (operators wrote ZED).' : ''; return CC.m209Run(t.replace(/ /g, 'Z').replace(/[^A-Z]/g, ''), k); },
  dec: function (s, k) { return CC.m209Run(CC.letters(s), k).replace(/Z/g, ' '); },
  sample: 'ENEMY PATROL AT CROSSROADS'
});

/* ---------- Enigma ---------- */
CC.enigma = {
  rotors: {
    I: ['EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'], II: ['AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'], III: ['BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'],
    IV: ['ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'], V: ['VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'], VI: ['JPGVOUMFYQBENHZRDKASXLICTW', 'ZM'],
    VII: ['NZJHGRCXMYSWBOUFAIVLPEKQDT', 'ZM'], VIII: ['FKQHTLXOCBJSPDZRAMEWNIUYGV', 'ZM'],
    Beta: ['LEYJVCNIXWPBQMDRTAKZGFUHOS', ''], Gamma: ['FSOKANUERHMBTIJCLGWYDQPZXV', '']
  },
  reflectors: { B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL', 'B-thin': 'ENKQAUYWJICOPBLMDXZVFTHRGS', 'C-thin': 'RDOBJNTKVEHMLFCWZAXGYIPSUQ' }
};
CC.Enigma = function (cfg) {
  var E = CC.enigma, self = this;
  this.model = cfg.model || 'M3';
  this.names = (cfg.rotors || ['I', 'II', 'III']).slice();      /* left to right as seen on the machine */
  this.rings = (cfg.rings || 'AAA').toUpperCase().split('').map(function (c) { return AZ.indexOf(c); });
  this.pos = (cfg.pos || 'AAA').toUpperCase().split('').map(function (c) { return AZ.indexOf(c); });
  this.refl = E.reflectors[cfg.reflector || 'B'];
  this.fourth = this.model === 'M4' ? (cfg.fourth || 'Beta') : null;
  if (this.fourth) { this.fourthPos = AZ.indexOf((cfg.fourthPos || 'A').toUpperCase()); this.fourthRing = AZ.indexOf((cfg.fourthRing || 'A').toUpperCase()); }
  this.plug = {}; String(cfg.plugboard || '').toUpperCase().split(/[\s,]+/).forEach(function (p) { if (/^[A-Z]{2}$/.test(p) && p[0] !== p[1] && !self.plug[p[0]] && !self.plug[p[1]]) { self.plug[p[0]] = p[1]; self.plug[p[1]] = p[0]; } });
  this.wire = this.names.map(function (n) { return E.rotors[n][0]; });
  this.notch = this.names.map(function (n) { return E.rotors[n][1]; });
};
CC.Enigma.prototype.step = function () {
  var p = this.pos, n = this.notch;
  var midAtNotch = n[1].indexOf(AZ[p[1]]) >= 0, rightAtNotch = n[2].indexOf(AZ[p[2]]) >= 0;
  if (midAtNotch) { p[0] = (p[0] + 1) % 26; p[1] = (p[1] + 1) % 26; }   /* double step */
  else if (rightAtNotch) p[1] = (p[1] + 1) % 26;
  p[2] = (p[2] + 1) % 26;
};
CC.Enigma.prototype.through = function (c, wiring, pos, ring, back) {
  var sh = pos - ring, x = mod(c + sh, 26);
  x = back ? wiring.indexOf(AZ[x]) : AZ.indexOf(wiring[x]);
  return mod(x - sh, 26);
};
/* press one key: returns the lamp letter and the path the current took */
CC.Enigma.prototype.press = function (ch) {
  this.step();
  var c = AZ.indexOf(ch), path = [ch], self = this;
  if (this.plug[ch]) c = AZ.indexOf(this.plug[ch]); path.push(AZ[c]);
  for (var r = 2; r >= 0; r--) { c = this.through(c, this.wire[r], this.pos[r], this.rings[r], false); path.push(AZ[c]); }
  if (this.fourth) { c = this.through(c, CC.enigma.rotors[this.fourth][0], this.fourthPos, this.fourthRing, false); path.push(AZ[c]); }
  c = AZ.indexOf(this.refl[c]); path.push(AZ[c]);
  if (this.fourth) { c = this.through(c, CC.enigma.rotors[this.fourth][0], this.fourthPos, this.fourthRing, true); path.push(AZ[c]); }
  for (r = 0; r <= 2; r++) { c = this.through(c, this.wire[r], this.pos[r], this.rings[r], true); path.push(AZ[c]); }
  var out = AZ[c]; if (this.plug[out]) out = this.plug[out]; path.push(out);
  return { out: out, path: path, pos: this.pos.map(function (p) { return AZ[p]; }).join('') };
};
CC.enigmaKeys = [
  { id: 'model', label: 'Model', type: 'select', def: 'M3', options: [['M3', 'Enigma I / M3 (three rotors)'], ['M4', 'M4 naval (four rotors)']] },
  { id: 'rotors', label: 'Rotors, left to right', type: 'text', def: 'I II III' },
  { id: 'reflector', label: 'Reflector', type: 'select', def: 'B', options: [['B', 'B'], ['C', 'C'], ['B-thin', 'B thin (M4)'], ['C-thin', 'C thin (M4)']] },
  { id: 'fourth', label: 'M4 fourth rotor', type: 'select', def: 'Beta', options: [['Beta', 'Beta'], ['Gamma', 'Gamma']] },
  { id: 'fourthPos', label: 'M4 fourth rotor position', type: 'text', def: 'A' },
  { id: 'rings', label: 'Ring settings', type: 'text', def: 'AAA' },
  { id: 'pos', label: 'Start positions', type: 'text', def: 'AAA' },
  { id: 'plugboard', label: 'Plugboard pairs', type: 'text', def: '' }
];
CC.enigmaCfg = function (k) {
  return { model: k.model, rotors: String(k.rotors || 'I II III').trim().split(/[\s,]+/), reflector: k.model === 'M4' && !/thin/.test(k.reflector) ? 'B-thin' : k.model !== 'M4' && /thin/.test(k.reflector) ? 'B' : k.reflector,
    fourth: k.fourth, fourthPos: k.fourthPos, rings: (k.rings || 'AAA').replace(/[^A-Za-z]/g, '') || 'AAA', pos: (k.pos || 'AAA').replace(/[^A-Za-z]/g, '') || 'AAA', plugboard: k.plugboard };
};
CC.reg({ id: 'enigma', ch: 8, name: 'Enigma machine', kind: 'cipher', object: 'enigma', keys: CC.enigmaKeys,
  about: 'Every key press turns the rotors, then the current runs through the plugboard, the rotors, the reflector and back. The same settings decipher. A letter can never become itself.',
  enc: function (s, k) { var m = new CC.Enigma(CC.enigmaCfg(k)); return CC.letters(s).split('').map(function (c) { return m.press(c).out; }).join(''); },
  dec: function (s, k) { return this.enc(s, k); },
  vectors: [{ k: { model: 'M3', rotors: 'I II III', reflector: 'B', rings: 'AAA', pos: 'AAA' }, p: 'AAAAA', c: 'BDZGO' },
            { k: { model: 'M3', rotors: 'II IV V', reflector: 'B', rings: 'BUL', pos: 'BLA', plugboard: 'AV BS CG DL FU HZ IN KM OW RX' }, p: 'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLTTDEISMDICAGYKUACTCDOMOHWXMUUIAUBSTSLRNBZSZWNRFXWFYSSXJZVIJHIDISHPRKLKAYUPADTXQSPINQMATLPIFSVKDASCTACDPBOPVHJK', c: 'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAFFLIEGERSTRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAXUMXEINSAQTDREINULLXUHRANGETRETENXANGRIFFXINFXRGTX', src: 'Operation Barbarossa message, 1941 (part 1)' },
            { k: { model: 'M4', rotors: 'I II III', reflector: 'B-thin', fourth: 'Beta', fourthPos: 'A', rings: 'AAA', pos: 'AAA' }, p: 'AAAAA', c: 'BDZGO', note: 'M4 with Beta at A and thin B behaves like M3 with B' }],
  sample: 'Wetterbericht fuer heute'
});

/* ---------- Vernam and one-time pad ---------- */
CC.reg({ id: 'vernam', ch: 9, name: 'Vernam cipher (teleprinter tape)', kind: 'cipher', object: 'vernam',
  keys: [{ id: 'key', label: 'Key tape (ITA2 letters, as long as the message)', type: 'text', def: '' }],
  about: 'Each five-hole teleprinter character is combined with a key tape character by exclusive-or (XOR). Doing it again with the same tape removes the key.',
  xor: function (codes, keyCodes) { return codes.map(function (b, i) { var k = keyCodes[i % keyCodes.length] || '00000'; return b.split('').map(function (x, j) { return x === k[j] ? '0' : '1'; }).join(''); }); },
  keyCodes: function (k, n) {
    var t = CC.ita2Encode(String(k.key || '').toUpperCase().replace(/[^A-Z]/g, ''));
    if (!t.length) { t = []; var r = CC.seeded(12345); for (var i = 0; i < n; i++) t.push(('0000' + r(32).toString(2)).slice(-5)); }
    return t;
  },
  enc: function (s, k) { var c = CC.ita2Encode(String(s)); return this.xor(c, this.keyCodes(k, c.length)).join(' '); },
  dec: function (s, k) { var c = String(s).replace(/[^01]/g, '').match(/[01]{5}/g) || []; return CC.ita2Decode(this.xor(c, this.keyCodes(k, c.length))); },
  sample: 'SEND MORE MONEY'
});
CC.reg({ id: 'otp', ch: 9, name: 'One-time pad', kind: 'cipher', object: 'pad',
  keys: [{ id: 'key', label: 'Pad letters (random, never reused)', type: 'text', def: '' }],
  about: 'A truly random key as long as the message, used once and destroyed. Each pad letter shifts one message letter. Without the pad every message of that length is equally likely.',
  enc: function (s, k) { var t = CC.letters(s), K = CC.letters(k.key); if (K.length < t.length) throw new Error('The pad is shorter than the message (' + K.length + ' < ' + t.length + ' letters). Make a new pad.'); return t.split('').map(function (c, i) { return AZ[(AZ.indexOf(c) + AZ.indexOf(K[i])) % 26]; }).join(''); },
  dec: function (s, k) { var t = CC.letters(s), K = CC.letters(k.key); if (K.length < t.length) throw new Error('The pad is shorter than the message.'); return t.split('').map(function (c, i) { return AZ[mod(AZ.indexOf(c) - AZ.indexOf(K[i]), 26)]; }).join(''); },
  vectors: [{ k: { key: 'XMCKL' }, p: 'HELLO', c: 'EQNVZ' }],
  sample: 'SEND HELP'
});

/* ---------- Lorenz SZ40/42 ---------- */
CC.lorenz = { chi: [41, 31, 29, 26, 23], psi: [43, 47, 51, 53, 59], mu: [61, 37] };
CC.lorenzPins = function (seed) {
  /* example pin patterns made from a seed; real ones changed regularly. About half the pins of each wheel are active. */
  var r = CC.seeded(seed || 1942), mk = function (n) { var a = []; for (var i = 0; i < n; i++) a.push(r(2)); return a; };
  return { chi: CC.lorenz.chi.map(mk), psi: CC.lorenz.psi.map(mk), mu: CC.lorenz.mu.map(mk) };
};
CC.LorenzMachine = function (k) {
  this.pins = CC.lorenzPins(+k.seed || 1942);
  var st = String(k.start || '').split(/[\s,]+/).map(Number);
  this.chi = [0, 0, 0, 0, 0]; this.psi = [0, 0, 0, 0, 0]; this.mu = [0, 0];
  for (var i = 0; i < 12; i++) { var v = st[i] || 0; if (i < 5) this.chi[i] = v % 41; else if (i < 10) this.psi[i - 5] = v % 59; else this.mu[i - 10] = v % 61; }
  var L = CC.lorenz; this.chi = this.chi.map(function (v, j) { return v % L.chi[j]; }); this.psi = this.psi.map(function (v, j) { return v % L.psi[j]; }); this.mu = this.mu.map(function (v, j) { return v % L.mu[j]; });
};
CC.LorenzMachine.prototype.key = function () {
  var P = this.pins, self = this, k = '';
  for (var b = 0; b < 5; b++) k += (P.chi[b][self.chi[b]] ^ P.psi[b][self.psi[b]]) ? '1' : '0';
  return k;
};
CC.LorenzMachine.prototype.advance = function () {
  var P = this.pins, L = CC.lorenz, basic = P.mu[1][this.mu[1]];   /* psi wheels move only when the 37 motor pin is active */
  var m61 = P.mu[0][this.mu[0]];
  this.chi = this.chi.map(function (v, j) { return (v + 1) % L.chi[j]; });
  if (basic) this.psi = this.psi.map(function (v, j) { return (v + 1) % L.psi[j]; });
  if (m61) this.mu[1] = (this.mu[1] + 1) % 37;
  this.mu[0] = (this.mu[0] + 1) % 61;
};
CC.reg({ id: 'lorenz', ch: 9, name: 'Lorenz SZ40/42 ("Tunny")', kind: 'cipher', object: 'lorenz',
  keys: [{ id: 'start', label: 'Wheel start positions (12 numbers)', type: 'text', def: '1 2 3 4 5 6 7 8 9 10 11 12' }, { id: 'seed', label: 'Pin pattern number', type: 'number', def: 1942 }],
  about: '12 pin wheels. Five chi wheels step every letter, five psi wheels step only when the motor wheels allow, and chi XOR psi is added to each five-bit teleprinter letter.',
  run: function (codes, k) { var m = new CC.LorenzMachine(k); return codes.map(function (c) { var key = m.key(); m.advance(); return c.split('').map(function (x, j) { return x === key[j] ? '0' : '1'; }).join(''); }); },
  enc: function (s, k) { return this.run(CC.ita2Encode(String(s)), k).join(' '); },
  dec: function (s, k) { return CC.ita2Decode(this.run(String(s).replace(/[^01]/g, '').match(/[01]{5}/g) || [], k)); },
  sample: 'OKW BERLIN TO ARMY GROUP CENTRE'
});

})(typeof window !== 'undefined' ? window : globalThis);
