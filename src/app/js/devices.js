/* Codes & Ciphers Studio engine - by Larry Dalton
   Version 1.1: cipher wheels and devices (chapter 14), ADFGVX (chapter 5), Hill (chapter 6) */
(function (G) {
'use strict';
var CC = G.CC, AZ = CC.AZ, mod = CC.mod;
CC.chapters[14] = 'Cipher wheels and devices';
var range = function (a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; };
var isPerm = function (s, alpha) { return s.length === alpha.length && alpha.split('').every(function (c) { return s.indexOf(c) >= 0; }); };

/* =====================================================================
   Number wheels: Mexican Army cipher (four rings of numbers under A-Z)
   and the Janelle cipher (four rings of 40 under 40 characters).
   Every character has one number on each ring; any of them may be sent.
   ===================================================================== */
CC.numWheels = {
  mexican: { outer: AZ, rings: [range(1, 26), range(27, 52), range(53, 78), range(79, 100).concat([null, null, null, null])] },
  janelle: { outer: '1234567890@ABCDEF#GHIJKL/MNOPQR.STUVWXYZ', rings: [range(121, 160), range(81, 120), range(41, 80), range(1, 40)] }
};
CC.numLabel = function (id, n) { return id === 'mexican' ? (n === 100 ? '00' : ('0' + n).slice(-2)) : String(n); };
/* where each ring's first number sits: the outer position index of ring[r][0] */
CC.numStarts = function (id, k) {
  var W = CC.numWheels[id], n = W.outer.length;
  if (id === 'mexican') {
    var key = CC.letters(k.key || 'AAAA');
    if (key.length !== 4) throw new Error('The key is four letters: the letter above 01, 27, 53 and 79 (for example AAAA or LOVE).');
    return key.split('').map(function (c) { return AZ.indexOf(c); });
  }
  var nums = String(k.key || '').match(/\d+/g) || [];
  if (nums.length !== 4) throw new Error('The key is the four numbers that sit under A, one from each ring (outer ring first), for example 145 88 67 30.');
  var A = W.outer.indexOf('A');
  return nums.map(function (x, r) {
    var i = W.rings[r].indexOf(+x);
    if (i < 0) throw new Error(x + ' is not on ring ' + (r + 1) + ' (that ring holds ' + W.rings[r][0] + ' to ' + W.rings[r][n - 1] + ').');
    return mod(A - i, n);
  });
};
/* the numbers under outer position i */
CC.numColumn = function (id, starts, i) {
  var W = CC.numWheels[id], n = W.outer.length;
  return W.rings.map(function (R, r) { return R[mod(i - starts[r], n)]; });
};
function numEnc(id) {
  return function (s, k) {
    var W = CC.numWheels[id], st = CC.numStarts(id, k), out = [], words = [];
    var t = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    t.split(/\s+/).forEach(function (w) {
      var o = [];
      Array.from(w).forEach(function (c) {
        var i = W.outer.indexOf(c); if (i < 0) return;
        var col = CC.numColumn(id, st, i).filter(function (x) { return x !== null; });
        o.push(CC.numLabel(id, col[CC.rand(col.length)]));
      });
      if (o.length) words.push(o.join(' '));
    });
    return id === 'mexican' ? words.join(' ') : words.join(' / ');
  };
}
function numDec(id) {
  return function (s, k) {
    var W = CC.numWheels[id], st = CC.numStarts(id, k), n = W.outer.length;
    var lookup = function (v) {
      for (var r = 0; r < 4; r++) { var j = W.rings[r].indexOf(v); if (j >= 0) return W.outer[mod(j + st[r], n)]; }
      return '?';
    };
    if (id === 'mexican') return (String(s).replace(/\D/g, '').match(/\d\d/g) || []).map(function (p) { return lookup(p === '00' ? 100 : +p); }).join('');
    return String(s).split('/').map(function (w) { return (w.match(/\d+/g) || []).map(function (x) { return lookup(+x); }).join(''); }).filter(Boolean).join(' ');
  };
}
CC.reg({ id: 'mexican', ch: 14, name: 'Mexican Army cipher wheel', kind: 'cipher', object: 'numwheel',
  keys: [{ id: 'key', label: 'Key: the letters above 01, 27, 53 and 79', type: 'text', def: 'LOVE' }],
  about: 'A disk used by the Mexican Army in the early 1900s. Around A to Z sit four turning rings numbered 01-26, 27-52, 53-78 and 79-00 (with four blank places). Each letter can be sent as any of the four numbers under it, so the same letter keeps changing. The key says where each ring is turned to.',
  enc: numEnc('mexican'), dec: numDec('mexican'), random: true,
  vectors: [{ k: { key: 'AAAA' }, p: 'DCODE', c: '56 81 15 82 31', dir: 'dec', src: 'dCode Mexican Army cipher wheel page' }],
  sample: 'Attack at dawn'
});
CC.reg({ id: 'janelle', ch: 14, name: 'Janelle cipher (number wheel)', kind: 'cipher', object: 'numwheel',
  keys: [{ id: 'key', label: 'Key: the numbers under A, outer ring first', type: 'text', def: '145 88 67 30' }],
  about: 'A modern wooden wheel by Creative Crafthouse built on the Mexican Army idea, but larger: 40 characters (letters, digits and @ # . /) over four turning rings of 40 numbers (121-160, 81-120, 41-80 and 1-40). Each character can be sent as any of its four numbers. 40 x 40 x 40 x 40 = 2,560,000 settings. Words are separated by a slash here.',
  enc: numEnc('janelle'), dec: numDec('janelle'), random: true,
  sample: 'Send help to 738 Main St.'
});

/* =====================================================================
   Enigma slide cipher (Creative Crafthouse): a slide rule worked as a Vigenere.
   The maker does not publish the method; this is the studio's reading of the rows on the slide.
   ===================================================================== */
CC.slideRows = { symbols: '1@2$3&?4+-5/6;7()=89!#0%:.', mixed: 'ZWXYTSVUPQRLNMOKGIHJEFBCDA' };
CC.slideRun = function (s, k, dir) {
  var K = CC.letters(k.key || '') || 'A', j = 0, SY = CC.slideRows.symbols, MX = CC.slideRows.mixed, out = '';
  Array.from(String(s)).forEach(function (ch) {
    var up = ch.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), kk = AZ.indexOf(K[j % K.length]);
    if (dir > 0) {
      if (/^[A-Z]$/.test(up)) { out += AZ[mod(AZ.indexOf(up) - kk, 26)]; j++; }
      else if (SY.indexOf(ch) >= 0) { out += MX[mod(SY.indexOf(ch) - kk, 26)].toLowerCase(); j++; }
      else if (/\s/.test(ch)) out += ch;
    } else {
      if (/^[A-Z]$/.test(ch)) { out += AZ[mod(AZ.indexOf(ch) + kk, 26)]; j++; }
      else if (/^[a-z]$/.test(ch)) { out += SY[mod(MX.indexOf(ch.toUpperCase()) + kk, 26)]; j++; }
      else if (/\s/.test(ch)) out += ch;
    }
  });
  return out;
};
CC.reg({ id: 'slide', ch: 14, name: 'Enigma slide cipher', kind: 'cipher', object: 'slide',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'SLIDE' }],
  about: 'A wooden slide rule sold by Creative Crafthouse that works as a Vigenere cipher and also carries digits and punctuation. The maker keeps the instructions in the box, so this is the studio\'s reading of the rows: for each character, slide the A of the code rows under the next key letter. A message letter on the top row is read straight down on the plain code row; a digit or sign on the bottom row is read straight up on the mixed code row and written as a small letter, so the reader knows to look it up on the bottom row. To decipher, find the cipher letter on its code row and read the top (or bottom) row.',
  enc: function (s, k) { return CC.slideRun(s, k, 1); }, dec: function (s, k) { return CC.slideRun(s, k, -1); },
  sample: 'Meet at 7:30 (gate 4)!'
});

