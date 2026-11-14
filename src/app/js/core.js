/* Codes & Ciphers Studio engine - by Larry Dalton
   core: helpers, registry, Chapter 1 (communication codes), Chapter 2 (Caesar family), Chapter 3 (substitution) */
(function (G) {
'use strict';
var CC = G.CC = G.CC || {};
CC.version = '1.1.0';
CC.list = [];
CC.byId = {};
CC.chapters = {
  1: 'Codes used for communication', 2: 'Caesar ciphers', 3: 'Simple substitution', 4: 'Transposition',
  5: 'Fractionation', 6: 'Polygraphic substitution', 7: 'Polyalphabetic ciphers', 8: 'Enigma',
  9: 'Perfect ciphers and Lorenz', 10: 'Codewords', 11: 'Book ciphers', 12: 'Computer cryptography',
  13: 'Steganography and hidden messages'
};
CC.reg = function (d) {
  d.keys = d.keys || [];
  if (CC.byId[d.id]) throw new Error('duplicate ' + d.id);
  CC.list.push(d); CC.byId[d.id] = d; return d;
};

/* ---------- helpers ---------- */
var AZ = CC.AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var mod = CC.mod = function (a, n) { return ((a % n) + n) % n; };
CC.letters = function (s) { return String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z]/g, ''); };
CC.group = function (s, n) { n = n || 5; var o = []; for (var i = 0; i < s.length; i += n) o.push(s.slice(i, i + n)); return o.join(' '); };
CC.dedupe = function (s) { var o = ''; for (var i = 0; i < s.length; i++) if (o.indexOf(s[i]) < 0) o += s[i]; return o; };
/* keyed alphabet: keyword letters (no repeats) then the rest of the alphabet */
CC.keyAlpha = function (key, alpha, merge) {
  alpha = alpha || AZ; var k = String(key || '').toUpperCase();
  if (merge) k = k.split(merge[1]).join(merge[0]);
  var s = ''; for (var i = 0; i < k.length; i++) if (alpha.indexOf(k[i]) >= 0 && s.indexOf(k[i]) < 0) s += k[i];
  for (i = 0; i < alpha.length; i++) if (s.indexOf(alpha[i]) < 0) s += alpha[i];
  return s;
};
/* order of key letters, ties left to right: 'ZEBRAS' -> [5,2,1,4,0,3] (rank of each column) */
CC.keyOrder = function (key) {
  var k = String(key).toUpperCase().split(''), idx = k.map(function (c, i) { return i; });
  idx.sort(function (a, b) { return k[a] < k[b] ? -1 : k[a] > k[b] ? 1 : a - b; });
  var rank = []; idx.forEach(function (c, r) { rank[c] = r; }); return rank;
};
/* apply a letter map to text, keeping case and anything that is not a letter */
CC.mapText = function (s, fn) {
  return String(s).replace(/[A-Za-z]/g, function (ch) {
    var up = ch.toUpperCase(), o = fn(up, AZ.indexOf(up));
    return ch === up ? o : o.toLowerCase();
  });
};
CC.rand = function (n) {
  var c = G.crypto || (typeof require === 'function' ? require('crypto').webcrypto : null);
  var a = new Uint32Array(1); c.getRandomValues(a); return a[0] % n;
};
CC.randLetters = function (n) { var s = ''; for (var i = 0; i < n; i++) s += AZ[CC.rand(26)]; return s; };
/* seeded generator so "random" fillers in examples are repeatable */
CC.seeded = function (seed) { var x = seed >>> 0 || 1; return function (n) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x % n; }; };
CC.fill = function (n, opt) { var r = opt && opt.seed ? CC.seeded(opt.seed) : CC.rand, s = ''; for (var i = 0; i < n; i++) s += opt && opt.pad ? opt.pad : AZ[r(26)]; return s; };

/* =====================================================================
   Chapter 1 - codes used for communication
   ===================================================================== */
/* International Code of Signals flags: drawn by the UI from this description */
CC.flags = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett',
  K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
  U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu'
};
CC.reg({ id: 'flags', ch: 1, name: 'Signal flags (International Code of Signals)', kind: 'code', object: 'flags',
  about: 'Each letter has its own flag and digits have numeral pennants. Ships hoist them on a halyard, read from the top down.',
  enc: function (s) { return String(s).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split('').map(function (c) { return c === ' ' ? '/' : (CC.flags[c] || 'Pennant ' + c); }).join(' '); },
  dec: function (s) { return String(s).split(/\s+/).map(function (w) { if (w === '/') return ' '; var m = /^Pennant$/i.test(w) ? '' : null; for (var k in CC.flags) if (CC.flags[k].toUpperCase() === w.toUpperCase()) return k; return /^\d$/.test(w) ? w : ''; }).join(''); },
  sample: 'ENGLAND EXPECTS'
});

