/* Codes & Ciphers Studio engine - by Larry Dalton
   Version 1.3: the Kama Sutra cipher (chapter 3), AMSCO (chapter 4), Fractionated Morse (chapter 5), Porta, Gronsfeld and
   Quagmire III (chapter 7), DES and ElGamal (chapter 12), the Nihilist cipher and the Hebern rotor machine (chapter 15)
   and ChaCha20 (chapter 16). */
(function (G) {
'use strict';
var CC = G.CC, AZ = CC.AZ, mod = CC.mod;

/* =====================================================================
   Kama Sutra cipher (mlecchita vikalpa): the alphabet split into 13 pairs, each letter swapped with its partner
   ===================================================================== */
CC.kamaPairs = function (k) { var A = CC.keyAlpha(CC.letters(k.key || '')); return [A.slice(0, 13), A.slice(13)]; };
CC.kama = function (s, k) { var P = CC.kamaPairs(k), T = P[0], B = P[1]; return CC.mapText(String(s), function (c) { var i = T.indexOf(c); return i >= 0 ? B[i] : T[B.indexOf(c)]; }); };
CC.reg({ id: 'kamasutra', ch: 3, name: 'Kama Sutra cipher', kind: 'cipher', object: 'kama',
  keys: [{ id: 'key', label: 'Keyword that mixes the pairs (blank = A-M over N-Z)', type: 'text', def: 'VATSYAYANA' }],
  about: 'The Kama Sutra (about the 3rd or 4th century AD) lists mlecchita vikalpa, the art of secret writing, among the 64 arts a cultured person should know. The method itself comes from a later commentary by Yashodhara: pair the letters of the alphabet off at random and write each letter as its partner. It is one of the oldest descriptions of a substitution cipher. Here the keyword mixes the alphabet and the first 13 letters are paired with the last 13. Because every letter swaps with its partner, the same step enciphers and deciphers. With no keyword it is ROT13.',
  enc: function (s, k) { return CC.kama(s, k); },
  dec: function (s, k) { return CC.kama(s, k); },
  vectors: [{ k: { key: '' }, p: 'Why did the chicken cross the road', c: 'Jul qvq gur puvpxra pebff gur ebnq', src: 'with no keyword the pairs are A-N, B-O ... the same as ROT13' }],
  sample: 'Meet me by the river at dusk'
});

/* =====================================================================
   AMSCO (A. M. Scott, 19th century): columnar transposition with cells of one and two letters
   ===================================================================== */
CC.amscoKey = function (k) { var t = String(k.key || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (t.length < 2) throw new Error('The AMSCO key needs at least two letters or digits (for example 41325 or CIPHER).'); return t; };
/* the cells: [row, col, size, start index in the text] filled row by row; the first row and first column alternate */
CC.amscoCells = function (n, C, first) {
  var cells = [], i = 0, r = 0, f = +first === 2 ? 2 : 1;
  while (i < n) { for (var c = 0; c < C && i < n; c++) { var sz = (r + c) % 2 ? 3 - f : f; sz = Math.min(sz, n - i); cells.push({ r: r, c: c, size: sz, at: i }); i += sz; } r++; }
  return cells;
};
CC.amscoOrder = function (key) { var rank = CC.keyOrder(key), order = []; rank.forEach(function (rk, col) { order[rk] = col; }); return order; };
CC.reg({ id: 'amsco', ch: 4, name: 'AMSCO transposition', kind: 'cipher', object: 'amsco',
  keys: [{ id: 'key', label: 'Key (digits or a keyword)', type: 'text', def: '41325' },
         { id: 'first', label: 'First cell holds', type: 'select', def: '2', options: [['2', 'two letters'], ['1', 'one letter']] }],
  about: 'Devised by A. M. Scott in the 19th century. The message is written into rows under a key, but the cells take one letter and two letters in turn, like the squares of a chessboard, so the first row and the first column always alternate. The columns are then read off in the key\'s order. Because letters travel in pairs as well as alone, the usual way of attacking a columnar transposition, by fitting columns side by side, works far less well. No filler letters are needed.',
  enc: function (s, k) {
    var key = CC.amscoKey(k), t = CC.letters(s), cells = CC.amscoCells(t.length, key.length, k.first), o = '';
    CC.amscoOrder(key).forEach(function (col) { cells.forEach(function (x) { if (x.c === col) o += t.substr(x.at, x.size); }); });
    return o;
  },
  dec: function (s, k) {
    var key = CC.amscoKey(k), t = CC.letters(s), cells = CC.amscoCells(t.length, key.length, k.first), g = [], p = 0;
    CC.amscoOrder(key).forEach(function (col) { cells.forEach(function (x) { if (x.c === col) { g[x.at] = t.substr(p, x.size); p += x.size; } }); });
    return g.join('');
  },
  vectors: [{ k: { key: '41325', first: '2' }, p: 'Incomplete columnar with alternating single letters and digraphs', c: 'CECRTEGLENPHPLUTNANTEIOMOWIRSITDDSINTNALINESAALEMHATGLRGR', src: 'American Cryptogram Association AMSCO example' }],
  sample: 'Incomplete columnar with alternating single letters and digraphs'
});

/* =====================================================================
   Fractionated Morse: Morse with x between letters, read in threes, each three becomes a letter
   ===================================================================== */
CC.fmTrigrams = (function () { var s = '.-x', o = []; for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) for (var c = 0; c < 3; c++) o.push(s[a] + s[b] + s[c]); return o.slice(0, 26); })();
CC.fmMorse = function (s) {
  var words = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).map(function (w) { return Array.from(w).filter(function (c) { return /[A-Z0-9]/.test(c); }).map(function (c) { return CC.morse[c]; }).join('x'); }).filter(Boolean);
  return words.join('xx');
};
CC.reg({ id: 'fracmorse', ch: 5, name: 'Fractionated Morse', kind: 'cipher', object: 'fracmorse',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'ROUNDTABLE' }],
  about: 'A cipher from the American Cryptogram Association\'s list. The message is written in Morse code with x between letters and xx between words, so it becomes one long string of dots, dashes and x. That string is cut into threes. There are 26 possible threes (xxx is never needed), and a keyword alphabet gives each one a letter. Letters of different Morse lengths are split across the threes, which is what fractionating means: a single cipher letter can hold the end of one plain letter and the start of the next. Letters and digits are kept; other signs are dropped.',
  enc: function (s, k) { var A = CC.keyAlpha(CC.letters(k.key)), m = CC.fmMorse(s); while (m.length % 3) m += 'x'; var o = ''; for (var i = 0; i < m.length; i += 3) o += A[CC.fmTrigrams.indexOf(m.substr(i, 3))]; return o; },
  dec: function (s, k) {
    var A = CC.keyAlpha(CC.letters(k.key)), inv = {}, m = CC.letters(s).split('').map(function (c) { return CC.fmTrigrams[A.indexOf(c)]; }).join('').replace(/x+$/, '');
    Object.keys(CC.morse).forEach(function (c) { inv[CC.morse[c]] = c; });
    return m.split('xx').map(function (w) { return w.split('x').map(function (c) { return inv[c] || (c ? '?' : ''); }).join(''); }).join(' ');
  },
  vectors: [{ k: { key: 'ROUNDTABLE' }, p: 'DEFEND THE EAST', c: 'ESOAVVLJRSSTRX', src: 'TheAlgorithms fractionated Morse example' }],
  sample: 'Come at once'
});