/* =====================================================================
   Heath's deciphering dice (Royal V. Heath, about 1927): a lightning-addition trick.
   Every face on a die equals that die's constant minus 99 x its last digit, and the five constants add up to 5000,
   so the total is (50 - sum of the last digits) x 100 + sum of the last digits.
   ===================================================================== */
CC.heath = { consts: [780, 840, 1350, 960, 1070], units: [[0, 1, 2, 3, 4, 5], [0, 2, 3, 5, 6, 7], [4, 5, 6, 7, 8, 9], [1, 3, 4, 6, 7, 8], [1, 2, 4, 6, 8, 9]] };
CC.heath.faces = CC.heath.consts.map(function (c, d) { return CC.heath.units[d].map(function (u) { return c - 99 * u; }); });
CC.heathTotal = function (nums) {
  var S = nums.reduce(function (a, n) { return a + n % 10; }, 0);
  return { units: S, quick: (50 - S) * 100 + S, real: nums.reduce(function (a, n) { return a + n; }, 0) };
};
CC.reg({ id: 'heath', ch: 14, name: 'Heath\'s deciphering dice', kind: 'tool', object: 'dice',
  about: 'A 1927 lightning-calculation trick by the magician Royal V. Heath. Five dice carry three-digit numbers; roll them and the performer names the total at a glance: add the last digits, take that from 50, and write the two numbers side by side (last digits 18: 50 - 18 = 32, total 3218). The faces here are the studio\'s own set built on Heath\'s rule.',
  enc: function (s) {
    var nums = (String(s).match(/\d+/g) || []).map(Number);
    if (nums.length !== 5) throw new Error('Type the five numbers on top of the dice (or press Roll on the dice above).');
    var bad = nums.filter(function (n, d) { return CC.heath.faces.every(function (f) { return f.indexOf(n) < 0; }); });
    var t = CC.heathTotal(nums);
    CC.byId.heath.lastNote = 'Last digits ' + nums.map(function (n) { return n % 10; }).join(' + ') + ' = ' + t.units + '; 50 - ' + t.units + ' = ' + (50 - t.units) + '; so the total is ' + t.quick + '.' +
      (bad.length ? ' Note: ' + bad.join(', ') + (bad.length > 1 ? ' are' : ' is') + ' not on these dice, so the trick does not apply' + (t.quick === t.real ? ' (it happens to work anyway).' : ': the real total is ' + t.real + '.') : ' Checked by ordinary addition: ' + t.real + '.');
    return String(bad.length ? t.real : t.quick);
  },
  dec: function (s) {
    var T = +(String(s).match(/\d+/) || [0])[0], S = T % 100, ok = Math.floor(T / 100) === 50 - S;
    CC.byId.heath.lastNote = ok ? 'The last two figures (' + S + ') are the sum of the last digits on top, and the first figures are 50 - ' + S + '. Every total these dice can make has this shape.' : 'This total cannot come from these dice: the first figures should be 50 minus the last two.';
    return ok ? 'last digits add up to ' + S : 'not a dice total';
  },
  sample: '483 840 756 168 971'
});