/* semaphore: arm directions seen by the observer, 0=down 1=down-left 2=left 3=up-left 4=up 5=up-right 6=right 7=down-right */
CC.semaphore = {
  A: [1, 0], B: [2, 0], C: [3, 0], D: [4, 0], E: [0, 5], F: [0, 6], G: [0, 7], H: [2, 1], I: [3, 1], J: [4, 6], K: [1, 4], L: [1, 5],
  M: [1, 6], N: [1, 7], O: [2, 3], P: [2, 4], Q: [2, 5], R: [2, 6], S: [2, 7], T: [3, 4], U: [3, 5], V: [4, 7], W: [5, 6], X: [5, 7],
  Y: [3, 6], Z: [7, 6], '#': [4, 5], ' ': [0, 0]
};
CC.semaDigits = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'H', 9: 'I', 0: 'K' };
CC.reg({ id: 'semaphore', ch: 1, name: 'Semaphore', kind: 'code', object: 'semaphore',
  about: 'Two flags held at one of eight angles. Digits use the numeral sign followed by A-I and K.',
  enc: function (s) {
    var o = [], num = false;
    String(s).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split('').forEach(function (c) {
      if (/\d/.test(c)) { if (!num) { o.push('#'); num = true; } c = CC.semaDigits[c]; }
      else if (num && c !== ' ') { o.push('J'); num = false; }
      var p = CC.semaphore[c]; o.push(c === ' ' ? '_' : c + '(' + p[0] + p[1] + ')');
    });
    return o.join(' ');
  },
  dec: function (s) {
    var out = '', num = false, inv = {};
    Object.keys(CC.semaphore).forEach(function (k) { var p = CC.semaphore[k]; inv[p[0] + '' + p[1]] = k; inv[p[1] + '' + p[0]] = k; });
    String(s).split(/\s+/).forEach(function (t) {
      if (!t) return; if (t === '_') { out += ' '; return; }
      var m = /\((\d)(\d)\)/.exec(t), c = m ? inv[m[1] + m[2]] : t[0];
      if (c === '#') { num = true; return; }
      if (num && c === 'J') { num = false; return; }
      if (num) { for (var d in CC.semaDigits) if (CC.semaDigits[d] === c) { out += d; return; } }
      out += c;
    });
    return out;
  },
  sample: 'SEND 4 BOATS'
});

