/* Codes & Ciphers Studio - working objects, part 4 (version 1.2) - by Larry Dalton
   Affine strips, Diffie-Hellman paint mixing, straddling checkerboard, VIC key lines, SIGABA banks, PURPLE switches,
   and the stream ciphers' registers and tables. */
(function () {
'use strict';
var CC = window.CC, AZ = CC.AZ, mod = CC.mod, OBJ = CC.OBJ;
['affine', 'dh', 'checkerboard', 'vic', 'sigaba', 'purple', 'a51', 'rc4', 'crypto1', 'salsa', 'trivium'].forEach(function (m) { CC.MOVING[m] = 1; });
var esc = CC.esc || function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
var HI = '#ffd75e', GOLD = '#c9a227', TXT = '#edf0ee', GRN = '#4fb38a', DIM = '#97a3a0';
var hint = function (t) { return '<div class="hint" style="text-align:center">' + t + '</div>'; };
var hex2 = function (v) { return ('0' + v.toString(16)).slice(-2).toUpperCase(); };

/* ======================= Affine: number line and formula ======================= */
OBJ.affine = function (host, api) {
  var box = CC.ui.mk(host, '');
  function draw(hl) {
    var k = api.keys(), a = +k.a || 1, b = +k.b || 0, cw = 26, W = 26 * cw + 30, h = '<svg viewBox="0 0 ' + W + ' 150" width="' + W + '" style="max-width:100%">';
    for (var i = 0; i < 26; i++) {
      var x = 15 + i * cw + cw / 2, o = mod(a * i + b, 26), on = hl === i;
      h += '<text x="' + x + '" y="20" text-anchor="middle" font-family="Consolas" font-size="11" fill="' + DIM + '">' + i + '</text>';
      h += '<rect x="' + (x - 11) + '" y="26" width="22" height="28" rx="4" fill="' + (on ? '#6b5a1c' : '#20262a') + '"/><text x="' + x + '" y="46" text-anchor="middle" fill="' + TXT + '" font-family="Consolas" font-size="16">' + AZ[i] + '</text>';
      h += '<line x1="' + x + '" y1="56" x2="' + x + '" y2="84" stroke="' + (on ? HI : '#2c3638') + '"/>';
      h += '<rect x="' + (x - 11) + '" y="86" width="22" height="28" rx="4" fill="' + (on ? '#6b5a1c' : '#163026') + '"/><text x="' + x + '" y="106" text-anchor="middle" fill="' + (on ? HI : GRN) + '" font-family="Consolas" font-size="16" font-weight="bold">' + AZ[o] + '</text>';
      h += '<text x="' + x + '" y="132" text-anchor="middle" font-family="Consolas" font-size="11" fill="' + DIM + '">' + o + '</text>';
    }
    box.innerHTML = h + '</svg>' + hint('Top: plain letters numbered 0-25. Bottom: the cipher letter, (' + a + ' &times; number + ' + b + ') counted round 26.');
  }
  var seq = function () { return CC.letters(api.input()); };
  var pl = CC.ui.player(host, {
    count: function () { return seq().length; },
    show: function (i) { if (i < 0) { draw(-1); return ''; } var k = api.keys(), a = +k.a || 1, b = +k.b || 0, c = seq()[i], x = AZ.indexOf(c); draw(x); return 'letter ' + (i + 1) + ': ' + c + ' = ' + x + '; ' + a + ' &times; ' + x + ' + ' + b + ' = ' + (a * x + b) + ', round 26 = ' + mod(a * x + b, 26) + ' &rarr; ' + AZ[mod(a * x + b, 26)]; }
  });
  return { refresh: function () { draw(-1); pl.reset(); }, stop: pl.stop };
};

/* ======================= Diffie-Hellman: the paint-mixing picture beside the numbers ======================= */
OBJ.dh = function (host, api) {
  var box = CC.ui.mk(host, '');
  function blob(x, y, col, label, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 26) + '" fill="' + col + '" stroke="#111" stroke-width="2"/><text x="' + x + '" y="' + (y + (r || 26) + 18) + '" text-anchor="middle" font-size="13" fill="' + TXT + '" font-family="Segoe UI, sans-serif">' + label + '</text>'; }
  function mix() { var n = arguments.length, r = 0, g = 0, b = 0; for (var i = 0; i < n; i++) { r += arguments[i][0]; g += arguments[i][1]; b += arguments[i][2]; } return 'rgb(' + Math.round(r / n) + ',' + Math.round(g / n) + ',' + Math.round(b / n) + ')'; }
  function draw(step) {
    var d; try { d = CC.dhParse(api.keys()); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var Y = [235, 200, 60], A = [200, 40, 40], B = [40, 90, 210], s = function (n) { return step >= n; };
    var h = '<svg viewBox="0 0 640 330" width="640" style="max-width:100%"><text x="110" y="24" text-anchor="middle" fill="' + HI + '" font-size="16" font-family="Georgia">Alice</text><text x="320" y="24" text-anchor="middle" fill="' + DIM + '" font-size="16" font-family="Georgia">in public</text><text x="530" y="24" text-anchor="middle" fill="' + HI + '" font-size="16" font-family="Georgia">Bob</text>';
    h += '<line x1="215" y1="35" x2="215" y2="320" stroke="#2c3638" stroke-dasharray="4 4"/><line x1="425" y1="35" x2="425" y2="320" stroke="#2c3638" stroke-dasharray="4 4"/>';
    h += blob(320, 70, 'rgb(235,200,60)', 'common paint: p = ' + d.p + ', g = ' + d.g);
    if (s(1)) { h += blob(110, 70, 'rgb(200,40,40)', 'secret a = ' + d.a); h += blob(530, 70, 'rgb(40,90,210)', 'secret b = ' + d.b); }
    if (s(2)) { h += blob(110, 170, mix(Y, A), 'A = g^a mod p = ' + d.A); h += blob(530, 170, mix(Y, B), 'B = g^b mod p = ' + d.B); }
    if (s(3)) { h += blob(275, 170, mix(Y, A), 'A sent', 20) + blob(365, 170, mix(Y, B), 'B sent', 20); h += '<path d="M140 170 L250 170 M500 170 L390 170" stroke="' + GOLD + '" stroke-width="2" marker-end="url(#ah)"/>'; }
    if (s(4)) { var S = String(CC.modPow(d.B, d.a, d.p)); h += blob(110, 270, mix(Y, A, B), 'B^a mod p = ' + S); h += blob(530, 270, mix(Y, A, B), 'A^b mod p = ' + CC.modPow(d.A, d.b, d.p)); h += '<text x="320" y="275" text-anchor="middle" fill="' + GRN + '" font-size="15" font-family="Georgia">the same secret</text>'; }
    h += '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="' + GOLD + '"/></marker></defs></svg>';
    box.innerHTML = h + hint('Mixing paint is easy; un-mixing it is not. The numbers work the same way: raising to a power round p is quick, undoing it is believed to be infeasible for huge primes.');
  }
  var L = ['Everyone, including any listener, knows the common paint: the prime p and the base g.', 'Alice and Bob each choose a secret colour (a secret number) and keep it to themselves.', 'Each mixes their secret into the common paint: g raised to their secret, round p.', 'They swap the mixtures in public. A listener sees both, but cannot separate the secrets out.', 'Each adds their own secret to the other\'s mixture. Both now hold the same colour: the shared key.'];
  var pl = CC.ui.player(host, { count: function () { return 5; }, show: function (i) { draw(i); return i < 0 ? '' : L[i]; } });
  return { refresh: function () { draw(4); pl.reset(); draw(4); }, stop: pl.stop };
};

/* ======================= straddling checkerboard (also used by VIC) ======================= */
function boardSvg(cb, hl) {
  var cw = 34, h = '<svg viewBox="0 0 ' + (11 * cw + 10) + ' ' + (4 * cw + 10) + '" width="' + (11 * cw + 10) + '">';
  for (var c = 0; c < 10; c++) h += '<text x="' + (5 + (c + 1) * cw + cw / 2) + '" y="' + (cw / 2 + 10) + '" text-anchor="middle" fill="' + (hl && hl.col === c ? HI : '#e8c766') + '" font-family="Consolas" font-size="17" font-weight="bold">' + cb.header[c] + '</text>';
  cb.rows.forEach(function (row, r) {
    var y = 5 + (r + 1) * cw;
    h += '<text x="' + (5 + cw / 2) + '" y="' + (y + cw / 2 + 6) + '" text-anchor="middle" fill="' + (hl && hl.row === r && r ? HI : '#e8c766') + '" font-family="Consolas" font-size="17" font-weight="bold">' + row.label + '</text>';
    row.cells.forEach(function (ch, c) { var on = hl && hl.row === r && hl.col === c; h += '<rect x="' + (5 + (c + 1) * cw + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (cw - 2) + '" rx="3" fill="' + (on ? HI : ch === ' ' ? '#0b0f0f' : (r + c) % 2 ? '#1a2021' : '#20262a') + '"/><text x="' + (5 + (c + 1) * cw + cw / 2) + '" y="' + (y + cw / 2 + 6) + '" text-anchor="middle" fill="' + (on ? '#111' : TXT) + '" font-family="Consolas" font-size="17">' + esc(ch === ' ' ? '' : ch) + '</text>'; });
  });
  return h + '</svg>';
}
function cbFind(cb, ch) { for (var r = 0; r < cb.rows.length; r++) { var c = cb.rows[r].cells.indexOf(ch); if (c >= 0 && ch !== ' ') return { row: r, col: c }; } return null; }
function cbTokens(cb, s) {
  var t = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), o = [], num = false;
  Array.from(t).forEach(function (ch) {
    if (/[0-9]/.test(ch)) { if (!num) { o.push({ ch: '/', code: cb.code['/'] }); num = true; } o.push({ ch: ch, code: ch + ch + ch, digit: true }); return; }
    if (num) { o.push({ ch: '/', code: cb.code['/'] }); num = false; }
    if (cb.code[ch] && ch !== '/') o.push({ ch: ch, code: cb.code[ch] });
  });
  if (num) o.push({ ch: '/', code: cb.code['/'] });
  return o;
}
OBJ.checkerboard = function (host, api) {
  var box = CC.ui.mk(host, ''), cb = null;
  function draw(hl) { try { var k = api.keys(); cb = CC.checkerboard(k.top, k.header, k.rest); } catch (e) { cb = null; box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; } box.innerHTML = '<div style="text-align:center">' + boardSvg(cb, hl) + '</div>' + hint('Top row: one digit each. Lower rows: the row number, then the column number. The blank columns of the top row are the row numbers, so the digits can be read back without gaps.'); }
  var pl = CC.ui.player(host, {
    count: function () { return cb ? cbTokens(cb, api.input()).length : 0; },
    show: function (i) { if (i < 0) { draw(null); return ''; } var t = cbTokens(cb, api.input())[i]; if (t.digit) { draw(cbFind(cb, '/')); return 'the figure ' + t.ch + ' is written three times &rarr; ' + t.code; } draw(cbFind(cb, t.ch)); return esc(t.ch === '/' ? 'number sign' : t.ch) + ' &rarr; ' + t.code; }
  });
  return { refresh: function () { draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= VIC: the key lines, then the checkerboard ======================= */
OBJ.vic = function (host, api) {
  var box = CC.ui.mk(host, ''), L = null, cb = null;
  var LINES = [['A', 'keygroup'], ['B', 'first five digits of the date'], ['C', 'A minus B, digit by digit (no carrying)'], ['E1', 'first 10 letters of the phrase, numbered in alphabetical order'], ['E2', 'next 10 letters, numbered'], ['F1', 'C, lengthened by chain addition'], ['F2', '1234567890'], ['G', 'E1 plus F1'], ['H', 'G looked up: find each digit in F2, take the E2 digit below it'], ['J', 'H numbered in order'], ['K', 'chain addition of H ...'], ['L', '...'], ['M', '...'], ['N', '...'], ['P', '... five lines of ten'], ['Q', 'first transposition key: columns of K-P read in the order of J'], ['R', 'second (disrupted) transposition key: the next digits'], ['S', 'P numbered in order: the checkerboard\'s column numbers']];
  function draw(hlLine, hlCell) {
    try { L = CC.vicKeys(api.keys()); cb = CC.checkerboard(api.keys().top, L.S.join('')); } catch (e) { L = null; box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var h = '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;align-items:flex-start"><table style="width:auto;font:14px Consolas,monospace">';
    LINES.forEach(function (x, i) { var on = hlLine === i, v = Array.isArray(L[x[0]]) ? L[x[0]].join('') : x[0] === 'D' ? L.D : ''; h += '<tr style="' + (on ? 'background:#3a3416' : '') + '"><td style="color:#e8c766;font-weight:bold">' + x[0] + '</td><td style="color:' + (on ? HI : TXT) + ';letter-spacing:2px">' + esc(v) + '</td><td class="hint">' + esc(x[1]) + (x[0] === 'Q' ? ' (' + L.a + ' digits = last digits of P + personal number)' : x[0] === 'R' ? ' (' + L.b + ' digits)' : '') + '</td></tr>'; });
    h += '</table><div>' + boardSvg(cb, hlCell) + '<div class="hint" style="max-width:380px">The keygroup goes in the clear ' + L.insertAt + ' group' + (L.insertAt === 1 ? '' : 's') + ' from the end (the sixth digit of the date).</div></div></div>';
    box.innerHTML = h + hint('Every key comes from the phrase, the date, the personal number and the keygroup. Play shows each line, then each letter on the checkerboard.');
  }
  var pl = CC.ui.player(host, {
    count: function () { if (!L) return 0; return LINES.length + cbTokens(cb, api.input()).length; },
    show: function (i) {
      if (i < 0) { draw(-1, null); return ''; }
      if (i < LINES.length) { draw(i, null); var x = LINES[i]; return 'line ' + x[0] + ': ' + esc(x[1]) + (Array.isArray(L[x[0]]) ? ' = ' + L[x[0]].join('') : ''); }
      var t = cbTokens(cb, api.input())[i - LINES.length]; draw(-1, t.digit ? cbFind(cb, '/') : cbFind(cb, t.ch));
      return 'checkerboard: ' + esc(t.digit ? 'figure ' + t.ch : t.ch === '/' ? 'number sign' : t.ch) + ' &rarr; ' + t.code + ' (then two transpositions)';
    }
  });
  return { refresh: function () { draw(-1, null); pl.reset(); }, stop: pl.stop };
};

/* ======================= SIGABA: three banks of rotors ======================= */
OBJ.sigaba = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [];
  function bank(y, label, pos, rot, step, n, col) {
    var h = '<text x="12" y="' + (y + 30) + '" fill="' + DIM + '" font-size="12" font-family="Georgia">' + label + '</text>';
    for (var i = 0; i < 5; i++) {
      var x = 150 + i * 92, on = step && step.indexOf(i) >= 0, r = rot[i];
      h += '<rect x="' + x + '" y="' + y + '" width="70" height="48" rx="8" fill="' + (on ? '#5c4f16' : '#20262a') + '" stroke="' + (on ? HI : col) + '" stroke-width="2"/>';
      h += '<text x="' + (x + 35) + '" y="' + (y + 31) + '" text-anchor="middle" fill="' + (on ? HI : TXT) + '" font-size="22" font-family="Consolas" font-weight="bold">' + (n === 26 ? AZ[pos[i]] : pos[i]) + '</text>';
      h += '<text x="' + (x + 35) + '" y="' + (y + 62) + '" text-anchor="middle" fill="' + DIM + '" font-size="10" font-family="Consolas">rotor ' + r.w + (r.rev ? ' R' : '') + '</text>';
    }
    return h;
  }
  function draw(t) {
    var S; try { S = CC.sigabaParse(api.keys()); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var cp = t ? t.cp : S.cpos, kp = t ? t.kp : S.kpos, st = t ? t.st : null;
    var h = '<svg viewBox="0 0 640 330" width="640" style="max-width:100%">';
    h += bank(16, 'Cipher rotors', cp, S.cipher, st ? st.step : null, 26, GOLD);
    h += bank(120, 'Control rotors', kp, S.control, null, 26, GRN);
    h += bank(224, 'Index rotors', S.ipos, S.index, null, 10, '#6a7a90');
    if (st) {
      h += '<text x="150" y="104" fill="' + GRN + '" font-size="12" font-family="Consolas">signals F G H I come out at ' + st.outs.join(' ') + ' &rarr; index inputs ' + st.idxIn.join(' ') + '</text>';
      h += '<text x="150" y="208" fill="#9fb3cf" font-size="12" font-family="Consolas">index outputs ' + st.idxOut.join(' ') + ' &rarr; cipher rotors ' + st.step.map(function (x) { return x + 1; }).join(', ') + ' step</text>';
      h += '<text x="320" y="318" text-anchor="middle" fill="' + HI + '" font-size="17" font-family="Consolas">' + esc(t.i) + ' &rarr; ' + esc(t.o) + '</text>';
    }
    box.innerHTML = h + '</svg>' + hint('Each letter goes through the five cipher rotors. Then four signals run through the control rotors and the index rotors; wherever they come out decides which cipher rotors move (gold). The control rotors themselves step like a mileage counter.');
  }
  function build() { trace = []; try { CC.sigabaRun(api.input(), api.keys(), 1, trace); } catch (e) { trace = []; } }
  var pl = CC.ui.player(host, {
    count: function () { return trace.length; },
    show: function (i) { if (i < 0) { draw(null); return ''; } var t = trace[i]; draw(t); return 'letter ' + (i + 1) + ': ' + esc(t.i === 'Z' ? 'Z (space)' : t.i) + ' &rarr; ' + t.o + ' (cipher rotors ' + t.st.step.map(function (x) { return x + 1; }).join(', ') + ' then step)'; }
  });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= PURPLE: the sixes and the three twenties switches ======================= */
OBJ.purple = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [];
  function sw(x, y, label, pos, active, stepped) {
    var h = '<rect x="' + x + '" y="' + y + '" width="120" height="120" rx="10" fill="' + (active ? '#2b2a14' : '#20262a') + '" stroke="' + (active ? HI : '#3a4446') + '" stroke-width="2"/>';
    h += '<text x="' + (x + 60) + '" y="' + (y + 22) + '" text-anchor="middle" fill="' + DIM + '" font-size="12" font-family="Georgia">' + label + '</text>';
    for (var i = 0; i < 25; i++) { var a = i / 25 * 2 * Math.PI - Math.PI / 2, px = x + 60 + 38 * Math.cos(a), py = y + 70 + 38 * Math.sin(a); h += '<circle cx="' + px + '" cy="' + py + '" r="' + (i === pos ? 5 : 2.4) + '" fill="' + (i === pos ? HI : '#55605f') + '"/>'; }
    var a2 = pos / 25 * 2 * Math.PI - Math.PI / 2; h += '<line x1="' + (x + 60) + '" y1="' + (y + 70) + '" x2="' + (x + 60 + 32 * Math.cos(a2)) + '" y2="' + (y + 70 + 32 * Math.sin(a2)) + '" stroke="' + (stepped ? '#e0605a' : GOLD) + '" stroke-width="3"/>';
    h += '<text x="' + (x + 60) + '" y="' + (y + 76) + '" text-anchor="middle" fill="' + TXT + '" font-size="16" font-family="Consolas" font-weight="bold">' + (pos + 1) + '</text>';
    return h;
  }
  function draw(t) {
    var P; try { P = CC.purpleParse(api.keys()); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var six = t ? t.six : P.pos[0], tw = t ? t.tw : P.pos.slice(1), names = ['fast', 'middle', 'slow'], role = {}; role[P.fast] = 'fast'; role[P.middle] = 'middle'; role[P.slow] = 'slow';
    var h = '<svg viewBox="0 0 640 230" width="640" style="max-width:100%">';
    h += sw(20, 20, 'sixes', six, t && t.sixes, false);
    for (var i = 0; i < 3; i++) h += sw(180 + i * 150, 20, 'twenties ' + (i + 1) + ' (' + role[i] + ')', tw[i], t && !t.sixes && t.i !== '-', t && t.stepped === role[i]);
    h += '<text x="20" y="170" fill="' + DIM + '" font-size="12" font-family="Consolas">plugboard: ' + esc(P.A.slice(0, 6)) + ' | ' + esc(P.A.slice(6)) + '</text>';
    if (t) h += '<text x="320" y="210" text-anchor="middle" fill="' + HI + '" font-size="17" font-family="Consolas">' + esc(t.i) + ' &rarr; ' + esc(t.o) + '   (' + (t.i === '-' ? 'garbled letter, switches still step' : t.sixes ? 'one of the sixes' : 'through the three twenties') + ')</text>';
    box.innerHTML = h + '</svg>' + hint('The six letters on the left of the plugboard go through the "sixes" switch; the other twenty through the three "twenties" switches in a chain. After each letter the sixes steps, and one twenties switch steps (red): usually the fast one, the middle one when the sixes passes 25, the slow one at the turnover.');
  }
  function build() { trace = []; try { CC.purpleRun(api.input(), api.keys(), 1, trace); } catch (e) { trace = []; } }
  var pl = CC.ui.player(host, { count: function () { return trace.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var t = trace[i]; draw(t); return 'letter ' + (i + 1) + ': ' + t.i + ' &rarr; ' + t.o; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= stream cipher helpers ======================= */
function bitRow(bits, x, y, w, cls, marks, label) {
  var h = label ? '<text x="' + x + '" y="' + (y - 6) + '" fill="' + DIM + '" font-size="11" font-family="Georgia">' + label + '</text>' : '';
  bits.forEach(function (b, i) { var m = marks && marks[i]; h += '<rect x="' + (x + i * w) + '" y="' + y + '" width="' + (w - 1) + '" height="' + (w + 4) + '" fill="' + (m ? m : b ? '#4fb38a' : '#20262a') + '" stroke="#0b0f0f"/>'; if (w >= 11) h += '<text x="' + (x + i * w + w / 2 - 0.5) + '" y="' + (y + w - 1) + '" text-anchor="middle" font-size="' + Math.min(11, w - 2) + '" font-family="Consolas" fill="' + (b ? '#06150f' : '#55605f') + '">' + b + '</text>'; });
  return h;
}
function textBytes(api) { return CC.utf8(api.input()); }

/* ======================= A5/1: three registers, majority clocking ======================= */
OBJ.a51 = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  var LEN = [19, 22, 23], MIDB = [8, 10, 10], TAPS = [[18, 17, 16, 13], [21, 20], [22, 21, 20, 7]];
  function regBits(R, i) { var o = []; for (var b = LEN[i] - 1; b >= 0; b--) o.push((R >>> b) & 1); return o; }
  function build() {
    steps = []; var key; try { key = CC.hexKey(api.keys().key, [8], 'key'); } catch (e) { return; }
    var m = new CC.A51(key, Math.max(0, +api.keys().frame || 0)), n = Math.min(48, textBytes(api).length * 8);
    for (var i = 0; i < n; i++) { var before = m.R.slice(), moved = m.clock(), b = m.bit(); steps.push({ before: before, after: m.R.slice(), moved: moved, bit: b }); }
  }
  function draw(s) {
    var key; try { key = CC.hexKey(api.keys().key, [8], 'key'); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var R = s ? s.after : new CC.A51(key, +api.keys().frame || 0).R, w = 22, h = '<svg viewBox="0 0 640 230" width="640" style="max-width:100%">';
    for (var i = 0; i < 3; i++) {
      var bits = regBits(R[i], i), marks = {}; TAPS[i].forEach(function (t) { marks[LEN[i] - 1 - t] = '#2d4b7a'; }); marks[LEN[i] - 1 - MIDB[i]] = '#c9a227'; marks[0] = s ? (s.bit ? '#e0605a' : '#5a2a31') : '#5a2a31';
      h += bitRow(bits, 20 + (23 - LEN[i]) * w, 30 + i * 62, w, '', marks, 'R' + (i + 1) + ' (' + LEN[i] + ' bits)' + (s ? (s.moved.indexOf(i) >= 0 ? ' - moved' : ' - held') : ''));
    }
    if (s) h += '<text x="320" y="222" text-anchor="middle" fill="' + HI + '" font-size="15" font-family="Consolas">key stream bit = ' + s.bit + '</text>';
    box.innerHTML = h + '</svg>' + hint('Gold: each register\'s clocking bit; a register moves only if its gold bit agrees with the majority. Blue: feedback taps. Red: the output bits, combined into one key stream bit. (Shown for the first 48 bits.)');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'tick ' + (i + 1) + ': registers ' + s.moved.map(function (x) { return 'R' + (x + 1); }).join(', ') + ' move (majority) &rarr; bit ' + s.bit; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= RC4: the 256-byte table ======================= */
OBJ.rc4 = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  function build() {
    steps = []; var key; try { key = CC.rc4Key(api.keys()); } catch (e) { return; }
    var r = new CC.RC4(key), p = textBytes(api).slice(0, 64);
    p.forEach(function (b) { var S0 = r.S.slice(), ks = r.next(); steps.push({ S: r.S.slice(), i: r.i, j: r.j, t: (r.S[r.i] + r.S[r.j]) & 255, ks: ks, p: b, c: b ^ ks }); });
  }
  function draw(s) {
    var key; try { key = CC.rc4Key(api.keys()); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var S = s ? s.S : new CC.RC4(key).S, cw = 26, h = '<svg viewBox="0 0 ' + (16 * cw + 10) + ' ' + (16 * cw + 10) + '" width="' + (16 * cw + 10) + '" style="max-width:100%">';
    for (var n = 0; n < 256; n++) {
      var x = 5 + (n % 16) * cw, y = 5 + Math.floor(n / 16) * cw, col = s && n === s.i ? '#2d4b7a' : s && n === s.j ? '#5c4f16' : s && n === s.t ? '#5a2a31' : '#161b1c';
      h += '<rect x="' + x + '" y="' + y + '" width="' + (cw - 1) + '" height="' + (cw - 1) + '" fill="' + col + '"/><text x="' + (x + cw / 2) + '" y="' + (y + cw / 2 + 4) + '" text-anchor="middle" font-size="10" font-family="Consolas" fill="' + (col === '#161b1c' ? '#7d8a87' : '#fff') + '">' + hex2(S[n]) + '</text>';
    }
    box.innerHTML = h + '</svg>' + hint('The table S holds the numbers 0-255 (shown in hexadecimal), first shuffled by the key. For each byte: i moves on one (blue), j jumps by S[i] (gold), the two are swapped, and S[S[i] + S[j]] (red) is the key stream byte.');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'byte ' + (i + 1) + ': i = ' + s.i + ', j = ' + s.j + ', swap, key byte S[' + s.t + '] = ' + hex2(s.ks) + '; ' + hex2(s.p) + ' xor ' + hex2(s.ks) + ' &rarr; ' + hex2(s.c); } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Crypto-1: the 48-bit register and its filter ======================= */
OBJ.crypto1 = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  var FB = [0, 5, 9, 10, 12, 14, 15, 17, 19, 24, 25, 27, 29, 35, 39, 41, 42, 43];
  function build() {
    steps = []; var c; try { c = CC.crypto1Setup(api.keys()); } catch (e) { return; }
    var n = Math.min(48, textBytes(api).length * 8); for (var i = 0; i < n; i++) { var before = c.lfsr(), b = c.bit(0, 0); steps.push({ x: before, bit: b }); }
  }
  function draw(s) {
    var c; try { c = CC.crypto1Setup(api.keys()); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var x = s ? s.x : c.lfsr(), marks = {}; FB.forEach(function (i) { marks[i] = '#2d4b7a'; }); for (var f = 9; f <= 47; f += 2) marks[f] = '#c9a227';
    var w = 13, h = '<svg viewBox="0 0 650 140" width="650" style="max-width:100%">' + bitRow(x, 8, 30, w, '', marks, '48-bit register x0 ... x47');
    h += '<text x="8" y="90" fill="' + DIM + '" font-size="12" font-family="Georgia">Gold: the 20 bits read by the filter (x9, x11 ... x47). Blue: the bits added together for the feedback.</text>';
    if (s) h += '<text x="325" y="125" text-anchor="middle" fill="' + HI + '" font-size="15" font-family="Consolas">filter output = key stream bit ' + s.bit + '</text>';
    box.innerHTML = h + '</svg>' + hint('Each tick the filter (two layers of small look-up tables) turns 20 of the 48 bits into one key stream bit, and the register shifts with a new bit made from the blue ones. (Shown for the first 48 bits.)');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'tick ' + (i + 1) + ': key stream bit ' + s.bit; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Salsa20: the 4 x 4 grid through its rounds ======================= */
OBJ.salsa = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [];
  function build() { trace = []; try { var k = api.keys(); CC.salsaBlock(CC.hexKey(k.key, [16, 32], 'key'), CC.hexKey(k.nonce, [8], 'nonce'), 0, trace); } catch (e) { trace = []; } }
  function draw(t, prev) {
    if (!trace.length) { box.innerHTML = hint('<span class="err">Check the key (32 or 64 hexadecimal digits) and the nonce (16).</span>'); return; }
    t = t || trace[0];
    var roles = ['const', 'key', 'key', 'key', 'key', 'const', 'nonce', 'nonce', 'counter', 'counter', 'const', 'key', 'key', 'key', 'key', 'const'], col = { 'const': '#3a3416', key: '#163026', nonce: '#1b2a44', counter: '#2a1b33' };
    var cw = 140, h = '<svg viewBox="0 0 ' + (4 * cw + 20) + ' 260" width="' + (4 * cw + 20) + '" style="max-width:100%">';
    for (var n = 0; n < 16; n++) {
      var x = 10 + (n % 4) * cw, y = 10 + Math.floor(n / 4) * 52, ch = prev && prev.z[n] !== t.z[n];
      h += '<rect x="' + x + '" y="' + y + '" width="' + (cw - 6) + '" height="46" rx="5" fill="' + (t.r === 0 ? col[roles[n]] : '#161b1c') + '" stroke="' + (ch ? HI : '#2c3638') + '" stroke-width="' + (ch ? 2 : 1) + '"/><text x="' + (x + cw / 2 - 3) + '" y="' + (y + 29) + '" text-anchor="middle" font-size="16" font-family="Consolas" fill="' + (ch ? HI : TXT) + '">' + ('0000000' + t.z[n].toString(16).toUpperCase()).slice(-8) + '</text>';
    }
    h += '<text x="' + (2 * cw + 10) + '" y="250" text-anchor="middle" fill="' + DIM + '" font-size="13" font-family="Georgia">' + (t.r === 0 ? 'starting grid: constant "expand 32-byte k" (gold), key (green), nonce (blue), block counter (purple)' : t.r === 21 ? 'final grid: the mixed grid added to the starting grid = 64 bytes of key stream' : 'after round ' + t.r + ' (' + t.kind + ')') + '</text>';
    box.innerHTML = h + '</svg>' + hint('Salsa20 mixes this grid of sixteen 32-bit numbers for 20 rounds, alternately down the columns and along the rows, using only add, rotate and exclusive-or. Changed numbers are outlined. (The first 64-byte block is shown.)');
  }
  var pl = CC.ui.player(host, { count: function () { return trace.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } draw(trace[i], trace[i - 1]); var t = trace[i]; return t.r === 0 ? 'the starting grid' : t.r === 21 ? 'add the starting grid: key stream ready' : 'round ' + t.r + ': quarter-rounds on the ' + t.kind; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Trivium: three registers in a ring ======================= */
OBJ.trivium = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  function build() {
    steps = []; var t; try { t = new CC.Trivium(CC.hexKey(api.keys().key, [10], 'key'), CC.hexKey(api.keys().iv, [10], 'iv')); } catch (e) { return; }
    var n = Math.min(48, textBytes(api).length * 8); for (var i = 0; i < n; i++) { var z = t.clock(); steps.push({ s: Array.from(t.s), z: z }); }
  }
  function draw(st) {
    var t; try { t = new CC.Trivium(CC.hexKey(api.keys().key, [10], 'key'), CC.hexKey(api.keys().iv, [10], 'iv')); } catch (e) { box.innerHTML = hint('<span class="err">' + esc(e.message) + '</span>'); return; }
    var s = st ? st.s : Array.from(t.s), w = 5.6, h = '<svg viewBox="0 0 660 200" width="660" style="max-width:100%">';
    var regs = [[1, 93, 'A: 93 bits', [66, 93, 91, 92, 69]], [94, 177, 'B: 84 bits', [162, 177, 175, 176, 171]], [178, 288, 'C: 111 bits', [243, 288, 286, 287, 264]]];
    regs.forEach(function (R, r) {
      var y = 30 + r * 54; h += '<text x="10" y="' + (y - 6) + '" fill="' + DIM + '" font-size="11" font-family="Georgia">' + R[2] + '</text>';
      for (var i = R[0]; i <= R[1]; i++) { var x = 10 + (i - R[0]) * w, tap = R[3].indexOf(i) >= 0; h += '<rect x="' + x + '" y="' + y + '" width="' + (w - 0.8) + '" height="22" fill="' + (tap ? (s[i] ? '#e8c766' : '#6b5a1c') : s[i] ? GRN : '#20262a') + '"/>'; }
    });
    if (st) h += '<text x="330" y="194" text-anchor="middle" fill="' + HI + '" font-size="15" font-family="Consolas">key stream bit = ' + st.z + '</text>';
    box.innerHTML = h + '</svg>' + hint('288 bits in three registers joined in a ring (each register feeds the next). Gold: the bits read at each tick. Before use the ring is turned 1,152 times; then every tick gives one key stream bit. (Shown for the first 48 bits.)');
  }
  var pl = CC.ui.player(host, { count: function () { return steps.length; }, show: function (i) { if (i < 0) { draw(null); return ''; } draw(steps[i]); return 'tick ' + (i + 1) + ': key stream bit ' + steps[i].z; } });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};
})();