/* =====================================================================
   Alphabet wheels: a ring of another script around a turning ring of letters.
   Turn the wheel (the shift) to encipher; at 0 it simply writes the letters in that script.
   ===================================================================== */
var BR = Array.from('⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵');
CC.scripts = {
  braille: { name: 'Braille', letters: 'ABCDEFGHIJKLMNOPQRSTUVXYZW', ring: 'ABCDEFGHIJKLMNOPQRSTUVXYZW'.split('').map(function (c) { return BR[AZ.indexOf(c)]; }), font: '' },
  runes: { name: 'Runes', letters: AZ, ring: Array.from('ᚨᛒᚳᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᛩᚱᛊᛏᚢᚡᚹᛪᚣᛉ'), font: 'CCRunic' },
  tengwar: { name: 'Tengwar', letters: AZ, ring: [0xE017, 0xE005, 0xE002, 0xE004, 0xE02A, 0xE009, 0xE007, 0xE028, 0xE02C, 0xE006, 0xE003, 0xE022, 0xE011, 0xE010, 0xE016, 0xE001, 0xE00F, 0xE020, 0xE024, 0xE000, 0xE02B, 0xE00D, 0xE015, 0xE00A, 0xE014, 0xE026].map(function (c) { return String.fromCharCode(c); }), font: 'CCTengwar' },
  pharaoh: { name: 'Hieroglyphs', letters: AZ, ring: Array.from('𓄿𓃀𓍿𓂧𓇋𓆑𓎼𓉔𓇌𓆓𓎡𓃭𓅓𓈖𓍯𓊪𓈎𓂋𓋴𓏏𓅱𓎛𓏲𓐍𓏭𓊃'), font: 'CCHiero' },
  ogham: { name: 'Ogham', letters: 'BLFSNHDTCQMGZRAOUEIP', ring: Array.from('ᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚎᚏᚐᚑᚒᚓᚔᚚ'), font: 'CCOgham', fold: { J: 'I', K: 'C', V: 'F', W: 'U', X: 'CS', Y: 'I' } },
  theban: { name: 'Theban', letters: 'ABCDEFGHIKLMNOPQRSTVXYZ', ring: range(0, 22).map(function (i) { return String.fromCharCode(0xE100 + i); }), font: 'CCTheban', fold: { J: 'I', U: 'V', W: 'VV' } }
};
CC.scriptFold = function (S, s) {
  var t = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (S.fold) t = t.replace(/[A-Z]/g, function (c) { return S.fold[c] || c; });
  return t;
};
CC.scriptShift = function (S, k) { return mod(+k.shift || 0, S.letters.length); };
CC.scriptIndex = function (S, k, i) { var n = S.letters.length, sh = CC.scriptShift(S, k); return k.dir === 'rev' ? mod(sh - i, n) : mod(i + sh, n); };
CC.scriptInverse = function (S, k, j) { var n = S.letters.length, sh = CC.scriptShift(S, k); return k.dir === 'rev' ? mod(sh - j, n) : mod(j - sh, n); };
function scriptReg(id, o) {
  var S = CC.scripts[id];
  var keys = [{ id: 'shift', label: 'Turn the letter ring (0 = plain ' + S.name + ')', type: 'number', def: o.def || 0, min: 0, max: S.letters.length - 1 }];
  if (id === 'braille') keys.push({ id: 'dir', label: 'Rings', type: 'select', def: 'same', options: [['same', 'Both rings run the same way'], ['rev', 'Braille ring runs the other way (as on the wooden Braille wheel)']] });
  CC.reg(Object.assign({ id: id, ch: 14, kind: 'cipher', object: 'scriptwheel', script: id, keys: keys,
    enc: function (s, k) {
      var t = CC.scriptFold(S, s), out = '', num = false;
      Array.from(t).forEach(function (c) {
        if (id === 'braille' && /[0-9]/.test(c)) { if (!num) { out += '⠼'; num = true; } out += BR[(+c + 9) % 10]; return; }
        if (id === 'braille' && num && /[A-J]/.test(c)) out += '⠰';
        num = false;
        var i = S.letters.indexOf(c);
        if (i >= 0) out += S.ring[CC.scriptIndex(S, k, i)];
        else if (/\s/.test(c)) out += id === 'ogham' ? ' ' : ' ';
        else if (id === 'braille' && /[.,?!]/.test(c)) out += { '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖' }[c];
      });
      return id === 'ogham' ? '᚛' + out.replace(/^ +| +$/g, '') + '᚜' : out;
    },
    dec: function (s, k) {
      var out = '', num = false;
      Array.from(String(s)).forEach(function (c) {
        if (id === 'braille') {
          if (c === '⠼') { num = true; return; }
          if (c === '⠰') { num = false; return; }
          if (num && BR.indexOf(c) >= 0 && BR.indexOf(c) < 10) { out += '1234567890'[BR.indexOf(c)]; return; }
          num = false;
          var pu = { '⠲': '.', '⠂': ',', '⠦': '?', '⠖': '!' }[c]; if (pu) { out += pu; return; }
        }
        var j = S.ring.indexOf(c);
        if (j >= 0) out += S.letters[CC.scriptInverse(S, k, j)];
        else if (c === ' ' || c === ' ' || c === '\n') out += ' ';
      });
      return out.trim();
    }
  }, o));
}
scriptReg('braille', { name: 'Braille cipher wheel', sample: 'Read with your fingers',
  about: 'Louis Braille\'s six-dot letters around a ring of print letters. At 0 it writes ordinary Braille (with the number sign for digits); turn the ring to make a Braille Caesar cipher. As in Braille\'s original 1829 alphabet, W comes last, after Z, because French did not need it. The wooden Braille wheel runs its Braille ring the opposite way, which makes a reversed, self-undoing cipher.',
  vectors: [{ k: { shift: 0, dir: 'same' }, p: 'braille', c: '⠃⠗⠁⠊⠇⠇⠑', src: 'standard Braille alphabet' }] });