/* Polybius square (I/J share a cell) */
CC.square = function (key, size) {
  if (size === 6) return CC.keyAlpha(key, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  return CC.keyAlpha(key, 'ABCDEFGHIKLMNOPQRSTUVWXYZ', 'IJ');
};
CC.reg({ id: 'polybius', ch: 1, name: 'Polybius square', kind: 'code', object: 'polybius',
  keys: [{ id: 'key', label: 'Keyword (optional)', type: 'text', def: '' }, { id: 'size', label: 'Square', type: 'select', def: '5', options: [['5', '5 x 5 (I = J)'], ['6', '6 x 6 (letters and digits)']] }],
  about: 'Each letter becomes its row and column number.',
  enc: function (s, k) {
    var n = +k.size || 5, sq = CC.square(k.key, n), t = String(s).toUpperCase();
    if (n === 5) t = t.replace(/J/g, 'I');
    return t.split('').filter(function (c) { return sq.indexOf(c) >= 0 || c === ' '; }).map(function (c) {
      if (c === ' ') return '/'; var i = sq.indexOf(c); return '' + (Math.floor(i / n) + 1) + (i % n + 1);
    }).join(' ');
  },
  dec: function (s, k) {
    var n = +k.size || 5, sq = CC.square(k.key, n);
    var t = String(s); if (t.indexOf('/') < 0) t = t.replace(/\D/g, '');   /* grouped digits: read straight through in pairs */
    return (t.match(/\d\d|\//g) || []).map(function (p) { return p === '/' ? ' ' : sq[(p[0] - 1) * n + (p[1] - 1)] || '?'; }).join('');
  },
  vectors: [{ k: {}, p: 'HELLO', c: '23 15 31 31 34' }],
  sample: 'ATTACK AT DAWN'
});

/* prisoners' tap code: 5x5 with K written as C */
CC.tapSquare = 'ABCDEFGHIJLMNOPQRSTUVWXYZ';
CC.reg({ id: 'tapcode', ch: 1, name: 'Tap code (knock code)', kind: 'code', object: 'tap',
  about: 'A Polybius square tapped out: row taps, a pause, column taps. K is sent as C.',
  enc: function (s) {
    return String(s).toUpperCase().replace(/K/g, 'C').split('').filter(function (c) { return CC.tapSquare.indexOf(c) >= 0 || c === ' '; }).map(function (c) {
      if (c === ' ') return '/'; var i = CC.tapSquare.indexOf(c); return Array(Math.floor(i / 5) + 2).join('.') + ' ' + Array(i % 5 + 2).join('.');
    }).join('   ');
  },
  dec: function (s) {
    return String(s).trim().split(/\s{3,}|\s*\|\s*/).map(function (g) {
      if (g.trim() === '/') return ' '; var p = g.trim().split(/\s+/); if (p.length < 2) return '';
      return CC.tapSquare[(p[0].length - 1) * 5 + (p[1].length - 1)] || '?';
    }).join('');
  },
  vectors: [{ k: {}, p: 'WATER', c: '..... ..   . .   .... ....   . .....   .... ..' }],
  sample: 'HELLO FRIEND'
});

/* Chappe optical telegraph: regulator horizontal or vertical, each indicator in one of 7 visible positions.
   Chappe's real system sent numbers that pointed into a codebook (92 x 92 pages and lines). Here letters,
   digits and space are given positions in order so the mechanism can be watched; that table is ours, not Chappe's. */
CC.chappeSigns = (function () {
  var t = [], r, a, b;
  for (r = 0; r < 2; r++) for (a = 0; a < 7; a++) for (b = 0; b < 7; b++) t.push([r, a, b]);
  return t; /* 98 positions */
})();
CC.chappeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
CC.chappeIndex = function (c) { var i = CC.chappeChars.indexOf(c); return i < 0 ? -1 : i * 2 + 1; }; /* spread out so arms move visibly */
CC.reg({ id: 'chappe', ch: 1, name: 'Chappe optical telegraph', kind: 'code', object: 'chappe',
  about: 'A beam (regulator) and two arms (indicators) on a mast. 2 x 7 x 7 = 98 positions. Chappe used them as numbers into a codebook; this studio gives each letter a position of its own so you can watch the arms move.',
  enc: function (s) { return String(s).toUpperCase().split('').map(function (c) { var i = CC.chappeIndex(c); if (i < 0) return ''; var p = CC.chappeSigns[i]; return (p[0] ? 'V' : 'H') + p[1] + p[2]; }).filter(Boolean).join(' '); },
  dec: function (s) { return String(s).toUpperCase().split(/\s+/).map(function (t) { var m = /^([HV])(\d)(\d)$/.exec(t); if (!m) return ''; var i = (m[1] === 'V' ? 49 : 0) + m[2] * 7 + +m[3]; var j = (i - 1) / 2; return CC.chappeChars[j] || '?'; }).join(''); },
  sample: 'PARIS 1794'
});

/* Cooke and Wheatstone five-needle telegraph: two needles point at a letter on a diamond board (20 letters) */
CC.cwLetters = (function () {
  var up = ['A', 'BD', 'EFG', 'HIKL'], dn = ['MNOP', 'RST', 'VW', 'Y'], m = {};
  /* upper half: needles i<j, distance h=j-i, letter sits above the middle */
  for (var h = 4; h >= 1; h--) { var row = up[4 - h]; for (var i = 0; i + h <= 4; i++) m[row[i]] = [i, i + h, 1]; }
  for (h = 1; h <= 4; h++) { row = dn[h - 1]; for (i = 0; i + h <= 4; i++) m[row[i]] = [i, i + h, -1]; }
  return m;
})();
CC.cwSub = { C: 'K', J: 'G', Q: 'K', U: 'V', X: 'S', Z: 'S' };
CC.reg({ id: 'cooke', ch: 1, name: 'Cooke and Wheatstone five-needle telegraph', kind: 'code', object: 'cooke',
  about: 'Two of five needles swing so that they point at one letter on a diamond board. Only 20 letters fit, so C, J, Q, U, X and Z were spelled with others.',
  enc: function (s) { return String(s).toUpperCase().replace(/[^A-Z ]/g, '').split('').map(function (c) { if (c === ' ') return '/'; c = CC.cwSub[c] || c; var p = CC.cwLetters[c]; return c + ':' + (p[0] + 1) + (p[1] + 1) + (p[2] > 0 ? '+' : '-'); }).join(' '); },
  dec: function (s) { return String(s).split(/\s+/).map(function (t) { if (t === '/') return ' '; var m = /(\d)(\d)([+-])/.exec(t); if (!m) return ''; for (var c in CC.cwLetters) { var p = CC.cwLetters[c]; if (p[0] === m[1] - 1 && p[1] === m[2] - 1 && (p[2] > 0) === (m[3] === '+')) return c; } return '?'; }).join(''); },
  sample: 'TRAIN LATE'
});

/* International Morse */
CC.morse = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '"': '.-..-.', '@': '.--.-.'
};
CC.reg({ id: 'morse', ch: 1, name: 'International Morse code', kind: 'code', object: 'morse',
  about: 'Dots and dashes; a dash is three dots long, letters are separated by three units and words by seven.',
  enc: function (s) { return String(s).toUpperCase().split(' ').map(function (w) { return w.split('').map(function (c) { return CC.morse[c] || ''; }).filter(Boolean).join(' '); }).filter(Boolean).join(' / '); },
  dec: function (s) { var inv = {}; for (var k in CC.morse) inv[CC.morse[k]] = k; return String(s).replace(/[•·]/g, '.').replace(/[–—_]/g, '-').trim().split(/\s*\/\s*|\s{3,}/).map(function (w) { return w.split(/\s+/).map(function (c) { return inv[c] || (c ? '?' : ''); }).join(''); }).join(' '); },
  vectors: [{ k: {}, p: 'SOS', c: '... --- ...' }],
  sample: 'WHAT HATH GOD WROUGHT'
});

/* Baudot code from the 1888 US patent (columns 1-5, + = 1). Transcribed from the patent table. */
CC.baudot = { A: '10000', B: '00110', C: '10110', D: '11110', 'É': '01000', E: '11000', F: '01110', G: '01010', H: '11010', I: '01100',
  J: '10010', K: '10011', L: '11011', M: '01011', N: '01111', O: '11100', P: '11111', Q: '10111', R: '00111', S: '00101', T: '10101',
  U: '10100', V: '11101', W: '01101', X: '01001', Y: '00100', Z: '11001' };
CC.reg({ id: 'baudot', ch: 1, name: 'Baudot code (1888 patent)', kind: 'code', object: 'tape',
  about: 'Five on/off signals per letter, keyed on Baudot\'s five-key keyboard.',
  enc: function (s) { return String(s).toUpperCase().split('').map(function (c) { return CC.baudot[c] || ''; }).filter(Boolean).join(' '); },
  dec: function (s) { var inv = {}; for (var k in CC.baudot) inv[CC.baudot[k]] = k; return (String(s).replace(/[^01]/g, '').match(/[01]{5}/g) || []).map(function (b) { return inv[b] || '?'; }).join(''); },
  vectors: [{ k: {}, p: 'BAUDOT', c: '00110 10000 10100 11110 11100 10101' }],
  sample: 'BAUDOT'
});

/* ITA2 (Murray / International Telegraph Alphabet No. 2), bits 1..5 */
CC.ita2L = { '00000': '', '00100': ' ', '10111': 'Q', '10011': 'W', '00001': 'E', '01010': 'R', '10000': 'T', '10101': 'Y', '00111': 'U', '00110': 'I',
  '11000': 'O', '10110': 'P', '00011': 'A', '00101': 'S', '01001': 'D', '01101': 'F', '11010': 'G', '10100': 'H', '01011': 'J', '01111': 'K',
  '10010': 'L', '10001': 'Z', '11101': 'X', '01110': 'C', '11110': 'V', '11001': 'B', '01100': 'N', '11100': 'M', '01000': '\r', '00010': '\n' };
CC.ita2F = { '10111': '1', '10011': '2', '00001': '3', '01010': '4', '10000': '5', '10101': '6', '00111': '7', '00110': '8', '11000': '9', '10110': '0',
  '00011': '-', '00101': "'", '01001': '\u0005', '01011': '\u0007', '01111': '(', '10010': ')', '10001': '+', '11101': '/', '01110': ':', '11110': '=',
  '11001': '?', '01100': ',', '11100': '.', '00100': ' ', '01000': '\r', '00010': '\n' };
/* the two tables above were typed bit 5 first; turn them round so every code reads bit 1 to bit 5 (A = 11000) */
(function () { ['ita2L', 'ita2F'].forEach(function (t) { var o = {}; for (var b in CC[t]) o[b.split('').reverse().join('')] = CC[t][b]; CC[t] = o; }); })();
CC.ITA2_FIGS = '11011'; CC.ITA2_LTRS = '11111';
CC.ita2Encode = function (s) {
  var out = [], fig = false, invL = {}, invF = {};
  for (var b in CC.ita2L) if (CC.ita2L[b]) invL[CC.ita2L[b]] = b;
  for (b in CC.ita2F) if (!/[\u0005\u0007]/.test(CC.ita2F[b])) invF[CC.ita2F[b]] = b;
  String(s).toUpperCase().split('').forEach(function (c) {
    if (c === ' ' || c === '\n' || c === '\r') { out.push(invL[c]); return; }
    if (invL[c]) { if (fig) { out.push(CC.ITA2_LTRS); fig = false; } out.push(invL[c]); }
    else if (invF[c]) { if (!fig) { out.push(CC.ITA2_FIGS); fig = true; } out.push(invF[c]); }
  });
  return out;
};
CC.ita2Decode = function (codes) {
  var fig = false, o = '';
  codes.forEach(function (b) { if (b === CC.ITA2_FIGS) fig = true; else if (b === CC.ITA2_LTRS) fig = false; else o += (fig ? CC.ita2F[b] : CC.ita2L[b]) || ''; });
  return o;
};
CC.reg({ id: 'ita2', ch: 1, name: 'Murray code / ITA2', kind: 'code', object: 'tape',
  about: 'The teleprinter code: five holes across a paper tape, with LTRS and FIGS shifts for letters and figures.',
  enc: function (s) { return CC.ita2Encode(s).join(' '); },
  dec: function (s) { return CC.ita2Decode(String(s).replace(/[^01]/g, '').match(/[01]{5}/g) || []); },
  vectors: [{ k: {}, p: 'RY', c: '01010 10101' }, { k: {}, p: 'AE', c: '11000 10000' }],
  sample: 'THE QUICK BROWN FOX 1234'
});

CC.reg({ id: 'ascii', ch: 1, name: 'ASCII and computer codes', kind: 'code', object: 'bits',
  keys: [{ id: 'fmt', label: 'Show as', type: 'select', def: 'bin', options: [['bin', 'Binary (8 bits)'], ['hex', 'Hexadecimal'], ['dec', 'Decimal'], ['b64', 'Base64 (UTF-8)']] }],
  about: 'Every character as a number. Characters beyond ASCII are stored as UTF-8 bytes.',
  enc: function (s, k) {
    var b = Array.prototype.slice.call(new TextEncoder().encode(String(s)));
    if (k.fmt === 'b64') return CC.b64(b);
    return b.map(function (x) { return k.fmt === 'hex' ? ('0' + x.toString(16).toUpperCase()).slice(-2) : k.fmt === 'dec' ? String(x) : ('0000000' + x.toString(2)).slice(-8); }).join(' ');
  },
  dec: function (s, k) {
    var b;
    if (k.fmt === 'b64') b = CC.unb64(String(s));
    else if (k.fmt === 'hex') b = (String(s).replace(/[^0-9A-Fa-f]/g, '').match(/../g) || []).map(function (t) { return parseInt(t, 16); });
    else if (k.fmt === 'dec') b = String(s).trim().split(/[\s,]+/).filter(Boolean).map(function (t) { return parseInt(t, 10); });
    else b = (String(s).replace(/[^01]/g, '').match(/[01]{8}/g) || []).map(function (t) { return parseInt(t, 2); });
    return new TextDecoder().decode(new Uint8Array(b));
  },
  vectors: [{ k: { fmt: 'hex' }, p: 'Hi!', c: '48 69 21' }, { k: { fmt: 'b64' }, p: 'Man', c: 'TWFu' }],
  sample: 'Hello, world'
});
var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
CC.b64 = function (b) { var o = ''; for (var i = 0; i < b.length; i += 3) { var n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0); o += B64[n >> 18 & 63] + B64[n >> 12 & 63] + (i + 1 < b.length ? B64[n >> 6 & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '='); } return o; };
CC.unb64 = function (s) { s = s.replace(/[^A-Za-z0-9+/]/g, ''); var o = [], bits = 0, v = 0; for (var i = 0; i < s.length; i++) { v = (v << 6) | B64.indexOf(s[i]); bits += 6; if (bits >= 8) { bits -= 8; o.push((v >> bits) & 255); } } return o; };

/* =====================================================================
   Chapter 2 - Caesar family
   ===================================================================== */
CC.shift = function (s, n) { return CC.mapText(s, function (c, i) { return AZ[mod(i + n, 26)]; }); };
CC.reg({ id: 'caesar', ch: 2, name: 'Caesar cipher', kind: 'cipher', object: 'wheel',
  keys: [{ id: 'shift', label: 'Shift', type: 'number', def: 3, min: 0, max: 25 }],
  about: 'Each letter moves a fixed number of places along the alphabet. Turn the inner wheel to set the shift.',
  enc: function (s, k) { return CC.shift(s, +k.shift || 0); },
  dec: function (s, k) { return CC.shift(s, -(+k.shift || 0)); },
  vectors: [{ k: { shift: 3 }, p: 'VENI VIDI VICI', c: 'YHQL YLGL YLFL' }],
  sample: 'Be ready at midnight'
});
CC.reg({ id: 'rot13', ch: 2, name: 'ROT13', kind: 'cipher', object: 'wheel', fixedShift: 13,
  about: 'Caesar with a shift of 13: doing it twice gives the original back.',
  enc: function (s) { return CC.shift(s, 13); }, dec: function (s) { return CC.shift(s, 13); },
  vectors: [{ k: {}, p: 'Hello', c: 'Uryyb' }], sample: 'Why did the chicken cross the road?'
});
CC.rotDigits = function (s, n) { return String(s).replace(/[0-9]/g, function (d) { return String(mod(+d + n, 10)); }); };
CC.reg({ id: 'rot5', ch: 2, name: 'ROT5 (digits)', kind: 'cipher', object: 'wheel', ring: '0123456789', fixedShift: 5,
  about: 'Digits move five places: 0 becomes 5, 7 becomes 2.',
  enc: function (s) { return CC.rotDigits(s, 5); }, dec: function (s) { return CC.rotDigits(s, 5); },
  vectors: [{ k: {}, p: '0123456789', c: '5678901234' }], sample: 'Meet at 0745 on platform 9'
});
CC.reg({ id: 'rot18', ch: 2, name: 'ROT18 (ROT13 + ROT5)', kind: 'cipher', object: 'wheel', fixedShift: 13,
  about: 'Letters by ROT13 and digits by ROT5.',
  enc: function (s) { return CC.rotDigits(CC.shift(s, 13), 5); }, dec: function (s) { return CC.rotDigits(CC.shift(s, 13), 5); },
  vectors: [{ k: {}, p: 'Room 101', c: 'Ebbz 656' }], sample: 'Room 101 at 9pm'
});
CC.reg({ id: 'rot47', ch: 2, name: 'ROT47', kind: 'cipher', object: 'wheel', ring: (function () { var s = ''; for (var i = 33; i < 127; i++) s += String.fromCharCode(i); return s; })(), fixedShift: 47,
  about: 'All 94 printable ASCII characters from ! to ~ move 47 places.',
  enc: function (s) { return String(s).replace(/[!-~]/g, function (c) { return String.fromCharCode(33 + mod(c.charCodeAt(0) - 33 + 47, 94)); }); },
  dec: function (s) { return CC.byId.rot47.enc(s); },
  vectors: [{ k: {}, p: 'Hello, World!', c: 'w6==@[ (@C=5P' }], sample: 'The password is "swordfish" (42)'
});
/* Hebrew-alphabet ciphers from the Kabbalah, shown on the Latin alphabet:
   Avgad = shift of one; Albam = swap the two halves (shift of 13 on 26 letters). */
CC.hebrew = 'אבגדהוזחטיכלמנסעפצקרשת';
CC.hebShift = function (s, n) { return String(s).replace(/[א-ת]/g, function (c) { var f = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }[c] || c; var i = CC.hebrew.indexOf(f); return i < 0 ? c : CC.hebrew[mod(i + n, 22)]; }); };
CC.reg({ id: 'avgad', ch: 2, name: 'Avgad', kind: 'cipher', object: 'wheel', fixedShift: 1,
  keys: [{ id: 'alpha', label: 'Alphabet', type: 'select', def: 'heb', options: [['heb', 'Hebrew (22 letters)'], ['lat', 'Latin (26 letters)']] }],
  about: 'An ancient Hebrew cipher: every letter is replaced by the next one (aleph to bet, bet to gimel...).',
  enc: function (s, k) { return k.alpha === 'lat' ? CC.shift(s, 1) : CC.hebShift(s, 1); },
  dec: function (s, k) { return k.alpha === 'lat' ? CC.shift(s, -1) : CC.hebShift(s, -1); },
  vectors: [{ k: { alpha: 'heb' }, p: 'אבג', c: 'בגד' }, { k: { alpha: 'lat' }, p: 'HAL', c: 'IBM' }], sample: 'שלום'
});
CC.reg({ id: 'albam', ch: 2, name: 'Albam', kind: 'cipher', object: 'wheel', fixedShift: 11,
  keys: [{ id: 'alpha', label: 'Alphabet', type: 'select', def: 'heb', options: [['heb', 'Hebrew (22 letters)'], ['lat', 'Latin (26 letters)']] }],
  about: 'The alphabet is split in two halves and the halves swap: aleph to lamed, bet to mem... On 26 Latin letters it is the same as ROT13.',
  enc: function (s, k) { return k.alpha === 'lat' ? CC.shift(s, 13) : CC.hebShift(s, 11); },
  dec: function (s, k) { return k.alpha === 'lat' ? CC.shift(s, 13) : CC.hebShift(s, 11); },
  vectors: [{ k: { alpha: 'heb' }, p: 'אב', c: 'למ' }], sample: 'בראשית'
});

/* =====================================================================
   Chapter 3 - simple substitution
   ===================================================================== */
CC.reg({ id: 'atbash', ch: 3, name: 'Atbash', kind: 'cipher', object: 'strips',
  about: 'The alphabet backwards: A to Z, B to Y. Doing it twice gives the original.',
  enc: function (s) { return CC.mapText(s, function (c, i) { return AZ[25 - i]; }); },
  dec: function (s) { return CC.byId.atbash.enc(s); },
  vectors: [{ k: {}, p: 'SECRET MESSAGE', c: 'HVXIVG NVHHZTV' }], sample: 'Be prepared'
});
CC.reg({ id: 'keyword', ch: 3, name: 'Keyword (simple alphabet) substitution', kind: 'cipher', object: 'strips',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'SPECTRUM' }, { id: 'alpha', label: 'Or a full cipher alphabet (26 letters, optional)', type: 'text', def: '' }],
  about: 'One mixed-up alphabet replaces the plain one. A keyword is an easy way to remember it.',
  cipherAlpha: function (k) { var a = CC.letters(k.alpha || ''); return a.length === 26 && CC.dedupe(a).length === 26 ? a : CC.keyAlpha(k.key); },
  enc: function (s, k) { var a = this.cipherAlpha(k); return CC.mapText(s, function (c, i) { return a[i]; }); },
  dec: function (s, k) { var a = this.cipherAlpha(k); return CC.mapText(s, function (c) { return AZ[a.indexOf(c)]; }); },
  vectors: [{ k: { key: 'ZEBRAS' }, p: 'FLEE AT ONCE', c: 'SIAA ZQ LKBA' }], sample: 'Look behind you'
});
/* Pigpen: tic-tac-toe and X grids, plain then dotted. Each letter -> [shape, dot] used by the UI drawing. */
CC.pigpen = (function () {
  var m = {}, i;
  for (i = 0; i < 9; i++) { m[AZ[i]] = { g: 'grid', cell: i, dot: false }; m[AZ[i + 9]] = { g: 'grid', cell: i, dot: true }; }
  for (i = 0; i < 4; i++) { m[AZ[18 + i]] = { g: 'x', cell: i, dot: false }; m[AZ[22 + i]] = { g: 'x', cell: i, dot: true }; }
  return m;
})();
CC.reg({ id: 'pigpen', ch: 3, name: 'Pigpen (Freemasons\') cipher', kind: 'cipher', object: 'pigpen',
  about: 'Each letter is drawn as the piece of a grid that surrounds it, with or without a dot.',
  enc: function (s) { return CC.letters(s); }, dec: function (s) { return CC.letters(s); },
  symbolic: true, sample: 'X MARKS THE SPOT'
});
CC.reg({ id: 'symbols', ch: 3, name: 'Symbolic substitution', kind: 'cipher', object: 'symbols',
  keys: [{ id: 'set', label: 'Symbol set', type: 'select', def: 'astro', options: [['astro', 'Astronomical and zodiac'], ['dance', 'Stick figures (made for this studio)'], ['shapes', 'Shapes and arrows']] }],
  about: 'Any set of 26 symbols can stand in for the letters. It is still a simple substitution.',
  sets: {
    astro: '☉☽☿♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓☊☋☄',
    shapes: '▲▼◀▶◆◇○●□■★☆♠♣♥♦↑↓←→↖↗↘↙⌂⌘',
    dance: null
  },
  enc: function (s, k) { var set = this.sets[k.set]; if (!set) return CC.letters(s); var a = Array.from(set); return String(s).toUpperCase().split('').map(function (c) { var i = AZ.indexOf(c); return i < 0 ? c : a[i]; }).join(''); },
  dec: function (s, k) { var set = this.sets[k.set]; if (!set) return CC.letters(s); var a = Array.from(set); return Array.from(String(s)).map(function (c) { var i = a.indexOf(c); return i < 0 ? c : AZ[i]; }).join(''); },
  sample: 'MEET ME AT THE OLD MILL'
});
/* Homophonic: frequent letters get several numbers (two-digit codes 00-99), chosen at random each time */
CC.engFreq = { E: 12.7, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09, R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23, G: 2.02, Y: 1.97, P: 1.93, B: 1.29, V: 0.98, K: 0.77, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07 };
CC.homTable = function (key) {
  /* 100 codes shared out roughly by frequency (each letter at least one), shuffled by the key */
  var counts = {}, total = 0; AZ.split('').forEach(function (c) { counts[c] = Math.max(1, Math.round(CC.engFreq[c])); total += counts[c]; });
  var order = AZ.split('').sort(function (a, b) { return CC.engFreq[b] - CC.engFreq[a]; }), i = 0;
  while (total < 100) { counts[order[i % 6]]++; total++; i++; }
  while (total > 100) { var c = order[i % 26]; if (counts[c] > 1) { counts[c]--; total--; } i++; }
  var codes = []; for (i = 0; i < 100; i++) codes.push(('0' + i).slice(-2));
  var r = CC.seeded(Array.from(String(key || 'HOMOPHONE')).reduce(function (h, ch) { return (h * 31 + ch.charCodeAt(0)) >>> 0; }, 7));
  for (i = codes.length - 1; i > 0; i--) { var j = r(i + 1), t = codes[i]; codes[i] = codes[j]; codes[j] = t; }
  var tab = {}, p = 0; AZ.split('').forEach(function (c) { tab[c] = codes.slice(p, p + counts[c]).sort(); p += counts[c]; });
  return tab;
};
CC.reg({ id: 'homophonic', ch: 3, name: 'Homophonic substitution', kind: 'cipher', object: 'homophones',
  keys: [{ id: 'key', label: 'Table key', type: 'text', def: 'HOMOPHONE' }],
  about: 'Common letters get several numbers and one is picked at random each time, so letter counts stop giving the game away.',
  enc: function (s, k) { var t = CC.homTable(k.key); return CC.letters(s).split('').map(function (c) { var o = t[c]; return o[CC.rand(o.length)]; }).join(' '); },
  dec: function (s, k) { var t = CC.homTable(k.key), inv = {}; for (var c in t) t[c].forEach(function (n) { inv[n] = c; }); return (String(s).replace(/\D/g, '').match(/\d\d/g) || []).map(function (n) { return inv[n] || '?'; }).join(''); },
  random: true, sample: 'THE ENEMY SEES EVERY LETTER E'
});
CC.reg({ id: 'nulls', ch: 3, name: 'Null characters', kind: 'cipher', object: null,
  keys: [{ id: 'key', label: 'Substitution keyword', type: 'text', def: 'SPECTRUM' }, { id: 'every', label: 'Insert a null after every', type: 'number', def: 2, min: 1, max: 9 }, { id: 'nulls', label: 'Null symbols', type: 'text', def: '0123456789' }],
  about: 'Meaningless extra symbols are mixed in to spoil frequency counts. Here: keyword substitution plus a random null after every N letters.',
  enc: function (s, k) { var a = CC.keyAlpha(k.key), n = Math.max(1, +k.every || 2), nl = Array.from(k.nulls || '0123456789'), o = ''; CC.letters(s).split('').forEach(function (c, i) { o += a[AZ.indexOf(c)]; if ((i + 1) % n === 0) o += nl[CC.rand(nl.length)]; }); return o; },
  dec: function (s, k) { var a = CC.keyAlpha(k.key), nl = k.nulls || '0123456789'; return Array.from(String(s).toUpperCase()).filter(function (c) { return nl.indexOf(c) < 0 && /[A-Z]/.test(c); }).map(function (c) { return AZ[a.indexOf(c)]; }).join(''); },
  random: true, sample: 'ATTACK AT DAWN'
});

