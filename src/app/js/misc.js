/* Codes & Ciphers Studio engine - by Larry Dalton
   Chapter 10 (codewords), 11 (book ciphers), 12 (computer cryptography), 13 (steganography), codebreaker tools */
(function (G) {
'use strict';
var CC = G.CC, AZ = CC.AZ, mod = CC.mod;
var subtle = function () { var c = G.crypto || (typeof require === 'function' ? require('crypto').webcrypto : null); return c.subtle; };

/* =====================================================================
   Chapter 10 - codewords
   ===================================================================== */
/* a small field codebook made for this studio */
CC.codebook = ['ATTACK', 'AT DAWN', 'AT DUSK', 'AT MIDNIGHT', 'TODAY', 'TOMORROW', 'TONIGHT', 'RETREAT', 'ADVANCE', 'HOLD POSITION', 'ENEMY', 'AIRCRAFT', 'SHIPS', 'TANKS',
  'INFANTRY', 'SUPPLIES', 'AMMUNITION', 'FUEL', 'FOOD', 'WATER', 'MEDICAL', 'REQUIRED', 'URGENT', 'SEND', 'RECEIVED', 'CONFIRM', 'CANCEL', 'NORTH', 'SOUTH', 'EAST', 'WEST',
  'BRIDGE', 'RIVER', 'HILL', 'TOWN', 'HARBOUR', 'AIRFIELD', 'RAILWAY', 'ROAD', 'MEET', 'AGENT', 'HEADQUARTERS', 'REPORT', 'STRENGTH', 'POSITION', 'UNKNOWN', 'SIGHTED',
  'DESTROYED', 'CAPTURED', 'WOUNDED', 'REINFORCEMENTS', 'AND', 'NOT', 'IS', 'ARE', 'THE', 'OF', 'TO', 'AT', 'IN', 'ON', 'BY', 'WITH', 'FROM', 'ONE', 'TWO', 'THREE', 'FOUR',
  'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO', 'HUNDRED', 'THOUSAND', 'HOURS', 'MILES', 'KILOMETRES', 'STOP'];
CC.codePage = function (page) {
  /* each page of a one-time codebook gives every phrase a different random 4-digit group */
  var r = CC.seeded(9973 * (+page || 1) + 17), used = {}, m = {};
  CC.codebook.forEach(function (w) { var g; do { g = ('000' + r(10000)).slice(-4); } while (used[g]); used[g] = 1; m[w] = g; });
  return m;
};
CC.codeEncode = function (text, table) {
  var words = String(text).toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean), out = [], i = 0;
  var digitNames = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  words = [].concat.apply([], words.map(function (w) { return /^\d+$/.test(w) ? w.split('').map(function (d) { return digitNames[+d]; }) : [w]; }));
  while (i < words.length) {
    var best = null;
    for (var n = 3; n >= 1 && !best; n--) { var ph = words.slice(i, i + n).join(' '); if (table[ph]) best = [ph, n]; }
    if (best) { out.push(table[best[0]]); i += best[1]; } else { out.push('[' + words[i] + ']'); i++; }
  }
  return out.join(' ');
};
CC.codeDecode = function (text, table) {
  var inv = {}; for (var k in table) inv[table[k]] = k;
  return String(text).split(/\s+/).filter(Boolean).map(function (g) { return inv[g] || (g[0] === '[' ? g.slice(1, -1) : '?' + g); }).join(' ');
};
CC.reg({ id: 'onetimecode', ch: 10, name: 'One-time code', kind: 'code', object: 'codebook',
  keys: [{ id: 'page', label: 'Codebook page (use each page once)', type: 'number', def: 1, min: 1, max: 9999 }],
  about: 'Whole words and phrases are replaced by number groups from a codebook page that is used once and then destroyed. Words that are not in the book are spelled in [brackets].',
  enc: function (s, k) { return CC.codeEncode(s, CC.codePage(k.page)); },
  dec: function (s, k) { var t = String(s); if (!/\[/.test(t) && /^[\d\s]+$/.test(t)) t = (t.replace(/\D/g, '').match(/\d{4}/g) || []).join(' '); return CC.codeDecode(t, CC.codePage(k.page)); },
  sample: 'Enemy tanks sighted north of bridge send reinforcements at dawn'
});
/* Nomenclator: a cipher alphabet with spare symbols for common letters, plus code symbols for names and words */
CC.nomen = {
  letters: { A: ['α', '∇'], B: ['β'], C: ['ɕ'], D: ['δ'], E: ['ε', '∂', 'ɘ'], F: ['ƒ'], G: ['ɡ'], H: ['ħ'], I: ['ι', 'ɨ'],
    K: ['κ'], L: ['λ'], M: ['ɱ'], N: ['η', 'ɲ'], O: ['ο', '∅'], P: ['π'], Q: ['ϙ'], R: ['ρ', 'ɾ'], S: ['σ', 'ʃ'],
    T: ['τ', '†'], V: ['ν'], W: ['ω'], X: ['ξ'], Y: ['ψ'], Z: ['ζ'] },
  words: { QUEEN: '♕', KING: '♔', LETTER: '✉', AND: '⊕', THE: '⊗', THAT: '⊙', OF: '⊖', WITH: '⊘', FRIEND: '♡', ENEMY: '☠',
    LONDON: '⌂', SCOTLAND: '⚑', FRANCE: '⚜', SPAIN: '⚔', PLAN: '⚙', SHIP: '⚓', MONEY: '⚖', SECRET: '⚘' },
  nulls: ['∴', '∵', '∷']
};
CC.reg({ id: 'nomenclator', ch: 10, name: 'Nomenclator', kind: 'code', object: 'nomen',
  keys: [{ id: 'nulls', label: 'Add null symbols', type: 'select', def: 'yes', options: [['yes', 'Yes'], ['no', 'No']] }],
  about: 'The working cipher of royal courts: a substitution alphabet (with extra symbols for common letters) plus symbols for frequent words and names, and nulls that mean nothing. J is written as I and U as V. The symbols here were made for this studio.',
  enc: function (s, k) {
    var N = CC.nomen, out = [];
    String(s).toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/).filter(Boolean).forEach(function (w) {
      if (N.words[w]) out.push(N.words[w]);
      else w.replace(/J/g, 'I').replace(/U/g, 'V').split('').forEach(function (c) { var o = N.letters[c]; out.push(o[CC.rand(o.length)]); });
      if (k.nulls !== 'no' && CC.rand(3) === 0) out.push(N.nulls[CC.rand(3)]);
    });
    return out.join('');
  },
  dec: function (s) {
    var N = CC.nomen, inv = {}, out = '';
    for (var c in N.letters) N.letters[c].forEach(function (x) { inv[x] = c; });
    for (var w in N.words) inv[N.words[w]] = ' ' + w + ' ';
    Array.from(String(s)).forEach(function (x) { if (N.nulls.indexOf(x) >= 0) return; out += inv[x] || ''; });
    return out.replace(/\s+/g, ' ').trim();
  },
  random: true, sample: 'The queen will send the letter to France with the ship'
});

/* =====================================================================
   Chapter 11 - book ciphers (default book: the Declaration of Independence, loaded by the app)
   ===================================================================== */
CC.book = { text: '', name: 'Declaration of Independence (1776)' };
CC.bookWords = function (t) { return (String(t || CC.book.text).match(/[A-Za-z']+/g) || []); };
CC.bookLines = function (t) { return String(t || CC.book.text).replace(/\r/g, '').split('\n').filter(function (l) { return /[A-Za-z]/.test(l); }).map(function (l) { return l.match(/[A-Za-z']+/g) || []; }); };
CC.reg({ id: 'bookword', ch: 11, name: 'Book word cipher', kind: 'cipher', object: 'book',
  keys: [{ id: 'book', label: 'Book text (blank = Declaration of Independence)', type: 'textarea', def: '' }],
  about: 'Each word of the message is replaced by where it appears in an agreed book: line.word. A word the book does not contain is spelled out from the first letters of other words (each marked *), followed by / to end it.',
  enc: function (s, k) {
    var lines = CC.bookLines(k.book), index = {}, initials = {}, missing = {};
    lines.forEach(function (ws, li) { ws.forEach(function (w, wi) { var u = w.toUpperCase().replace(/'/g, ''); (index[u] = index[u] || []).push((li + 1) + '.' + (wi + 1)); (initials[u[0]] = initials[u[0]] || []).push((li + 1) + '.' + (wi + 1)); }); });
    var out = String(s).toUpperCase().replace(/[^A-Z' ]/g, ' ').split(/\s+/).filter(Boolean).map(function (w) {
      w = w.replace(/'/g, ''); if (!w) return ''; var c = index[w]; if (c) return c[CC.rand(c.length)];
      return w.split('').map(function (ch) { var o = initials[ch]; if (!o) { missing[ch] = 1; return '*?'; } return '*' + o[CC.rand(o.length)]; }).join(' ') + ' /';
    }).filter(Boolean).join(' ');
    var miss = Object.keys(missing); this.lastNote = miss.length ? 'The book has no word starting with ' + miss.join(', ') + ', so ' + (miss.length > 1 ? 'those letters are' : 'that letter is') + ' written as *? and cannot be read back.' : '';
    return out;
  },
  dec: function (s, k) {
    var lines = CC.bookLines(k.book), out = [], spell = '';
    String(s).split(/\s+/).filter(Boolean).forEach(function (t) {
      if (t === '/') { if (spell) { out.push(spell); spell = ''; } return; }
      if (t === '*?') { spell += '?'; return; }
      var star = t[0] === '*', m = /(\d+)\.(\d+)/.exec(t); if (!m) return;
      var w = (lines[m[1] - 1] || [])[m[2] - 1] || '?';
      if (star) spell += w[0].toUpperCase(); else { if (spell) { out.push(spell); spell = ''; } out.push(w.toUpperCase().replace(/'/g, '')); }
    });
    if (spell) out.push(spell);
    return out.join(' ');
  },
  random: true, sample: 'the people shall have power'
});
CC.reg({ id: 'bookletter', ch: 11, name: 'Book letter cipher (Beale style)', kind: 'cipher', object: 'book',
  keys: [{ id: 'book', label: 'Book text (blank = Declaration of Independence)', type: 'textarea', def: '' }],
  about: 'Number every word of the book. Each letter of the message becomes the number of any word that starts with that letter, so the same letter is written many different ways.',
  enc: function (s, k) {
    var ws = CC.bookWords(k.book), by = {}, missing = {}; ws.forEach(function (w, i) { var c = w[0].toUpperCase(); (by[c] = by[c] || []).push(i + 1); });
    var out = CC.letters(s).split('').map(function (c) { var o = by[c]; if (!o) { missing[c] = 1; return '?'; } return o[CC.rand(o.length)]; }).join(', ');
    var miss = Object.keys(missing); this.lastNote = miss.length ? 'The book has no word starting with ' + miss.join(', ') + ', so ' + (miss.length > 1 ? 'those letters are' : 'that letter is') + ' written as ? and cannot be read back. (Beale had the same problem with the Declaration.)' : '';
    return out;
  },
  dec: function (s, k) { var ws = CC.bookWords(k.book); return String(s).split(/[\s,]+/).filter(Boolean).map(function (n) { if (n === '?') return '?'; var w = ws[+n - 1]; return w ? w[0].toUpperCase() : '?'; }).join(''); },
  random: true, sample: 'Buried near Bedford'
});
CC.reg({ id: 'runningkey', ch: 11, name: 'Running key', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'book', label: 'Book text (blank = Declaration of Independence)', type: 'textarea', def: '' }, { id: 'start', label: 'Start at letter number', type: 'number', def: 1, min: 1 }],
  about: 'A Vigenère cipher whose key is a long passage of an agreed book, starting at an agreed place, so the key never repeats.',
  key: function (k, n) { var L = CC.letters(k.book || CC.book.text), st = Math.max(0, (+k.start || 1) - 1); var key = L.slice(st, st + n); if (key.length < n) throw new Error('The book runs out ' + (n - key.length) + ' letters before the message ends.'); return key; },
  enc: function (s, k) { var t = CC.letters(s), K = this.key(k, t.length); return t.split('').map(function (c, i) { return AZ[(AZ.indexOf(c) + AZ.indexOf(K[i])) % 26]; }).join(''); },
  dec: function (s, k) { var t = CC.letters(s), K = this.key(k, t.length); return t.split('').map(function (c, i) { return AZ[mod(AZ.indexOf(c) - AZ.indexOf(K[i]), 26)]; }).join(''); },
  sample: 'Meet the courier at the old mill'
});

/* =====================================================================
   Chapter 12 - computer cryptography (real algorithms from the browser's Web Crypto)
   ===================================================================== */
CC.hex = function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };
CC.unhex = function (h) { h = String(h).replace(/[^0-9a-f]/gi, ''); var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; };
CC.aesKey = async function (pass, salt) {
  var base = await subtle().importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'PBKDF2', salt: salt, iterations: 200000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
};
CC.reg({ id: 'aes', ch: 12, name: 'AES-256 (symmetric key)', kind: 'cipher', object: 'modern', async: true,
  keys: [{ id: 'pass', label: 'Shared password', type: 'text', def: 'correct horse battery staple' }],
  about: 'The modern standard symmetric cipher, run by your browser\'s own Web Crypto. The password is stretched into a 256-bit key (PBKDF2, 200,000 rounds); AES-GCM also detects tampering. Output: salt, nonce and ciphertext in Base64.',
  enc: async function (s, k) {
    var salt = new Uint8Array(16), iv = new Uint8Array(12), c = G.crypto || require('crypto').webcrypto; c.getRandomValues(salt); c.getRandomValues(iv);
    var key = await CC.aesKey(k.pass || '', salt), ct = await subtle().encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(s));
    return CC.b64(Array.from(salt).concat(Array.from(iv), Array.from(new Uint8Array(ct))));
  },
  dec: async function (s, k) {
    var b = new Uint8Array(CC.unb64(s)); if (b.length < 29) throw new Error('This is not AES output from this studio.');
    var key = await CC.aesKey(k.pass || '', b.slice(0, 16));
    try { var pt = await subtle().decrypt({ name: 'AES-GCM', iv: b.slice(16, 28) }, key, b.slice(28)); } catch (e) { throw new Error('Wrong password, or the message has been altered.'); }
    return new TextDecoder().decode(pt);
  },
  random: true, sample: 'The vault code is 4417'
});
/* RSA with BigInt: real algorithm, small enough to watch */
CC.modpow = function (b, e, m) { var r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; e >>= 1n; b = b * b % m; } return r; };
CC.egcd = function (a, b) { var x0 = 1n, x1 = 0n; while (b) { var q = a / b, t = a - q * b; a = b; b = t; t = x0 - q * x1; x0 = x1; x1 = t; } return [a, x0]; };
CC.modinv = function (a, m) { var g = CC.egcd(((a % m) + m) % m, m); if (g[0] !== 1n) throw new Error('no inverse'); return ((g[1] % m) + m) % m; };
CC.isPrime = function (n) {
  if (n < 2n) return false; var small = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (var i = 0; i < small.length; i++) { if (n === small[i]) return true; if (n % small[i] === 0n) return false; }
  var d = n - 1n, r = 0; while (d % 2n === 0n) { d /= 2n; r++; }
  outer: for (i = 0; i < small.length; i++) {
    var x = CC.modpow(small[i], d, n); if (x === 1n || x === n - 1n) continue;
    for (var j = 1; j < r; j++) { x = x * x % n; if (x === n - 1n) continue outer; }
    return false;
  }
  return true;
};
CC.randBig = function (bits) { var c = G.crypto || require('crypto').webcrypto, a = new Uint8Array(Math.ceil(bits / 8)); c.getRandomValues(a); var h = CC.hex(a), n = BigInt('0x' + h); n |= 1n << BigInt(bits - 1); n |= 1n; return n & ((1n << BigInt(bits)) - 1n); };
CC.rsaGenerate = function (bits) {
  bits = bits || 512; var e = 65537n, p, q, phi;
  do { do { p = CC.randBig(bits / 2); } while (!CC.isPrime(p)); do { q = CC.randBig(bits / 2); } while (!CC.isPrime(q) || q === p); phi = (p - 1n) * (q - 1n); } while (phi % e === 0n);
  return { p: p, q: q, n: p * q, e: e, d: CC.modinv(e, phi) };
};
CC.rsaText = function (s) { return BigInt('0x' + (CC.hex(new TextEncoder().encode(s)) || '00')); };
CC.rsaUntext = function (m) { var h = m.toString(16); if (h.length % 2) h = '0' + h; return new TextDecoder().decode(CC.unhex(h)); };
CC.reg({ id: 'rsa', ch: 12, name: 'RSA (public key)', kind: 'cipher', object: 'rsa',
  keys: [{ id: 'n', label: 'Modulus n (public)', type: 'textarea', def: '' }, { id: 'e', label: 'Public exponent e', type: 'text', def: '65537' }, { id: 'd', label: 'Private exponent d (keep secret)', type: 'textarea', def: '' }],
  about: 'Anyone can lock with the public key (n, e); only the private key d unlocks. Its safety rests on how hard it is to split n back into its two primes. Use "New key pair" to make one. Short messages only, and no padding: a teaching version of the real algorithm.',
  enc: function (s, k) { var n = BigInt(String(k.n).trim() || '0'), e = BigInt(String(k.e).trim() || '65537'); if (n < 3n) throw new Error('Make or paste a key pair first.'); var m = CC.rsaText(s); if (m >= n) throw new Error('Message too long for this key. Use a bigger key or a shorter message.'); return CC.modpow(m, e, n).toString(); },
  dec: function (s, k) { var n = BigInt(String(k.n).trim() || '0'), d = BigInt(String(k.d).trim() || '0'); if (n < 3n || d < 1n) throw new Error('The private key d is needed to decipher.'); return CC.rsaUntext(CC.modpow(BigInt(String(s).replace(/\D/g, '')), d, n)); },
  sample: 'Meet at noon'
});
CC.reg({ id: 'hash', ch: 12, name: 'Hashes and digital signatures', kind: 'tool', object: 'hash', async: true,
  keys: [{ id: 'alg', label: 'Hash', type: 'select', def: 'SHA-256', options: [['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512'], ['SHA-1', 'SHA-1 (broken, for comparison)']] }],
  about: 'A hash is a fingerprint: change one letter and the whole fingerprint changes, and it cannot be run backwards. A signature (ECDSA P-256) proves who sent a message and that it was not changed.',
  enc: async function (s, k) { return CC.hex(await subtle().digest(k.alg || 'SHA-256', new TextEncoder().encode(s))); },
  dec: async function () { throw new Error('A hash cannot be reversed - that is the point of it. Use Verify on the signature panel instead.'); },
  vectors: [{ k: { alg: 'SHA-256' }, p: 'abc', c: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', dir: 'enc' }],
  sample: 'I owe Larry ten dollars'
});
CC.signPair = async function () { return subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); };
CC.sign = async function (priv, msg) { return CC.hex(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, new TextEncoder().encode(msg))); };
CC.verify = async function (pub, msg, sig) { return subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, CC.unhex(sig), new TextEncoder().encode(msg)); };
CC.rsa129 = {
  n: '114381625757888867669235779976146612010218296721242362562561842935706935245733897830597123563958705058989075147599290026879543541',
  p: '3490529510847650949147849619903898133417764638493387843990820577',
  q: '32769132993266709549961988190834461413177642967992942539798288533',
  e: '9007',
  c: '96869613754622061477140922254355882905759991124574319874695120930816298225145708356931476622883989628013391990551829945157815154'
};
CC.rsa129Solve = function () {
  var R = CC.rsa129, p = BigInt(R.p), q = BigInt(R.q), n = BigInt(R.n), e = BigInt(R.e);
  if (p * q !== n) throw new Error('factors do not match');
  var d = CC.modinv(e, (p - 1n) * (q - 1n)), m = CC.modpow(BigInt(R.c), d, n).toString();
  if (m.length % 2) m = '0' + m; var o = '';
  for (var i = 0; i < m.length; i += 2) { var v = +m.substr(i, 2); o += v === 0 ? ' ' : String.fromCharCode(64 + v); }
  return o;
};

/* =====================================================================
   Chapter 13 - steganography
   ===================================================================== */
CC.reg({ id: 'nullcipher', ch: 13, name: 'Null cipher (hidden in ordinary text)', kind: 'stego', object: 'nullcipher',
  keys: [{ id: 'rule', label: 'Hidden letters are', type: 'select', def: 'first', options: [['first', 'First letter of each word'], ['second', 'Second letter of each word'], ['last', 'Last letter of each word'], ['lines', 'First letter of each line (acrostic)']] }],
  about: 'The real message is spelled by an agreed letter of each word (or line) of an innocent-looking letter. Encipher suggests words for each hidden letter; you then polish the cover text.',
  pick: function (w, rule) { return rule === 'second' ? w[1] : rule === 'last' ? w[w.length - 1] : w[0]; },
  enc: function (s, k) {
    var rule = k.rule || 'first', words = CC.coverWords, out = [];
    CC.letters(s).split('').forEach(function (c) {
      var cand = words.filter(function (w) { return (CC.byId.nullcipher.pick(w.toUpperCase(), rule === 'lines' ? 'first' : rule) === c); });
      /* no ordinary word fits: make a filler that still puts the letter in the agreed place */
      out.push(cand.length ? cand[CC.rand(cand.length)] : rule === 'second' ? 'o' + c.toLowerCase() + 'ka' : rule === 'last' ? 'ok' + c.toLowerCase() : c.toLowerCase() + 'ok');
    });
    return rule === 'lines' ? out.map(function (w) { return w[0].toUpperCase() + w.slice(1) + ' ...'; }).join('\n') : out.join(' ');
  },
  dec: function (s, k) {
    var rule = k.rule || 'first', self = this;
    if (rule === 'lines') return String(s).split('\n').map(function (l) { var m = /[A-Za-z]/.exec(l); return m ? m[0].toUpperCase() : ''; }).join('');
    return (String(s).match(/[A-Za-z']+/g) || []).map(function (w) { w = w.replace(/'/g, '').toUpperCase(); return w.length > (rule === 'second' ? 1 : 0) ? self.pick(w, rule) : ''; }).join('');
  },
  random: true, sample: 'HELP'
});
CC.coverWords = ('about above across after again almost along already also always among animal another answer apple around autumn away baby back bake basket beach because bed before began behind best better between bicycle big bird birthday blue boat book both bread bright brother brought busy butter cake call came candle care carried cat chair change cheese children church city clean clear close cloud coat cold come cook corner could country cousin cup daisy dance dark daughter day dear dinner doctor dog done door down dream dress during each early easy eat egg eight either else end enjoy enough evening every eye face fair family farm father few field fine fire first fish five flower follow food for forest found four fresh friend from front fruit full game garden gate gave gentle get gift give glad go going gold good grand grass great green grow had hair half hand happy hard has have he head hear heard heart help her here hill his hold holiday home hope horse hot house how hundred hungry ice idea if in inside into iron is island it its jam jar jolly journey joy jug jump just keep kept kettle kind king kitchen kite knew know lady lake lamp large last late laugh lawn leaf learn left lemon letter light like little live long look lot love lovely lucky lunch made make many market may meet milk mind minute money month moon more morning most mother much music must my name near need never new next nice night nine no noon north not nothing now number oak ocean of off often oh old on once one only open orange other our out over own paint paper park party past people picnic piece pink place plant play please pocket pond poor potato pretty quiet quick quite rabbit rain read ready red rest river road rock room rose round run sad said sail same sand say school sea season second see seven shall she ship shop short should show sing sister sit six sky sleep slow small snow so soft some soon south spring star station still stone stop story street strong such summer sun supper sure sweet table take talk tall tea tell ten than thank that the their them then there these they thing think this three through time to today together told tomorrow too took town tree trip true try two umbrella uncle under until up upon us use usual valley very village visit voice wait walk wall want warm was watch water way we weather week well went were west what when where which while white who why will window winter wish with wood word work world would write yard year yellow yes yesterday yet you young your zebra zoo').split(' ');

/* Bacon's biliteral cipher */
CC.bacon24 = 'ABCDEFGHIKLMNOPQRSTUWXYZ'; /* I=J, U=V, as Bacon had it */
CC.baconCode = function (c, full) { var a = full ? AZ : CC.bacon24; if (!full) c = c === 'J' ? 'I' : c === 'V' ? 'U' : c; var i = a.indexOf(c); return ('00000' + i.toString(2)).slice(-5).replace(/0/g, 'a').replace(/1/g, 'b'); };
CC.reg({ id: 'bacon', ch: 13, name: 'Bacon\'s cipher', kind: 'stego', object: 'bacon',
  keys: [{ id: 'alpha', label: 'Alphabet', type: 'select', def: '24', options: [['24', 'Bacon\'s 24 letters (I = J, U = V)'], ['26', '26 letters']] },
         { id: 'cover', label: 'Cover text (5 letters per hidden letter)', type: 'textarea', def: 'Francis Bacon wrote about many things in his long and busy life, from science to law and the art of writing in secret.' },
         { id: 'mode', label: 'Hide as', type: 'select', def: 'case', options: [['case', 'Lower case = a, CAPITAL = b'], ['ab', 'Plain a/b groups (no cover)']] }],
  about: 'Each letter becomes five a/b symbols. Write any cover text in two slightly different typefaces (or cases), and the choice of typeface carries the message.',
  enc: function (s, k) {
    var full = k.alpha === '26', code = CC.letters(s).split('').map(function (c) { return CC.baconCode(c, full); }).join('');
    if (k.mode === 'ab') return CC.group(code, 5);
    var cover = String(k.cover || ''), need = code.length, have = (cover.match(/[A-Za-z]/g) || []).length;
    if (have < need) throw new Error('The cover text needs at least ' + need + ' letters; it has ' + have + '.');
    var j = 0; return cover.replace(/[A-Za-z]/g, function (ch) { if (j >= need) return ch.toLowerCase(); return code[j++] === 'b' ? ch.toUpperCase() : ch.toLowerCase(); });
  },
  dec: function (s, k) {
    var full = k.alpha === '26', a = full ? AZ : CC.bacon24, t = String(s), bits;
    bits = /^[\sabAB]+$/.test(t) ? t.toLowerCase().replace(/[^ab]/g, '') : (t.match(/[A-Za-z]/g) || []).map(function (c) { return c === c.toUpperCase() ? 'b' : 'a'; }).join('');
    var o = ''; for (var i = 0; i + 5 <= bits.length; i += 5) { var v = parseInt(bits.substr(i, 5).replace(/a/g, '0').replace(/b/g, '1'), 2); if (v < a.length) o += a[v]; }
    return o.replace(/A+$/, '');
  },
  vectors: [{ k: { alpha: '24', mode: 'ab' }, p: 'BACON', c: 'aaaab aaaaa aaaba abbab abbaa' }],
  sample: 'FLEE'
});
/* Cardan grille: the message letters are found, in order, inside an innocent cover text */
CC.reg({ id: 'cardan', ch: 13, name: 'Cardan grille', kind: 'stego', object: 'cardan',
  keys: [{ id: 'cover', label: 'Cover text', type: 'textarea', def: 'Dear Aunt Mary, I hope this finds you well. The garden is lovely this year and the roses have done better than ever. We went to the coast on Sunday and the weather held. Tom sends his love and asks after the dog. Write soon, your loving niece.' }],
  about: 'A card with holes laid over a letter shows only the hidden message. Encipher finds the message letters in order in your cover text and cuts the holes; the grille is the list of positions.',
  enc: function (s, k) {
    var cover = String(k.cover || ''), msg = CC.letters(s), pos = [], j = 0;
    for (var i = 0; i < cover.length && j < msg.length; i++) if (cover[i].toUpperCase() === msg[j]) { pos.push(i); j++; }
    if (j < msg.length) throw new Error('The cover text runs out after ' + j + ' of ' + msg.length + ' letters. Make it longer.');
    return pos.join(' ');
  },
  dec: function (s, k) { var cover = String(k.cover || ''); return (String(s).match(/\d+/g) || []).map(function (p) { return (cover[+p] || '?').toUpperCase(); }).join(''); },
  sample: 'GO AT DAWN'
});
/* Invisible characters in text */
CC.ZW = ['​', '‌'];
CC.reg({ id: 'zerowidth', ch: 13, name: 'Invisible text (zero-width characters)', kind: 'stego', object: 'zerowidth',
  keys: [{ id: 'cover', label: 'Cover text', type: 'textarea', def: 'See you at the cafe at the usual time.' }],
  about: 'The secret is turned into bits and written as two invisible Unicode characters tucked inside an ordinary sentence. It survives copy and paste in most apps.',
  enc: function (s, k) {
    var bytes = new TextEncoder().encode(String(s)), bits = '';
    bytes.forEach(function (b) { bits += ('0000000' + b.toString(2)).slice(-8); });
    var hidden = bits.split('').map(function (b) { return CC.ZW[+b]; }).join('') + '⁠', cover = String(k.cover || 'Hello.');
    var cut = Math.max(1, cover.indexOf(' ')); return cover.slice(0, cut) + hidden + cover.slice(cut);
  },
  dec: function (s) {
    var bits = Array.from(String(s)).filter(function (c) { return c === CC.ZW[0] || c === CC.ZW[1]; }).map(function (c) { return c === CC.ZW[1] ? '1' : '0'; }).join('');
    var b = []; for (var i = 0; i + 8 <= bits.length; i += 8) b.push(parseInt(bits.substr(i, 8), 2));
    return b.length ? new TextDecoder().decode(new Uint8Array(b)) : '(no hidden text found)';
  },
  sample: 'The key is under the mat'
});
/* Pictures: hide bytes in the lowest bit of each colour value */
CC.stegoMagic = [0x43, 0x43, 0x53, 0x31]; /* "CCS1" */
CC.stegoCapacity = function (w, h, bits) { return Math.floor(w * h * 3 * (bits || 1) / 8) - 8; };
CC.stegoEmbed = function (rgba, bytes, bits) {
  bits = bits || 1; var len = bytes.length, head = CC.stegoMagic.concat([len >>> 24 & 255, len >>> 16 & 255, len >>> 8 & 255, len & 255]), all = head.concat(Array.from(bytes));
  var stream = []; all.forEach(function (b) { for (var i = 7; i >= 0; i--) stream.push(b >> i & 1); });
  var cap = Math.floor(rgba.length / 4) * 3 * bits; if (stream.length > cap) throw new Error('The picture is too small: it can hold ' + Math.floor(cap / 8 - 8) + ' bytes, the message needs ' + bytes.length + '.');
  var p = 0, mask = (1 << bits) - 1;
  for (var i = 0; i < rgba.length && p < stream.length; i++) {
    if (i % 4 === 3) continue; var v = 0; for (var j = 0; j < bits; j++) v = v << 1 | (p < stream.length ? stream[p++] : 0);
    rgba[i] = (rgba[i] & ~mask) | v;
  }
  return rgba;
};
CC.stegoExtract = function (rgba, bits) {
  bits = bits || 1; var stream = [], mask = (1 << bits) - 1;
  for (var i = 0; i < rgba.length; i++) { if (i % 4 === 3) continue; var v = rgba[i] & mask; for (var j = bits - 1; j >= 0; j--) stream.push(v >> j & 1); }
  var byteAt = function (n) { var b = 0; for (var k = 0; k < 8; k++) b = b << 1 | (stream[n * 8 + k] || 0); return b; };
  for (i = 0; i < 4; i++) if (byteAt(i) !== CC.stegoMagic[i]) return null;
  var len = (byteAt(4) << 24 | byteAt(5) << 16 | byteAt(6) << 8 | byteAt(7)) >>> 0;
  if (len > stream.length / 8) return null;
  var out = new Uint8Array(len); for (i = 0; i < len; i++) out[i] = byteAt(8 + i); return out;
};
CC.reg({ id: 'imagestego', ch: 13, name: 'Message hidden in a picture', kind: 'stego', object: 'image',
  about: 'The lowest bit of each red, green and blue value is replaced by a bit of the message. The picture looks the same; save it as PNG (JPEG would destroy the hidden bits).',
  enc: function (s) { return s; }, dec: function (s) { return s; }, sample: 'Meet at the station at 6'
});

/* =====================================================================
   Codebreaker tools
   ===================================================================== */
CC.counts = function (t) { var c = {}; AZ.split('').forEach(function (x) { c[x] = 0; }); CC.letters(t).split('').forEach(function (x) { c[x]++; }); return c; };
CC.ioc = function (t) { t = CC.letters(t); var c = CC.counts(t), n = t.length, s = 0; for (var k in c) s += c[k] * (c[k] - 1); return n > 1 ? s / (n * (n - 1)) : 0; };
CC.chi2 = function (t) { t = CC.letters(t); var c = CC.counts(t), n = t.length || 1, s = 0; for (var k in c) { var e = CC.engFreq[k] / 100 * n; s += (c[k] - e) * (c[k] - e) / e; } return s; };
CC.quad = null; /* loaded by the app from data/quadgrams.json */
CC.fitness = function (t) {
  var q = CC.quad; t = CC.letters(t); if (!q || t.length < 4) return -CC.chi2(t);
  var s = 0; for (var i = 0; i + 4 <= t.length; i++) { var v = q.q[t.substr(i, 4)]; s += v === undefined ? q.floor : v; } return s / (t.length - 3);
};
CC.solveCaesar = function (t) { var r = []; for (var k = 0; k < 26; k++) { var p = CC.shift(CC.letters(t), -k); r.push({ shift: k, text: p, score: CC.fitness(p) }); } return r.sort(function (a, b) { return b.score - a.score; }); };
CC.kasiskiPeriods = function (t, max) {
  t = CC.letters(t); max = max || 16; var out = [];
  for (var p = 1; p <= max && p < t.length / 2; p++) { var s = 0; for (var c = 0; c < p; c++) { var col = ''; for (var i = c; i < t.length; i += p) col += t[i]; s += CC.ioc(col); } out.push({ period: p, ioc: s / p }); }
  return out;
};
CC.solveVigenere = function (t, period) {
  t = CC.letters(t);
  if (!period) { var ps = CC.kasiskiPeriods(t, 20).filter(function (x) { return x.ioc > 0.058; }); period = ps.length ? ps[0].period : CC.kasiskiPeriods(t, 20).sort(function (a, b) { return b.ioc - a.ioc; })[0].period; }
  var key = '';
  for (var c = 0; c < period; c++) { var col = ''; for (var i = c; i < t.length; i += period) col += t[i]; var best = 0, bs = 1e9; for (var k = 0; k < 26; k++) { var x = CC.chi2(CC.shift(col, -k)); if (x < bs) { bs = x; best = k; } } key += AZ[best]; }
  /* polish each key letter with the four-letter-group score of the whole text */
  for (var pass = 0; pass < 2; pass++) for (c = 0; c < period; c++) {
    var bk = key[c], bsc = -1e9; for (k = 0; k < 26; k++) { var kk = key.slice(0, c) + AZ[k] + key.slice(c + 1), f = CC.fitness(CC.byId.vigenere.dec(t, { key: kk })); if (f > bsc) { bsc = f; bk = AZ[k]; } }
    key = key.slice(0, c) + bk + key.slice(c + 1);
  }
  return { period: period, key: key, text: CC.byId.vigenere.dec(t, { key: key }) };
};
/* hill climbing on a substitution key, scored with English four-letter groups */
CC.solveSubstitution = function (t, opts) {
  t = CC.letters(t); opts = opts || {}; var r = CC.seeded(opts.seed || 7), restarts = opts.restarts || 8, iters = opts.iters || 2000;
  var decode = function (key) { var o = ''; for (var i = 0; i < t.length; i++) o += AZ[key.indexOf(t[i])]; return o; };
  var bestAll = null;
  for (var rs = 0; rs < restarts; rs++) {
    var key = AZ.split(''); for (var i = 25; i > 0; i--) { var j = r(i + 1), x = key[i]; key[i] = key[j]; key[j] = x; }
    var best = CC.fitness(decode(key.join(''))), stale = 0;
    while (stale < iters) {
      var a = r(26), b = r(26); if (a === b) continue;
      var k2 = key.slice(); var y = k2[a]; k2[a] = k2[b]; k2[b] = y;
      var sc = CC.fitness(decode(k2.join('')));
      if (sc > best) { best = sc; key = k2; stale = 0; } else stale++;
    }
    if (!bestAll || best > bestAll.score) bestAll = { score: best, key: key.join(''), text: decode(key.join('')) };
  }
  return bestAll;
};
CC.cribDrag = function (cipher, crib) {
  var t = CC.letters(cipher), c = CC.letters(crib), out = [];
  for (var i = 0; i + c.length <= t.length; i++) { var k = ''; for (var j = 0; j < c.length; j++) k += AZ[mod(AZ.indexOf(t[i + j]) - AZ.indexOf(c[j]), 26)]; out.push({ at: i, key: k }); }
  return out;
};

if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