scriptReg('runes', { name: 'Runes cipher wheel', sample: 'Odin gave his eye for wisdom', def: 3,
  about: 'Runes around a turning ring of letters. Each letter has its own rune: the Elder Futhark for most, with Anglo-Saxon runes for C, Q, Y and X, and the later rune for V, so all 26 letters differ (the studio\'s table; real runic spelling went by sound). Turn the ring to shift the runes.' });
scriptReg('tengwar', { name: 'Elvish (Tengwar) cipher wheel', sample: 'Not all those who wander are lost', def: 5,
  about: 'J.R.R. Tolkien\'s Tengwar, the "elvish" letters of The Lord of the Rings, around a turning ring of letters. Real Tengwar is written by sound, with vowels as marks over the consonants; a cipher wheel needs one sign per letter, so the studio gives each English letter its own tengwa (consonants by their usual sound, vowels as full letters). Font: Alcarin Tengwar by Toshi Omagari (SIL Open Font License).' });
scriptReg('pharaoh', { name: 'Pharaoh\'s hieroglyph cipher wheel', sample: 'Tutankhamun', def: 4,
  about: 'Egyptian one-sound hieroglyphs around a turning ring of letters, as on souvenir "pharaoh" cipher wheels. Egyptian had no vowels or letters like C, V and X as such, so the table matches each English letter to the nearest sign and gives every letter a different one (the studio\'s choice). Font: NewGardiner by Mark-Jan Nederhof (SIL Open Font License).' });
scriptReg('ogham', { name: 'Ogham cipher wheel', sample: 'The oak and the hazel', def: 2,
  about: 'Ogham, the early Irish alphabet of strokes cut along the edge of a stone (about AD 400). Its 20 letters plus peith (P) sit around a turning ring; J, K, V, W, X and Y become I, C, F, U, CS and I. Each message is closed with the feather marks ᚛ ᚜. Font: Noto Sans Ogham (SIL Open Font License).' });
scriptReg('theban', { name: 'Theban alphabet cipher wheel', sample: 'Witches alphabet', def: 0,
  about: 'The Theban or "witches\'" alphabet, first printed by Johannes Trithemius in 1518 and by Agrippa in 1533: 23 letters, with I for J, V for U and VV for W. Theban has no Unicode letters, so the result uses the studio\'s own Theban font (drawn from public-domain outlines) in a private part of Unicode; copy it into another program and it will only look right with that font.' });

/* =====================================================================
   Confederate cipher disk: the Vigenere ("Vicksburg") system worked on a brass disk, key phrases of the Signal Corps
   ===================================================================== */