/* ---------- groups of 3, 4 or 5 ----------
   mode: 'upper' letters and digits in capitals; 'case' keep upper and lower case; 'digits' numbers only;
   'bits' teleprinter bits; 'hebrew'; 'chars' every character except spaces; or a reason why it cannot be grouped */
CC.groupMode = function (d, k) {
  k = k || {};
  var m = {
    alberti: 'chars', aes: 'case', rot47: 'chars', rsa: 'digits', homophonic: 'digits', polybius: 'digits', baudot: 'bits', ita2: 'bits', vernam: 'bits', lorenz: 'bits',
    flags: 'Signal flags are hoisted word by word, so they are not put into groups.', semaphore: 'Semaphore is sent sign by sign, so it is not put into groups.',
    tapcode: 'Tap code relies on the pauses between knocks, so it is not put into groups.', chappe: 'Each telegraph position is one sign, so it is not put into groups.',
    cooke: 'Each needle position is one sign, so it is not put into groups.', morse: 'Morse letters are different lengths and separated by spaces; regrouping would change the letters.',
    bookword: 'Book references (line.word) are different lengths, so they are not put into groups.', bookletter: 'Word numbers are different lengths, so they are not put into groups.',
    pigpen: 'Pigpen is drawn as symbols above.', symbols: 'Symbols are shown as they are.', nomenclator: 'Nomenclator symbols are shown as they are.',
    hash: 'A hash is compared as a whole, so it is not put into groups.', nullcipher: 'The cover text must read naturally, so it is not put into groups.',
    bacon: 'The cover text must read naturally, so it is not put into groups.', cardan: 'Grille positions are different lengths, so they are not put into groups.',
    zerowidth: 'The cover text must read naturally, so it is not put into groups.', imagestego: 'The message is inside the picture.'
  }[d.id];
  if (d.id === 'ascii') m = k.fmt === 'hex' ? 'case' : k.fmt === 'bin' ? 'bits' : k.fmt === 'b64' ? 'case' : 'Decimal numbers are different lengths, so they are not put into groups.';
  if (d.id === 'avgad' || d.id === 'albam') m = k.alpha === 'lat' ? 'upper' : 'hebrew';
  if (d.id === 'onetimecode') m = 'digits';
  return m || 'upper';
};
CC.groupOut = function (v, d, n, k) {
  v = String(v == null ? '' : v); if (!n || !v) return { text: v, note: '' };
  var m = CC.groupMode(d, k), t;
  if (!/^(upper|case|digits|bits|hebrew|chars)$/.test(m)) return { text: v, note: m };
  if (d.id === 'onetimecode' && /\[/.test(v)) return { text: v, note: 'Words spelled out in [brackets] are not in the codebook, so this message is not put into groups.' };
  if (m === 'upper') t = v.toUpperCase().replace(/[^A-Z0-9+]/g, '');
  else if (m === 'case') t = v.replace(/[^A-Za-z0-9+\/=]/g, '');
  else if (m === 'digits') t = v.replace(/\D/g, '');
  else if (m === 'bits') t = v.replace(/[^01]/g, '');
  else if (m === 'hebrew') t = v.replace(/[^\u05d0-\u05ea0-9]/g, '');
  else t = v.replace(/\s/g, '');
  if (!t) return { text: v, note: '' };
  return { text: Array.from(t).reduce(function (a, c, i) { return a + (i && i % n === 0 ? ' ' : '') + c; }, ''), note: '' };
};

if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