/* =====================================================================
   Porta (Giovanni Battista della Porta, 1563): 13 reciprocal alphabets, chosen by pairs of key letters
   ===================================================================== */
CC.portaRow = function (keyLetter) { var k = Math.floor(AZ.indexOf(keyLetter) / 2), r = ''; for (var i = 0; i < 26; i++) r += i < 13 ? AZ[13 + mod(i + k, 13)] : AZ[mod(i - 13 - k, 13)]; return r; };
CC.reg({ id: 'porta', ch: 7, name: 'Porta cipher', kind: 'cipher', object: 'porta',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'FORTIFICATION' }],
  about: 'Giovanni Battista della Porta published it in De Furtivis Literarum Notis (1563), one of the first great books on cryptography. It is a polyalphabetic cipher like Vigenère, but with only 13 alphabets, one for each pair of key letters (A and B share one, C and D the next, and so on). Each alphabet swaps the first half of the alphabet with the second half, so every letter has a partner and the same key both enciphers and deciphers.',
  enc: function (s, k) { var K = CC.letters(k.key) || 'A', j = 0; return CC.mapText(CC.letters(s), function (c, i) { return CC.portaRow(K[j++ % K.length])[i]; }); },
  dec: function (s, k) { return this.enc(s, k); },
  vectors: [{ k: { key: 'FORTIFICATION' }, p: 'DEFEND THE EAST WALL OF THE CASTLE', c: 'SYNNJSCVRNRLAHUTUKUCVRYRLANY', src: 'Porta test cases of the Rust "ciphers" crate (from Practical Cryptography)' },
            { k: { key: 'ZYXWVUTSRQPON' }, p: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', c: 'ZNNOOPPQQRRSSBCEFHIKLABDEG', src: 'Porta test cases of the Rust "ciphers" crate' }],
  sample: 'Defend the east wall of the castle'
});