CC.reg({ id: 'csa', ch: 14, name: 'Confederate Army cipher disk', kind: 'cipher', object: 'csa',
  keys: [{ id: 'key', label: 'Key phrase', type: 'select', def: 'MANCHESTER BLUFF', options: [['MANCHESTER BLUFF', 'Manchester Bluff'], ['COMPLETE VICTORY', 'Complete Victory'], ['COME RETRIBUTION', 'Come Retribution'], ['custom', 'My own key phrase (below)']] },
         { id: 'own', label: 'Own key phrase', type: 'text', def: 'RICHMOND' }],
  about: 'The Confederate Signal Corps (1861-65) enciphered with the Vigenere system on a small brass disk of two alphabets made by F. LaBarre of Richmond. Their best known key phrases were Manchester Bluff, Complete Victory and Come Retribution. Like the Confederates, the studio keeps the gaps between words, which made their messages much easier for Union codebreakers.',
  phrase: function (k) { return CC.letters(k.key === 'custom' ? k.own : k.key) || 'A'; },
  enc: function (s, k) { var K = this.phrase(k), j = 0; return CC.mapText(String(s).toUpperCase(), function (c, i) { return AZ[mod(i + AZ.indexOf(K[j++ % K.length]), 26)]; }).replace(/[^A-Z\s]/g, ''); },
  dec: function (s, k) { var K = this.phrase(k), j = 0; return CC.mapText(String(s).toUpperCase(), function (c, i) { return AZ[mod(i - AZ.indexOf(K[j++ % K.length]), 26)]; }).replace(/[^A-Z\s]/g, ''); },
  vectors: [{ k: { key: 'custom', own: 'LEMON' }, p: 'ATTACK AT DAWN', c: 'LXFOPV EF RNHR', src: 'standard Vigenere example (key LEMON), with the word gaps kept' }],
  sample: 'Send ammunition to Vicksburg'
});

/* =====================================================================
   Jefferson wheel cypher / US Army M-94: 25 lettered disks on a rod. The order of the disks is the key.
   Line up the message along one row, then send any other row; the reader lines up that row and looks for the one that reads.
   Disk alphabets: the M-94 (1922), as listed in the M-94 identification matrix (George Mace, via jproc.ca).
   ===================================================================== */
CC.m94 = ['ABCEIGDJFVUYMHTQKZOLRXSPWN', 'ACDEHFIJKTLMOUVYGZNPQXRWSB', 'ADKOMJUBGEPHSCZINXFYQRTVWL', 'AEDCBIFGJHLKMRUOQVPTNWYXZS', 'AFNQUKDOPITJBRHCYSLWEMZVXG',
  'AGPOCIXLURNDYZHWBJSQFKVMET', 'AHXJEZBNIKPVROGSYDULCFMQTW', 'AIHPJOBWKCVFZLQERYNSUMGTDX', 'AJDSKQOIVTZEFHGYUNLPMBXWCR', 'AKELBDFJGHONMTPRQSVZUXYWIC',
  'ALTMSXVQPNOHUWDIZYCGKRFBEJ', 'AMNFLHQGCUJTBYPZKXISRDVEWO', 'ANCJILDHBMKGXUZTSWQYVORPFE', 'AODWPKJVIUQHZCTXBLEGNYRSMF', 'APBVHIYKSGUENTCXOWFQDRLJZM',
  'AQJNUBTGIMWZRVLXCSHDEOKFPY', 'ARMYOFTHEUSZJXDPCWGQIBKLNV', 'ASDMCNEQBOZPLGVJRKYTFUIWXH', 'ATOJYLFXNGWHVCMIRBSEKUPDZQ', 'AUTRZXQLYIOVBPESNHJWMDGFCK',
  'AVNKHRGOXEYBFSJMUDQCLZWTIP', 'AWVSFDLIEBHKNRJQZGMXPUCOTY', 'AXKWREVDTUFOYHMLSIQNJCPGBZ', 'AYJPXMVKBQWUGLOSTECHNZFRID', 'AZDNBUHYFWJLVGRCQMPSOEXTKI'];
CC.m94.forEach(function (d, i) { if (!isPerm(d, AZ)) throw new Error('M-94 disk ' + (i + 1) + ' is not a full alphabet'); });
CC.m94Order = function (k) {
  var ids = 'BCDEFGHIJKLMNOPQRSTUVWXYZ', o = CC.keyAlpha(CC.letters(k.key || ''), ids);
  return o.split('').map(function (c) { return ids.indexOf(c); });
};
CC.m94Run = function (t, k, row, dir) {
  var ord = CC.m94Order(k), o = '';
  for (var i = 0; i < t.length; i++) { var D = CC.m94[ord[i % 25]]; o += D[mod(D.indexOf(t[i]) + dir * row, 26)]; }
  return o;
};
CC.reg({ id: 'jefferson', ch: 14, name: 'Jefferson wheel cypher (M-94)', kind: 'cipher', object: 'cylinder',
  keys: [{ id: 'key', label: 'Disk order keyword (disks are named B to Z)', type: 'text', def: 'MONTICELLO' },
         { id: 'row', label: 'Send the row this far round (1-25; 0 when deciphering = find the readable row)', type: 'number', def: 7, min: 0, max: 25 }],
  about: 'Thomas Jefferson described a cylinder of lettered wooden disks in the 1790s; Étienne Bazeries reinvented it in 1891 and the US Army used it as the M-94 from 1922 to the 1940s. Each disk has the alphabet in a different order. Turn the disks until the message reads along one row, then send any other row. The reader turns his disks to that row and looks round the cylinder for the one row that makes sense. Jefferson\'s own disk alphabets were never recorded, so the studio uses the 25 disks of the M-94.',
  enc: function (s, k) {
    var t = CC.letters(s), row = mod(+k.row || 0, 26) || 1, o = CC.m94Run(t, k, row, 1);
    return (o.match(/.{1,25}/g) || []).join(' ');
  },
  dec: function (s, k) {
    var t = CC.letters(s), row = +k.row || 0;
    if (row) return CC.m94Run(t, k, mod(row, 26), -1);
    var out = '', blocks = t.match(/.{1,25}/g) || [], rows = [];
    blocks.forEach(function (b) {
      var best = null; for (var r = 1; r < 26; r++) { var p = CC.m94Run(b, k, r, -1), f = CC.fitness(p); if (!best || f > best.f) best = { r: r, p: p, f: f }; }
      out += best.p; rows.push(best.r);
    });
    CC.byId.jefferson.lastNote = 'The readable row was found ' + rows.join(', ') + ' place' + (rows.length > 1 || rows[0] !== 1 ? 's' : '') + ' round (one number per block of 25), by scoring each row against English.';
    return out;
  },
  sample: 'We hold these truths to be self evident'
});

