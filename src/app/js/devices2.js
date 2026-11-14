/* Codes & Ciphers Studio engine - by Larry Dalton
   Version 1.2: affine (chapter 2), Diffie-Hellman (chapter 12), spy ciphers and machines (chapter 15: straddling checkerboard,
   VIC, SIGABA, PURPLE) and stream ciphers in your pocket (chapter 16: A5/1, RC4, Crypto-1, Salsa20, Trivium). */
(function (G) {
'use strict';
var CC = G.CC, AZ = CC.AZ, mod = CC.mod;
CC.chapters[15] = 'Spy ciphers and cipher machines';
CC.chapters[16] = 'Stream ciphers in your pocket';

/* ---------- bytes and hex ---------- */
CC.utf8 = function (s) { return Array.from(new TextEncoder().encode(String(s))); };
CC.unutf8 = function (b) { return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(b)); };
CC.toHex = function (b) { return b.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').toUpperCase(); };
CC.fromHex = function (h) { var t = String(h).replace(/[^0-9a-fA-F]/g, ''); if (t.length % 2) throw new Error('A hexadecimal value needs an even number of digits (0-9, A-F).'); var o = []; for (var i = 0; i < t.length; i += 2) o.push(parseInt(t.substr(i, 2), 16)); return o; };
CC.hexKey = function (h, sizes, what) {
  var b = CC.fromHex(h);
  if (sizes.indexOf(b.length) < 0) throw new Error(what + ' must be ' + sizes.map(function (n) { return n * 2; }).join(' or ') + ' hexadecimal digits (' + sizes.map(function (n) { return n * 8; }).join(' or ') + ' bits); this one has ' + b.length * 2 + '.');
  return b;
};
/* a stream cipher used on text: UTF-8 bytes XOR key stream, shown as hex */
function streamReg(d) {
  d.enc = function (s, k) { var p = CC.utf8(s), ks = this.stream(k, p.length); return CC.toHex(p.map(function (x, i) { return x ^ ks[i]; })); };
  d.dec = function (s, k) {
    var c = CC.fromHex(s), ks = this.stream(k, c.length), p = c.map(function (x, i) { return x ^ ks[i]; });
    var t = CC.unutf8(p);
    if (/�|[\u0000-\u0008\u000E-\u001F]/.test(t)) this.lastNote = 'Some bytes did not make readable text: check the key (and nonce) are the ones used to encipher.';
    return t;
  };
  d.kind = 'cipher'; d.ch = 16;
  return CC.reg(d);
}

/* =====================================================================
   Affine cipher: E(x) = (a x + b) mod 26
   ===================================================================== */
CC.reg({ id: 'affine', ch: 2, name: 'Affine cipher', kind: 'cipher', object: 'affine',
  keys: [{ id: 'a', label: 'Multiply by a (must share no factor with 26)', type: 'select', def: '5', options: [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].map(function (n) { return [String(n), String(n)]; }) },
         { id: 'b', label: 'Then add b', type: 'number', def: 8, min: 0, max: 25 }],
  about: 'A Caesar cipher with a multiplication first: number the letters A = 0 to Z = 25, multiply by a, add b and count round 26. Only 12 values of a work (those with no factor in common with 26), because the others send two letters to the same place and cannot be undone. With a = 1 it is a Caesar shift; with a = 25 and b = 25 it is Atbash.',
  enc: function (s, k) { var a = +k.a || 1, b = +k.b || 0; return CC.mapText(String(s), function (c, i) { return AZ[mod(a * i + b, 26)]; }); },
  dec: function (s, k) { var a = +k.a || 1, b = +k.b || 0, ai = CC.modInv(a, 26); if (!ai) throw new Error('a = ' + a + ' cannot be undone; choose a value with no factor in common with 26.'); return CC.mapText(String(s), function (c, i) { return AZ[mod(ai * (i - b), 26)]; }); },
  vectors: [{ k: { a: '5', b: 8 }, p: 'AFFINE CIPHER', c: 'IHHWVC SWFRCP', src: 'Wikipedia affine cipher example' }],
  sample: 'Affine cipher'
});

/* =====================================================================
   Diffie-Hellman key exchange (1976)
   ===================================================================== */
CC.modPow = function (b, e, m) { b = BigInt(b); e = BigInt(e); m = BigInt(m); var r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };
CC.dhParse = function (k) {
  var p, g, a, b; try { p = BigInt(String(k.p).trim()); g = BigInt(String(k.g).trim()); a = BigInt(String(k.a).trim()); b = BigInt(String(k.b).trim()); } catch (e) { throw new Error('p, g and the two secrets must be whole numbers.'); }
  if (p < 3n) throw new Error('The prime p must be 3 or more.');
  if (g < 2n || g >= p) throw new Error('g must be at least 2 and less than p.');
  if (a < 1n || b < 1n) throw new Error('Each secret must be 1 or more.');
  return { p: p, g: g, a: a, b: b, A: CC.modPow(g, a, p), B: CC.modPow(g, b, p) };
};
CC.reg({ id: 'dh', ch: 12, name: 'Diffie-Hellman key exchange', kind: 'tool', object: 'dh',
  keys: [{ id: 'p', label: 'Public prime p', type: 'text', def: '23' }, { id: 'g', label: 'Public base g', type: 'text', def: '5' },
         { id: 'a', label: 'Alice\'s secret a', type: 'text', def: '4' }, { id: 'b', label: 'Bob\'s secret b', type: 'text', def: '3' }],
  about: 'Whitfield Diffie and Martin Hellman\'s 1976 answer to an old problem: how can two people who have never met agree a secret key while everyone listens? Both use public numbers p and g. Alice sends g^a mod p, Bob sends g^b mod p, and each raises what they receive to their own secret. Both arrive at g^(ab) mod p; a listener who sees only the public numbers would have to undo the power, which is believed to be infeasible for very large primes. Compute shows the exchange; the message box is not needed.',
  enc: function (s, k) {
    var d = CC.dhParse(k), sa = CC.modPow(d.B, d.a, d.p), sb = CC.modPow(d.A, d.b, d.p);
    CC.byId.dh.lastNote = 'Alice sends A = ' + d.g + '^' + d.a + ' mod ' + d.p + ' = ' + d.A + '. Bob sends B = ' + d.g + '^' + d.b + ' mod ' + d.p + ' = ' + d.B + '. Alice works out B^a mod p = ' + sa + '; Bob works out A^b mod p = ' + sb + (sa === sb ? '. They match.' : '.');
    return 'shared secret ' + sa;
  },
  dec: function (s, k) {
    var d = CC.dhParse(k), A = d.A, hit = null;
    if (d.p > 2000000n) { CC.byId.dh.lastNote = 'p is too large to try every secret here; that is the point of large primes.'; return 'not found by trying'; }
    for (var x = 1n; x < d.p; x++) if (CC.modPow(d.g, x, d.p) === A) { hit = x; break; }
    CC.byId.dh.lastNote = 'An eavesdropper sees p, g and A = ' + A + '. With a prime this small, trying every power finds a secret that works (' + hit + ') and so the shared key. With a prime of 600 digits there are too many powers to try.';
    return 'eavesdropper finds a = ' + hit + ', so the shared secret is ' + CC.modPow(d.B, hit, d.p);
  },
  vectors: [{ k: { p: '23', g: '5', a: '4', b: '3' }, p: '', c: 'shared secret 18', dir: 'enc', src: 'Wikipedia Diffie-Hellman example (A = 4, B = 10, secret 18)' }],
  sample: ''
});

/* =====================================================================
   Straddling checkerboard
   ===================================================================== */
CC.checkerboard = function (top, header, restOrder) {
  /* top: 10 cells, 8 letters and 2 blanks (spaces). header: 10 digits (string). */
  var t = String(top || '').toUpperCase().replace(/[^A-Z ]/g, '');
  if (t.length !== 10 || t.replace(/ /g, '').length !== 8) throw new Error('The top row is 10 places: 8 different letters and 2 spaces, for example "ET AON RIS".');
  var H = String(header || '0123456789').replace(/\D/g, '');
  if (H.length !== 10 || new Set(H.split('')).size !== 10) throw new Error('The column numbers must be the ten digits 0-9, each once.');
  var used = t.replace(/ /g, ''), rest = AZ.split('').filter(function (c) { return used.indexOf(c) < 0; }).join('') + './';
  if (restOrder) {
    var ro = String(restOrder).toUpperCase().replace(/[^A-Z./]/g, '');
    if (ro.length !== 20 || ro.split('').sort().join('') !== rest.split('').sort().join('')) throw new Error('The lower rows must hold the other 18 letters, the full stop and the number sign (/), each once.');
    rest = ro;
  }
  if (new Set(used.split('')).size !== 8) throw new Error('The 8 letters on the top row must all be different.');
  var blanks = []; for (var i = 0; i < 10; i++) if (t[i] === ' ') blanks.push(i);
  var code = {}, rows = [{ label: '', cells: t.split('') }];
  for (i = 0; i < 10; i++) if (t[i] !== ' ') code[t[i]] = H[i];
  blanks.forEach(function (b, r) { var cells = []; for (var c = 0; c < 10; c++) { var ch = rest[r * 10 + c]; cells.push(ch); code[ch] = H[b] + H[c]; } rows.push({ label: H[b], cells: cells }); });
  var inv = {}; Object.keys(code).forEach(function (ch) { inv[code[ch]] = ch; });
  return { code: code, inv: inv, rows: rows, header: H, prefixes: blanks.map(function (b) { return H[b]; }) };
};
/* letters -> digits; numbers are written between number-shift signs with each digit three times (as the VIC agents did) */
CC.cbEncode = function (cb, s, keepSpaces) {
  var t = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), o = '', num = false;
  Array.from(t).forEach(function (ch) {
    if (/[0-9]/.test(ch)) { if (!num) { o += cb.code['/']; num = true; } o += ch + ch + ch; return; }
    if (num) { o += cb.code['/']; num = false; }
    if (cb.code[ch] && ch !== '/') o += cb.code[ch];
  });
  if (num) o += cb.code['/'];
  return o;
};
CC.cbDecode = function (cb, d) {
  d = String(d).replace(/\D/g, ''); var o = '', i = 0, num = false;
  while (i < d.length) {
    if (num) {
      var tri = d.substr(i, 3);
      if (tri.length === 3 && tri[0] === tri[1] && tri[1] === tri[2] && d.substr(i, cb.code['/'].length) !== cb.code['/']) { o += tri[0]; i += 3; continue; }
      if (tri.length === 3 && tri[0] === tri[1] && tri[1] === tri[2]) { /* digits that look like the shift sign: a triple wins */ o += tri[0]; i += 3; continue; }
      if (d.substr(i, 2) === cb.code['/']) { num = false; i += 2; continue; }
      i++; continue;
    }
    var c = d[i];
    if (cb.prefixes.indexOf(c) >= 0) { var two = d.substr(i, 2), ch = cb.inv[two]; i += 2; if (ch === '/') num = true; else if (ch) o += ch; continue; }
    o += cb.inv[c] || ''; i++;
  }
  return o;
};
CC.reg({ id: 'checkerboard', ch: 15, name: 'Straddling checkerboard', kind: 'code', object: 'checkerboard',
  keys: [{ id: 'top', label: 'Top row: 8 letters and 2 spaces', type: 'text', def: 'ET AON RIS' }, { id: 'header', label: 'Column numbers (the ten digits in any order)', type: 'text', def: '0123456789' },
         { id: 'rest', label: 'Lower rows: the other letters, full stop and number sign (/)', type: 'text', def: 'BCDFGHJKLMPQ/UVWXYZ.' }],
  about: 'A way of turning letters into digits that spies used from the 1920s to the Cold War. The eight commonest letters get a single digit; all the others get two, starting with the digit of one of the two blank columns. Because no single-digit code starts a two-digit one, the digits can be read back without any gaps. The full stop and the number sign (/) fill the last two places; numbers are written between number signs with each figure three times.',
  enc: function (s, k) { return CC.cbEncode(CC.checkerboard(k.top, k.header, k.rest), s); },
  dec: function (s, k) { return CC.cbDecode(CC.checkerboard(k.top, k.header, k.rest), s); },
  vectors: [{ k: { top: 'ET AON RIS', header: '0123456789', rest: 'BCDFGHJKLMPQ/UVWXYZ.' }, p: 'ATTACK AT DAWN', c: '3113212731223655', src: 'Wikipedia straddling checkerboard example' }],
  sample: 'Attack at dawn'
});

/* =====================================================================
   VIC cipher (Reino Hayhanen, KGB, 1950s): key derivation by chain addition, a straddling checkerboard,
   a columnar transposition and a disrupted (triangular) transposition. Method as described by David Kahn and Wikipedia.
   ===================================================================== */
CC.digits = function (s) { return String(s).replace(/\D/g, '').split('').map(Number); };
CC.chainAdd = function (seed, n) { var o = seed.slice(); for (var i = 0; o.length < seed.length + n; i++) o.push((o[i] + o[i + 1]) % 10); return o.slice(seed.length); };
/* sequencing: number the items 1..n in alphabetical / numerical order (0 counts as 10), ties left to right; 10 is written 0 */
CC.sequence = function (arr, zeroLast) {
  var key = arr.map(function (x) { return zeroLast && x === 0 ? 10 : x; });
  var idx = key.map(function (_, i) { return i; }).sort(function (a, b) { return key[a] < key[b] ? -1 : key[a] > key[b] ? 1 : a - b; });
  var r = []; idx.forEach(function (i, n) { r[i] = (n + 1) % 10; }); return r;
};
CC.seqLetters = function (s) { var t = s.split(''), idx = t.map(function (_, i) { return i; }).sort(function (a, b) { return t[a] < t[b] ? -1 : t[a] > t[b] ? 1 : a - b; }); var r = []; idx.forEach(function (i, n) { r[i] = (n + 1) % 10; }); return r; };
CC.vicKeys = function (k) {
  var phrase = CC.letters(k.phrase), date = CC.digits(k.date), kg = CC.digits(k.keygroup), pn = +k.personal;
  if (phrase.length < 20) throw new Error('The key phrase needs at least 20 letters (the agent used the start of a song).');
  if (date.length < 6) throw new Error('The date needs at least 6 digits, for example 139195 for 13 September 1959.');
  if (kg.length !== 5) throw new Error('The keygroup is 5 random digits, chosen fresh for each message.');
  if (!(pn >= 1 && pn <= 16)) throw new Error('The personal number is 1 to 16.');
  var L = {};
  L.A = kg; L.B = date.slice(0, 5); L.C = L.A.map(function (x, i) { return mod(x - L.B[i], 10); });
  L.D = phrase.slice(0, 20);
  L.E1 = CC.seqLetters(L.D.slice(0, 10)); L.E2 = CC.seqLetters(L.D.slice(10, 20));
  L.F1 = L.C.concat(CC.chainAdd(L.C, 5)); L.F2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  L.G = L.E1.map(function (x, i) { return (x + L.F1[i]) % 10; });
  L.H = L.G.map(function (d) { return L.E2[L.F2.indexOf(d)]; });
  L.J = CC.sequence(L.H, true);
  var chain = CC.chainAdd(L.H, 50); L.K = chain.slice(0, 10); L.L = chain.slice(10, 20); L.M = chain.slice(20, 30); L.N = chain.slice(30, 40); L.P = chain.slice(40, 50);
  var last = L.P[9], j = 8; while (j >= 0 && L.P[j] === last) j--;
  var first = j >= 0 ? L.P[j] : last; L.a = first + pn; L.b = last + pn;
  var rows = [L.K, L.L, L.M, L.N, L.P], cols = [];
  for (var dgt = 1; dgt <= 10; dgt++) { var c = L.J.indexOf(dgt % 10); rows.forEach(function (r) { cols.push(r[c]); }); }
  L.Q = cols.slice(0, L.a); L.R = cols.slice(L.a, L.a + L.b);
  L.S = CC.sequence(L.P, true);
  L.insertAt = date[5];
  return L;
};
CC.vicBoard = function (k) { return CC.checkerboard(k.top, CC.vicKeys(k).S.join('')); };
/* columnar transposition with a digit key (0 counts as 10, ties left to right) */
CC.colOrder = function (key) { var rank = CC.sequence(key, true).map(function (r) { return r === 0 ? 10 : r; }), keyv = key.map(function (x) { return x === 0 ? 10 : x; }); var idx = keyv.map(function (_, i) { return i; }).sort(function (a, b) { return keyv[a] - keyv[b] || a - b; }); return idx; };
CC.columnarDigits = function (d, key, dir) {
  var C = key.length, n = d.length, R = Math.ceil(n / C), order = CC.colOrder(key), out = [], p = 0;
  if (dir > 0) { order.forEach(function (c) { for (var r = 0; r < R; r++) { var i = r * C + c; if (i < n) out.push(d[i]); } }); return out; }
  var g = []; order.forEach(function (c) { for (var r = 0; r < R; r++) { var i = r * C + c; if (i < n) g[i] = d[p++]; } }); return g;
};
/* the disrupted transposition: triangles start in the column of key digit 1, 2, 3...; each row of a triangle begins one
   column further right; the message fills the rest of the block first, then the triangles, row by row; read by columns */
CC.vicTriangles = function (n, key) {
  var C = key.length, R = Math.ceil(n / C), order = CC.colOrder(key), tri = {}, r = 0, t = 0;
  while (r < R) { var c = order[t % C]; t++; while (c <= C && r < R) { for (var x = c; x < C; x++) tri[r * C + x] = 1; r++; c++; } }
  return { R: R, C: C, tri: tri };
};
CC.vicDisrupt = function (d, key, dir) {
  var n = d.length, T = CC.vicTriangles(n, key), C = T.C, cells = [], i;
  for (i = 0; i < n; i++) if (!T.tri[i]) cells.push(i);
  for (i = 0; i < n; i++) if (T.tri[i]) cells.push(i);
  var order = CC.colOrder(key), readCells = []; order.forEach(function (c) { for (var r = 0; r < T.R; r++) { var x = r * C + c; if (x < n) readCells.push(x); } });
  var grid = [];
  if (dir > 0) { cells.forEach(function (cell, j) { grid[cell] = d[j]; }); return readCells.map(function (cell) { return grid[cell]; }); }
  readCells.forEach(function (cell, j) { grid[cell] = d[j]; }); return cells.map(function (cell) { return grid[cell]; });
};
CC.reg({ id: 'vic', ch: 15, name: 'VIC cipher (Soviet spy, 1950s)', kind: 'cipher', object: 'vic',
  keys: [{ id: 'phrase', label: 'Key phrase (first 20 letters are used)', type: 'text', def: 'TWAS THE NIGHT BEFORE CHRISTMAS' },
         { id: 'date', label: 'Date as digits (day, month, year)', type: 'text', def: '1391959' },
         { id: 'personal', label: 'Personal number', type: 'number', def: 6, min: 1, max: 16 },
         { id: 'keygroup', label: 'Keygroup (5 random digits, new for each message)', type: 'text', def: '72401' },
         { id: 'top', label: 'Checkerboard top row: 8 letters and 2 spaces', type: 'text', def: 'AT ONE SIR' }],
  about: 'The pencil-and-paper cipher of Reino Hayhanen, a KGB agent in New York. A message he sent was found in a hollow nickel in 1953, and the FBI could not read it until he defected in 1957. A song line, a date, a personal number and a random keygroup are stirred together by "chain addition" (adding neighbouring digits) to make every key; the message becomes digits on a straddling checkerboard, goes through two transpositions (the second with triangular gaps) and the keygroup is hidden among the groups.',
  enc: function (s, k) {
    var L = CC.vicKeys(k), cb = CC.checkerboard(k.top, L.S.join(''));
    var d = CC.digits(CC.cbEncode(cb, s));
    /* fill out to whole groups of five: a number sign and digits that are not triples, which the reader ignores */
    if (d.length % 5) {
      var need = 5 - d.length % 5; if (need < 3) need += 5;
      var sh = CC.digits(cb.code['/']), x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function (v) { return v !== sh[0]; });
      var a1 = x[CC.rand(x.length)], b1 = x.filter(function (v) { return v !== a1; })[CC.rand(x.length - 1)];
      d = d.concat(sh); for (var q = 0; q < need - 2; q++) d.push(q % 2 ? b1 : a1);
    }
    d = CC.vicDisrupt(CC.columnarDigits(d, L.Q, 1), L.R, 1);
    var groups = (d.join('').match(/.{5}/g) || []);
    groups.splice(Math.min(groups.length, Math.max(0, groups.length - L.insertAt + 1)), 0, L.A.join(''));
    return groups.join(' ');
  },
  dec: function (s, k) {
    var L = CC.vicKeys(k), cb = CC.checkerboard(k.top, L.S.join(''));
    var groups = String(s).replace(/[^0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean), flat = groups.join('');
    groups = flat.match(/.{1,5}/g) || [];
    var pos = Math.min(groups.length - 1, Math.max(0, groups.length - 1 - L.insertAt + 1));
    var kg = groups.splice(pos, 1)[0];
    if (kg !== L.A.join('')) this.lastNote = 'The keygroup found in the message (' + kg + ') is not the one in the key; check the date or keygroup.';
    var d = CC.digits(groups.join(''));
    d = CC.columnarDigits(CC.vicDisrupt(d, L.R, -1), L.Q, -1);
    return CC.cbDecode(cb, d.join(''));
  },
  random: true,
  sample: 'Attack at dawn. By dawn I mean 0500. Not 0915 like you did last time.'
});

/* =====================================================================
   SIGABA / ECM Mark II (US, 1940s): five cipher rotors, five control rotors, five index rotors.
   Mechanism from the published descriptions (Stamp and Chan); the real rotor wirings were never published,
   so the studio uses example wirings.
   ===================================================================== */
CC.perm = function (n, seed) { var r = CC.seeded(seed), a = []; for (var i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { var j = r(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
CC.sigabaRotors = (function () { var o = []; for (var i = 0; i < 10; i++) o.push(CC.perm(26, 1941 + i * 7919)); return o; })();
CC.sigabaIndex = (function () { var o = []; for (var i = 0; i < 5; i++) o.push(CC.perm(10, 4242 + i * 104729)); return o; })();
CC.sigabaParse = function (k) {
  var list = function (s, n, max, what) { var t = String(s).toUpperCase().match(/\d+R?/g) || []; if (t.length !== n) throw new Error(what + ': give ' + n + ' rotor numbers (0-' + max + '), add R for a rotor put in backwards.'); return t.map(function (x) { var v = parseInt(x, 10); if (v > max) throw new Error(what + ': rotor ' + v + ' does not exist.'); return { w: v, rev: /R/.test(x) }; }); };
  var rot = list(k.cipher, 5, 9, 'Cipher rotors').concat(list(k.control, 5, 9, 'Control rotors'));
  var seen = {}; rot.forEach(function (r) { if (seen[r.w]) throw new Error('Each of the 10 big rotors can be used once; rotor ' + r.w + ' appears twice.'); seen[r.w] = 1; });
  var idx = list(k.index, 5, 4, 'Index rotors'), si = {}; idx.forEach(function (r) { if (si[r.w]) throw new Error('Each index rotor can be used once.'); si[r.w] = 1; });
  var pos = function (s, n, what) { var t = CC.letters(s); if (t.length !== n) throw new Error(what + ' positions: ' + n + ' letters.'); return t.split('').map(function (c) { return AZ.indexOf(c); }); };
  var ipos = CC.digits(k.ipos); if (ipos.length !== 5) throw new Error('Index positions: 5 digits.');
  return { cipher: rot.slice(0, 5), control: rot.slice(5), index: idx, cpos: pos(k.cpos, 5, 'Cipher rotor'), kpos: pos(k.kpos, 5, 'Control rotor'), ipos: ipos };
};
/* a rotor at position p: forward and backward; a backwards rotor uses the mirror image of its wiring */
CC.SigabaMachine = function (k) {
  var S = CC.sigabaParse(k), self = this;
  this.S = S; this.cp = S.cpos.slice(); this.kp = S.kpos.slice();
  var R = CC.sigabaRotors, I = CC.sigabaIndex;
  var through = function (bank, pos, x, back) {
    if (!back) { for (var i = 0; i < 5; i++) x = fwd(bank[i], pos[i], x); }
    else { for (i = 4; i >= 0; i--) x = bwd(bank[i], pos[i], x); }
    return x;
  };
  var fwd = function (r, p, x) { var W = R[r.w]; return r.rev ? mod(-W.indexOf(mod(-(x + p) , 26)) - p, 26) : mod(W[mod(x + p, 26)] - p, 26); };
  var bwd = function (r, p, y) { var W = R[r.w]; return r.rev ? mod(-W[mod(-(y + p), 26)] - p, 26) : mod(W.indexOf(mod(y + p, 26)) - p, 26); };
  var ifwd = function (r, p, x) { var W = I[r.w]; return r.rev ? mod(-W.indexOf(mod(-(x + p), 10)) - p, 10) : mod(W[mod(x + p, 10)] - p, 10); };
  var GROUP = { B: 1, C: 2, D: 3, E: 3, F: 4, G: 4, H: 4, I: 5, J: 5, K: 5, L: 6, M: 6, N: 6, O: 6, P: 7, Q: 7, R: 7, S: 7, T: 7, U: 8, V: 8, W: 8, X: 8, Y: 8, Z: 8, A: 9 };
  /* which cipher rotors step: control signals F G H I enter control rotor 4 and leave rotor 0 */
  this.stepping = function () {
    var outs = {}, ins = [5, 6, 7, 8];
    ins.forEach(function (x) { var y = x; for (var i = 4; i >= 0; i--) y = fwd(S.control[i], self.kp[i], y); outs[AZ[y]] = 1; });
    var idxIn = {}; Object.keys(outs).forEach(function (L) { idxIn[GROUP[L]] = 1; });
    var idxOut = {}; Object.keys(idxIn).forEach(function (v) { var x = +v; for (var i = 0; i < 5; i++) x = ifwd(S.index[i], S.ipos[i], x); idxOut[x] = 1; });
    var step = {}; Object.keys(idxOut).forEach(function (o) { step[[0, 4, 4, 3, 3, 2, 2, 1, 1, 0][+o]] = 1; });
    return { outs: Object.keys(outs), idxIn: Object.keys(idxIn).map(Number), idxOut: Object.keys(idxOut).map(Number), step: Object.keys(step).map(Number).sort() };
  };
  this.advance = function (st) {
    st.step.forEach(function (i) { self.cp[i] = mod(self.cp[i] + (S.cipher[i].rev ? -1 : 1), 26); });
    /* control rotors: 2 fast, 3 medium, 1 slow; 0 and 4 stay still */
    var c2 = self.kp[2]; self.kp[2] = mod(self.kp[2] + 1, 26);
    if (c2 === 25) { var c3 = self.kp[3]; self.kp[3] = mod(self.kp[3] + 1, 26); if (c3 === 25) self.kp[1] = mod(self.kp[1] + 1, 26); }
  };
  this.press = function (x, dir) {
    var y = dir > 0 ? through(S.cipher, self.cp, x, false) : through(S.cipher, self.cp, x, true);
    var st = self.stepping(); self.advance(st); return { y: y, st: st };
  };
};
CC.sigabaRun = function (s, k, dir, trace) {
  var m = new CC.SigabaMachine(k), out = '';
  var t = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (dir > 0) t = t.replace(/Z/g, 'X').replace(/\s+/g, 'Z').replace(/[^A-Z]/g, ''); else t = t.replace(/[^A-Z]/g, '');
  Array.from(t).forEach(function (c) {
    var before = { cp: m.cp.slice(), kp: m.kp.slice() }, r = m.press(AZ.indexOf(c), dir), o = AZ[r.y];
    if (trace) trace.push({ i: c, o: o, cp: before.cp, kp: before.kp, st: r.st });
    out += dir > 0 ? o : (o === 'Z' ? ' ' : o);
  });
  return out;
};
CC.reg({ id: 'sigaba', ch: 15, name: 'SIGABA (ECM Mark II)', kind: 'cipher', object: 'sigaba',
  keys: [{ id: 'cipher', label: 'Cipher rotors, left to right (0-9, R = backwards)', type: 'text', def: '0 1 2R 3 4' },
         { id: 'control', label: 'Control rotors', type: 'text', def: '5 6R 7 8 9' },
         { id: 'index', label: 'Index rotors (0-4)', type: 'text', def: '0 1 2 3 4' },
         { id: 'cpos', label: 'Cipher rotor start letters', type: 'text', def: 'AAAAA' },
         { id: 'kpos', label: 'Control rotor start letters', type: 'text', def: 'AAAAA' },
         { id: 'ipos', label: 'Index rotor settings', type: 'text', def: '00000' }],
  about: 'The American machine of the Second World War, and the only major one that was never broken. Enigma moved its rotors like a mileage counter; SIGABA let a second bank of five rotors (the control rotors) and a bank of small index rotors decide which of its five cipher rotors move, so one to four of them step at random-looking moments. Spaces are sent as Z and Z as X, as on the real machine. The mechanism follows the published descriptions; the real rotor wirings were never made public, so the studio uses example wirings.',
  enc: function (s, k) { return CC.sigabaRun(s, k, 1); },
  dec: function (s, k) { return CC.sigabaRun(s, k, -1); },
  sample: 'Fleet sails at dawn'
});

/* =====================================================================
   PURPLE (Japanese Cipher Machine Type B, 1939-45): stepping switches instead of rotors.
   Wiring from Freeman, Sullivan and Weierud, "PURPLE Revealed" (Cryptologia, 2003), as published in Brian Neal's
   purple simulator (MIT licence).
   ===================================================================== */
CC.purpleData = (function () {
  var raw = {"sixes": "102435,524103,043512,321054,250341,105423,543102,250341,431520,342105,103452,435210,201534,314025,051243,432501,514230,123045,012453,205314,540132,025314,534021,350142,413250", "t1": "5ID09316C87F2HEA4BJG,34FGD0JE27HABC9I1586,G0C5EAIBFH926D7J3814,2DJ35F7I1BG840A96CEH,I57JC4H392FEDB61GA08,1A8D6I52HCB79EFGJ340,F65H89C0G143AIJD7E2B,0J6FBD4HE9C57238AGI1,G8A7JH6D0FE4I15B39C2,B7G82J39D46H1FC50IEA,J0FA1G837E9C2HD456BI,43E1CI5FBD76G9H280AJ,EG9IF1A7862DHCB04J53,AB627EF53J1408IH9DGC,BF1637EI40A8JG5DC2H9,7EH0BAGDJFCI86231495,624HGCIJDA89150EBF37,9C3DH21GAIJ05B86E74F,C68BJFD9I501A342HG7E,0123456789ABCDEFGHIJ,8JB49G0C6E32F7HAI1D5,HE1C0694IG5J8AB723FD,FHI9AJ4803BC65G1DE27,470EI8B152DG3JFCH96A,D9378B2AGJI5E41HF60C", "t2": "E804GI2197AHBF5CJ3D6,B5E1387FIG4AJ69H0DC2,3H47F0BEJDCGA168529I,5A1JD6HBE27490GI8F3C,61C283GD0BHJ5AFE47I9,4GD698IJ7C01F23BAH5E,732AIC18BF9GDEJ5H064,J0F9E7DAH426CGI318B5,876E413CG0A5IHD92JFB,9BAH7FJG45823IC60DE1,A6D3HJ50CIBE48F1G972,1289CDEF6AJBH5047GI3,F9E0G2C836571D4ABIHJ,IFHB2C8951GDA36JE407,HDBI0695AE487JG32C1F,J2I134AD89HFEB76C5G0,253D1BF4HJ6I0E879ACG,4EJ89G0ICB3165ADF72H,DJCG4H731EF08I2569BA,7A05ID4HG29CBJEF3168,GI50BEJ6F82AC91H734D,04BJ5AD786I32C9GHFE1,F79CA5I423EJG1H0D68B,IC7FJ9601HD584B2GEA3,C0GE63F2D419H7A8IBJ5", "t3": "6IA2J095FBGC783H4DE1,EGD1BC720I8396AJF5H4,1AJB0I398D5EC26FH74G,F2B83J5IH147DA90EGC6,BHF382EC5J71694ID0GA,C84576BGDHJ91IAE320F,361EG9I47F0B2C5DJ8AH,8539HF7D4BG0JECI1A62,4DHGCEAB672501J389FI,AF8H2B4E90DG13I576CJ,I72ED40A19BFHJG6C385,0BGC86D1E34A5F27HIJ9,239B0H17DCI6F5E8GJ4A,8A5493GICE61BHDJ0F72,7CDFIBJ692E83G0A415H,HFE31GCB5AJID4807629,D06J5CFHB83G4A129EI7,GI0A61H32794EBF85CJD,9E1DA560FJC287HGI4B3,J875BA1436FDG2E9CIH0,AJC7F9HDI5E30G64281B,F49I3HEG021JA57C6BD8,59IF480JG3AH6DC1B72E,7640ED8FAGH5IJ2B319C,C1G6D728J4F950BEAH3I"};
  var dec = function (s) { return s.split(',').map(function (r) { return r.split('').map(function (c) { return '0123456789ABCDEFGHIJ'.indexOf(c); }); }); };
  var o = {}; Object.keys(raw).forEach(function (k) { o[k] = dec(raw[k]); });
  return o;
})();
CC.purpleParse = function (k) {
  var m = String(k.switches).replace(/\s/g, '').match(/^(\d+)-(\d+),(\d+),(\d+)-([123])([123])$/);
  if (!m) throw new Error('Switch setting in the US codebreakers\' form sixes-twenties,twenties,twenties-fastmiddle, for example 9-1,24,6-23.');
  var v = [m[1], m[2], m[3], m[4]].map(Number);
  if (v.some(function (x) { return x < 1 || x > 25; })) throw new Error('Switch positions are 1 to 25.');
  if (m[5] === m[6]) throw new Error('The fast and middle switches must be different.');
  var A = String(k.alphabet || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (A.length !== 26 || new Set(A.split('')).size !== 26) throw new Error('The plugboard alphabet must hold all 26 letters once; the first six are the "sixes".');
  return { pos: v.map(function (x) { return x - 1; }), fast: +m[5] - 1, middle: +m[6] - 1, slow: 3 - (+m[5] - 1) - (+m[6] - 1), A: A };
};
CC.purpleRun = function (s, k, dir, trace) {
  var P = CC.purpleParse(k), D = CC.purpleData, six = P.pos[0], tw = P.pos.slice(1), T = [D.t1, D.t2, D.t3], A = P.A, out = '';
  var dec = function (tab, p, x) { return tab[p][x]; }, enc = function (tab, p, x) { return tab[p].indexOf(x); };
  var t = String(s).toUpperCase(); t = dir > 0 ? t.replace(/[^A-Z]/g, '') : t.replace(/[^A-Z-]/g, '');
  Array.from(t).forEach(function (c) {
    var st = { six: six, tw: tw.slice() }, o;
    if (c === '-') o = '-';
    else {
      var n = A.indexOf(c);
      if (n < 6) o = A[dir > 0 ? enc(D.sixes, six, n) : dec(D.sixes, six, n)];
      else { var x = n - 6; if (dir > 0) x = enc(T[2], tw[2], enc(T[1], tw[1], enc(T[0], tw[0], x))); else x = dec(T[0], tw[0], dec(T[1], tw[1], dec(T[2], tw[2], x))); o = A[x + 6]; }
    }
    var mid = tw[P.middle], stepped;
    if (six === 23 && mid === 24) { tw[P.slow] = (tw[P.slow] + 1) % 25; stepped = 'slow'; }
    else if (six === 24) { tw[P.middle] = (tw[P.middle] + 1) % 25; stepped = 'middle'; }
    else { tw[P.fast] = (tw[P.fast] + 1) % 25; stepped = 'fast'; }
    six = (six + 1) % 25;
    if (trace) trace.push({ i: c, o: o, six: st.six, tw: st.tw, sixes: c !== '-' && A.indexOf(c) < 6, stepped: stepped });
    out += o;
  });
  return out;
};
CC.reg({ id: 'purple', ch: 15, name: 'PURPLE (Japanese Type B machine)', kind: 'cipher', object: 'purple',
  keys: [{ id: 'switches', label: 'Switches: sixes-twenties-fast/middle (US notation)', type: 'text', def: '9-1,24,6-23' },
         { id: 'alphabet', label: 'Plugboard alphabet (first six letters go to the sixes)', type: 'text', def: 'NOKTYUXEQLHBRMPDICJASVWGZF' }],
  about: 'Japan\'s diplomatic cipher machine from 1939. Instead of rotors it used telephone stepping switches: six letters (the "sixes") went through one switch, the other twenty through a chain of three. American codebreakers led by Frank Rowlett and Genevieve Grotjan rebuilt the machine in 1940 without ever seeing one, and read the message breaking off talks with the United States on 7 December 1941. Wiring from the 2003 paper "PURPLE Revealed".',
  enc: function (s, k) { return CC.purpleRun(s, k, 1); },
  dec: function (s, k) { return CC.purpleRun(s, k, -1); },
  vectors: [{ k: { switches: '9-1,24,6-23', alphabet: 'NOKTYUXEQLHBRMPDICJASVWGZF' }, p: 'FOVTATAKIDASINIMUIMINOMOXIWOIRUBESIFYXXFCKZZR', c: 'ZTXODNWKCCMAVNZXYWEETUQTCIMNVEUVIWBLUAXRRTLVA', src: 'part 1 of the 14-part message of 7 December 1941 (as published in PURPLE Revealed)' }],
  sample: 'Negotiations are broken off'
});

/* =====================================================================
   A5/1 (GSM mobile phones, 1987): three shift registers with majority clocking.
   Following Briceno, Goldberg and Wagner's reference implementation (1999).
   ===================================================================== */
CC.A51 = function (keyBytes, frame) {
  var R = [0, 0, 0], MASK = [0x07FFFF, 0x3FFFFF, 0x7FFFFF], MID = [0x000100, 0x000400, 0x000400], TAP = [0x072000, 0x300000, 0x700080], OUT = [0x040000, 0x200000, 0x400000];
  var par = function (x) { x ^= x >>> 16; x ^= x >>> 8; x ^= x >>> 4; x ^= x >>> 2; x ^= x >>> 1; return x & 1; };
  var one = function (i) { R[i] = ((R[i] << 1) & MASK[i]) | par(R[i] & TAP[i]); };
  var maj = function () { var s = (R[0] & MID[0] ? 1 : 0) + (R[1] & MID[1] ? 1 : 0) + (R[2] & MID[2] ? 1 : 0); return s >= 2 ? 1 : 0; };
  this.R = R; this.MID = MID; this.OUT = OUT;
  this.clock = function () { var m = maj(), moved = []; for (var i = 0; i < 3; i++) if ((R[i] & MID[i] ? 1 : 0) === m) { one(i); moved.push(i); } return moved; };
  this.bit = function () { return par((R[0] & OUT[0]) | (R[1] & OUT[1]) | (R[2] & OUT[2])); };
  for (var i = 0; i < 64; i++) { one(0); one(1); one(2); var kb = (keyBytes[i >> 3] >> (i & 7)) & 1; R[0] ^= kb; R[1] ^= kb; R[2] ^= kb; }
  for (i = 0; i < 22; i++) { one(0); one(1); one(2); var fb = (frame >> i) & 1; R[0] ^= fb; R[1] ^= fb; R[2] ^= fb; }
  for (i = 0; i < 100; i++) this.clock();
};
/* one GSM frame: 114 bits one way (A to B), then 114 bits the other way; bytes are filled from the high bit */
CC.a51Frame = function (keyBytes, frame) {
  var m = new CC.A51(keyBytes, frame), a = [], b = [], i;
  for (i = 0; i < 15; i++) { a.push(0); b.push(0); }
  for (i = 0; i < 114; i++) { m.clock(); a[i >> 3] |= m.bit() << (7 - (i & 7)); }
  for (i = 0; i < 114; i++) { m.clock(); b[i >> 3] |= m.bit() << (7 - (i & 7)); }
  return { a: a, b: b };
};
streamReg({ id: 'a51', name: 'A5/1 (GSM mobile phones)', object: 'a51',
  keys: [{ id: 'key', label: 'Session key (16 hexadecimal digits, 64 bits)', type: 'text', def: '12 23 45 67 89 AB CD EF' },
         { id: 'frame', label: 'Starting frame number (0 to 4194303)', type: 'number', def: 308, min: 0, max: 4194303 }],
  about: 'The cipher that protected billions of GSM mobile calls from 1987. Three shift registers of 19, 22 and 23 bits; at each tick a register moves only if its middle bit agrees with the majority of the three. Its design was secret until it was reverse-engineered in 1999, and by 2009 calls could be decrypted with precomputed tables. Each GSM frame uses 114 bits of key stream; the studio runs on to the next frame for longer messages. The result is shown in hexadecimal.',
  stream: function (k, n) {
    var key = CC.hexKey(k.key, [8], 'The A5/1 key'), f = Math.max(0, Math.min(4194303, +k.frame || 0)), bits = [];
    while (bits.length < n * 8) { var m = new CC.A51(key, f); for (var i = 0; i < 114; i++) { m.clock(); bits.push(m.bit()); } f = (f + 1) % 4194304; }
    var o = []; for (var j = 0; j < n; j++) { var v = 0; for (var b = 0; b < 8; b++) v = (v << 1) | bits[j * 8 + b]; o.push(v); } return o;
  },
  sample: 'Hello, can you hear me?'
});

/* =====================================================================
   RC4 (Ron Rivest, 1987): a 256-byte table shuffled by the key
   ===================================================================== */
CC.RC4 = function (key) {
  var S = [], i, j = 0, t; for (i = 0; i < 256; i++) S.push(i);
  for (i = 0; i < 256; i++) { j = (j + S[i] + key[i % key.length]) & 255; t = S[i]; S[i] = S[j]; S[j] = t; }
  this.S = S; this.i = 0; this.j = 0;
  this.next = function () { this.i = (this.i + 1) & 255; this.j = (this.j + S[this.i]) & 255; t = S[this.i]; S[this.i] = S[this.j]; S[this.j] = t; return S[(S[this.i] + S[this.j]) & 255]; };
};
CC.rc4Key = function (k) { var b = k.form === 'hex' ? CC.fromHex(k.key) : CC.utf8(k.key); if (!b.length || b.length > 256) throw new Error('The key must be 1 to 256 bytes.'); return b; };
streamReg({ id: 'rc4', name: 'RC4 (Wi-Fi, early secure websites)', object: 'rc4',
  keys: [{ id: 'key', label: 'Key', type: 'text', def: 'Secret' }, { id: 'form', label: 'Key is written as', type: 'select', def: 'text', options: [['text', 'text'], ['hex', 'hexadecimal']] }],
  about: 'Ron Rivest\'s 1987 cipher, kept secret until it was posted anonymously in 1994, then used everywhere: WEP Wi-Fi, early secure websites, PDF files. It is tiny: a table of the numbers 0-255 is shuffled by the key, and every byte of key stream comes from two more swaps. Small biases in its first bytes broke WEP in 2001, and RC4 was banned from secure websites in 2015. The result is shown in hexadecimal.',
  stream: function (k, n) { var r = new CC.RC4(CC.rc4Key(k)), o = []; for (var i = 0; i < n; i++) o.push(r.next()); return o; },
  vectors: [{ k: { key: 'Key', form: 'text' }, p: 'Plaintext', c: 'BBF316E8D940AF0AD3', src: 'Wikipedia RC4 test vectors' },
            { k: { key: 'Wiki', form: 'text' }, p: 'pedia', c: '1021BF0420', src: 'Wikipedia RC4 test vectors' },
            { k: { key: 'Secret', form: 'text' }, p: 'Attack at dawn', c: '45A01F645FC35B383552544B9BF5', src: 'Wikipedia RC4 test vectors' }],
  sample: 'Attack at dawn'
});

/* =====================================================================
   Crypto-1 (NXP MIFARE Classic cards): a 48-bit shift register and a two-layer filter.
   As described by Garcia et al., "Dismantling MIFARE Classic" (2008); checked against the Proxmark3 crapto1 library.
   ===================================================================== */
CC.Crypto1 = function (keyBytes) {
  /* the state is kept as its odd- and even-numbered bits, as in the published Crypto-1 descriptions (crapto1) */
  var K = 0n; keyBytes.forEach(function (b) { K = (K << 8n) | BigInt(b); });
  var BIT = function (x, n) { return Number((x >> BigInt(n)) & 1n); };
  var odd = 0, even = 0, self = this;
  for (var i = 47; i > 0; i -= 2) { odd = ((odd << 1) | BIT(K, (i - 1) ^ 7)) >>> 0; even = ((even << 1) | BIT(K, i ^ 7)) >>> 0; }
  var par = function (x) { x ^= x >>> 16; x ^= x >>> 8; x ^= x >>> 4; x ^= x >>> 2; x ^= x >>> 1; return x & 1; };
  CC.crypto1Filter = function (x) {
    var f = (0xf22c0 >>> (x & 0xf)) & 16; f |= (0x6c9c0 >>> ((x >>> 4) & 0xf)) & 8; f |= (0x3c8b0 >>> ((x >>> 8) & 0xf)) & 4;
    f |= (0x1e458 >>> ((x >>> 12) & 0xf)) & 2; f |= (0x0d938 >>> ((x >>> 16) & 0xf)) & 1; return (0xEC57E80A >>> f) & 1;
  };
  this.bit = function (inBit, encrypted) {
    var ret = CC.crypto1Filter(odd), feed = (ret & (encrypted ? 1 : 0)) ^ (inBit ? 1 : 0) ^ (0x29CE5C & odd) ^ (0x870804 & even);
    even = ((even << 1) | par(feed)) >>> 0; var t = odd; odd = even; even = t; return ret;
  };
  this.byte = function (inB) { var r = 0; for (var j = 0; j < 8; j++) r |= self.bit((inB >> j) & 1, 0) << j; return r; };
  this.word = function (w) { for (var j = 0; j < 32; j++) self.bit((w >>> (j ^ 24)) & 1, 0); };
  /* the 48 register bits in shift order (as crapto1's crypto1_get_lfsr reads them) */
  this.lfsr = function () { var o = []; for (var j = 23; j >= 0; j--) { o.push((odd >>> (j ^ 3)) & 1); o.push((even >>> (j ^ 3)) & 1); } return o; };
  this.filterIn = function () { return odd; };
};
/* card authentication start: the card's UID XOR its nonce is shifted in, then every output bit is key stream */
CC.crypto1Setup = function (k) {
  var key = CC.hexKey(k.key, [6], 'The Crypto-1 key'), uid = CC.hexKey(k.uid, [4], 'The card UID'), nt = CC.hexKey(k.nonce, [4], 'The card nonce');
  var c = new CC.Crypto1(key), w = 0; for (var i = 0; i < 4; i++) w = (w * 256) + (uid[i] ^ nt[i]);
  c.word(w >>> 0);
  return c;
};
streamReg({ id: 'crypto1', name: 'Crypto-1 (MIFARE Classic cards)', object: 'crypto1',
  keys: [{ id: 'key', label: 'Card sector key (12 hexadecimal digits, 48 bits)', type: 'text', def: 'A0A1A2A3A4A5' },
         { id: 'uid', label: 'Card UID (8 hexadecimal digits)', type: 'text', def: 'CDEF0123' },
         { id: 'nonce', label: 'Card nonce (8 hexadecimal digits)', type: 'text', def: '01200145' }],
  about: 'The secret cipher inside MIFARE Classic contactless cards, used for transport tickets such as the London Oyster card, building passes and stadium tickets. A 48-bit shift register feeds 20 of its bits through two layers of small filter functions to make one key stream bit per tick. Researchers in Germany and the Netherlands rebuilt it from the chip in 2007-2008 and showed a card key can be found in seconds. Here the card\'s ID and nonce are shifted in first, as when a card is read; the result is shown in hexadecimal.',
  stream: function (k, n) { var c = CC.crypto1Setup(k), o = []; for (var j = 0; j < n; j++) o.push(c.byte(0)); return o; },
  sample: 'Door 4 open'
});

/* =====================================================================
   Salsa20/20 (Daniel J. Bernstein, 2005; eSTREAM portfolio)
   ===================================================================== */
CC.salsaBlock = function (key, nonce, counter, trace) {
  var u32 = function (b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; };
  var c = key.length === 32 ? 'expand 32-byte k' : 'expand 16-byte k', C = CC.utf8(c), k2 = key.length === 32 ? key.slice(16) : key;
  var x = [u32(C, 0), u32(key, 0), u32(key, 4), u32(key, 8), u32(key, 12), u32(C, 4), u32(nonce, 0), u32(nonce, 4),
    counter >>> 0, Math.floor(counter / 4294967296) >>> 0, u32(C, 8), u32(k2, 0), u32(k2, 4), u32(k2, 8), u32(k2, 12), u32(C, 12)];
  var z = x.slice(), R = function (a, b) { return ((a << b) | (a >>> (32 - b))) >>> 0; };
  var qr = function (a, b, cc, d) { z[b] ^= R((z[a] + z[d]) >>> 0, 7); z[cc] ^= R((z[b] + z[a]) >>> 0, 9); z[d] ^= R((z[cc] + z[b]) >>> 0, 13); z[a] ^= R((z[d] + z[cc]) >>> 0, 18); };
  if (trace) trace.push({ r: 0, z: z.slice() });
  for (var r = 0; r < 20; r += 2) {
    qr(0, 4, 8, 12); qr(5, 9, 13, 1); qr(10, 14, 2, 6); qr(15, 3, 7, 11); if (trace) trace.push({ r: r + 1, kind: 'columns', z: z.slice() });
    qr(0, 1, 2, 3); qr(5, 6, 7, 4); qr(10, 11, 8, 9); qr(15, 12, 13, 14); if (trace) trace.push({ r: r + 2, kind: 'rows', z: z.slice() });
  }
  var out = []; for (var i = 0; i < 16; i++) { var v = (z[i] + x[i]) >>> 0; out.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24); }
  if (trace) trace.push({ r: 21, z: z.map(function (v, i) { return (v + x[i]) >>> 0; }), start: x });
  return out;
};
streamReg({ id: 'salsa20', name: 'Salsa20 (ancestor of ChaCha20)', object: 'salsa',
  keys: [{ id: 'key', label: 'Key (32 or 64 hexadecimal digits)', type: 'text', def: '80000000000000000000000000000000' },
         { id: 'nonce', label: 'Nonce (16 hexadecimal digits, never reuse with the same key)', type: 'text', def: '0000000000000000' }],
  about: 'Daniel J. Bernstein\'s 2005 cipher and a winner of the European eSTREAM competition. It needs only three operations - add, rotate and exclusive-or - on a 4 x 4 grid of 32-bit numbers, mixed for 20 rounds, alternately down the columns and along the rows. Its close relative ChaCha20 now protects much of the internet (HTTPS, WhatsApp, VPNs). It is still unbroken. The result is shown in hexadecimal.',
  stream: function (k, n) { var key = CC.hexKey(k.key, [16, 32], 'The Salsa20 key'), nonce = CC.hexKey(k.nonce, [8], 'The nonce'), o = []; for (var c = 0; o.length < n; c++) o = o.concat(CC.salsaBlock(key, nonce, c)); return o.slice(0, n); },
  sample: 'The quick brown fox'
});

/* =====================================================================
   Trivium (De Canniere and Preneel, 2005; eSTREAM portfolio): 288 bits in three shift registers
   ===================================================================== */
CC.Trivium = function (key, iv) {
  var s = new Uint8Array(289), i;
  /* eSTREAM byte and bit order: the last byte's high bit is loaded first */
  for (i = 0; i < 80; i++) s[1 + i] = (key[9 - (i >> 3)] >> (7 - (i & 7))) & 1;
  for (i = 0; i < 80; i++) s[94 + i] = (iv[9 - (i >> 3)] >> (7 - (i & 7))) & 1;
  s[286] = s[287] = s[288] = 1;
  this.s = s;
  this.clock = function () {
    var t1 = s[66] ^ s[93], t2 = s[162] ^ s[177], t3 = s[243] ^ s[288], z = t1 ^ t2 ^ t3;
    t1 ^= (s[91] & s[92]) ^ s[171]; t2 ^= (s[175] & s[176]) ^ s[264]; t3 ^= (s[286] & s[287]) ^ s[69];
    for (var j = 93; j > 1; j--) s[j] = s[j - 1]; s[1] = t3;
    for (j = 177; j > 94; j--) s[j] = s[j - 1]; s[94] = t1;
    for (j = 288; j > 178; j--) s[j] = s[j - 1]; s[178] = t2;
    return z;
  };
  for (i = 0; i < 4 * 288; i++) this.clock();
};
streamReg({ id: 'trivium', name: 'Trivium', object: 'trivium',
  keys: [{ id: 'key', label: 'Key (20 hexadecimal digits, 80 bits)', type: 'text', def: '80000000000000000000' },
         { id: 'iv', label: 'IV (20 hexadecimal digits)', type: 'text', def: '00000000000000000000' }],
  about: 'Christophe De Canniere and Bart Preneel\'s 2005 cipher, an eSTREAM winner for hardware: 288 bits in three shift registers (93, 84 and 111 bits) joined in a ring, with only a few exclusive-or and AND gates. Before use it is stirred for 1,152 ticks; after that each tick gives one bit of key stream. It is designed to fit in a tiny chip and is still unbroken. The result is shown in hexadecimal.',
  stream: function (k, n) { var t = new CC.Trivium(CC.hexKey(k.key, [10], 'The Trivium key'), CC.hexKey(k.iv, [10], 'The IV')), o = []; for (var j = 0; j < n; j++) { var v = 0; for (var b = 0; b < 8; b++) v |= t.clock() << b; o.push(v); } return o; },
  sample: 'Light and small'
});

/* =====================================================================
   extra checks run by the Self-test page and test/vectors.js
   ===================================================================== */
CC.extraChecks = [
  { name: 'A5/1: the Briceno-Goldberg-Wagner reference frame (key 1223456789ABCDEF, frame 0x134), both directions', fn: function () { var f = CC.a51Frame([0x12, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF], 0x134); return CC.toHex(f.a) === '534EAA582FE8151AB6E1855A728C00' && CC.toHex(f.b) === '24FD35A35D5FB6526D32F906DF1AC0'; } },
  { name: 'Salsa20: eSTREAM test vector (set 1, vector 0), first 32 bytes of key stream', fn: function () { return CC.toHex(CC.byId.salsa20.stream({ key: '80000000000000000000000000000000', nonce: '0000000000000000' }, 32)) === '4DFA5E481DA23EA09A31022050859936DA52FCEE218005164F267CB65F5CFD7F'; } },
  { name: 'Trivium: eSTREAM test vectors (set 1 vector 0 and set 6 vector 3), first 16 bytes', fn: function () { return CC.toHex(CC.byId.trivium.stream({ key: '80000000000000000000', iv: '00000000000000000000' }, 16)) === '38EB86FF730D7A9CAF8DF13A4420540D' && CC.toHex(CC.byId.trivium.stream({ key: '0F62B5085BAE0154A7FA', iv: '288FF65DC42B92F960C7' }, 16)) === 'A4386C6D7624983FEA8DBE7314E5FE1F'; } },
  { name: 'Crypto-1: key stream agrees with the Proxmark3 crapto1 library (key FFFFFFFFFFFF; and a card read with key A0A1A2A3A4A5)', fn: function () { var c = new CC.Crypto1([255, 255, 255, 255, 255, 255]), o = []; for (var i = 0; i < 8; i++) o.push(c.byte(0)); return CC.toHex(o) === 'FF3FE936DBD948EB' && CC.toHex(CC.byId.crypto1.stream({ key: 'A0A1A2A3A4A5', uid: 'CDEF0123', nonce: '01200145' }, 16)) === '13F44042EF34C7A4BDEC88C6758DE0BC'; } },
  { name: 'VIC: key lines A to S reproduce the published example (phrase TWASTHENIG HTBEFORECH, date 1391959, keygroup 72401, personal number 6)', fn: function () {
      var L = CC.vicKeys({ phrase: 'TWAS THE NIGHT BEFORE CHRISTMAS', date: '1391959', personal: 6, keygroup: '72401' }), j = function (x) { return L[x].join(''); };
      return j('C') === '69592' && j('E1') === '8017942653' && j('E2') === '6013589427' && j('F1') === '6959254417' && j('G') === '4966196060' && j('H') === '3288628787' && j('J') === '3178429506' && j('K') === '5064805552' && j('L') === '5602850077' && j('M') === '1620350748' && j('N') === '7823857125' && j('P') === '5051328370' && j('Q') === '0668005552551' && j('R') === '758838' && j('S') === '5961328470' && L.a === 13 && L.b === 6; } },
  { name: 'SIGABA: every letter steps one to four cipher rotors, and the same settings decipher', fn: function () { var k = {}; CC.byId.sigaba.keys.forEach(function (x) { k[x.id] = x.def; }); var tr = [], c = CC.sigabaRun('ATTACK AT DAWN ON THE NORTHERN FLANK WITH ALL ARMOUR', k, 1, tr); var ok = tr.every(function (t) { return t.st.step.length >= 1 && t.st.step.length <= 4; }); return ok && CC.sigabaRun(c, k, -1) === 'ATTACK AT DAWN ON THE NORTHERN FLANK WITH ALL ARMOUR'; } },
  { name: 'Diffie-Hellman: both sides reach the same secret with the 521-bit prime 2^521 - 1', fn: function () { var p = (1n << 521n) - 1n, a = 123456789123456789n, b = 987654321987654321n, g = 3n; return CC.modPow(CC.modPow(g, a, p), b, p) === CC.modPow(CC.modPow(g, b, p), a, p); } }
];

/* =====================================================================
   groups for the new entries
   ===================================================================== */
var gm = CC.groupMode;
CC.groupMode = function (d, k) {
  var m = { affine: 'upper', dh: 'A key exchange result is not put into groups.', checkerboard: 'digits', vic: 'digits', sigaba: 'upper', purple: 'upper',
    a51: 'case', rc4: 'case', crypto1: 'case', salsa20: 'case', trivium: 'case' }[d.id];
  return m || gm(d, k);
};

if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