/* =====================================================================
   Gronsfeld: Vigenère with a number for its key
   ===================================================================== */
CC.gronKey = function (k) { var d = String(k.key == null ? '' : k.key).replace(/\D/g, ''); if (!d) throw new Error('The Gronsfeld key is a number, for example 31415.'); return d.split('').map(Number); };
CC.reg({ id: 'gronsfeld', ch: 7, name: 'Gronsfeld cipher', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'key', label: 'Key number', type: 'text', def: '31415' }],
  about: 'Named after Count Gronsfeld and described in the 17th century: Vigenère with a number instead of a keyword. Each digit says how many places to move that letter, so only the first ten rows of the square are used. A key number was easy to remember and easy to hide, and the cipher was widely used in Europe; in 1892 it was still being used by French anarchists. It is weaker than Vigenère because there are only ten shifts.',
  enc: function (s, k) { var K = CC.gronKey(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) + K[j % K.length]; }); },
  dec: function (s, k) { var K = CC.gronKey(k), t = CC.letters(s); return CC.streamText(s, function (i, j) { return AZ.indexOf(t[j]) - K[j % K.length]; }); },
  vectors: [{ k: { key: '3141' }, p: 'ATTACK AT DAWN', c: 'DUXBFLEUGBAO', src: 'the same as Vigenère with the key DBEB' }],
  sample: 'Meet at the old mill'
});

/* =====================================================================
   Quagmire III (as on Kryptos): Vigenère on a keyed alphabet
   ===================================================================== */
CC.reg({ id: 'quagmire3', ch: 7, name: 'Quagmire III (keyed Vigenère, as on Kryptos)', kind: 'cipher', object: 'tabula',
  keys: [{ id: 'alpha', label: 'Alphabet keyword', type: 'text', def: 'KRYPTOS' }, { id: 'key', label: 'Keyword', type: 'text', def: 'PALIMPSEST' }],
  about: 'The American Cryptogram Association\'s name for a Vigenère square built on a mixed alphabet, used for both the plain and the cipher letters. Jim Sanborn used it for the first two panels of Kryptos (1990) at CIA headquarters: alphabet keyword KRYPTOS, and the keywords PALIMPSEST and ABSCISSA. Because the alphabet is mixed, the shifts no longer follow the normal A-Z order, which hides the key from a casual look but not from a determined analyst: both panels were solved in 1999.',
  enc: function (s, k) { var A = CC.keyAlpha(CC.letters(k.alpha)), K = CC.letters(k.key) || A[0], j = 0; return CC.mapText(CC.letters(s), function (c) { return A[mod(A.indexOf(c) + A.indexOf(K[j++ % K.length]), 26)]; }); },
  dec: function (s, k) { var A = CC.keyAlpha(CC.letters(k.alpha)), K = CC.letters(k.key) || A[0], j = 0; return CC.mapText(CC.letters(s), function (c) { return A[mod(A.indexOf(c) - A.indexOf(K[j++ % K.length]), 26)]; }); },
  vectors: [{ k: { alpha: 'KRYPTOS', key: 'PALIMPSEST' }, p: 'BETWEEN SUBTLE SHADING AND THE ABSENCE OF LIGHT LIES THE NUANCE OF IQLUSION', c: 'EMUFPHZLRFAXYUSDJKZLDKRNSHGNFIVJYQTQUXQBQVYUVLLTREVJYQTMKYRDMFD', src: 'Kryptos panel K1 (the misspelling is Sanborn\'s)' }],
  sample: 'Between subtle shading and the absence of light lies the nuance of iqlusion'
});

/* =====================================================================
   Nihilist cipher (Russian Nihilists, 1880s): Polybius numbers plus key numbers
   ===================================================================== */