/* =====================================================================
   ADFGVX (German Army, 1918) and ADFGX: a keyed Polybius square with the labels ADFGVX, then a columnar transposition
   ===================================================================== */
CC.adfgvxSquare = function (k) {
  var six = k.variant !== 'ADFGX', alpha = six ? AZ + '0123456789' : 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  var raw = String(k.square || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!six) raw = raw.replace(/J/g, 'I').replace(/[0-9]/g, '');
  return isPerm(raw, alpha) ? raw : CC.keyAlpha(raw, alpha);
};
CC.adfgvxPrep = function (s, k) { var t = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, ''); return k.variant === 'ADFGX' ? t.replace(/J/g, 'I').replace(/[0-9]/g, '') : t; };
CC.reg({ id: 'adfgvx', ch: 5, name: 'ADFGVX (German Army, 1918)', kind: 'cipher', object: 'adfgvx',
  keys: [{ id: 'variant', label: 'Version', type: 'select', def: 'ADFGVX', options: [['ADFGVX', 'ADFGVX: 6 x 6, letters and digits (June 1918)'], ['ADFGX', 'ADFGX: 5 x 5, I and J together (March 1918)']] },
         { id: 'square', label: 'Square: keyword, or all 36 (or 25) characters in order', type: 'text', def: 'NA1C3H8TB2OME5WRPD4F6G7I9J0KLQSUVXYZ' },
         { id: 'key', label: 'Transposition keyword', type: 'text', def: 'PRIVACY' }],
  about: 'Fritz Nebel\'s field cipher for the 1918 German spring offensive. Each character becomes two letters from A D F G V X (its row and column in a mixed square), chosen because they sound unlike in Morse. The letter pairs are then written under a keyword and the columns sent in alphabetical order of the keyword. Georges Painvin broke it in June 1918 with days of sleepless work.',
  pairs: function (s, k) { var Q = CC.adfgvxSquare(k), L = k.variant === 'ADFGX' ? 'ADFGX' : 'ADFGVX', n = L.length; return CC.adfgvxPrep(s, k).split('').map(function (c) { var i = Q.indexOf(c); return L[Math.floor(i / n)] + L[i % n]; }).join(''); },
  enc: function (s, k) {
    var mid = this.pairs(s, k), key = CC.letters(k.key) || 'A', n = key.length, ord = CC.keyOrder(key), cols = [];
    for (var c = 0; c < n; c++) { var col = ''; for (var i = c; i < mid.length; i += n) col += mid[i]; cols[ord[c]] = col; }
    return cols.join('');
  },
  dec: function (s, k) {
    var t = String(s).toUpperCase().replace(/[^ADFGVX]/g, ''), key = CC.letters(k.key) || 'A', n = key.length, ord = CC.keyOrder(key);
    var rows = Math.ceil(t.length / n), extra = t.length % n || n, lens = [], cols = [], p = 0, c;
    for (c = 0; c < n; c++) lens[c] = rows - (c < extra ? 0 : 1);
    var byRank = []; for (c = 0; c < n; c++) byRank[ord[c]] = c;
    byRank.forEach(function (col) { cols[col] = t.substr(p, lens[col]); p += lens[col]; });
    var mid = ''; for (var r = 0; r < rows; r++) for (c = 0; c < n; c++) if (cols[c][r]) mid += cols[c][r];
    var Q = CC.adfgvxSquare(k), L = k.variant === 'ADFGX' ? 'ADFGX' : 'ADFGVX', m = L.length, out = '';
    for (var i = 0; i + 1 < mid.length; i += 2) out += Q[L.indexOf(mid[i]) * m + L.indexOf(mid[i + 1])];
    return out;
  },
  vectors: [{ k: { variant: 'ADFGVX', square: 'NA1C3H8TB2OME5WRPD4F6G7I9J0KLQSUVXYZ', key: 'PRIVACY' }, p: 'ATTACK AT 1200AM', c: 'DGDDDAGDDGAFADDFDADVDVFAADVX', src: 'Wikipedia ADFGVX example' }],
  sample: 'Attack at 1200am'
});

