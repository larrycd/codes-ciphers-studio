/* Codes & Ciphers Studio - working objects, part 1 - by Larry Dalton
   Each object draws itself into the panel above the key and can be turned, dragged or played. */
(function () {
'use strict';
var CC = window.CC, AZ = CC.AZ, mod = CC.mod, OBJ = CC.OBJ = {};
CC.MOVING = { wheel: 1, alberti: 1, tabula: 1, scytale: 1, rails: 1, columns: 1, grid: 1, flags: 1, semaphore: 1, chappe: 1, cooke: 1, morse: 1, tape: 1, tap: 1,
  enigma: 1, lorenz: 1, m209: 1, trellis: 1, turning: 1, crossword: 1, playfair: 1, twosquare: 1, foursquare: 1, bifid: 1, trifid: 1, strips: 1, polybius: 1, vernam: 1, cardan: 1 };
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
var P = Math.PI;
CC.ui = {};

/* step player: Play / Step / Back / Reset with a speed slider */
CC.ui.player = function (host, opts) {
  var bar = document.createElement('div'); bar.className = 'ctl noprint';
  bar.innerHTML = '<button class="b p" data-a="play">&#9654; Play</button><button class="b" data-a="back">&#9664;</button><button class="b" data-a="step">&#9654;|</button><button class="b" data-a="reset">Reset</button>' +
    '<label class="hint">speed <input type="range" min="1" max="10" value="' + (opts.speed || 5) + '" style="width:90px;vertical-align:middle"></label>' + (opts.extra || '');
  var line = document.createElement('div'); line.className = 'step';
  host.appendChild(bar); host.appendChild(line);
  var i = -1, timer = null, sp = bar.querySelector('input');
  function n() { return opts.count(); }
  function go(k) { if (!n()) { opts.show(-1); line.innerHTML = k >= 0 ? 'Nothing to play: the message box has nothing this model can show. Type a message (or use Decipher first).' : ''; i = -1; return; } i = Math.max(-1, Math.min(n() - 1, k)); var txt = opts.show(i) || ''; line.innerHTML = txt && i >= 0 && !/^letter \d/.test(txt) ? 'step ' + (i + 1) + ' of ' + n() + ': ' + txt : txt; }
  function stop() { clearInterval(timer); timer = null; bar.querySelector('[data-a=play]').innerHTML = '&#9654; Play'; }
  bar.onclick = function (e) {
    var a = e.target.dataset.a; if (!a) return;
    if (a === 'play') { if (timer) { stop(); return; } if (i >= n() - 1) go(-1); e.target.innerHTML = '&#10074;&#10074; Pause'; timer = setInterval(function () { if (i >= n() - 1) { stop(); return; } go(i + 1); }, 1500 / +sp.value); }
    if (a === 'step') { stop(); go(i + 1); } if (a === 'back') { stop(); go(i - 1); } if (a === 'reset') { stop(); go(-1); }
  };
  return { stop: stop, go: go, get i() { return i; }, bar: bar, line: line, reset: function () { stop(); go(-1); } };
};
CC.ui.mk = function (host, html) { var d = document.createElement('div'); d.innerHTML = html; host.appendChild(d); return d; };
function polar(cx, cy, r, a) { return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; }
CC.ui.polar = polar;

/* ======================= cipher wheel (Caesar family) ======================= */
OBJ.wheel = function (host, api) {
  var d = api.def, rot = 0, drag = null;
  function ring() { if (d.ring) return Array.from(d.ring); var k = api.keys(); return Array.from(k.alpha === 'heb' ? CC.hebrew : AZ); }
  function shift() { var k = api.keys(); return k.shift !== undefined ? mod(+k.shift || 0, ring().length) : d.fixedShift % ring().length; }
  var S = 380, C = S / 2;
  var box = CC.ui.mk(host, '');
  function draw() {
    var R = ring(), n = R.length, sh = shift(), fs = n > 40 ? 9 : 17, h = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '"><defs><radialGradient id="wg"><stop offset="0" stop-color="#2b2a14"/><stop offset="1" stop-color="#14170f"/></radialGradient></defs>';
    h += '<circle cx="' + C + '" cy="' + C + '" r="182" fill="#1b1f12" stroke="#c9a227" stroke-width="3"/>';
    R.forEach(function (c, i) { var a = i / n * 2 * P, p = polar(C, C, 164, a); h += '<text class="po" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" font-size="' + fs + '" fill="#edf0ee" text-anchor="middle" dominant-baseline="central" font-family="Georgia" transform="rotate(' + (i / n * 360) + ' ' + p[0] + ' ' + p[1] + ')">' + esc(c) + '</text>'; });
    h += '<g id="inner" style="transition:transform .5s;transform-origin:' + C + 'px ' + C + 'px;transform:rotate(' + (-sh / n * 360) + 'deg);cursor:grab"><circle cx="' + C + '" cy="' + C + '" r="148" fill="url(#wg)" stroke="#e8c766" stroke-width="2"/>';
    R.forEach(function (c, i) { var a = i / n * 2 * P, p = polar(C, C, 130, a), q = polar(C, C, 148, a + P / n), q2 = polar(C, C, 112, a + P / n); h += '<line x1="' + q[0] + '" y1="' + q[1] + '" x2="' + q2[0] + '" y2="' + q2[1] + '" stroke="#3b3a1c"/><text class="pi" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" font-size="' + fs + '" fill="#4fb38a" text-anchor="middle" dominant-baseline="central" font-family="Georgia" font-weight="bold" transform="rotate(' + (i / n * 360) + ' ' + p[0] + ' ' + p[1] + ')">' + esc(n === 26 ? c.toLowerCase() : c) + '</text>'; });
    h += '<circle cx="' + C + '" cy="' + C + '" r="34" fill="#2b2a14" stroke="#c9a227"/><circle cx="' + C + '" cy="' + C + '" r="6" fill="#c9a227"/></g>';
    h += '<path d="M' + C + ' 6 l-7 -0 l7 14 l7 -14z" fill="#ffd75e"/>';
    h += '<text x="' + C + '" y="' + (C + 4) + '" text-anchor="middle" fill="#e8c766" font-size="15" font-family="Georgia" pointer-events="none">' + sh + '</text></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Outer ring: plain letters. Inner wheel: cipher letters. ' + (api.keys().shift !== undefined ? 'Drag the inner wheel to change the shift.' : 'This cipher has a fixed shift.') + '</div>';
    var g = box.querySelector('#inner'), svg = box.querySelector('svg');
    g.addEventListener('pointerdown', function (e) { if (api.keys().shift === undefined) return; drag = { a: ang(e), s: shift() }; g.setPointerCapture(e.pointerId); g.style.transition = 'none'; });
    g.addEventListener('pointermove', function (e) { if (!drag) return; var da = ang(e) - drag.a, n = ring().length, steps = Math.round(-da / (2 * P) * n); g.style.transform = 'rotate(' + (-(drag.s + steps) / n * 360) + 'deg)'; drag.cur = mod(drag.s + steps, n); });
    g.addEventListener('pointerup', function () { if (!drag) return; var v = drag.cur !== undefined ? drag.cur : drag.s; drag = null; api.set('shift', v); });
    function ang(e) { var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * S - C, y = (e.clientY - r.top) / r.height * S - C; return Math.atan2(x, -y); }
  }
  var finals = { '\u05da': '\u05db', '\u05dd': '\u05de', '\u05df': '\u05e0', '\u05e3': '\u05e4', '\u05e5': '\u05e6' };
  function seqW() { var R = ring(); return Array.from(api.input()).map(function (c) { return finals[c] || c; }).filter(function (c) { return R.indexOf(R.length === 26 ? c.toUpperCase() : c) >= 0; }); }
  var pl = CC.ui.player(host, {
    count: function () { return seqW().length; },
    show: function (i) {
      box.querySelectorAll('.po,.pi').forEach(function (t) { t.setAttribute('fill', t.classList.contains('po') ? '#edf0ee' : '#4fb38a'); t.removeAttribute('stroke'); t.style.fontSize = ''; });
      if (i < 0) return '';
      var R = ring(), n = R.length, ch = seqW()[i], up = n === 26 ? ch.toUpperCase() : ch, j = R.indexOf(up);
      if (j < 0) return esc(ch) + ' is not on this wheel, so it stays as it is';
      var o = R[(j + shift()) % n];
      [box.querySelector('.po[data-i="' + j + '"]'), box.querySelector('.pi[data-i="' + ((j + shift()) % n) + '"]')].forEach(function (t) { t.setAttribute('fill', '#ffd75e'); t.setAttribute('stroke', '#ffd75e'); t.style.fontSize = (n > 40 ? 15 : 26) + 'px'; });
      return 'letter ' + (i + 1) + ': ' + esc(up) + ' &rarr; ' + esc(n === 26 ? o : o) + '  (move ' + shift() + ' places)';
    }
  });
  return { refresh: function () { draw(); pl.reset(); }, stop: pl.stop };
};

/* ======================= Alberti disk ======================= */
OBJ.alberti = function (host, api) {
  var S = 400, C = 200, box = CC.ui.mk(host, ''), trace = [];
  function rings() { return CC.byId.alberti.rings(api.keys()); }
  function draw(off) {
    var R = rings(), O = R[0], I = R[1], n = O.length, h = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '">';
    h += '<circle cx="' + C + '" cy="' + C + '" r="190" fill="#24200f" stroke="#c9a227" stroke-width="3"/><circle cx="' + C + '" cy="' + C + '" r="150" fill="none" stroke="#6b5a1c"/>';
    for (var i = 0; i < n; i++) { var a = i / n * 2 * P, p = polar(C, C, 170, a), l1 = polar(C, C, 190, a + P / n), l2 = polar(C, C, 150, a + P / n); h += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="#6b5a1c"/><text class="ao" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" fill="#f3e3b3" font-size="19" font-family="Georgia" text-anchor="middle" dominant-baseline="central" transform="rotate(' + (i / n * 360) + ' ' + p[0] + ' ' + p[1] + ')">' + O[i] + '</text>'; }
    h += '<g id="ainner" style="transition:transform .6s;transform-origin:' + C + 'px ' + C + 'px;transform:rotate(' + (off / n * 360) + 'deg)"><circle cx="' + C + '" cy="' + C + '" r="148" fill="#132018" stroke="#4fb38a" stroke-width="2"/>';
    for (i = 0; i < n; i++) { a = i / n * 2 * P; p = polar(C, C, 128, a); l1 = polar(C, C, 148, a + P / n); l2 = polar(C, C, 108, a + P / n); h += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="#24493a"/><text class="ai" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" fill="#8fe0bd" font-size="19" font-style="italic" font-family="Georgia" text-anchor="middle" dominant-baseline="central" transform="rotate(' + (i / n * 360) + ' ' + p[0] + ' ' + p[1] + ')">' + I[i] + '</text>'; }
    h += '<circle cx="' + C + '" cy="' + C + '" r="60" fill="#0f1712" stroke="#4fb38a"/><text x="' + C + '" y="' + (C + 6) + '" text-anchor="middle" fill="#4fb38a" font-family="Georgia" font-size="16">Formula</text><circle cx="' + C + '" cy="' + C + '" r="5" fill="#c9a227"/></g></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Outer: Alberti\'s plain capitals and the digits 1-4. Inner (turns): his mixed small letters. Play the message to watch the disk turn at each new capital.</div>';
  }
  function offsetFor(cap) { var R = rings(), k = api.keys(), idx = R[1].indexOf(String(k.index || R[1][1])[0]); if (idx < 0) idx = 1; return mod(idx - R[0].indexOf(cap), R[0].length); }
  function build() {
    trace = []; var R = rings(), O = R[0], I = R[1], n = O.length, ct = CC.byId.alberti.enc(api.input(), api.keys()), off = 0;
    Array.from(ct).forEach(function (c) {
      if (/[A-Z]/.test(c) && O.indexOf(c) >= 0) { off = offsetFor(c); trace.push({ cap: c, off: off }); }
      else { var q = I.indexOf(c); if (q >= 0) trace.push({ c: c, q: q, off: off, p: O[mod(q - off, n)] }); }
    });
    draw(trace.length ? -trace[0].off : 0);
  }
  var pl = CC.ui.player(host, {
    count: function () { return trace.length; },
    show: function (i) {
      box.querySelectorAll('.ao,.ai').forEach(function (t) { t.setAttribute('fill', t.classList.contains('ao') ? '#f3e3b3' : '#8fe0bd'); });
      if (i < 0) return '';
      var t = trace[i], g = box.querySelector('#ainner'), n = rings()[0].length;
      g.style.transform = 'rotate(' + (-t.off / n * 360) + 'deg)';
      if (t.cap) return 'Capital ' + t.cap + ': turn the index letter "' + esc(api.keys().index) + '" to ' + t.cap;
      var oi = rings()[0].indexOf(t.p);
      box.querySelector('.ao[data-i="' + oi + '"]').setAttribute('fill', '#ffd75e'); box.querySelector('.ai[data-i="' + t.q + '"]').setAttribute('fill', '#ffd75e');
      return t.p + ' &rarr; ' + t.c;
    }
  });
  return { refresh: function () { build(); pl.reset(); }, stop: pl.stop };
};

/* ======================= two alphabets (Atbash, keyword) ======================= */
OBJ.strips = function (host, api) {
  var box = CC.ui.mk(host, '');
  function alpha() { return api.def.id === 'atbash' ? AZ.split('').reverse().join('') : CC.byId.keyword.cipherAlpha(api.keys()); }
  function draw() {
    var A = alpha(), w = 26 * 26 + 20, h = '<svg viewBox="0 0 ' + w + ' 110" width="' + w + '">';
    for (var i = 0; i < 26; i++) { var x = 14 + i * 26; h += '<rect class="sa" data-i="' + i + '" x="' + (x - 11) + '" y="10" width="22" height="30" rx="4" fill="#20262a"/><text x="' + x + '" y="31" text-anchor="middle" fill="#edf0ee" font-family="Consolas" font-size="17">' + AZ[i] + '</text>' +
      '<line x1="' + x + '" y1="42" x2="' + x + '" y2="66" stroke="#2c3638"/><rect class="sb" data-i="' + i + '" x="' + (x - 11) + '" y="68" width="22" height="30" rx="4" fill="#163026"/><text x="' + x + '" y="89" text-anchor="middle" fill="#4fb38a" font-family="Consolas" font-size="17" font-weight="bold">' + A[i] + '</text>'; }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">Top: plain alphabet. Bottom: cipher alphabet.</div>';
  }
  var pl = CC.ui.player(host, {
    count: function () { return CC.letters(api.input()).length; },
    show: function (i) {
      box.querySelectorAll('.sa,.sb').forEach(function (r) { r.setAttribute('fill', r.classList.contains('sa') ? '#20262a' : '#163026'); });
      if (i < 0) return ''; var c = CC.letters(api.input())[i], j = AZ.indexOf(c);
      box.querySelector('.sa[data-i="' + j + '"]').setAttribute('fill', '#6b5a1c'); box.querySelector('.sb[data-i="' + j + '"]').setAttribute('fill', '#6b5a1c');
      return c + ' &rarr; ' + alpha()[j];
    }
  });
  return { refresh: function () { draw(); pl.reset(); }, stop: pl.stop };
};

/* ======================= tabula recta / Vigenere square and a key slider ======================= */
OBJ.tabula = function (host, api) {
  var box = CC.ui.mk(host, ''), id = api.def.id, steps = [];
  function alphaT() { return id === 'trithemius' ? CC.trithemiusAlpha(api.keys()) : id === 'quagmire3' ? CC.keyAlpha(CC.letters(api.keys().alpha)) : AZ; }
  function draw() {
    var cs = 19, o = 24, W = o + 26 * cs + 4, h = '<svg viewBox="0 0 ' + W + ' ' + W + '" width="' + W + '" style="max-width:560px">';
    var A = alphaT();
    for (var c = 0; c < 26; c++) h += '<text class="th" data-c="' + c + '" x="' + (o + c * cs + cs / 2) + '" y="16" text-anchor="middle" fill="#e8c766" font-size="12" font-family="Consolas">' + A[c] + '</text>';
    for (var r = 0; r < 26; r++) {
      h += '<text class="tv" data-r="' + r + '" x="10" y="' + (o + r * cs + cs / 2 + 4) + '" text-anchor="middle" fill="#e8c766" font-size="12" font-family="Consolas">' + (id === 'quagmire3' ? A : AZ)[r] + '</text>';
      for (c = 0; c < 26; c++) h += '<rect class="tc" data-r="' + r + '" data-c="' + c + '" x="' + (o + c * cs) + '" y="' + (o + r * cs) + '" width="' + cs + '" height="' + cs + '" fill="' + ((r + c) % 2 ? '#161b1c' : '#1a2021') + '"/><text x="' + (o + c * cs + cs / 2) + '" y="' + (o + r * cs + cs / 2 + 4) + '" text-anchor="middle" fill="#9fb0ab" font-size="11" font-family="Consolas" pointer-events="none">' + (id === 'beaufort' ? AZ[mod(r - c, 26)] : A[(r + c) % 26]) + '</text>';
    }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">' + (id === 'beaufort' ? 'The Beaufort square: each row runs backwards (Z to A). Row = key letter, column = plain letter; the cell is the cipher letter. The same square deciphers: row = key letter, column = cipher letter.' : id === 'varbeaufort' ? 'Variant Beaufort: find the plain letter in the key row; the column heading is the cipher letter.' : (id === 'trithemius' ? 'Row = this letter\'s step (A = no change), column = plain letter; the cell is the cipher letter.' : id === 'gronsfeld' ? 'Row = key digit (0 = row A, 1 = row B ... 9 = row J), column = plain letter; the cell is the cipher letter. Only the first ten rows are ever used.' : id === 'quagmire3' ? 'The whole square, headings included, uses the mixed alphabet. Row = key letter, column = plain letter; the cell is the cipher letter.' : 'Row = key letter, column = plain letter; the cell is the cipher letter.')) + '</div>';
  }
  function build() {
    steps = []; var t = CC.letters(api.input()), k = api.keys(), key;
    if (id === 'trithemius') key = t.split('').map(function (_, i) { return AZ[mod(CC.trithemiusShift(k, i), 26)]; }).join('');
    else if (id === 'autokey') key = (CC.letters(k.key) || 'A') + t;
    else if (id === 'runningkey') { try { key = CC.byId.runningkey.key(k, t.length); } catch (e) { key = ''; } }
    else if (id === 'gronsfeld') { var Gd = String(k.key || '').replace(/\D/g, '') || '0'; key = t.split('').map(function (_, i) { return AZ[+Gd[i % Gd.length]]; }).join(''); }
    else { var K = CC.letters(k.key) || 'A'; key = t.split('').map(function (_, i) { return K[i % K.length]; }).join(''); }
    var A = alphaT();
    t.split('').forEach(function (p, i) { if (!key[i]) return; var ki = (id === 'quagmire3' ? A : AZ).indexOf(key[i]), pi = A.indexOf(p), out;
      if (id === 'beaufort') out = mod(ki - pi, 26); else if (id === 'varbeaufort') out = mod(pi - ki, 26); else out = mod(pi + ki, 26);
      steps.push({ p: p, k: key[i], pi: pi, ki: ki, o: A[out], oi: out }); });
  }
  var pl = CC.ui.player(host, {
    count: function () { return steps.length; },
    show: function (i) {
      box.querySelectorAll('.tc').forEach(function (r) { var a = +r.dataset.r, b = +r.dataset.c; r.setAttribute('fill', (a + b) % 2 ? '#161b1c' : '#1a2021'); var t = r.nextElementSibling; t.setAttribute('fill', '#9fb0ab'); t.removeAttribute('font-weight'); t.setAttribute('font-size', '11'); });
      box.querySelectorAll('.th,.tv').forEach(function (t) { t.setAttribute('fill', '#e8c766'); t.removeAttribute('font-weight'); t.setAttribute('font-size', '12'); });
      if (i < 0) return ''; var s = steps[i], R, Cc;
      if (id === 'beaufort') { R = s.ki; Cc = s.pi; }
      else if (id === 'varbeaufort') { R = s.ki; Cc = s.oi; }
      else { R = s.ki; Cc = s.pi; }
      box.querySelectorAll('.tc').forEach(function (r) { var a = +r.dataset.r, b = +r.dataset.c, t = r.nextElementSibling;
        if (a === R && b <= Cc || b === Cc && a <= R) { r.setAttribute('fill', '#5c4f16'); t.setAttribute('fill', '#fff'); }
        if (a === R && b === Cc) { r.setAttribute('fill', '#ffd75e'); r.classList.add('hit'); t.setAttribute('fill', '#111'); t.setAttribute('font-weight', 'bold'); t.setAttribute('font-size', '14'); } else r.classList.remove('hit'); });
      [box.querySelector('.tv[data-r="' + R + '"]'), box.querySelector('.th[data-c="' + Cc + '"]')].forEach(function (t) { t.setAttribute('fill', '#ffd75e'); t.setAttribute('font-weight', 'bold'); t.setAttribute('font-size', '15'); });
      if (id === 'varbeaufort') { var hd = box.querySelector('.th[data-c="' + Cc + '"]'); hd.setAttribute('fill', '#4fb38a'); hd.setAttribute('font-size', '17'); }
      return 'letter ' + (i + 1) + ': plain ' + s.p + (id === 'trithemius' ? ' on row ' + s.k : id === 'gronsfeld' ? ' with key digit ' + s.ki + ' (row ' + s.k + ')' : ' with key ' + s.k) + ' &rarr; ' + s.o;
    }
  });
  return { refresh: function () { draw(); build(); pl.reset(); }, stop: pl.stop };
};

/* ======================= scytale: a rod you can turn and a strip that unwinds ======================= */
OBJ.scytale = function (host, api) {
  var box = CC.ui.mk(host, ''), turn = 0, unwound = false;
  function draw() {
    var k = api.keys(), f = Math.max(2, +k.faces || 4), t = CC.letters(api.input()), cols = Math.max(1, Math.ceil(t.length / f));
    var note = '', full = t + Array(f * cols - t.length + 1).join('·'), cw = cols < 12 ? 46 : 30, W = cols * cw + 80, h = '<svg viewBox="0 0 ' + W + ' 250" width="' + W + '">';
    if (!unwound) {
      /* the rod, seen from the side: the visible face is row "turn"; the faces above and below are foreshortened */
      h += '<rect x="20" y="40" width="' + (cols * cw + 40) + '" height="130" rx="65" fill="#5b3b1a"/><rect x="20" y="40" width="' + (cols * cw + 40) + '" height="130" rx="65" fill="url(#rodg)"/>';
      h += '<defs><linearGradient id="rodg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient></defs>';
      for (var vis = -1; vis <= 1; vis++) {
        var r = mod(turn + vis, f), y = 105 + vis * 40, sc = vis === 0 ? 1 : 0.55, op = vis === 0 ? 1 : 0.5;
        for (var c = 0; c < cols; c++) { var x = 40 + c * cw + cw / 2; h += '<g opacity="' + op + '"><rect x="' + (x - cw / 2 + 1) + '" y="' + (y - 17 * sc) + '" width="' + (cw - 2) + '" height="' + (34 * sc) + '" fill="#e8dcb8" stroke="#8a7440" transform="skewX(-12)" transform-origin="' + x + ' ' + y + '"/><text x="' + x + '" y="' + y + '" font-size="' + (19 * sc) + '" text-anchor="middle" dominant-baseline="central" font-family="Georgia" fill="#2a1d0c">' + full[r * cols + c] + '</text></g>'; }
      }
      note = 'Face ' + (turn + 1) + ' of ' + f + ' is facing you. Turn the rod to read the next line; the leather spirals round it.';
    } else {
      var o = CC.byId.scytale.enc(api.input(), Object.assign({}, k, { pad: 'x' })), sw = Math.min(26, (W - 40) / Math.max(1, o.length));
      h += '<rect x="20" y="85" width="' + (o.length * sw) + '" height="44" fill="#e8dcb8" stroke="#8a7440"/>';
      for (var i = 0; i < o.length; i++) h += '<text x="' + (20 + i * sw + sw / 2) + '" y="107" font-size="' + Math.min(18, sw) + '" text-anchor="middle" dominant-baseline="central" font-family="Georgia" fill="#2a1d0c">' + o[i] + '</text>';
      note = 'The unwound strip: the letters no longer line up into words.';
    }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">' + note + '</div>';
  }
  var ctl = CC.ui.mk(host, '<div class="ctl noprint"><button class="b" data-t="-1">&#8635; Turn rod back</button><button class="b" data-t="1">Turn rod &#8634;</button><button class="b p" data-u="1">Unwind / wind the strip</button></div>');
  ctl.onclick = function (e) { var f = Math.max(2, +api.keys().faces || 4); if (e.target.dataset.t) { turn = mod(turn + +e.target.dataset.t, f); unwound = false; draw(); } if (e.target.dataset.u) { unwound = !unwound; draw(); } };
  return { refresh: function () { turn = 0; draw(); } };
};

/* ======================= rail fence zig-zag ======================= */
OBJ.rails = function (host, api) {
  var box = CC.ui.mk(host, '');
  function draw(upto, reading) {
    var t = CC.letters(api.input()), R = Math.max(2, +api.keys().rails || 3), p = CC.railPattern(t.length, R), cw = 22, W = Math.max(400, t.length * cw + 40), H = R * 34 + 30, h = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '">';
    for (var r = 0; r < R; r++) h += '<line x1="10" y1="' + (25 + r * 34) + '" x2="' + (W - 10) + '" y2="' + (25 + r * 34) + '" stroke="#3a3216" stroke-width="2"/>';
    var path = '';
    for (var i = 0; i < t.length; i++) { var x = 25 + i * cw, y = 25 + p[i] * 34; path += (i ? 'L' : 'M') + x + ' ' + y; }
    h += '<path d="' + path + '" fill="none" stroke="#2c5a47" stroke-dasharray="3 3"/>';
    for (i = 0; i < t.length; i++) {
      if (upto !== undefined && i > upto) break;
      x = 25 + i * cw; y = 25 + p[i] * 34; var lit = reading !== undefined && p[i] === reading;
      h += '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + (lit ? '#a8871d' : '#163026') + '"/><text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-family="Consolas" font-size="14" fill="#edf0ee">' + t[i] + '</text>';
    }
    box.innerHTML = h + '</svg>';
  }
  var t0 = function () { return CC.letters(api.input()); };
  var pl = CC.ui.player(host, {
    count: function () { return t0().length + Math.max(2, +api.keys().rails || 3); },
    show: function (i) {
      var t = t0(), R = Math.max(2, +api.keys().rails || 3);
      if (i < 0) { draw(-1); return ''; }
      if (i < t.length) { draw(i); return 'Writing ' + t[i] + ' on rail ' + (CC.railPattern(t.length, R)[i] + 1); }
      var r = i - t.length, p = CC.railPattern(t.length, R), s = ''; for (var j = 0; j < t.length; j++) if (p[j] === r) s += t[j];
      draw(undefined, r); return 'Reading rail ' + (r + 1) + ': ' + s;
    }
  });
  return { refresh: function () { pl.reset(); draw(); }, stop: pl.stop };
};

/* ======================= columnar family: columns slide into key order ======================= */
OBJ.columns = function (host, api) {
  var box = CC.ui.mk(host, ''), id = api.def.id, step = 0;
  /* the grids to show: one for single transpositions, two for the double one (the second is filled with the first one's result) */
  function stages() {
    var k = api.keys(), t = CC.letters(api.input()), key1 = CC.letters(k.key) || 'KEY', out = [];
    var mk = function (key, text, pad) {
      var C = key.length, R = Math.max(1, Math.ceil(text.length / C)), cells = [];
      if (id === 'disrupted') { var d = CC.disruptGrid(text.length, key, text); for (var i = 0; i < R * C; i++) cells.push(d.grid[i] === undefined ? '' : text[d.grid[i]]); }
      else { var pc = pad === 'x' ? 'X' : pad === 'random' ? '?' : ''; for (i = 0; i < R * C; i++) cells.push(text[i] || pc); }
      var rank = CC.keyOrder(key), order = []; rank.forEach(function (rk, col) { order[rk] = col; });
      var read = ''; order.forEach(function (col) { for (var r = 0; r < R; r++) { var v = cells[r * C + col]; if (v && v !== '?') read += v; } });
      if (id === 'myszkowski') read = CC.byId.myszkowski.enc(text, { key: key, pad: 'blank' });
      return { key: key, C: C, R: R, cells: cells, rank: rank, read: read };
    };
    out.push(mk(key1, t, k.pad));
    if (id === 'double') out.push(mk(CC.letters(k.key2) || 'KEY', out[0].read.replace(/\?/g, ''), 'blank'));
    return out;
  }
  function grid(L, sorted, title) {
    var cw = 30, ch = 28, top = 46, W = Math.max(L.C * cw + 20, 220), H = top + L.R * ch + 10;
    var groups = id === 'myszkowski' ? (function () { var u = CC.dedupe(L.key.split('').sort().join('')); return L.key.split('').map(function (c) { return u.indexOf(c) + 1; }); })() : L.rank.map(function (r) { return r + 1; });
    var h = '<div style="text-align:center;margin:4px 10px"><div class="hint">' + title + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '">';
    for (var c = 0; c < L.C; c++) {
      var x = 10 + (sorted && id !== 'myszkowski' ? L.rank[c] : c) * cw;
      h += '<g style="transition:transform .9s ease;transform:translateX(' + x + 'px)"><rect x="0" y="0" width="' + (cw - 2) + '" height="' + ch + '" rx="4" fill="#4a3f12"/><text x="' + (cw / 2 - 1) + '" y="19" text-anchor="middle" fill="#ffd75e" font-family="Consolas" font-size="16" font-weight="bold">' + L.key[c] + '</text>' +
        '<text x="' + (cw / 2 - 1) + '" y="' + (ch + 13) + '" text-anchor="middle" fill="#97a3a0" font-family="Consolas" font-size="11">' + groups[c] + '</text>';
      for (var r = 0; r < L.R; r++) { var v = L.cells[r * L.C + c]; h += '<rect x="0" y="' + (top + r * ch) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" fill="' + (v ? '#1e2526' : '#101414') + '"/><text x="' + (cw / 2 - 1) + '" y="' + (top + r * ch + 19) + '" text-anchor="middle" fill="' + (v === '?' ? '#4fb38a' : '#edf0ee') + '" font-family="Consolas" font-size="15">' + v + '</text>'; }
      h += '</g>';
    }
    h += '</svg>';
    if (sorted || id === 'myszkowski') h += '<div class="out" style="font-size:13px;min-height:auto;padding:4px 8px;max-width:' + Math.max(W, 220) + 'px;margin:4px auto">' + (L.read || '&nbsp;') + '</div>';
    return h + '</div>';
  }
  function draw() {
    var S = stages(), h = '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">', maxStep = S.length * 2 - 1;
    S.forEach(function (L, i) {
      var shown = step >= i * 2, sorted = step >= i * 2 + 1;
      if (!shown) return;
      var title = id === 'double' ? (i === 0 ? 'Step 1: first keyword ' : 'Step 2: second keyword ') + L.key + (i === 1 ? ' (filled with the result of step 1)' : '') : 'Keyword ' + L.key;
      if (i > 0) h += '<div style="font-size:26px;color:#c9a227">&darr;</div>';
      h += grid(L, sorted, title + (sorted && id !== 'myszkowski' ? ': columns sorted, read down each' : ''));
    });
    var btn = host.querySelector('#csort');
    if (btn) btn.textContent = step >= maxStep ? 'Start again' : step % 2 === 0 ? 'Sort the columns' : 'Write the result into the second keyword';
    box.innerHTML = h + '</div><div class="hint" style="text-align:center">' + (id === 'myszkowski' ? 'Columns with the same number are read together, row by row; the box shows the result.' : id === 'disrupted' ? 'Writing jumps to a new row after any letter that is in the keyword; leftovers fill the gaps. Then the columns are read in keyword order.' : 'The numbers show the alphabetical order of the keyword letters.' + (id === 'double' ? ' The result of step 1 is written row by row under the second keyword and transposed again.' : '')) + ' Green ? marks a filler letter.</div>';
  }
  var ctl = CC.ui.mk(host, '<div class="ctl noprint"><button class="b p" id="csort">Sort the columns</button></div>');
  ctl.onclick = function (e) { if (e.target.id !== 'csort') return; var max = stages().length * 2 - 1; step = step >= max ? 0 : step + 1; draw(); };
  if (id === 'myszkowski') ctl.style.display = 'none';
  return { refresh: function () { step = id === 'myszkowski' ? 1 : 0; draw(); } };
};

/* ======================= route grid ======================= */
OBJ.grid = function (host, api) {
  var box = CC.ui.mk(host, '');
  function geo() { var k = api.keys(), C = Math.max(2, +k.cols || 7), t = CC.letters(api.input()), R = Math.ceil(t.length / C); return { C: C, R: R, t: t, ord: CC.routeOrder(R, C, k.route) }; }
  function draw(upto) {
    var g = geo(), cw = 34, W = g.C * cw + 20, H = g.R * cw + 20, h = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '">';
    for (var r = 0; r < g.R; r++) for (var c = 0; c < g.C; c++) { var v = g.t[r * g.C + c] || '·'; h += '<rect x="' + (10 + c * cw) + '" y="' + (10 + r * cw) + '" width="' + (cw - 2) + '" height="' + (cw - 2) + '" fill="#1e2526"/><text x="' + (10 + c * cw + cw / 2 - 1) + '" y="' + (10 + r * cw + cw / 2 + 5) + '" text-anchor="middle" font-family="Consolas" font-size="16" fill="' + (g.t[r * g.C + c] ? '#edf0ee' : '#4fb38a') + '">' + v + '</text>'; }
    if (upto >= 0) { var d = ''; for (var i = 0; i <= upto && i < g.ord.length; i++) d += (i ? 'L' : 'M') + (10 + g.ord[i][1] * cw + cw / 2 - 1) + ' ' + (10 + g.ord[i][0] * cw + cw / 2 - 1); h += '<path d="' + d + '" fill="none" stroke="#ffd75e" stroke-width="3" stroke-opacity=".7" stroke-linejoin="round"/>'; var e = g.ord[Math.min(upto, g.ord.length - 1)]; h += '<circle cx="' + (10 + e[1] * cw + cw / 2 - 1) + '" cy="' + (10 + e[0] * cw + cw / 2 - 1) + '" r="6" fill="#ffd75e"/>'; }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">Dots are filler cells. Play to follow the route.</div>';
  }
  var pl = CC.ui.player(host, { speed: 7, count: function () { var g = geo(); return g.R * g.C; }, show: function (i) { draw(i); if (i < 0) return ''; var g = geo(), p = g.ord[i]; return 'step ' + (i + 1) + ': row ' + (p[0] + 1) + ', column ' + (p[1] + 1); } });
  return { refresh: function () { pl.reset(); draw(-1); }, stop: pl.stop };
};

/* ======================= signal flags ======================= */
CC.flagSVG = function (c, w) {
  var W = w || 60, H = W * 0.75, y = '#f5c400', r = '#d6202b', b = '#1a3b8f', k = '#111', wh = '#f4f4f4', s = '<svg viewBox="0 0 60 45" width="' + W + '" height="' + H + '">', R = function (x, y0, w0, h0, f) { return '<rect x="' + x + '" y="' + y0 + '" width="' + w0 + '" height="' + h0 + '" fill="' + f + '"/>'; };
  switch (c) {
    case 'A': s += R(0, 0, 30, 45, wh) + '<path d="M30 0H60L45 22.5L60 45H30Z" fill="' + b + '"/>'; break;
    case 'B': s += '<path d="M0 0H60L45 22.5L60 45H0Z" fill="' + r + '"/>'; break;
    case 'C': s += R(0, 0, 60, 9, b) + R(0, 9, 60, 9, wh) + R(0, 18, 60, 9, r) + R(0, 27, 60, 9, wh) + R(0, 36, 60, 9, b); break;
    case 'D': s += R(0, 0, 60, 45, b) + R(0, 0, 60, 9, y) + R(0, 36, 60, 9, y); break;
    case 'E': s += R(0, 0, 60, 22.5, b) + R(0, 22.5, 60, 22.5, r); break;
    case 'F': s += R(0, 0, 60, 45, wh) + '<path d="M30 0L60 22.5L30 45L0 22.5Z" fill="' + r + '"/>'; break;
    case 'G': for (var i = 0; i < 6; i++) s += R(i * 10, 0, 10, 45, i % 2 ? b : y); break;
    case 'H': s += R(0, 0, 30, 45, wh) + R(30, 0, 30, 45, r); break;
    case 'I': s += R(0, 0, 60, 45, y) + '<circle cx="30" cy="22.5" r="11" fill="' + k + '"/>'; break;
    case 'J': s += R(0, 0, 60, 15, b) + R(0, 15, 60, 15, wh) + R(0, 30, 60, 15, b); break;
    case 'K': s += R(0, 0, 30, 45, y) + R(30, 0, 30, 45, b); break;
    case 'L': s += R(0, 0, 30, 22.5, y) + R(30, 0, 30, 22.5, k) + R(0, 22.5, 30, 22.5, k) + R(30, 22.5, 30, 22.5, y); break;
    case 'M': s += R(0, 0, 60, 45, b) + '<path d="M0 0L60 45M60 0L0 45" stroke="' + wh + '" stroke-width="8"/>'; break;
    case 'N': for (var a = 0; a < 4; a++) for (var bb = 0; bb < 4; bb++) s += R(a * 15, bb * 11.25, 15, 11.25, (a + bb) % 2 ? wh : b); break;
    case 'O': s += '<path d="M0 0H60V45Z" fill="' + r + '"/><path d="M0 0V45H60Z" fill="' + y + '"/>'; break;
    case 'P': s += R(0, 0, 60, 45, b) + R(18, 13, 24, 19, wh); break;
    case 'Q': s += R(0, 0, 60, 45, y); break;
    case 'R': s += R(0, 0, 60, 45, r) + R(25, 0, 10, 45, y) + R(0, 17.5, 60, 10, y); break;
    case 'S': s += R(0, 0, 60, 45, wh) + R(18, 13, 24, 19, b); break;
    case 'T': s += R(0, 0, 20, 45, r) + R(20, 0, 20, 45, wh) + R(40, 0, 20, 45, b); break;
    case 'U': s += R(0, 0, 30, 22.5, r) + R(30, 0, 30, 22.5, wh) + R(0, 22.5, 30, 22.5, wh) + R(30, 22.5, 30, 22.5, r); break;
    case 'V': s += R(0, 0, 60, 45, wh) + '<path d="M0 0L60 45M60 0L0 45" stroke="' + r + '" stroke-width="8"/>'; break;
    case 'W': s += R(0, 0, 60, 45, b) + R(9, 7, 42, 31, wh) + R(20, 15, 20, 15, r); break;
    case 'X': s += R(0, 0, 60, 45, wh) + R(25, 0, 10, 45, b) + R(0, 17.5, 60, 10, b); break;
    case 'Y': s += R(0, 0, 60, 45, y) + '<g clip-path="inset(0)">' + [-40, -24, -8, 8, 24, 40, 56].map(function (o) { return '<path d="M' + o + ' 45L' + (o + 45) + ' 0" stroke="' + r + '" stroke-width="7"/>'; }).join('') + '</g>'; break;
    case 'Z': s += '<path d="M0 0H60L30 22.5Z" fill="' + y + '"/><path d="M0 0V45L30 22.5Z" fill="' + k + '"/><path d="M0 45H60L30 22.5Z" fill="' + r + '"/><path d="M60 0V45L30 22.5Z" fill="' + b + '"/>'; break;
    default: /* numeral pennants 0-9 */
      var pen = { 1: [wh, '<circle cx="14" cy="22.5" r="7" fill="' + r + '"/>'], 2: [b, '<circle cx="14" cy="22.5" r="7" fill="' + wh + '"/>'], 3: [wh, R(0, 0, 18, 45, r) + R(36, 0, 24, 45, b)], 4: [r, R(13, 0, 6, 45, wh) + R(0, 19.5, 60, 6, wh)],
        5: [b, R(0, 0, 25, 45, y)], 6: [wh, R(0, 0, 60, 22.5, k)], 7: [r, R(0, 0, 60, 22.5, y)], 8: [wh, R(13, 0, 6, 45, r) + R(0, 19.5, 60, 6, r)], 9: [wh, R(0, 0, 25, 22.5, wh) + R(25, 0, 35, 22.5, k) + R(0, 22.5, 25, 22.5, r) + R(25, 22.5, 35, 22.5, y)], 0: [y, R(18, 0, 18, 45, r)] }[c];
      if (!pen) return '';
      s += '<defs><clipPath id="pen' + c + '"><path d="M0 0L60 16V29L0 45Z"/></clipPath></defs><g clip-path="url(#pen' + c + ')">' + R(0, 0, 60, 45, pen[0]) + pen[1] + '</g><path d="M0 0L60 16V29L0 45Z" fill="none" stroke="#777"/>';
  }
  return s + (/[A-Z]/.test(c) ? '<rect x="0" y="0" width="60" height="45" fill="none" stroke="#777"/>' : '') + '</svg>';
};
OBJ.flags = function (host, api) {
  var box = CC.ui.mk(host, '');
  function draw(upto) {
    var words = String(api.input()).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean), h = '<div style="display:flex;gap:26px;flex-wrap:wrap;justify-content:center">', n = 0;
    words.forEach(function (w) {
      h += '<div style="display:flex;flex-direction:column;align-items:center"><div style="width:4px;background:#8a7440;height:10px"></div>';
      w.split('').forEach(function (c) { var show = upto === undefined || n <= upto; h += '<div style="display:flex;align-items:center;gap:6px;transition:opacity .4s;opacity:' + (show ? 1 : 0.08) + ';transform:translateY(' + (show ? 0 : 20) + 'px);transition:all .5s"><div style="width:4px;align-self:stretch;background:#8a7440"></div>' + CC.flagSVG(c, 54) + '<span class="hint" style="width:62px">' + (CC.flags[c] || 'Pennant ' + c) + '</span></div>'; n++; });
      h += '</div>';
    });
    box.innerHTML = h + '</div><div class="hint" style="text-align:center;margin-top:6px">One hoist per word, read from the top. Play to run the flags up.</div>';
  }
  var pl = CC.ui.player(host, { count: function () { return String(api.input()).replace(/[^A-Za-z0-9]/g, '').length; }, show: function (i) { draw(i); return i < 0 ? '' : 'Hoisting flag ' + (i + 1); } });
  return { refresh: function () { pl.reset(); draw(); }, stop: pl.stop };
};
OBJ.flags.chart = true;

/* ======================= semaphore figure ======================= */
OBJ.semaphore = function (host, api) {
  var box = CC.ui.mk(host, '');
  box.innerHTML = '<svg viewBox="0 0 300 300" width="300"><circle cx="150" cy="60" r="22" fill="#d9b48f"/><rect x="128" y="86" width="44" height="90" rx="12" fill="#1a3b8f"/><rect x="132" y="176" width="16" height="90" fill="#222"/><rect x="152" y="176" width="16" height="90" fill="#222"/>' +
    '<g id="armL" style="transition:transform .45s;transform-origin:138px 100px"><rect x="132" y="100" width="12" height="80" rx="6" fill="#d9b48f"/><rect x="136" y="175" width="4" height="40" fill="#8a7440"/><path d="M140 182h34v34h-34z" fill="#f5c400"/><path d="M140 182h34l-34 34z" fill="#d6202b"/></g>' +
    '<g id="armR" style="transition:transform .45s;transform-origin:162px 100px"><rect x="156" y="100" width="12" height="80" rx="6" fill="#d9b48f"/><rect x="160" y="175" width="4" height="40" fill="#8a7440"/><path d="M164 182h-34v34h34z" fill="#f5c400"/><path d="M164 182h-34l34 34z" fill="#d6202b"/></g>' +
    '<text id="sl" x="150" y="292" text-anchor="middle" fill="#ffd75e" font-family="Georgia" font-size="22"></text></svg><div class="hint" style="text-align:center">Seen from the front, as the receiver sees the signaller.</div>';
  function pose(c) {
    var p = CC.semaphore[c] || [0, 0], deg = function (d) { return d * 45; };
    /* direction 0 = down; arms rotate about the shoulders. Left of picture uses the lower-numbered side */
    var a = p[0], b = p[1], L = a, Rr = b; if (a > 4 || (b >= 1 && b <= 4 && a !== 0) ) { /* keep each arm on its own side where possible */ }
    var left = [a, b].filter(function (d) { return d >= 1 && d <= 4; }), right = [a, b].filter(function (d) { return d >= 5 && d <= 7; }), down = [a, b].filter(function (d) { return d === 0; });
    var arr = left.concat(down, right); L = arr[0]; Rr = arr[1];
    if (left.length === 2) { L = left[0]; Rr = left[1]; } if (right.length === 2) { L = right[0]; Rr = right[1]; }
    box.querySelector('#armL').style.transform = 'rotate(' + deg(L) + 'deg)'; box.querySelector('#armR').style.transform = 'rotate(' + deg(Rr) + 'deg)';
    box.querySelector('#sl').textContent = c === ' ' ? '(space)' : c === '#' ? 'numerals' : c;
  }
  function seq() { var o = []; String(api.input()).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split('').forEach(function (c) { if (/\d/.test(c)) { o.push('#'); o.push(CC.semaDigits[c]); } else o.push(c); }); return o; }
  var pl = CC.ui.player(host, { count: function () { return seq().length; }, show: function (i) { if (i < 0) { pose(' '); return ''; } var c = seq()[i]; pose(c); return c === '#' ? 'numeral sign (next letters are digits)' : c === ' ' ? 'rest (space)' : 'letter ' + c; } });
  return { refresh: function () { pl.reset(); }, stop: pl.stop };
};

/* ======================= Chappe telegraph ======================= */
OBJ.chappe = function (host, api) {
  var box = CC.ui.mk(host, '');
  box.innerHTML = '<svg viewBox="0 0 320 320" width="320"><rect x="40" y="250" width="240" height="60" fill="#3a2f1d"/><path d="M30 252L160 210L290 252Z" fill="#5b3b1a"/><rect x="154" y="60" width="12" height="190" fill="#4a3a22"/>' +
    '<g id="reg" style="transition:transform .6s;transform-origin:160px 80px"><rect x="90" y="75" width="140" height="10" fill="#222"/>' +
    '<g id="indL" style="transition:transform .6s;transform-origin:92px 80px"><rect x="88" y="80" width="8" height="46" fill="#111"/><circle cx="92" cy="128" r="5" fill="#333"/></g>' +
    '<g id="indR" style="transition:transform .6s;transform-origin:228px 80px"><rect x="224" y="80" width="8" height="46" fill="#111"/><circle cx="228" cy="128" r="5" fill="#333"/></g><circle cx="160" cy="80" r="7" fill="#c9a227"/></g>' +
    '<text id="cl" x="160" y="30" text-anchor="middle" fill="#ffd75e" font-family="Georgia" font-size="22"></text></svg>';
  function pose(sig) { var r = sig ? sig[0] : 0, a = sig ? sig[1] : 0, b = sig ? sig[2] : 0;
    box.querySelector('#reg').style.transform = 'rotate(' + (r ? 90 : 0) + 'deg)';
    box.querySelector('#indL').style.transform = 'rotate(' + (a * 45 + 45) + 'deg)'; box.querySelector('#indR').style.transform = 'rotate(' + (-(b * 45 + 45)) + 'deg)'; }
  function seq() { return String(api.input()).toUpperCase().split('').filter(function (c) { return CC.chappeIndex(c) >= 0; }); }
  var pl = CC.ui.player(host, { count: function () { return seq().length; }, show: function (i) { if (i < 0) { pose(null); box.querySelector('#cl').textContent = ''; return ''; } var c = seq()[i], s = CC.chappeSigns[CC.chappeIndex(c)]; pose(s); box.querySelector('#cl').textContent = c === ' ' ? '(space)' : c; return (s[0] ? 'regulator upright' : 'regulator level') + ', left arm position ' + (s[1] + 1) + ', right arm position ' + (s[2] + 1); } });
  return { refresh: function () { pl.reset(); }, stop: pl.stop };
};

/* ======================= Cooke and Wheatstone ======================= */
OBJ.cooke = function (host, api) {
  var box = CC.ui.mk(host, ''), X0 = 70, DX = 55, Y0 = 200, DY = 38;
  function draw(letter) {
    var h = '<svg viewBox="0 0 360 400" width="360"><path d="M180 30L340 200L180 370L20 200Z" fill="#3a2f1d" stroke="#8a7440" stroke-width="3"/>';
    for (var L in CC.cwLetters) { var p = CC.cwLetters[L], x = X0 + (p[0] + p[1]) / 2 * DX, y = Y0 - p[2] * (p[1] - p[0]) * DY; h += '<text x="' + x + '" y="' + (y + 6) + '" text-anchor="middle" font-family="Georgia" font-size="18" fill="' + (L === letter ? '#ffd75e' : '#e8dcb8') + '">' + L + '</text>'; }
    var pp = letter ? CC.cwLetters[letter] : null;
    for (var i = 0; i < 5; i++) {
      var x0 = X0 + i * DX, ang = 0;
      if (pp && (i === pp[0] || i === pp[1])) { ang = (i === pp[0] ? 1 : -1) * pp[2] * 45; }
      h += '<g style="transition:transform .5s;transform-origin:' + x0 + 'px ' + Y0 + 'px;transform:rotate(' + ang + 'deg)"><path d="M' + x0 + ' ' + (Y0 - 34) + 'l5 10v48l-5 10l-5 -10v-48z" fill="' + (ang ? '#c9a227' : '#999') + '"/></g><circle cx="' + x0 + '" cy="' + Y0 + '" r="5" fill="#222" stroke="#c9a227"/>';
    }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">Two needles swing; the letter where their lines cross is the one being sent.</div>';
  }
  function seq() { return String(api.input()).toUpperCase().replace(/[^A-Z]/g, '').split('').map(function (c) { return CC.cwSub[c] || c; }); }
  var pl = CC.ui.player(host, { count: function () { return seq().length; }, show: function (i) { if (i < 0) { draw(null); return ''; } var c = seq()[i]; draw(c); var p = CC.cwLetters[c]; return c + ': needles ' + (p[0] + 1) + ' and ' + (p[1] + 1) + ' point ' + (p[2] > 0 ? 'up' : 'down') + ' to it'; } });
  return { refresh: function () { pl.reset(); }, stop: pl.stop };
};

/* ======================= Morse: lamp, sound and a key you can tap ======================= */
OBJ.morse = function (host, api) {
  var box = CC.ui.mk(host, '<div style="display:flex;gap:30px;align-items:center;justify-content:center;flex-wrap:wrap"><div id="mlamp" style="width:90px;height:90px;border-radius:50%;background:#222;border:4px solid #555;transition:background .03s"></div>' +
    '<div><div class="row"><label class="hint">words per minute <input type="number" id="mwpm" value="15" min="5" max="40" style="width:70px"></label><label class="hint"><input type="checkbox" id="msnd" checked> sound</label></div>' +
    '<div class="row"><button class="b p" id="mplay">&#9654; Send the message</button><button class="b" id="mstop">Stop</button></div>' +
    '<div class="row"><button class="b" id="mkey" style="width:150px;height:48px;font-size:15px">Tap key (or hold Space)</button><button class="b" id="mclr">Clear</button></div><div class="out" id="mtap" style="min-width:300px"></div></div></div>');
  var ac = null, osc = null, gain = null, stopFlag = false;
  function tone(on) { var lamp = box.querySelector('#mlamp'); lamp.style.background = on ? '#ffd75e' : '#222'; lamp.style.boxShadow = on ? '0 0 30px #ffd75e' : 'none';
    if (!box.querySelector('#msnd').checked) on = false;
    try { if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); osc = ac.createOscillator(); gain = ac.createGain(); osc.frequency.value = 650; gain.gain.value = 0; osc.connect(gain).connect(ac.destination); osc.start(); } gain.gain.setTargetAtTime(on ? 0.25 : 0, ac.currentTime, 0.005); } catch (e) { } }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  box.querySelector('#mplay').onclick = async function () {
    stopFlag = false; var u = 1200 / Math.max(5, +box.querySelector('#mwpm').value || 15), code = CC.byId.morse.enc(api.input());
    for (var i = 0; i < code.length && !stopFlag; i++) { var c = code[i];
      if (c === '.' || c === '-') { tone(true); await wait(c === '.' ? u : 3 * u); tone(false); await wait(u); }
      else if (c === ' ') await wait(2 * u); else if (c === '/') await wait(2 * u); }
    tone(false);
  };
  box.querySelector('#mstop').onclick = function () { stopFlag = true; tone(false); };
  /* tapping: short press = dot, long press = dash; gaps split letters and words */
  var down = 0, up = Date.now(), seqs = '', key = box.querySelector('#mkey');
  function unit() { return 1200 / Math.max(5, +box.querySelector('#mwpm').value || 15); }
  function press() { if (down) return; var gap = Date.now() - up; if (seqs && gap > 5 * unit()) seqs += ' / '; else if (seqs && gap > 2 * unit()) seqs += ' '; down = Date.now(); tone(true); }
  function release() { if (!down) return; var dur = Date.now() - down; down = 0; up = Date.now(); tone(false); seqs += dur < 2 * unit() ? '.' : '-'; show(); }
  function show() { box.querySelector('#mtap').textContent = seqs + '\n' + CC.byId.morse.dec(seqs.replace(/ \/ /g, ' / ')); }
  key.onpointerdown = press; key.onpointerup = release; key.onpointerleave = release;
  var kd = function (e) { if (e.code === 'Space' && document.activeElement === key) { e.preventDefault(); press(); } }, ku = function (e) { if (e.code === 'Space' && document.activeElement === key) { e.preventDefault(); release(); } };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  box.querySelector('#mclr').onclick = function () { seqs = ''; show(); };
  return { stop: function () { stopFlag = true; tone(false); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); } };
};

/* ======================= punched tape (Baudot, ITA2) ======================= */
CC.ui.tape = function (codes, labels, hl) {
  var cw = 26, W = Math.max(300, codes.length * cw + 40), h = '<svg viewBox="0 0 ' + W + ' 190" width="' + W + '"><rect x="0" y="10" width="' + W + '" height="150" fill="#efe3c2"/>';
  codes.forEach(function (b, i) {
    var x = 20 + i * cw + cw / 2;
    if (i === hl) h += '<rect x="' + (x - cw / 2) + '" y="10" width="' + cw + '" height="150" fill="#f7d36b"/>';
    for (var j = 0; j < 5; j++) { var y = 30 + (j < 2 ? j : j + 1) * 22; if (b[j] === '1') h += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#1a1a1a"/>'; }
    h += '<circle cx="' + x + '" cy="74" r="3" fill="#6d6046"/>';
    if (labels && labels[i] !== undefined) h += '<text x="' + x + '" y="178" text-anchor="middle" font-size="12" fill="#ffd75e" font-family="Consolas">' + esc(labels[i] === ' ' ? '␣' : labels[i] === '\n' ? '↵' : labels[i] === '\r' ? '↤' : labels[i]) + '</text>';
  });
  return h + '</svg>';
};
OBJ.tape = function (host, api) {
  var box = CC.ui.mk(host, ''), id = api.def.id;
  function data() {
    if (id === 'baudot') { var t = String(api.input()).toUpperCase().split('').filter(function (c) { return CC.baudot[c]; }); return { c: t.map(function (c) { return CC.baudot[c]; }), l: t }; }
    var codes = CC.ita2Encode(api.input()), fig = false, l = codes.map(function (b) { if (b === CC.ITA2_FIGS) { fig = true; return 'FIG'; } if (b === CC.ITA2_LTRS) { fig = false; return 'LTR'; } return (fig ? CC.ita2F : CC.ita2L)[b]; });
    return { c: codes, l: l };
  }
  function draw(hl) { var d = data(); box.innerHTML = CC.ui.tape(d.c, d.l, hl) + '<div class="hint" style="text-align:center">Five hole positions across the tape (bit 1 at the top); the small holes are the feed holes.' + (id === 'baudot' ? ' Baudot keyed the five bits on a five-key keyboard.' : ' FIG and LTR shift between figures and letters.') + '</div>'; }
  var pl = CC.ui.player(host, { count: function () { return data().c.length; }, show: function (i) { draw(i); if (i < 0) return ''; var d = data(); return esc(d.l[i]) + ' = ' + d.c[i]; } });
  return { refresh: function () { pl.reset(); draw(-1); }, stop: pl.stop };
};
OBJ.bits = function (host, api) { var box = CC.ui.mk(host, ''); return { refresh: function () { var b = Array.from(new TextEncoder().encode(String(api.input()).slice(0, 24))); box.innerHTML = '<table style="width:auto;margin:auto"><tr><th>Character</th><th>Decimal</th><th>Hex</th><th>Bits</th></tr>' + Array.from(String(api.input()).slice(0, 24)).map(function (ch) { var bs = Array.from(new TextEncoder().encode(ch)); return '<tr><td style="font-size:18px">' + esc(ch === ' ' ? '(space)' : ch) + '</td><td>' + bs.join(' ') + '</td><td>' + bs.map(function (x) { return ('0' + x.toString(16).toUpperCase()).slice(-2); }).join(' ') + '</td><td style="font-family:Consolas">' + bs.map(function (x) { return ('0000000' + x.toString(2)).slice(-8).replace(/1/g, '■').replace(/0/g, '□'); }).join(' ') + '</td></tr>'; }).join('') + '</table>'; } }; };

/* ======================= Polybius square with torches; tap code with sound ======================= */
OBJ.polybius = function (host, api) {
  var box = CC.ui.mk(host, '');
  function sq() { var k = api.keys(); return { s: CC.square(k.key, +k.size || 5), n: +k.size || 5 }; }
  function draw(hl) {
    var q = sq(), cs = 40, h = '<div style="display:flex;gap:30px;align-items:center;justify-content:center;flex-wrap:wrap"><svg viewBox="0 0 ' + (q.n * cs + 40) + ' ' + (q.n * cs + 40) + '" width="' + (q.n * cs + 40) + '">';
    for (var i = 0; i < q.n; i++) h += '<text x="' + (40 + i * cs + cs / 2) + '" y="24" text-anchor="middle" fill="#e8c766" font-size="15">' + (i + 1) + '</text><text x="18" y="' + (40 + i * cs + cs / 2 + 5) + '" text-anchor="middle" fill="#e8c766" font-size="15">' + (i + 1) + '</text>';
    for (i = 0; i < q.n * q.n; i++) { var r = Math.floor(i / q.n), c = i % q.n; h += '<rect x="' + (40 + c * cs) + '" y="' + (40 + r * cs) + '" width="' + (cs - 2) + '" height="' + (cs - 2) + '" fill="' + (i === hl ? '#a8871d' : '#1e2526') + '"/><text x="' + (40 + c * cs + cs / 2 - 1) + '" y="' + (40 + r * cs + cs / 2 + 5) + '" text-anchor="middle" fill="#edf0ee" font-size="16" font-family="Georgia">' + (q.s[i] === 'I' && q.n === 5 ? 'I/J' : q.s[i]) + '</text>'; }
    h += '</svg>';
    if (hl >= 0) { var rr = Math.floor(hl / q.n) + 1, cc = hl % q.n + 1, torch = function (k) { var t = ''; for (var j = 0; j < k; j++) t += '<span style="display:inline-block;width:14px;height:40px;margin:2px;background:linear-gradient(#ffd75e,#d6202b 40%,#5b3b1a 45%);border-radius:7px 7px 2px 2px"></span>'; return t; }; h += '<div style="text-align:center"><div>' + torch(rr) + '</div><div class="hint">row ' + rr + '</div><div style="margin-top:10px">' + torch(cc) + '</div><div class="hint">column ' + cc + '</div></div>'; }
    box.innerHTML = h + '</div><div class="hint" style="text-align:center">The Greeks signalled with two groups of torches: row, then column.</div>';
  }
  function seq() { var q = sq(), t = String(api.input()).toUpperCase(); if (q.n === 5) t = t.replace(/J/g, 'I'); return t.split('').filter(function (c) { return q.s.indexOf(c) >= 0; }); }
  var pl = CC.ui.player(host, { count: function () { return seq().length; }, show: function (i) { if (i < 0) { draw(-1); return ''; } var q = sq(), c = seq()[i], k = q.s.indexOf(c); draw(k); return c + ' = ' + (Math.floor(k / q.n) + 1) + (k % q.n + 1); } });
  return { refresh: function () { pl.reset(); draw(-1); }, stop: pl.stop };
};
OBJ.tap = function (host, api) {
  var box = CC.ui.mk(host, ''), ac = null, stop = false;
  function draw(hl) { var cs = 40, h = '<svg viewBox="0 0 240 240" width="240">'; for (var i = 0; i < 25; i++) { var r = Math.floor(i / 5), c = i % 5; h += '<rect x="' + (20 + c * cs) + '" y="' + (20 + r * cs) + '" width="' + (cs - 2) + '" height="' + (cs - 2) + '" fill="' + (i === hl ? '#a8871d' : '#1e2526') + '"/><text x="' + (20 + c * cs + 19) + '" y="' + (20 + r * cs + 25) + '" text-anchor="middle" fill="#edf0ee" font-size="16" font-family="Georgia">' + (CC.tapSquare[i] === 'C' ? 'C/K' : CC.tapSquare[i]) + '</text>'; } box.innerHTML = h + '</svg>'; }
  function knock() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 180; o.type = 'triangle'; g.gain.setValueAtTime(0.6, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.13); } catch (e) { } }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var c = CC.ui.mk(host, '<div class="ctl noprint"><button class="b p" id="tplay">&#9654; Knock the message</button><button class="b" id="tstop">Stop</button></div><div class="step" id="tline"></div>');
  c.querySelector('#tplay').onclick = async function () {
    stop = false; var t = String(api.input()).toUpperCase().replace(/K/g, 'C').split('').filter(function (x) { return CC.tapSquare.indexOf(x) >= 0; });
    for (var i = 0; i < t.length && !stop; i++) { var k = CC.tapSquare.indexOf(t[i]), r = Math.floor(k / 5) + 1, cc = k % 5 + 1; draw(k); c.querySelector('#tline').textContent = t[i] + ': ' + r + ' knocks, pause, ' + cc + ' knocks';
      for (var j = 0; j < r && !stop; j++) { knock(); await wait(220); } await wait(450); for (j = 0; j < cc && !stop; j++) { knock(); await wait(220); } await wait(800); }
  };
  c.querySelector('#tstop').onclick = function () { stop = true; };
  return { refresh: function () { draw(-1); }, stop: function () { stop = true; } };
};