CC.nihSquare = function (k) { return CC.square(CC.letters(k.square), 5); };
CC.nihNums = function (sq, t) { return CC.letters(t).replace(/J/g, 'I').split('').map(function (c) { var i = sq.indexOf(c); return (Math.floor(i / 5) + 1) * 10 + i % 5 + 1; }); };
CC.reg({ id: 'nihilist', ch: 15, name: 'Nihilist cipher', kind: 'cipher', object: 'nihilist',
  keys: [{ id: 'square', label: 'Square keyword', type: 'text', def: 'ZEBRAS' }, { id: 'key', label: 'Key word', type: 'text', def: 'RUSSIAN' }],
  about: 'Used by Russian revolutionaries, the Nihilists, against the Tsar\'s secret police in the 1880s. Each letter is turned into a two-figure number (row and column) in a keyed Polybius square. The key word is turned into numbers the same way and added on, repeating, as ordinary sums, so the results run from 22 to 110. It is a Vigenère in disguise and can be broken the same way, but it led to the Soviet straddling-checkerboard ciphers such as VIC. I and J share a square.',
  enc: function (s, k) { var sq = CC.nihSquare(k), K = CC.nihNums(sq, k.key); if (!K.length) throw new Error('The Nihilist key needs at least one letter.'); return CC.nihNums(sq, s).map(function (n, i) { return n + K[i % K.length]; }).join(' '); },
  dec: function (s, k) {
    var sq = CC.nihSquare(k), K = CC.nihNums(sq, k.key); if (!K.length) throw new Error('The Nihilist key needs at least one letter.');
    return (String(s).match(/\d+/g) || []).map(function (x, i) { var n = +x - K[i % K.length], r = Math.floor(n / 10), c = n % 10; if (r < 1 || r > 5 || c < 1 || c > 5) throw new Error('Number ' + (i + 1) + ' (' + x + ') does not fit this square and key: check the key, the square keyword and that no number is missing.'); return sq[(r - 1) * 5 + c - 1]; }).join('');
  },
  vectors: [{ k: { square: 'ZEBRAS', key: 'RUSSIAN' }, p: 'DYNAMITE WINTER PALACE', c: '37 106 62 36 67 47 86 26 104 53 62 77 27 55 57 66 55 36 54 27', src: 'Wikipedia Nihilist cipher example' }],
  sample: 'Dynamite winter palace'
});

/* =====================================================================
   Hebern rotor machine (Edward Hebern, 1917): one wired rotor that steps with every letter
   ===================================================================== */