/* =====================================================================
   Hill cipher (Lester Hill, 1929): blocks of letters multiplied by a key matrix, modulo 26
   ===================================================================== */
CC.hillMatrix = function (k) {
  var t = CC.letters(k.key), n = t.length === 9 ? 3 : t.length === 4 ? 2 : 0;
  if (!n) throw new Error('The key is 4 letters (a 2 x 2 matrix) or 9 letters (a 3 x 3 matrix).');
  var M = []; for (var r = 0; r < n; r++) { M.push([]); for (var c = 0; c < n; c++) M[r].push(AZ.indexOf(t[r * n + c])); }
  return M;
};
CC.det = function (M) { return M.length === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0] : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]); };
CC.modInv = function (a, m) { a = mod(a, m); for (var x = 1; x < m; x++) if ((a * x) % m === 1) return x; return 0; };
CC.hillInverse = function (M) {
  var n = M.length, d = CC.modInv(CC.det(M), 26);
  if (!d) throw new Error('This key cannot be undone: its determinant (' + mod(CC.det(M), 26) + ') shares a factor with 26. Try another key.');
  if (n === 2) return [[mod(M[1][1] * d, 26), mod(-M[0][1] * d, 26)], [mod(-M[1][0] * d, 26), mod(M[0][0] * d, 26)]];
  var C = [[], [], []];
  for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
    var m = []; for (var i = 0; i < 3; i++) if (i !== r) { var row = []; for (var j = 0; j < 3; j++) if (j !== c) row.push(M[i][j]); m.push(row); }
    C[c][r] = mod(((r + c) % 2 ? -1 : 1) * (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * d, 26);
  }
  return C;
};
CC.hillApply = function (M, t) {
  var n = M.length, o = '';
  for (var b = 0; b < t.length; b += n) for (var r = 0; r < n; r++) { var s = 0; for (var c = 0; c < n; c++) s += M[r][c] * AZ.indexOf(t[b + c]); o += AZ[mod(s, 26)]; }
  return o;
};
CC.reg({ id: 'hill', ch: 6, name: 'Hill cipher', kind: 'cipher', object: 'hill',
  keys: [{ id: 'key', label: 'Key: 4 letters (2 x 2) or 9 letters (3 x 3)', type: 'text', def: 'HILL' }],
  about: 'Lester Hill\'s 1929 cipher, the first to use algebra: the letters are numbered A = 0 to Z = 25, taken two or three at a time, and multiplied by a square of key numbers; everything is counted round 26. Deciphering uses the inverse square, which only exists for some keys. A short message is filled out with X.',
  enc: function (s, k) { var M = CC.hillMatrix(k), n = M.length, t = CC.letters(s); while (t.length % n) t += 'X'; CC.hillInverse(M); return CC.hillApply(M, t); },
  dec: function (s, k) { var M = CC.hillMatrix(k), n = M.length, t = CC.letters(s); while (t.length % n) t += 'X'; return CC.hillApply(CC.hillInverse(M), t); },
  vectors: [{ k: { key: 'GYBNQKURP' }, p: 'ACT', c: 'POH', src: 'Wikipedia Hill cipher example' }, { k: { key: 'GYBNQKURP' }, p: 'CAT', c: 'FIN', src: 'Wikipedia Hill cipher example' }],
  sample: 'Short example'
});

/* =====================================================================
   Chaocipher (John F. Byrne, 1918; method published 2010): two alphabets that are stirred after every letter
   ===================================================================== */
/* a wheel is 26 letters in any order; a shorter keyword is filled out with the rest of the alphabet */
CC.chaoWheel = function (w) { var t = CC.letters(w); return isPerm(t, AZ) ? t : CC.keyAlpha(t); };
CC.chaoRun = function (s, k, dir) {
  var L = CC.chaoWheel(k.left), R = CC.chaoWheel(k.right);
  var out = '', trace = [];
  CC.letters(s).split('').forEach(function (ch) {
    var i = dir > 0 ? R.indexOf(ch) : L.indexOf(ch), c = dir > 0 ? L[i] : R[i];
    trace.push({ L: L, R: R, i: i, p: dir > 0 ? ch : c, c: dir > 0 ? c : ch });
    out += c;
    L = L.slice(i) + L.slice(0, i); L = L[0] + L.slice(2, 14) + L[1] + L.slice(14);
    R = R.slice(i) + R.slice(0, i); R = R.slice(1) + R[0]; R = R.slice(0, 2) + R.slice(3, 14) + R[2] + R.slice(14);
  });
  CC.chaoTrace = trace;
  return out;
};
CC.reg({ id: 'chaocipher', ch: 14, name: 'Chaocipher', kind: 'cipher', object: 'chao',
  keys: [{ id: 'left', label: 'Left (cipher) wheel: 26 letters, or a keyword', type: 'text', def: 'HXUCZVAMDSLKPEFJRIGTWOBNYQ' }, { id: 'right', label: 'Right (plain) wheel: 26 letters, or a keyword', type: 'text', def: 'PTLNBQDEOYSFAVZKGJRIHWXUMC' }],
  about: 'John F. Byrne invented Chaocipher in 1918 and offered it to the US government for decades; nobody broke his challenge messages, and the method stayed secret until his family gave it to the National Cryptologic Museum in 2010. Two wheels of letters sit side by side. Find the letter on the right wheel, read the one beside it on the left, then shuffle both wheels in a fixed way before the next letter.',
  enc: function (s, k) { return CC.chaoRun(s, k, 1); }, dec: function (s, k) { return CC.chaoRun(s, k, -1); },
  vectors: [{ k: {}, p: 'WELLDONEISBETTERTHANWELLSAID', c: 'OAHQHCNYNXTSZJRRHJBYHQKSOUJY', src: 'Rubin\'s 2010 paper on Chaocipher' }],
  sample: 'Well done is better than well said'
});