/* ======================= Pigpen and symbol sets ======================= */
CC.pigSVG = function (c, s) {
  var p = CC.pigpen[c]; if (!p) return '';
  s = s || 34; var h = '<svg viewBox="0 0 30 30" width="' + s + '" height="' + s + '"><g stroke="#e8dcb8" stroke-width="2.4" fill="none" stroke-linecap="round">';
  if (p.g === 'grid') { var r = Math.floor(p.cell / 3), col = p.cell % 3;
    if (r > 0) h += '<path d="M4 4H26"/>'; if (r < 2) h += '<path d="M4 26H26"/>'; if (col > 0) h += '<path d="M4 4V26"/>'; if (col < 2) h += '<path d="M26 4V26"/>'; }
  else h += ['<path d="M4 4L15 15L26 4"/>', '<path d="M26 4L15 15L26 26"/>', '<path d="M4 4L15 15L4 26"/>', '<path d="M4 26L15 15L26 26"/>'][[0, 2, 1, 3][p.cell]];
  /* X grid cells: S top, T left, U right, V bottom (dots: W X Y Z) */
  if (p.dot) h += '<circle cx="' + (p.g === 'x' ? [15, 9, 21, 15][[0, 2, 1, 3][p.cell]] : 15) + '" cy="' + (p.g === 'x' ? [9, 15, 15, 21][[0, 2, 1, 3][p.cell]] : 15) + '" r="2.6" fill="#e8dcb8" stroke="none"/>';
  return h + '</g></svg>';
};
OBJ.pigpen = function (host, api) {
  var box = CC.ui.mk(host, ''), key = CC.ui.mk(host, '');
  key.innerHTML = '<details><summary class="hint" style="cursor:pointer">Show the key</summary><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:6px">' + AZ.split('').map(function (c) { return '<div style="text-align:center">' + CC.pigSVG(c, 30) + '<div class="hint">' + c + '</div></div>'; }).join('') + '</div></details>';
  var dl = CC.ui.mk(host, '<div class="ctl noprint"><button class="b" id="pdl">Save as picture (SVG)</button></div>');
  function render() { var t = CC.letters(api.input()); return t.split('').map(function (c) { return CC.pigSVG(c, 40); }).join(''); }
  dl.onclick = function () { var t = CC.letters(api.input()), w = t.length * 44 + 20, s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="64" style="background:#161b1c">' + t.split('').map(function (c, i) { return '<g transform="translate(' + (10 + i * 44) + ' 10)">' + CC.pigSVG(c, 40).replace('<svg ', '<svg x="0" y="0" ') + '</g>'; }).join('') + '</svg>'; var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })); a.download = 'pigpen.svg'; a.click(); };
  return { refresh: function () { box.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">' + render() + '</div><div class="hint" style="text-align:center">A-I: the noughts-and-crosses grid; J-R: the same with a dot; S-V: the X; W-Z: the X with a dot.</div>'; }, ran: function (dir) { if (dir === 'enc') api.setOutput(CC.letters(api.input()), 'Pigpen is drawn: the symbols are shown above. Use "Save as picture" to keep them.'); } };
};
OBJ.symbols = function (host, api) {
  var box = CC.ui.mk(host, '');
  return { refresh: function () { var k = api.keys(), set = CC.byId.symbols.sets[k.set];
    if (!set) { box.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' + CC.letters(api.input()).split('').map(function (c) { return CC.danceSVG(c); }).join('') + '</div>'; return; }
    var a = Array.from(set); box.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center">' + AZ.split('').map(function (c, i) { return '<div style="text-align:center;min-width:26px">' + c + '<br><span style="font-size:22px;color:#ffd75e">' + a[i] + '</span></div>'; }).join('') + '</div>'; } };
};
/* stick figures made for this studio: arms and legs take positions from the letter number */
CC.danceSVG = function (c) { var i = AZ.indexOf(c); if (i < 0) return ''; var arm = [[-14, -6], [-12, -16], [-6, 6], [-16, 2], [-10, -14]][i % 5], arm2 = [[14, -6], [12, -16], [6, 6], [16, 2], [10, 14]][Math.floor(i / 5) % 5], leg = Math.floor(i / 25);
  return '<svg viewBox="0 0 40 60" width="34" height="51"><g stroke="#e8dcb8" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cx="20" cy="9" r="5"/><path d="M20 14V36"/><path d="M20 20l' + arm[0] + ' ' + arm[1] + '"/><path d="M20 20l' + arm2[0] + ' ' + arm2[1] + '"/><path d="M20 36l' + (leg ? -12 : -7) + ' 18M20 36l' + (leg ? 12 : 7) + ' 18"/></g></svg>'; };

})();