CC.hebernWiring = function (k) {
  var w = String(k.wiring || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (w.length !== 26 || new Set(w).size !== 26) throw new Error('The rotor wiring must list all 26 letters once each.');
  return w;
};
CC.hebernStart = function (k) { var p = AZ.indexOf((CC.letters(k.pos) || 'A')[0]); return p < 0 ? 0 : p; };
CC.hebernRun = function (s, k, dir, trace) {
  var W = CC.hebernWiring(k), pos = CC.hebernStart(k), o = '';
  Array.from(CC.letters(s)).forEach(function (ch) {
    var x = AZ.indexOf(ch), c;
    if (dir > 0) c = mod(AZ.indexOf(W[mod(x + pos, 26)]) - pos, 26);
    else c = mod(W.indexOf(AZ[mod(x + pos, 26)]) - pos, 26);
    if (trace) trace.push({ pos: pos, i: x, o: c });
    o += AZ[c]; pos = (pos + 1) % 26;
  });
  return o;
};
CC.reg({ id: 'hebern', ch: 15, name: 'Hebern rotor machine', kind: 'cipher', object: 'hebern',
  keys: [{ id: 'wiring', label: 'Rotor wiring (where A-Z are wired to)', type: 'text', def: 'RYJGMOPKTLWBIZNUDXQASFVECH' }, { id: 'pos', label: 'Starting position', type: 'text', def: 'A' }],
  about: 'Edward Hebern, a Californian, built the first rotor cipher machine in 1917, a few years before the Enigma. A typewriter is joined to a second one through a wheel, the rotor, whose 26 contacts on each side are wired together in a scrambled order. After every letter the rotor turns one place, so each letter of the message is enciphered with a different alphabet. With only one rotor the alphabets repeat every 26 letters, and the US Navy\'s later five-rotor Hebern machine was broken by William Friedman in the 1920s. Every rotor was wired differently, so the wiring here is an example; change it to make your own rotor.',
  enc: function (s, k) { return CC.hebernRun(s, k, 1); },
  dec: function (s, k) { return CC.hebernRun(s, k, -1); },
  vectors: [{ k: { wiring: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', pos: 'A' }, p: 'HELLO', c: 'HELLO', src: 'a straight-through rotor changes nothing' }],
  sample: 'The first rotor machine'
});

/* =====================================================================
   DES (Data Encryption Standard, FIPS 46, 1977)
   ===================================================================== */
var D = {
  IP: [58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8, 57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3, 61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7],
  E: [32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25, 24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1],
  P: [16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25],
  PC1: [57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4],
  PC2: [14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32],
  SH: [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1],
  S: [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7, 0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8, 4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0, 15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10, 3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5, 0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15, 13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8, 13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1, 13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7, 1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15, 13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9, 10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4, 3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9, 14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6, 4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14, 11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11, 10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8, 9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6, 4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1, 13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6, 1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2, 6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7, 1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2, 7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8, 2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
  ]
};
D.FP = []; D.IP.forEach(function (v, i) { D.FP[v - 1] = i + 1; });
CC.DES = D;
var bitsOf = function (bytes) { var o = []; bytes.forEach(function (b) { for (var i = 7; i >= 0; i--) o.push((b >> i) & 1); }); return o; };
var bytesOf = function (bits) { var o = []; for (var i = 0; i < bits.length; i += 8) { var v = 0; for (var j = 0; j < 8; j++) v = v * 2 + bits[i + j]; o.push(v); } return o; };
var perm = function (bits, table) { return table.map(function (p) { return bits[p - 1]; }); };
var bitHex = function (bits) { var h = ''; for (var i = 0; i < bits.length; i += 4) h += (bits[i] * 8 + bits[i + 1] * 4 + bits[i + 2] * 2 + bits[i + 3]).toString(16); return h.toUpperCase(); };
CC.desBits = { hex: bitHex, bits: bitsOf, bytes: bytesOf };
CC.desSubkeys = function (key) {
  var k = perm(bitsOf(key), D.PC1), c = k.slice(0, 28), d = k.slice(28), out = [];
  D.SH.forEach(function (n) { c = c.slice(n).concat(c.slice(0, n)); d = d.slice(n).concat(d.slice(0, n)); out.push(perm(c.concat(d), D.PC2)); });
  return out;
};
CC.desF = function (r, sub, trace) {
  var e = perm(r, D.E), x = e.map(function (b, i) { return b ^ sub[i]; }), s = [];
  for (var j = 0; j < 8; j++) { var b = x.slice(j * 6, j * 6 + 6), row = b[0] * 2 + b[5], col = b[1] * 8 + b[2] * 4 + b[3] * 2 + b[4], v = D.S[j][row * 16 + col]; s.push((v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1); }
  var f = perm(s, D.P);
  if (trace) { trace.e = bitHex(e); trace.x = bitHex(x); trace.s = bitHex(s); trace.f = bitHex(f); }
  return f;
};
/* one 8-byte block; dir 1 = encipher, -1 = decipher (subkeys in reverse); trace collects every round */
CC.desBlock = function (block, subs, dir, trace) {
  var b = perm(bitsOf(block), D.IP), L = b.slice(0, 32), R = b.slice(32);
  if (trace) trace.push({ round: 0, L: bitHex(L), R: bitHex(R) });
  for (var i = 0; i < 16; i++) {
    var sub = subs[dir > 0 ? i : 15 - i], t = trace ? {} : null, f = CC.desF(R, sub, t), nR = L.map(function (x, j) { return x ^ f[j]; });
    L = R; R = nR;
    if (trace) { t.round = i + 1; t.K = bitHex(sub); t.L = bitHex(L); t.R = bitHex(R); trace.push(t); }
  }
  return bytesOf(perm(R.concat(L), D.FP));
};
CC.desKey = function (k) { return CC.hexKey(k.key, [8], 'The DES key'); };
CC.reg({ id: 'des', ch: 12, name: 'DES (Data Encryption Standard)', kind: 'cipher', object: 'des',
  keys: [{ id: 'key', label: 'Key (16 hexadecimal digits, 56 bits plus 8 parity bits)', type: 'text', def: '133457799BBCDFF1' },
         { id: 'fmt', label: 'Message is', type: 'select', def: 'text', options: [['text', 'text (padded to whole 8-byte blocks)'], ['hex', 'hexadecimal blocks of 16 digits (no padding)']] }],
  about: 'The US government\'s standard cipher from 1977 to 2001, based on IBM\'s Lucifer with changes made by the NSA. A 64-bit block is split into two halves and put through 16 rounds of a Feistel network: each round mixes one half with a round key through eight small look-up tables, the S-boxes, and adds the result onto the other half, then the halves swap. Deciphering is the same process with the round keys in reverse. Its 56-bit key became its downfall: in 1998 the Electronic Frontier Foundation\'s Deep Crack machine found a key in 56 hours. Each 8-byte block is enciphered on its own here (ECB), so repeated blocks show: a teaching version. The result is shown in hexadecimal.',
  enc: function (s, k) {
    var subs = CC.desSubkeys(CC.desKey(k)), p;
    if (k.fmt === 'hex') { p = CC.fromHex(s); if (!p.length || p.length % 8) throw new Error('In hexadecimal mode the message must be whole blocks of 16 hexadecimal digits.'); }
    else { p = CC.utf8(s); var n = 8 - p.length % 8; for (var j = 0; j < n; j++) p.push(n); }
    var o = []; for (var i = 0; i < p.length; i += 8) o = o.concat(CC.desBlock(p.slice(i, i + 8), subs, 1));
    return CC.toHex(o);
  },
  dec: function (s, k) {
    var subs = CC.desSubkeys(CC.desKey(k)), c = CC.fromHex(s);
    if (!c.length || c.length % 8) throw new Error('DES ciphertext is whole blocks of 16 hexadecimal digits.');
    var o = []; for (var i = 0; i < c.length; i += 8) o = o.concat(CC.desBlock(c.slice(i, i + 8), subs, -1));
    if (k.fmt === 'hex') return CC.toHex(o);
    var n = o[o.length - 1]; if (n < 1 || n > 8 || o.slice(-n).some(function (x) { return x !== n; })) throw new Error('The padding at the end is wrong, so the key is probably not the one used to encipher.');
    return CC.unutf8(o.slice(0, -n));
  },
  vectors: [{ k: { key: '133457799BBCDFF1', fmt: 'hex' }, p: '0123456789ABCDEF', c: '85E813540F0AB405', src: 'the classic worked DES example (J. Orlin Grabbe, "The DES Algorithm Illustrated")' },
            { k: { key: '0E329232EA6D0D73', fmt: 'hex' }, p: '8787878787878787', c: '0000000000000000', src: 'a widely published DES test value' }],
  sample: 'Meet at the dock'
});

/* =====================================================================
   ChaCha20 (Bernstein, 2008; RFC 8439)
   ===================================================================== */
CC.chachaBlock = function (key, nonce, counter, trace) {
  var u32 = function (b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; };
  var C = CC.utf8('expand 32-byte k'), x = [u32(C, 0), u32(C, 4), u32(C, 8), u32(C, 12)], i;
  for (i = 0; i < 8; i++) x.push(u32(key, i * 4));
  x.push(counter >>> 0, u32(nonce, 0), u32(nonce, 4), u32(nonce, 8));
  var z = x.slice(), R = function (a, b) { return ((a << b) | (a >>> (32 - b))) >>> 0; };
  var qr = function (a, b, c, d) {
    z[a] = (z[a] + z[b]) >>> 0; z[d] = R(z[d] ^ z[a], 16); z[c] = (z[c] + z[d]) >>> 0; z[b] = R(z[b] ^ z[c], 12);
    z[a] = (z[a] + z[b]) >>> 0; z[d] = R(z[d] ^ z[a], 8); z[c] = (z[c] + z[d]) >>> 0; z[b] = R(z[b] ^ z[c], 7);
  };
  if (trace) trace.push({ r: 0, z: z.slice() });
  for (var r = 0; r < 20; r += 2) {
    qr(0, 4, 8, 12); qr(1, 5, 9, 13); qr(2, 6, 10, 14); qr(3, 7, 11, 15); if (trace) trace.push({ r: r + 1, kind: 'columns', z: z.slice() });
    qr(0, 5, 10, 15); qr(1, 6, 11, 12); qr(2, 7, 8, 13); qr(3, 4, 9, 14); if (trace) trace.push({ r: r + 2, kind: 'diagonals', z: z.slice() });
  }
  var out = []; for (i = 0; i < 16; i++) { var v = (z[i] + x[i]) >>> 0; out.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24); }
  if (trace) trace.push({ r: 21, z: z.map(function (v, j) { return (v + x[j]) >>> 0; }), start: x });
  return out;
};
CC.chachaCounter = function (k) { var c = String(k.counter == null ? '1' : k.counter).trim(); if (!/^\d+$/.test(c) || +c > 4294967295) throw new Error('The block counter is a whole number from 0 to 4294967295.'); return +c; };
CC.reg({ id: 'chacha20', ch: 16, name: 'ChaCha20 (used across today\'s internet)', kind: 'cipher', object: 'salsa',
  keys: [{ id: 'key', label: 'Key (64 hexadecimal digits, 256 bits)', type: 'text', def: '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F' },
         { id: 'nonce', label: 'Nonce (24 hexadecimal digits, never reuse with the same key)', type: 'text', def: '000000000000004A00000000' },
         { id: 'counter', label: 'First block number', type: 'text', def: '1' }],
  about: 'Daniel J. Bernstein\'s 2008 refinement of Salsa20. The same 4 x 4 grid of 32-bit numbers is mixed with add, rotate and exclusive-or, but each step spreads changes faster, and the rounds go down the columns and then along the diagonals. It is standardised in RFC 8439 and protects a large share of today\'s traffic: TLS 1.3 on phones without AES hardware, WireGuard VPNs and SSH. It is unbroken. The defaults are the key and nonce from the RFC\'s worked example; the result is shown in hexadecimal.',
  stream: function (k, n) { var key = CC.hexKey(k.key, [32], 'The ChaCha20 key'), nonce = CC.hexKey(k.nonce, [12], 'The nonce'), c = CC.chachaCounter(k), o = []; for (var b = 0; o.length < n; b++) o = o.concat(CC.chachaBlock(key, nonce, c + b)); return o.slice(0, n); },
  enc: function (s, k) { var p = CC.utf8(s), ks = this.stream(k, p.length); return CC.toHex(p.map(function (x, i) { return x ^ ks[i]; })); },
  dec: function (s, k) {
    var c = CC.fromHex(s), ks = this.stream(k, c.length), t = CC.unutf8(c.map(function (x, i) { return x ^ ks[i]; }));
    if (/�|[\u0000-\u0008\u000E-\u001F]/.test(t)) this.lastNote = 'Some bytes did not make readable text: check the key, nonce and block number are the ones used to encipher.';
    return t;
  },
  vectors: [{ k: { key: '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F', nonce: '000000000000004A00000000', counter: '1' },
    p: 'Ladies and Gentlemen of the class of \'99: If I could offer you only one tip for the future, sunscreen would be it.',
    c: '6E2E359A2568F98041BA0728DD0D6981E97E7AEC1D4360C20A27AFCCFD9FAE0BF91B65C5524733AB8F593DABCD62B3571639D624E65152AB8F530C359F0861D807CA0DBF500D6A6156A38E088A22B65E52BC514D16CCF806818CE91AB77937365AF90BBF74A35BE6B40B8EEDF2785E42874D',
    src: 'RFC 8439, section 2.4.2' }],
  sample: 'Sunscreen would be it'
});

/* =====================================================================
   ElGamal encryption (Taher Elgamal, 1985)
   ===================================================================== */
CC.elgParse = function (k, needK) {
  var p, g, x, r = null;
  try { p = BigInt(String(k.p).replace(/\s/g, '')); g = BigInt(String(k.g).trim()); x = BigInt(String(k.x).trim()); if (needK && String(k.k || '').trim()) r = BigInt(String(k.k).trim()); } catch (e) { throw new Error('p, g, the private key and the one-time number must be whole numbers.'); }
  if (p < 257n) throw new Error('The prime p must be at least 257.');
  if (g < 2n || g >= p - 1n) throw new Error('g must be at least 2 and less than p - 1.');
  if (x < 2n || x >= p - 1n) throw new Error('The private key x must be at least 2 and less than p - 1.');
  if (r !== null && (r < 2n || r >= p - 1n)) throw new Error('The one-time number k must be at least 2 and less than p - 1, or left blank for a random one.');
  return { p: p, g: g, x: x, k: r, y: CC.modPow(g, x, p) };
};
CC.elgDefaultP = '6864797660130609714981900799081393217269435300143305409394463459185543183397656052122559640661454554977296311391480858037121987999716643812574028291115057151';
CC.reg({ id: 'elgamal', ch: 12, name: 'ElGamal (public key)', kind: 'cipher', object: 'elgamal', random: true,
  keys: [{ id: 'p', label: 'Public prime p (the default is 2^521 - 1)', type: 'textarea', def: CC.elgDefaultP }, { id: 'g', label: 'Public base g', type: 'text', def: '3' },
         { id: 'x', label: 'Private key x (keep secret)', type: 'text', def: '2026043118' },
         { id: 'k', label: 'One-time number k (blank = a new random one each time)', type: 'text', def: '' }],
  about: 'Taher Elgamal\'s 1985 public-key system, built on Diffie-Hellman. The public key is y = g^x mod p; x stays private. To send a message m, choose a fresh random number k and send two numbers: c1 = g^k mod p (half of a Diffie-Hellman exchange) and c2 = m times y^k mod p (the message hidden by the shared secret). Only the holder of x can work out the shared secret c1^x and divide it out. Because k is random, the same message never looks the same twice; reusing k gives the game away. Used in early versions of PGP and GnuPG. Short messages only, and no padding: a teaching version of the real algorithm.',
  enc: function (s, k) {
    var d = CC.elgParse(k, true), m = CC.rsaText(s), r = d.k;
    if (m >= d.p) throw new Error('Message too long for this prime. Use a shorter message or a larger p.');
    if (r === null) r = CC.randBig(d.p.toString(2).length + 64) % (d.p - 3n) + 2n;
    var c1 = CC.modPow(d.g, r, d.p), c2 = m * CC.modPow(d.y, r, d.p) % d.p;
    CC.byId.elgamal.lastNote = 'Public key y = g^x mod p = ' + (String(d.y).length > 40 ? String(d.y).slice(0, 20) + '...' + String(d.y).slice(-12) + ' (' + String(d.y).length + ' digits)' : d.y) + '.';
    return c1 + ' / ' + c2;
  },
  dec: function (s, k) {
    var d = CC.elgParse(k, false), parts = String(s).match(/\d+/g);
    if (!parts || parts.length !== 2) throw new Error('ElGamal ciphertext is two numbers, c1 / c2.');
    var c1 = BigInt(parts[0]) % d.p, c2 = BigInt(parts[1]) % d.p, sh = CC.modPow(c1, d.x, d.p), m = c2 * CC.modPow(sh, d.p - 2n, d.p) % d.p;
    return CC.rsaUntext(m);
  },
  sample: 'Meet at noon'
});
/* the worked example in the Handbook of Applied Cryptography (Menezes, van Oorschot and Vanstone), example 8.18 */
CC.elgSmall = function () { var p = 2357n, g = 2n, x = 1751n, k = 1520n, m = 2035n, y = CC.modPow(g, x, p), c1 = CC.modPow(g, k, p), c2 = m * CC.modPow(y, k, p) % p, sh = CC.modPow(c1, x, p); return { y: y, c1: c1, c2: c2, m: c2 * CC.modPow(sh, p - 2n, p) % p }; };

/* =====================================================================
   extra checks for the new entries
   ===================================================================== */
CC.extraChecks.push(
  { name: 'DES: the key schedule and all 16 rounds of the classic worked example (key 133457799BBCDFF1), and both directions', fn: function () {
      var subs = CC.desSubkeys(CC.fromHex('133457799BBCDFF1')), tr = [], c = CC.desBlock(CC.fromHex('0123456789ABCDEF'), subs, 1, tr);
      return bitHex(subs[0]) === '1B02EFFC7072' && bitHex(subs[15]) === 'CB3D8B0E17F5' && tr[0].L === 'CC00CCFF' && tr[0].R === 'F0AAF0AA' && tr[1].R === 'EF4A6544' && tr[16].L === '43423234' && tr[16].R === '0A4CD995' && CC.toHex(c) === '85E813540F0AB405' && CC.toHex(CC.desBlock(c, subs, -1)) === '0123456789ABCDEF'; } },
  { name: 'ChaCha20: the RFC 8439 block function test (section 2.3.2), first 16 bytes of the block', fn: function () {
      var key = CC.fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'), nonce = CC.fromHex('000000090000004a00000000');
      return CC.toHex(CC.chachaBlock(key, nonce, 1).slice(0, 16)) === '10F1E7E4D13B5915500FDD1FA32071C4'; } },
  { name: 'ElGamal: the Handbook of Applied Cryptography example (p = 2357, g = 2, x = 1751, k = 1520) sends m = 2035 as (1430, 697) and gets 2035 back; and a 521-bit round trip with a fresh k each time', fn: function () {
      var e = CC.elgSmall(), k = { p: CC.elgDefaultP, g: '3', x: '2026043118', k: '' }, c = CC.byId.elgamal.enc('Larry', k), c2 = CC.byId.elgamal.enc('Larry', k);
      return e.y === 1185n && e.c1 === 1430n && e.c2 === 697n && e.m === 2035n && CC.byId.elgamal.dec(c, k) === 'Larry' && c !== c2; } },
  { name: 'Hebern: the rotor turns once per letter, so its 26 alphabets repeat exactly every 26 letters, and the same settings decipher', fn: function () {
      var k = { wiring: 'RYJGMOPKTLWBIZNUDXQASFVECH', pos: 'A' }, p = 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG', t = p + p, c = CC.hebernRun(Array(53).join('A'), k, 1), c2 = CC.hebernRun('AB', { wiring: k.wiring, pos: 'C' }, 1);
      return c.slice(0, 26) === c.slice(26, 52) && c.slice(0, 13) !== c.slice(13, 26) && c2 === c.slice(2, 3) + CC.hebernRun('B', { wiring: k.wiring, pos: 'D' }, 1) && CC.hebernRun(CC.hebernRun(t, k, 1), k, -1) === t; } }
);

/* groups for the new entries */
var gm = CC.groupMode;
CC.groupMode = function (d, k) {
  var m = { kamasutra: 'upper', amsco: 'upper', fracmorse: 'upper', porta: 'upper', gronsfeld: 'upper', quagmire3: 'upper', hebern: 'upper',
    nihilist: 'Nihilist numbers have two or three figures, so they are not put into groups.', des: 'case', chacha20: 'case',
    elgamal: 'ElGamal ciphertext is two numbers, so it is not put into groups.' }[d.id];
  return m || gm(d, k);
};

if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