/* =====================================================================
   Solitaire (Bruce Schneier, 1999, for Neal Stephenson's Cryptonomicon): a key stream made by shuffling a pack of cards
   Cards 1-52 (clubs, diamonds, hearts, spades), 53 = joker A, 54 = joker B.
   ===================================================================== */
CC.solStep = function (d) {
  var move = function (card, n) { for (var s = 0; s < n; s++) { var i = d.indexOf(card); if (i === d.length - 1) { d.splice(i, 1); d.splice(1, 0, card); } else { d[i] = d[i + 1]; d[i + 1] = card; } } };
  move(53, 1); move(54, 2);
  var a = d.indexOf(53), b = d.indexOf(54), t = Math.min(a, b), u = Math.max(a, b);
  var nd = d.slice(u + 1).concat(d.slice(t, u + 1), d.slice(0, t)); d.length = 0; Array.prototype.push.apply(d, nd);
  CC.solCount(d, d[53]);
};
CC.solCount = function (d, v) { v = Math.min(v, 53); var top = d.slice(0, v), rest = d.slice(v, 53); var nd = rest.concat(top, [d[53]]); d.length = 0; Array.prototype.push.apply(d, nd); };
CC.solDeck = function (k) {
  var d = range(1, 54);
  CC.letters(k.key || '').split('').forEach(function (c) { CC.solStep(d); CC.solCount(d, AZ.indexOf(c) + 1); });
  return d;
};
CC.solStream = function (k, n, trace) {
  var d = CC.solDeck(k), out = [];
  while (out.length < n) {
    CC.solStep(d);
    var v = d[Math.min(d[0], 53)];
    if (trace) trace.push({ deck: d.slice(), top: d[0], card: v, use: v < 53 });
    if (v < 53) out.push(((v - 1) % 26) + 1);
  }
  return out;
};
CC.reg({ id: 'solitaire', ch: 14, name: 'Solitaire (pack of cards)', kind: 'cipher', object: 'cards',
  keys: [{ id: 'key', label: 'Passphrase that shuffles the pack (blank = new-pack order)', type: 'text', def: 'CRYPTONOMICON' }],
  about: 'Bruce Schneier designed Solitaire for Neal Stephenson\'s novel Cryptonomicon (1999): a cipher you can work in prison with an ordinary pack of cards and two jokers. Moving the jokers, cutting round them and counting down the pack gives one key number at a time, which is added to the message like a one-time pad. Both people must start with the pack in the same order. The message is filled out to a multiple of five with X.',
  enc: function (s, k) { var t = CC.letters(s); while (t.length % 5) t += 'X'; var ks = CC.solStream(k, t.length); return t.split('').map(function (c, i) { return AZ[mod(AZ.indexOf(c) + ks[i], 26)]; }).join(''); },
  dec: function (s, k) { var t = CC.letters(s), ks = CC.solStream(k, t.length); return t.split('').map(function (c, i) { return AZ[mod(AZ.indexOf(c) - ks[i], 26)]; }).join(''); },
  vectors: [{ k: { key: '' }, p: 'AAAAAAAAAA', c: 'EXKYIZSGEH', src: 'Schneier\'s published Solitaire test vectors' },
            { k: { key: 'FOO' }, p: 'AAAAAAAAAAAAAAA', c: 'ITHZUJIWGRFARMW', src: 'Schneier\'s published Solitaire test vectors' },
            { k: { key: 'CRYPTONOMICON' }, p: 'SOLITAIREX', c: 'KIRAKSFJAN', src: 'Schneier\'s published Solitaire test vectors' }],
  sample: 'Do not use PCs'
});

/* groups for the new entries */
var gm = CC.groupMode;
CC.groupMode = function (d, k) {
  var m = {
    mexican: 'digits', janelle: 'Janelle numbers have one to three figures, so they are not put into groups.', slide: 'case', heath: 'A dice total is not put into groups.',
    braille: 'Braille is shown cell by cell, so it is not put into groups.', runes: 'chars', tengwar: 'chars', pharaoh: 'chars', theban: 'chars',
    ogham: 'Ogham is written as one line between feather marks, so it is not put into groups.', csa: 'The Confederates kept the gaps between words, so this is not put into groups.',
    adfgvx: 'upper', hill: 'upper', chaocipher: 'upper', solitaire: 'upper', jefferson: 'upper'
  }[d.id];
  return m || gm(d, k);
};

if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
