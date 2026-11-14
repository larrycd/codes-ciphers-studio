/* Codes & Ciphers Studio - working objects, part 5 (version 1.3) - by Larry Dalton
   Kama Sutra pairs, AMSCO grid, Fractionated Morse, Porta table, Nihilist square, Hebern rotor, DES rounds and ElGamal. */
(function () {
'use strict';
var CC = window.CC, AZ = CC.AZ, mod = CC.mod, OBJ = CC.OBJ;
['kama', 'amsco', 'fracmorse', 'porta', 'nihilist', 'hebern', 'des', 'elgamal'].forEach(function (m) { CC.MOVING[m] = 1; });
var esc = CC.esc || function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
var HI = '#ffd75e', TXT = '#edf0ee', GRN = '#4fb38a', DIM = '#97a3a0', GOLD = '#e8c766';
var hint = function (t) { return '<div class="hint" style="text-align:center">' + t + '</div>'; };
var cell = function (x, y, w, h, ch, on, opt) { opt = opt || {}; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + (on ? HI : opt.bg || '#20262a') + '"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 6) + '" text-anchor="middle" fill="' + (on ? '#111' : opt.fg || TXT) + '" font-family="Consolas" font-size="' + (opt.fs || 17) + '"' + (on ? ' font-weight="bold"' : '') + '>' + esc(ch) + '</text>'; };

/* ======================= Kama Sutra: 13 pairs of letters ======================= */
OBJ.kama = function (host, api) {
  var box = CC.ui.mk(host, '');
  function draw(hl) {
    var P = CC.kamaPairs(api.keys()), T = P[0], B = P[1], cw = 44, W = 13 * cw + 20, h = '<svg viewBox="0 0 ' + W + ' 150" width="' + W + '" style="max-width:100%">';
    for (var i = 0; i < 13; i++) {
      var x = 10 + i * cw, on = hl === i;
      h += cell(x + 4, 14, cw - 8, 34, T[i], on) + '<line x1="' + (x + cw / 2) + '" y1="50" x2="' + (x + cw / 2) + '" y2="98" stroke="' + (on ? HI : '#3a4446') + '" stroke-width="' + (on ? 3 : 1.5) + '"/>' + cell(x + 4, 100, cw - 8, 34, B[i], on, { bg: '#163026', fg: GRN });
    }
    box.innerHTML = h + '</svg>' + hint('Each letter is joined to its partner. To encipher or decipher, swap every letter for the one at the other end of its line.');
  }
  var seq = function () { return CC.letters(api.input()); };
  var pl = CC.ui.player(host, {
    count: function () { return seq().length; },
    show: function (i) { if (i < 0) { draw(-1); return ''; } var P = CC.kamaPairs(api.keys()), c = seq()[i], j = P[0].indexOf(c), top = j >= 0; if (!top) j = P[1].indexOf(c); draw(j); return 'letter ' + (i + 1) + ': ' + c + ' is paired with &rarr; ' + (top ? P[1][j] : P[0][j]); }
  });
  return { refresh: function () { draw(-1); pl.reset(); }, stop: pl.stop };
};

/* ======================= AMSCO: the grid of single and double cells ======================= */
OBJ.amsco = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [], cells = [], key = '', t = '';
  function build() {
    steps = []; cells = []; t = CC.letters(api.input());
    try { key = CC.amscoKey(api.keys()); } catch (e) { key = ''; return; }
    cells = CC.amscoCells(t.length, key.length, api.keys().first);
    CC.amscoOrder(key).forEach(function (col, n) { cells.forEach(function (x) { if (x.c === col) steps.push({ cell: x, n: n }); }); });
  }
  function draw(hl) {
    if (!key) { box.innerHTML = hint('<span class="err">The key needs at least two letters or digits.</span>'); return; }
    var C = key.length, rows = cells.length ? cells[cells.length - 1].r + 1 : 1, cw = Math.max(44, Math.min(60, 640 / C)), ch = 34, W = C * cw + 20, H = (rows + 2) * ch + 20;
    var rank = CC.keyOrder(key), h = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" style="max-width:100%">';
    for (var c = 0; c < C; c++) { var on = hl && hl.cell.c === c; h += '<text x="' + (10 + c * cw + cw / 2) + '" y="22" text-anchor="middle" fill="' + (on ? HI : GOLD) + '" font-family="Consolas" font-size="18" font-weight="bold">' + key[c] + '</text><text x="' + (10 + c * cw + cw / 2) + '" y="42" text-anchor="middle" fill="' + DIM + '" font-family="Consolas" font-size="12">read ' + (rank[c] + 1) + '</text>'; }
    cells.forEach(function (x) { var on = hl && hl.cell === x, done = hl && steps.indexOf(hl) > steps.findIndex(function (s) { return s.cell === x; }); h += cell(10 + x.c * cw + 3, 52 + x.r * ch, cw - 6, ch - 4, t.substr(x.at, x.size), on, { bg: done ? '#163026' : x.size === 2 ? '#26303a' : '#20262a', fg: done ? GRN : TXT }); });
    box.innerHTML = h + '</svg>' + hint('The message goes in row by row, one letter and two letters in turn, like a chessboard. The columns are then read off in the order shown under the key.');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'column ' + key[s.cell.c] + ' (read ' + (s.n + 1) + '), row ' + (s.cell.r + 1) + ' &rarr; ' + t.substr(s.cell.at, s.cell.size); } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Fractionated Morse: the Morse string cut into threes ======================= */
OBJ.fracmorse = function (host, api) {
  var box = CC.ui.mk(host, ''), m = '', A = AZ;
  function build() { A = CC.keyAlpha(CC.letters(api.keys().key)); m = CC.fmMorse(api.input()); while (m.length % 3) m += 'x'; }
  var sym = function (c) { return c === '.' ? '&#8226;' : c === '-' ? '&#8211;' : 'x'; };
  function draw(n) {
    var cols = 9, cw = 66, h = '<svg viewBox="0 0 ' + (cols * cw + 20) + ' 128" width="' + (cols * cw + 20) + '" style="max-width:100%">';
    for (var i = 0; i < 26; i++) { var x = 10 + (i % cols) * cw, y = 6 + Math.floor(i / cols) * 40, on = n >= 0 && CC.fmTrigrams.indexOf(m.substr(n * 3, 3)) === i; h += '<rect x="' + x + '" y="' + y + '" width="' + (cw - 6) + '" height="34" rx="4" fill="' + (on ? HI : '#20262a') + '"/><text x="' + (x + 6) + '" y="' + (y + 22) + '" fill="' + (on ? '#111' : DIM) + '" font-family="Consolas" font-size="15">' + CC.fmTrigrams[i].split('').map(sym).join('') + '</text><text x="' + (x + cw - 16) + '" y="' + (y + 23) + '" text-anchor="middle" fill="' + (on ? '#111' : GRN) + '" font-family="Consolas" font-size="18" font-weight="bold">' + A[i] + '</text>'; }
    h += '</svg>';
    var strip = ''; for (var j = 0; j < m.length; j += 3) strip += '<span style="padding:1px 3px;margin:1px;border-radius:3px;display:inline-block;' + (j / 3 === n ? 'background:' + HI + ';color:#111' : j / 3 < n ? 'color:' + GRN : '') + '">' + m.substr(j, 3).split('').map(sym).join('') + '</span>';
    box.innerHTML = h + '<div style="font:16px Consolas,monospace;line-height:1.9;word-break:break-all;margin:6px 0">' + (strip || '<span class="hint">Type a message to see its Morse code.</span>') + '</div>' + hint('The message in Morse, with x between letters and xx between words, cut into threes. Each three is looked up in the keyword table above.');
  }
  var pl = CC.ui.player(host, { count: function () { return m.length / 3; }, show: function (i) { draw(i); if (i < 0) return ''; var tri = m.substr(i * 3, 3); return 'group ' + (i + 1) + ': ' + tri.split('').map(sym).join('') + ' &rarr; ' + A[CC.fmTrigrams.indexOf(tri)]; } });
  return { refresh: function () { build(); draw(-1); pl.reset(); }, stop: pl.stop };
};

/* ======================= Porta: the 13-row table ======================= */
OBJ.porta = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  function build() { steps = []; var K = CC.letters(api.keys().key) || 'A'; CC.letters(api.input()).split('').forEach(function (p, i) { var k = K[i % K.length]; steps.push({ p: p, k: k, row: Math.floor(AZ.indexOf(k) / 2), o: CC.portaRow(k)[AZ.indexOf(p)] }); }); }
  function draw(s) {
    var cw = 30, rh = 26, W = 70 + 13 * cw + 10, H = 34 + 13 * rh + 8, h = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" style="max-width:100%">';
    var pi = s ? AZ.indexOf(s.p) : -1, col = pi < 0 ? -1 : pi < 13 ? pi : CC.portaRow(s.k).slice(0, 13).indexOf(s.p);
    for (var c = 0; c < 13; c++) h += '<text x="' + (70 + c * cw + cw / 2) + '" y="22" text-anchor="middle" font-family="Consolas" font-size="16" font-weight="bold" fill="' + (c === col ? HI : GOLD) + '">' + AZ[c] + '</text>';
    for (var r = 0; r < 13; r++) {
      var y = 30 + r * rh, row = CC.portaRow(AZ[r * 2]), onR = s && s.row === r;
      h += '<text x="34" y="' + (y + 18) + '" text-anchor="middle" font-family="Consolas" font-size="15" fill="' + (onR ? HI : GOLD) + '"' + (onR ? ' font-weight="bold"' : '') + '>' + AZ[r * 2] + AZ[r * 2 + 1] + '</text>';
      for (c = 0; c < 13; c++) { var on = onR && c === col; h += '<rect x="' + (70 + c * cw + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (rh - 2) + '" rx="3" fill="' + (on ? HI : onR || c === col ? '#3a3416' : (r + c) % 2 ? '#161b1c' : '#1a2021') + '"/><text x="' + (70 + c * cw + cw / 2) + '" y="' + (y + 18) + '" text-anchor="middle" font-family="Consolas" font-size="15" fill="' + (on ? '#111' : TXT) + '">' + row[c] + '</text>'; }
    }
    box.innerHTML = h + '</svg>' + hint('Della Porta\'s table. Pick the row for the key letter (two key letters share each row). A letter in the top line (A-M) swaps with the letter below it in that row, and a letter in the row swaps with the one above it, so the same table enciphers and deciphers.');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'letter ' + (i + 1) + ': plain ' + s.p + ' with key ' + s.k + ' (row ' + AZ[s.row * 2] + AZ[s.row * 2 + 1] + ') &rarr; ' + s.o; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Nihilist: the square and the sums ======================= */
OBJ.nihilist = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [], sq = '';
  function build() {
    steps = []; var k = api.keys(); sq = CC.nihSquare(k); var K = CC.nihNums(sq, k.key), KL = CC.letters(k.key).replace(/J/g, 'I'), P = CC.letters(api.input()).replace(/J/g, 'I'), N = CC.nihNums(sq, P);
    if (!K.length) return;
    N.forEach(function (n, i) { steps.push({ p: P[i], n: n, kl: KL[i % KL.length], k: K[i % K.length], c: n + K[i % K.length] }); });
  }
  function draw(s) {
    var cw = 40, h = '<svg viewBox="0 0 ' + (6 * cw + 20) + ' ' + (6 * cw + 10) + '" width="' + (6 * cw + 20) + '">';
    for (var i = 1; i <= 5; i++) h += '<text x="' + (10 + i * cw + cw / 2) + '" y="26" text-anchor="middle" fill="' + GOLD + '" font-family="Consolas" font-size="17" font-weight="bold">' + i + '</text><text x="' + (10 + cw / 2) + '" y="' + (i * cw + 26) + '" text-anchor="middle" fill="' + GOLD + '" font-family="Consolas" font-size="17" font-weight="bold">' + i + '</text>';
    for (i = 0; i < 25; i++) { var r = Math.floor(i / 5), c = i % 5, ch = sq[i], on = s && (ch === s.p), kon = s && (ch === s.kl); h += cell(10 + (c + 1) * cw + 2, (r + 1) * cw + 2, cw - 4, cw - 4, ch === 'I' ? 'I/J' : ch, on, { bg: kon ? '#163026' : null, fg: kon ? GRN : null, fs: ch === 'I' ? 13 : 17 }); }
    h += '</svg>';
    var sum = s ? '<div style="font:20px Consolas,monospace;text-align:center;margin:6px 0">' + s.p + ' = <b style="color:' + HI + '">' + s.n + '</b> &nbsp;+&nbsp; key ' + s.kl + ' = <b style="color:' + GRN + '">' + s.k + '</b> &nbsp;=&nbsp; <b>' + s.c + '</b></div>' : '';
    box.innerHTML = '<div style="text-align:center">' + h + '</div>' + sum + hint('Each letter becomes its row number then column number. The key word is turned into numbers the same way and added on as an ordinary sum, repeating the key word as often as needed.');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'letter ' + (i + 1) + ': ' + s.p + ' (' + s.n + ') + key ' + s.kl + ' (' + s.k + ') &rarr; ' + s.c; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Hebern: one rotor between two keyboards ======================= */
OBJ.hebern = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  function build() { steps = []; try { var tr = []; CC.hebernRun(api.input(), api.keys(), 1, tr); steps = tr; } catch (e) { steps = []; } }
  function draw(s) {
    var W, k = api.keys(); try { W = CC.hebernWiring(k); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var pos = s ? s.pos : CC.hebernStart(k), cw = 25, X = function (i) { return 14 + i * cw + cw / 2; }, h = '<svg viewBox="0 0 ' + (26 * cw + 28) + ' 250" width="' + (26 * cw + 28) + '" style="max-width:100%">';
    h += '<text x="6" y="22" fill="' + DIM + '" font-size="12" font-family="Georgia">keyboard (plain letters)</text><text x="6" y="244" fill="' + DIM + '" font-size="12" font-family="Georgia">printer (cipher letters)</text>';
    h += '<rect x="10" y="68" width="' + (26 * cw + 8) + '" height="114" rx="10" fill="#3a2a14" stroke="#6b5226"/><text x="' + (13 * cw + 14) + '" y="126" text-anchor="middle" fill="#8f7a4d" font-size="13" font-family="Georgia">rotor at position ' + AZ[pos] + '</text>';
    for (var i = 0; i < 26; i++) {
      var inOn = s && s.i === i, outOn = s && s.o === i;
      h += cell(X(i) - 11, 30, 22, 26, AZ[i], inOn, { fs: 14 }) + cell(X(i) - 11, 196, 22, 26, AZ[i], outOn, { fs: 14, bg: '#163026', fg: GRN });
      /* the rotor's contact under keyboard letter i is contact (i + pos); it is wired to contact W[i + pos], which sits under printer letter (that - pos) */
      var a = mod(i + pos, 26), b = mod(AZ.indexOf(W[a]) - pos, 26), wOn = s && s.i === i;
      h += '<line x1="' + X(i) + '" y1="74" x2="' + X(b) + '" y2="176" stroke="' + (wOn ? HI : '#7a6233') + '" stroke-width="' + (wOn ? 3 : 0.8) + '" opacity="' + (wOn ? 1 : 0.55) + '"/>';
      h += '<text x="' + X(i) + '" y="86" text-anchor="middle" fill="#c7a76a" font-size="9" font-family="Consolas">' + AZ[a] + '</text>';
    }
    box.innerHTML = h + '</svg>' + hint('The rotor sits between the keyboard and the printer. Each wire joins a contact on one face to a different contact on the other. After every letter the rotor turns one place, so every wire moves along and the next letter goes through a different alphabet. The small letters on the rotor show which of its contacts is under each key.');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'letter ' + (i + 1) + ': rotor at ' + AZ[s.pos] + ', plain ' + AZ[s.i] + ' &rarr; ' + AZ[s.o]; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= DES: sixteen rounds of the Feistel network ======================= */
OBJ.des = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [], block = null, out = null;
  function build() {
    trace = []; block = null; out = null; var k = api.keys();
    try { var subs = CC.desSubkeys(CC.desKey(k)), p; if (k.fmt === 'hex') p = CC.fromHex(api.input()).slice(0, 8); else { p = CC.utf8(api.input()).slice(0, 8); var n = 8 - p.length % 8; if (p.length < 8) for (var j = 0; j < n; j++) p.push(n); }
      if (p.length !== 8) return; block = p; out = CC.desBlock(p, subs, 1, trace); } catch (e) { trace = []; }
  }
  function draw(n) {
    if (!trace.length) { box.innerHTML = hint('<span class="err">Check the key (16 hexadecimal digits) and type a message' + (api.keys().fmt === 'hex' ? ' of at least 16 hexadecimal digits' : '') + '.</span>'); return; }
    var h = '<table style="margin:0 auto;border-collapse:collapse;font:14px Consolas,monospace"><tr style="color:' + GOLD + '"><th style="padding:2px 10px">round</th><th style="padding:2px 10px">round key</th><th style="padding:2px 10px">left half</th><th style="padding:2px 10px">right half</th></tr>';
    trace.forEach(function (t, i) { var on = i === n, past = i < n; h += '<tr style="' + (on ? 'background:' + HI + ';color:#111;font-weight:bold' : past ? 'color:' + GRN : 'color:' + DIM) + '"><td style="padding:1px 10px;text-align:center">' + (t.round || 'start') + '</td><td style="padding:1px 10px">' + (t.K || '') + '</td><td style="padding:1px 10px">' + t.L + '</td><td style="padding:1px 10px">' + t.R + '</td></tr>'; });
    h += '</table>';
    var t = trace[n], f = t && t.round ? '<div style="font:14px Consolas,monospace;text-align:center;margin:8px 0;line-height:1.6">f(right half, round key): expand to 48 bits <b>' + t.e + '</b><br>&oplus; round key = <b>' + t.x + '</b> &rarr; eight S-boxes give <b>' + t.s + '</b> &rarr; shuffle (P) <b style="color:' + HI + '">' + t.f + '</b><br>new right half = old left half &oplus; ' + t.f + ' = <b>' + t.R + '</b>; the old right half becomes the new left half</div>' : '';
    box.innerHTML = '<div class="hint" style="text-align:center">First block: ' + CC.toHex(block) + ' &rarr; ' + CC.toHex(out) + '</div>' + h + f + hint('The initial shuffle splits the 64-bit block into two 32-bit halves. In each of the 16 rounds the right half is put through the f-function with that round\'s 48-bit key and the result is added (exclusive-or) to the left half; then the halves swap. After round 16 the halves are joined (right then left) and shuffled back. Deciphering runs the same rounds with the keys in reverse order.');
  }
  var pl = CC.ui.player(host, { count: function () { return trace.length; }, show: function (i) { draw(i); if (i < 0) return ''; var t = trace[i]; return t.round ? 'round ' + t.round + ': left ' + t.L + ', right ' + t.R + (t.round === 16 ? ' &mdash; then join and final shuffle: ' + CC.toHex(out) : '') : 'initial permutation: left ' + t.L + ', right ' + t.R; } });
  return { refresh: function () { build(); draw(-1); pl.reset(); }, stop: pl.stop };
};

/* ======================= ElGamal: the two numbers ======================= */
OBJ.elgamal = function (host, api) {
  var box = CC.ui.mk(host, ''), st = null;
  var short = function (v) { v = String(v); return v.length > 34 ? v.slice(0, 14) + '&hellip;' + v.slice(-12) + ' <span class="hint">(' + v.length + ' digits)</span>' : v; };
  function build() {
    st = null; var k = api.keys();
    try { var d = CC.elgParse(k, true), m = CC.rsaText(api.input()); if (m >= d.p) throw new Error('Message too long for this prime.'); var r = d.k === null ? 2n + (d.p - 3n) / 7n : d.k;
      st = { d: d, m: m, r: r, rand: d.k === null, c1: CC.modPow(d.g, r, d.p), s: CC.modPow(d.y, r, d.p) }; st.c2 = m * st.s % d.p; st.s2 = CC.modPow(st.c1, d.x, d.p); st.back = st.c2 * CC.modPow(st.s2, d.p - 2n, d.p) % d.p;
    } catch (e) { st = { err: e.message }; }
  }
  var L = ['Bob publishes p, g and his public key y = g^x mod p. His private key x stays with him.', 'Alice turns the message into a number m (its bytes read as one big number).', 'Alice picks a one-time number k and sends c1 = g^k mod p: half of a Diffie-Hellman exchange.', 'She works out the shared secret s = y^k mod p, which only she and Bob can reach.', 'She hides the message: c2 = m &times; s mod p. She sends c1 and c2.', 'Bob works out the same secret from c1 with his private key: c1^x mod p.', 'He divides it out of c2 and gets the message back.'];
  function draw(n) {
    if (!st || st.err) { box.innerHTML = hint('<span class="err">' + esc(st ? st.err : 'Type a message.') + '</span>'); return; }
    var d = st.d, rows = [
      ['public', 'p = ' + short(d.p) + ', g = ' + d.g + ', y = g^x mod p = ' + short(d.y)],
      ['message', 'm = ' + short(st.m)],
      ['Alice sends', 'k = ' + short(st.r) + (st.rand ? ' <span class="hint">(an example: Encipher picks a new random k)</span>' : '') + '; c1 = g^k mod p = ' + short(st.c1)],
      ['shared secret', 's = y^k mod p = ' + short(st.s)],
      ['Alice sends', 'c2 = m &times; s mod p = ' + short(st.c2)],
      ['Bob', 'c1^x mod p = ' + short(st.s2) + (st.s2 === st.s ? ' <span style="color:' + GRN + '">(the same secret)</span>' : '')],
      ['Bob reads', 'c2 &divide; s mod p = ' + short(st.back) + ' = &ldquo;' + esc(CC.rsaUntext(st.back)) + '&rdquo;']
    ];
    var h = '<table style="margin:0 auto;border-collapse:collapse;font:15px Consolas,monospace">';
    rows.forEach(function (r, i) { var on = i === n, vis = n < 0 || i <= n; h += '<tr style="' + (on ? 'background:#3a3416' : '') + ';opacity:' + (vis ? 1 : 0.25) + '"><td style="padding:4px 12px;color:' + (on ? HI : GOLD) + ';white-space:nowrap">' + r[0] + '</td><td style="padding:4px 12px;color:' + TXT + '">' + r[1] + '</td></tr>'; });
    box.innerHTML = h + '</table>' + hint('Two numbers travel: c1 lets Bob rebuild the shared secret, and c2 is the message multiplied by it. Without x, an eavesdropper would have to undo a power round p, which is believed infeasible for primes this large.');
  }
  var pl = CC.ui.player(host, { count: function () { return st && !st.err ? 7 : 0; }, show: function (i) { draw(i); return i < 0 ? '' : L[i]; } });
  return { refresh: function () { build(); draw(-1); pl.reset(); }, stop: pl.stop };
};
})();
