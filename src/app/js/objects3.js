/* Codes & Ciphers Studio - working objects, part 3 (version 1.1) - by Larry Dalton
   Number wheels, the slide, Heath's dice, alphabet wheels, the Confederate disk, the M-94 cylinder,
   ADFGVX, Hill, Chaocipher and the Solitaire pack. */
(function () {
'use strict';
var CC = window.CC, AZ = CC.AZ, mod = CC.mod, OBJ = CC.OBJ, P = Math.PI, polar = CC.ui.polar;
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
['numwheel', 'slide', 'dice', 'scriptwheel', 'csa', 'cylinder', 'adfgvx', 'hill', 'chao', 'cards'].forEach(function (m) { CC.MOVING[m] = 1; });
var HI = '#ffd75e', GOLD = '#c9a227', TXT = '#edf0ee', GRN = '#4fb38a';
function rt(x, y, a) { return ' transform="rotate(' + a + ' ' + x + ' ' + y + ')"'; }
function angle(svg, e, S) { var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * S - S / 2, y = (e.clientY - r.top) / r.height * S - S / 2; return { a: Math.atan2(x, -y), d: Math.sqrt(x * x + y * y) }; }

/* ======================= Mexican Army and Janelle number wheels ======================= */
OBJ.numwheel = function (host, api) {
  var id = api.def.id, W = CC.numWheels[id], n = W.outer.length, S = id === 'janelle' ? 560 : 500, C = S / 2, box = CC.ui.mk(host, ''), st = null, drag = null;
  var radii = id === 'janelle' ? [262, 222, 186, 150, 114] : [232, 196, 162, 128, 94];
  function starts() { try { return CC.numStarts(id, api.keys()); } catch (e) { return null; } }
  function draw() {
    st = starts();
    var h = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '"><circle cx="' + C + '" cy="' + C + '" r="' + (radii[0] + 18) + '" fill="#24200f" stroke="' + GOLD + '" stroke-width="3"/>';
    var fsO = id === 'janelle' ? 15 : 19, fsN = id === 'janelle' ? 12 : 14;
    for (var i = 0; i < n; i++) {
      var a = i / n * 2 * P, p = polar(C, C, radii[0], a), l1 = polar(C, C, radii[0] + 18, a + P / n), l2 = polar(C, C, radii[1] + 18, a + P / n);
      h += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="#6b5a1c"/><text class="no" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" fill="#f3e3b3" font-size="' + fsO + '" font-family="Georgia" font-weight="bold" text-anchor="middle" dominant-baseline="central"' + rt(p[0], p[1], i / n * 360) + '>' + esc(W.outer[i]) + '</text>';
    }
    for (var r = 0; r < 4; r++) {
      var off = st ? st[r] : 0, R = radii[r + 1];
      h += '<g class="ring" data-r="' + r + '" style="transition:transform .5s;transform-origin:' + C + 'px ' + C + 'px;transform:rotate(' + (off / n * 360) + 'deg);cursor:grab"><circle cx="' + C + '" cy="' + C + '" r="' + (R + 18) + '" fill="' + (r % 2 ? '#1a2416' : '#132018') + '" stroke="' + (r % 2 ? '#3d5a2a' : '#2d5a47') + '"/>';
      W.rings[r].forEach(function (v, j) {
        var a = j / n * 2 * P, p = polar(C, C, R, a);
        if (v !== null) h += '<text class="nn" data-r="' + r + '" data-v="' + v + '" x="' + p[0] + '" y="' + p[1] + '" fill="#8fe0bd" font-size="' + fsN + '" font-family="Consolas" text-anchor="middle" dominant-baseline="central"' + rt(p[0], p[1], j / n * 360) + '>' + CC.numLabel(id, v) + '</text>';
      });
      h += '</g>';
    }
    h += '<circle cx="' + C + '" cy="' + C + '" r="' + (radii[4] - 14) + '" fill="#2b2a14" stroke="' + GOLD + '"/><text x="' + C + '" y="' + (C - 6) + '" text-anchor="middle" fill="#e8c766" font-family="Georgia" font-size="15">' + (id === 'janelle' ? 'Janelle' : 'Mexican Army') + '</text><text x="' + C + '" y="' + (C + 14) + '" text-anchor="middle" fill="#97a3a0" font-family="Georgia" font-size="12">' + (id === 'janelle' ? '2,560,000 settings' : 'cipher disk') + '</text></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">' + (st ? 'Drag any number ring to turn it; the key above follows. Play to see the four numbers each character may become.' : '<span class="err">Check the key: it does not set the rings.</span>') + '</div>';
    var svg = box.querySelector('svg');
    box.querySelectorAll('.ring').forEach(function (g) {
      g.addEventListener('pointerdown', function (e) { if (!st) return; drag = { r: +g.dataset.r, a: angle(svg, e, S).a, s: st[+g.dataset.r], g: g }; g.setPointerCapture(e.pointerId); g.style.transition = 'none'; e.stopPropagation(); });
      g.addEventListener('pointermove', function (e) { if (!drag || drag.g !== g) return; var steps = Math.round((angle(svg, e, S).a - drag.a) / (2 * P) * n); drag.cur = mod(drag.s + steps, n); g.style.transform = 'rotate(' + (drag.cur / n * 360) + 'deg)'; });
      g.addEventListener('pointerup', function () { if (!drag) return; var d = drag; drag = null; if (d.cur === undefined) return; st[d.r] = d.cur; setKey(); });
    });
  }
  function setKey() {
    if (id === 'mexican') api.set('key', st.map(function (s) { return AZ[s]; }).join(''));
    else { var A = W.outer.indexOf('A'); api.set('key', CC.numColumn(id, st, A).join(' ')); }
  }
  function chars() { var t = String(api.input()).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return Array.from(t).filter(function (c) { return W.outer.indexOf(c) >= 0; }); }
  var pl = CC.ui.player(host, {
    count: function () { return st ? chars().length : 0; },
    show: function (i) {
      box.querySelectorAll('.no').forEach(function (t) { t.setAttribute('fill', '#f3e3b3'); t.style.fontSize = ''; });
      box.querySelectorAll('.nn').forEach(function (t) { t.setAttribute('fill', '#8fe0bd'); t.removeAttribute('font-weight'); t.style.fontSize = ''; });
      if (i < 0 || !st) return '';
      var c = chars()[i], j = W.outer.indexOf(c), col = CC.numColumn(id, st, j);
      var o = box.querySelector('.no[data-i="' + j + '"]'); o.setAttribute('fill', HI); o.style.fontSize = (id === 'janelle' ? 22 : 26) + 'px';
      col.forEach(function (v, r) { if (v === null) return; var t = box.querySelector('.nn[data-r="' + r + '"][data-v="' + v + '"]'); if (t) { t.setAttribute('fill', HI); t.setAttribute('font-weight', 'bold'); t.style.fontSize = (id === 'janelle' ? 17 : 20) + 'px'; } });
      return 'letter ' + (i + 1) + ': ' + esc(c) + ' &rarr; any of ' + col.filter(function (v) { return v !== null; }).map(function (v) { return CC.numLabel(id, v); }).join(', ');
    }
  });
  return { refresh: function () { draw(); pl.reset(); }, stop: pl.stop };
};

/* ======================= Enigma slide ======================= */
OBJ.slide = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [], cw = 21, W = 52 * cw + 70;
  function draw() {
    var SY = CC.slideRows.symbols, MX = CC.slideRows.mixed, h = '<svg viewBox="0 0 ' + W + ' 196" width="' + W + '" style="max-width:100%">';
    h += '<rect x="2" y="2" width="' + (W - 4) + '" height="192" rx="8" fill="#3a2a14" stroke="' + GOLD + '"/>';
    h += '<text x="10" y="22" fill="#c8b48a" font-size="11" font-family="Georgia">message letters</text><text x="10" y="186" fill="#c8b48a" font-size="11" font-family="Georgia">digits and signs</text>';
    for (var i = 0; i < 52; i++) {
      var x = 60 + i * cw;
      h += '<text class="sm" data-i="' + i + '" x="' + x + '" y="44" text-anchor="middle" fill="#f3e3b3" font-size="16" font-family="Georgia">' + AZ[i % 26] + '</text>';
      h += '<text class="sy" data-i="' + i + '" x="' + x + '" y="166" text-anchor="middle" fill="#f3e3b3" font-size="16" font-family="Georgia">' + esc(SY[i % 26]) + '</text>';
    }
    h += '<g id="slider" style="transition:transform .5s"><rect x="40" y="56" width="' + (52 * cw + 40) + '" height="86" rx="5" fill="#132018" stroke="' + GRN + '"/><text x="44" y="102" fill="' + HI + '" font-size="11" font-family="Georgia">KEY&#9650;</text>';
    for (i = 0; i < 52; i++) {
      x = 100 + i * cw;
      h += '<text class="c1" data-i="' + i + '" x="' + x + '" y="84" text-anchor="middle" fill="#8fe0bd" font-size="16" font-family="Georgia" font-weight="bold">' + AZ[i % 26] + '</text>';
      h += '<text class="c2" data-i="' + i + '" x="' + x + '" y="128" text-anchor="middle" fill="#8fe0bd" font-size="16" font-family="Georgia">' + MX[i % 26].toLowerCase() + '</text>';
    }
    h += '</g></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Top: message letters. Sliding middle: the plain code row and the mixed code row. Bottom: digits and signs. Play to watch the slide move to each key letter. (The studio\'s reading of the slide: see the note above.)</div>';
  }
  function build() {
    steps = []; var k = api.keys(), K = CC.letters(k.key) || 'A', j = 0, SY = CC.slideRows.symbols, MX = CC.slideRows.mixed;
    Array.from(String(api.input())).forEach(function (ch) {
      var up = ch.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), kk = AZ.indexOf(K[j % K.length]);
      if (/^[A-Z]$/.test(up)) { steps.push({ p: up, k: K[j % K.length], kk: kk, row: 1, col: AZ.indexOf(up), o: AZ[mod(AZ.indexOf(up) - kk, 26)] }); j++; }
      else if (SY.indexOf(ch) >= 0) { steps.push({ p: ch, k: K[j % K.length], kk: kk, row: 2, col: SY.indexOf(ch), o: MX[mod(SY.indexOf(ch) - kk, 26)].toLowerCase() }); j++; }
    });
  }
  var pl = CC.ui.player(host, {
    count: function () { return steps.length; },
    show: function (i) {
      box.querySelectorAll('.sm,.sy,.c1,.c2').forEach(function (t) { t.setAttribute('fill', /c[12]/.test(t.getAttribute('class')) ? '#8fe0bd' : '#f3e3b3'); t.style.fontSize = ''; });
      var sl = box.querySelector('#slider');
      if (i < 0) { sl.style.transform = 'translateX(0px)'; return ''; }
      var s = steps[i];
      /* slider letter at index q sits at x = 100 + q*cw - shift; put its A (q = 0 or 26) under the key letter on the top row */
      var shift = (100 - 60) - s.kk * cw; sl.style.transform = 'translateX(' + (-shift) + 'px)';
      /* the message character sits in fixed column s.col (first copy); the code letter under it is slider index s.col - kk (mod 26), in the copy that lines up */
      var col = s.col < s.kk ? s.col + 26 : s.col, q = col - s.kk;
      var top = box.querySelector((s.row === 1 ? '.sm' : '.sy') + '[data-i="' + col + '"]'), cl = box.querySelector((s.row === 1 ? '.c1' : '.c2') + '[data-i="' + q + '"]');
      [top, cl].forEach(function (t) { if (t) { t.setAttribute('fill', HI); t.style.fontSize = '22px'; } });
      var kt = box.querySelector('.sm[data-i="' + s.kk + '"]'); if (kt && kt !== top) kt.setAttribute('fill', '#e0605a');
      return 'character ' + (i + 1) + ': key ' + s.k + ' (red) &mdash; ' + esc(s.p) + (s.row === 1 ? ' on the message row, read straight down' : ' on the bottom row, read straight up') + ' &rarr; ' + s.o;
    }
  });
  return { refresh: function () { draw(); build(); pl.reset(); }, stop: pl.stop };
};

/* ======================= Heath's dice ======================= */
OBJ.dice = function (host, api) {
  var box = CC.ui.mk(host, '');
  function nums() { return (String(api.input()).match(/\d+/g) || []).map(Number).slice(0, 5); }
  function side(n, d) { var F = CC.heath.faces[d], i = F.indexOf(n); return i < 0 ? ['', ''] : [F[(i + 1) % 6], F[(i + 3) % 6]]; }
  function draw(hl) {
    var N = nums(), h = '<svg viewBox="0 0 660 230" width="660" style="max-width:100%"><rect x="20" y="150" width="620" height="60" rx="10" fill="#3a2a14" stroke="' + GOLD + '"/>';
    for (var d = 0; d < 5; d++) {
      var x = 40 + d * 122, y = 40, n = N[d], sd = side(n, d), u = n === undefined ? '' : String(n);
      h += '<g><polygon points="' + x + ',' + (y + 22) + ' ' + (x + 44) + ',' + y + ' ' + (x + 104) + ',' + y + ' ' + (x + 60) + ',' + (y + 22) + '" fill="#efe2bf" stroke="#7a5a2a"/>';
      h += '<rect x="' + x + '" y="' + (y + 22) + '" width="60" height="96" fill="#e3d2a6" stroke="#7a5a2a"/><polygon points="' + (x + 60) + ',' + (y + 22) + ' ' + (x + 104) + ',' + y + ' ' + (x + 104) + ',' + (y + 96) + ' ' + (x + 60) + ',' + (y + 118) + '" fill="#cdb98a" stroke="#7a5a2a"/>';
      h += '<text x="' + (x + 52) + '" y="' + (y + 16) + '" text-anchor="middle" font-family="Georgia" font-size="17" font-weight="bold" fill="#2a1d0c" transform="skewX(-20)" transform-origin="' + (x + 52) + ' ' + (y + 12) + '">';
      if (u) h += esc(u.slice(0, -1)) + '<tspan class="ud" fill="' + (hl ? '#c0392b' : '#2a1d0c') + '">' + u.slice(-1) + '</tspan>';
      h += '</text><text x="' + (x + 30) + '" y="' + (y + 76) + '" text-anchor="middle" font-family="Georgia" font-size="14" fill="#6b5233" transform="rotate(-90 ' + (x + 30) + ' ' + (y + 72) + ')">' + sd[0] + '</text>';
      h += '<text x="' + (x + 82) + '" y="' + (y + 64) + '" text-anchor="middle" font-family="Georgia" font-size="13" fill="#6b5233" transform="rotate(-90 ' + (x + 82) + ' ' + (y + 60) + ')">' + sd[1] + '</text></g>';
    }
    h += '<text id="dsum" x="330" y="187" text-anchor="middle" font-family="Georgia" font-size="19" fill="#f3e3b3"></text></svg>';
    box.innerHTML = h + '<div class="ctl noprint"><button class="b p" id="droll">Roll the dice</button></div><div class="hint" style="text-align:center">Top faces are read from the message box; Roll puts five new numbers there. Play shows the trick step by step.</div>';
    box.querySelector('#droll').onclick = function () { var r = CC.heath.faces.map(function (f) { return f[CC.rand(6)]; }); api.setInput(r.join(' ')); api.run('enc'); };
  }
  var pl = CC.ui.player(host, {
    count: function () { return nums().length === 5 ? 4 : 0; },
    show: function (i) {
      var N = nums(); draw(i >= 0); var t = CC.heathTotal(N), el = box.querySelector('#dsum');
      if (i < 0) return '';
      var L = ['Look only at the last digit of each top number (in red).', 'Add them: ' + N.map(function (n) { return n % 10; }).join(' + ') + ' = ' + t.units + '.', 'Take that from 50: 50 - ' + t.units + ' = ' + (50 - t.units) + '.', 'Put the two side by side: ' + (50 - t.units) + ' and ' + ('0' + t.units).slice(-2) + ' make ' + t.quick + (t.quick === t.real ? ' - and the real sum is ' + t.real + '.' : '. These are not all faces of these dice, so the trick fails: the real sum is ' + t.real + '.')];
      el.textContent = ['last digits: ' + N.map(function (n) { return n % 10; }).join('  '), 'sum of last digits = ' + t.units, '50 - ' + t.units + ' = ' + (50 - t.units), 'total = ' + t.quick][i];
      return L[i];
    }
  });
  return { refresh: function () { draw(false); pl.reset(); }, stop: pl.stop };
};

/* ======================= alphabet wheels (Braille, runes, Tengwar, hieroglyphs, Ogham, Theban) ======================= */
CC.brailleDots = function (ch, x, y, s, fill) {
  var b = ch.charCodeAt(0) - 0x2800, pos = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], h = '';
  pos.forEach(function (p, i) { var on = b & (1 << i); h += '<circle cx="' + (x + (p[0] - 0.5) * s) + '" cy="' + (y + (p[1] - 1) * s) + '" r="' + (on ? s * 0.32 : s * 0.13) + '" fill="' + (on ? fill : '#6b5a1c') + '"/>'; });
  return h;
};
OBJ.scriptwheel = function (host, api) {
  var id = api.def.id, Sc = CC.scripts[id], n = Sc.letters.length, S = 420, C = S / 2, box = CC.ui.mk(host, ''), drag = null;
  function sym(c, x, y, fs, a, cls, i) {
    if (id === 'braille') return '<g class="' + cls + '" data-i="' + i + '"' + rt(x, y, a) + '>' + CC.brailleDots(c, x, y, fs * 0.42, '#f3e3b3') + '</g>';
    return '<text class="' + cls + '" data-i="' + i + '" x="' + x + '" y="' + y + '" fill="#f3e3b3" font-size="' + fs + '" font-family="' + Sc.font + ', serif" text-anchor="middle" dominant-baseline="central"' + rt(x, y, a) + '>' + esc(c) + '</text>';
  }
  function draw() {
    var k = api.keys(), sh = CC.scriptShift(Sc, k), rev = k.dir === 'rev', h = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '">';
    h += '<circle cx="' + C + '" cy="' + C + '" r="204" fill="#24200f" stroke="' + GOLD + '" stroke-width="3"/><circle cx="' + C + '" cy="' + C + '" r="156" fill="none" stroke="#6b5a1c"/>';
    for (var i = 0; i < n; i++) {
      /* outer: the script, fixed; position i holds ring[i] (reversed wheel: positions run the other way) */
      var a = (rev ? -i : i) / n * 2 * P, p = polar(C, C, 180, a), l1 = polar(C, C, 204, a + P / n), l2 = polar(C, C, 156, a + P / n);
      h += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="#6b5a1c"/>' + sym(Sc.ring[i], p[0], p[1], id === 'pharaoh' ? 26 : id === 'theban' ? 24 : 23, (rev ? -i : i) / n * 360, 'so', i);
    }
    /* inner: letters; letter i sits under ring position (i + shift) */
    h += '<g id="sin" style="transition:transform .5s;transform-origin:' + C + 'px ' + C + 'px;transform:rotate(' + ((rev ? -sh : sh) / n * 360) + 'deg);cursor:grab"><circle cx="' + C + '" cy="' + C + '" r="154" fill="#132018" stroke="' + GRN + '" stroke-width="2"/>';
    for (i = 0; i < n; i++) {
      var b = i / n * 2 * P, q = polar(C, C, 136, b), m1 = polar(C, C, 154, b + P / n), m2 = polar(C, C, 116, b + P / n);
      h += '<line x1="' + m1[0] + '" y1="' + m1[1] + '" x2="' + m2[0] + '" y2="' + m2[1] + '" stroke="#24493a"/><text class="si" data-i="' + i + '" x="' + q[0] + '" y="' + q[1] + '" fill="#8fe0bd" font-size="19" font-family="Georgia" font-weight="bold" text-anchor="middle" dominant-baseline="central"' + rt(q[0], q[1], i / n * 360) + '>' + Sc.letters[i] + '</text>';
    }
    h += '<circle cx="' + C + '" cy="' + C + '" r="60" fill="#2b2a14" stroke="' + GOLD + '"/></g><text x="' + C + '" y="' + (C - 4) + '" text-anchor="middle" fill="#e8c766" font-family="Georgia" font-size="15" pointer-events="none">' + esc(Sc.name) + '</text><text x="' + C + '" y="' + (C + 16) + '" text-anchor="middle" fill="#97a3a0" font-family="Georgia" font-size="12" pointer-events="none">turned ' + sh + '</text>';
    h += '<path d="M' + C + ' 4 l-7 0 l7 13 l7 -13z" fill="' + HI + '"/></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Outer ring: ' + esc(Sc.name) + '. Inner ring (drag to turn): the letters of the message. At 0 each letter sits under its own sign.</div>';
    var g = box.querySelector('#sin'), svg = box.querySelector('svg');
    g.addEventListener('pointerdown', function (e) { drag = { a: angle(svg, e, S).a, s: sh }; g.setPointerCapture(e.pointerId); g.style.transition = 'none'; });
    g.addEventListener('pointermove', function (e) { if (!drag) return; var st = Math.round((angle(svg, e, S).a - drag.a) / (2 * P) * n) * (rev ? -1 : 1); drag.cur = mod(drag.s + st, n); g.style.transform = 'rotate(' + ((rev ? -drag.cur : drag.cur) / n * 360) + 'deg)'; });
    g.addEventListener('pointerup', function () { if (!drag) return; var d = drag; drag = null; if (d.cur !== undefined) api.set('shift', d.cur); });
  }
  function seq() { return Array.from(CC.scriptFold(Sc, api.input())).filter(function (c) { return Sc.letters.indexOf(c) >= 0; }); }
  var pl = CC.ui.player(host, {
    count: function () { return seq().length; },
    show: function (i) {
      box.querySelectorAll('.so').forEach(function (t) { if (id === 'braille') t.querySelectorAll('circle').forEach(function (c) { if (c.getAttribute('fill') !== '#6b5a1c') c.setAttribute('fill', '#f3e3b3'); }); else { t.setAttribute('fill', '#f3e3b3'); t.style.fontSize = ''; } });
      box.querySelectorAll('.si').forEach(function (t) { t.setAttribute('fill', '#8fe0bd'); t.style.fontSize = ''; });
      if (i < 0) return '';
      var c = seq()[i], li = Sc.letters.indexOf(c), ri = CC.scriptIndex(Sc, api.keys(), li);
      var o = box.querySelector('.so[data-i="' + ri + '"]'), t = box.querySelector('.si[data-i="' + li + '"]');
      if (id === 'braille') o.querySelectorAll('circle').forEach(function (cc) { if (cc.getAttribute('fill') !== '#6b5a1c') cc.setAttribute('fill', HI); }); else { o.setAttribute('fill', HI); o.style.fontSize = '32px'; }
      t.setAttribute('fill', HI); t.style.fontSize = '26px';
      return 'letter ' + (i + 1) + ': ' + c + ' &rarr; <span style="font-family:' + Sc.font + ',\'Segoe UI Symbol\';font-size:20px">' + esc(Sc.ring[ri]) + '</span>';
    }
  });
  return { refresh: function () { draw(); pl.reset(); }, stop: pl.stop };
};

/* ======================= Confederate cipher disk ======================= */
OBJ.csa = function (host, api) {
  var S = 400, C = S / 2, box = CC.ui.mk(host, ''), steps = [];
  function draw(off) {
    var h = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '"><defs><radialGradient id="brass"><stop offset="0" stop-color="#d8b45a"/><stop offset="1" stop-color="#8a6a22"/></radialGradient></defs>';
    h += '<circle cx="' + C + '" cy="' + C + '" r="194" fill="url(#brass)" stroke="#5a4210" stroke-width="3"/>';
    for (var i = 0; i < 26; i++) { var a = i / 26 * 2 * P, p = polar(C, C, 172, a), l1 = polar(C, C, 194, a + P / 26), l2 = polar(C, C, 150, a + P / 26); h += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="#5a4210"/><text class="co" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" fill="#2a1d0c" font-size="20" font-family="Georgia" font-weight="bold" text-anchor="middle" dominant-baseline="central"' + rt(p[0], p[1], i / 26 * 360) + '>' + AZ[i] + '</text>'; }
    h += '<g id="cin" style="transition:transform .5s;transform-origin:' + C + 'px ' + C + 'px;transform:rotate(' + (-off / 26 * 360) + 'deg)"><circle cx="' + C + '" cy="' + C + '" r="148" fill="#b8923c" stroke="#5a4210" stroke-width="2"/>';
    for (i = 0; i < 26; i++) { a = i / 26 * 2 * P; p = polar(C, C, 128, a); l1 = polar(C, C, 148, a + P / 26); l2 = polar(C, C, 108, a + P / 26); h += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="#5a4210"/><text class="ci" data-i="' + i + '" x="' + p[0] + '" y="' + p[1] + '" fill="#3a2508" font-size="18" font-family="Georgia" text-anchor="middle" dominant-baseline="central"' + rt(p[0], p[1], i / 26 * 360) + '>' + AZ[i] + '</text>'; }
    h += '<text x="' + C + '" y="' + (C + 4) + '" text-anchor="middle" fill="#3a2508" font-family="Georgia" font-size="46" font-style="italic">CSA</text><text x="' + C + '" y="' + (C + 34) + '" text-anchor="middle" fill="#3a2508" font-family="Georgia" font-size="15">S.S.</text></g></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Outer ring: plain letters. Inner disk: cipher letters. For each letter, turn the inner A under the key letter, then read the cipher letter under the plain one.</div>';
  }
  function build() {
    steps = []; var k = api.keys(), K = CC.byId.csa.phrase(k), j = 0;
    CC.letters(api.input()).split('').forEach(function (p) { var kk = AZ.indexOf(K[j++ % K.length]); steps.push({ p: p, k: AZ[kk], kk: kk, o: AZ[mod(AZ.indexOf(p) + kk, 26)] }); });
  }
  var pl = CC.ui.player(host, {
    count: function () { return steps.length; },
    show: function (i) {
      box.querySelectorAll('.co').forEach(function (t) { t.setAttribute('fill', '#2a1d0c'); t.style.fontSize = ''; });
      box.querySelectorAll('.ci').forEach(function (t) { t.setAttribute('fill', '#3a2508'); t.style.fontSize = ''; });
      var g = box.querySelector('#cin');
      if (i < 0) { g.style.transform = 'rotate(0deg)'; return ''; }
      var s = steps[i]; g.style.transform = 'rotate(' + (s.kk / 26 * 360) + 'deg)';
      var a = box.querySelector('.co[data-i="' + AZ.indexOf(s.p) + '"]'), b = box.querySelector('.ci[data-i="' + AZ.indexOf(s.o) + '"]');
      a.setAttribute('fill', '#7a0c0c'); a.style.fontSize = '26px'; b.setAttribute('fill', '#7a0c0c'); b.style.fontSize = '24px';
      return 'letter ' + (i + 1) + ': key letter ' + s.k + ' &mdash; plain ' + s.p + ' &rarr; ' + s.o;
    }
  });
  return { refresh: function () { draw(0); build(); pl.reset(); }, stop: pl.stop };
};

/* ======================= Jefferson / M-94 cylinder ======================= */
OBJ.cylinder = function (host, api) {
  var box = CC.ui.mk(host, ''), blocks = [];
  function build() {
    var k = api.keys(), t = CC.letters(api.input()); blocks = (t.match(/.{1,25}/g) || []);
  }
  function draw(b, col) {
    var k = api.keys(), ord = CC.m94Order(k), row = mod(+k.row || 0, 26) || 1, t = blocks[b] || '', n = 25, cw = 26, rows = 13, W = n * cw + 70, H = rows * 26 + 70;
    var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" style="max-width:100%"><defs><linearGradient id="cyl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient></defs>';
    h += '<rect x="4" y="' + (H / 2 - 4) + '" width="' + (W - 8) + '" height="8" fill="#b08d3a"/>';
    for (var d = 0; d < n; d++) {
      var D = CC.m94[ord[d]], x = 36 + d * cw, base = t[d] ? D.indexOf(t[d]) : 0;
      h += '<rect x="' + (x - 11) + '" y="30" width="22" height="' + (rows * 26 + 8) + '" rx="3" fill="#cdb98a" stroke="#6b5233"/>';
      h += '<text x="' + x + '" y="22" text-anchor="middle" fill="#97a3a0" font-size="10" font-family="Consolas">' + 'BCDEFGHIJKLMNOPQRSTUVWXYZ'[ord[d]] + '</text>';
      for (var r = -2; r < rows - 2; r++) {
        var y = 52 + (r + 2) * 26, L = t[d] ? D[mod(base + r, 26)] : '', isP = r === 0, isC = r === row || (row > 10 && r === row - 26);
        h += '<text class="cy" x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Georgia" font-size="16" font-weight="' + (isP || isC ? 'bold' : 'normal') + '" fill="' + (isP ? '#7a0c0c' : isC ? '#0b5a3a' : '#2a1d0c') + '"' + (col === d && (isP || isC) ? ' style="font-size:21px"' : '') + '>' + L + '</text>';
      }
    }
    h += '<rect x="20" y="30" width="' + (n * cw + 6) + '" height="' + (rows * 26 + 8) + '" fill="url(#cyl)" pointer-events="none"/>';
    h += '<text x="8" y="' + (52 + 2 * 26 + 5) + '" fill="#e0605a" font-size="11" font-family="Georgia">msg</text>';
    var cy = row <= 10 ? 52 + (row + 2) * 26 + 5 : 52 + (row - 26 + 2) * 26 + 5;
    h += '<text x="' + (W - 30) + '" y="' + cy + '" fill="' + GRN + '" font-size="11" font-family="Georgia">sent</text></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">The disks are threaded in key order (their names above). Red: the message lined up along one row. Green: the row that is sent, ' + row + ' place' + (row > 1 ? 's' : '') + ' round.' + (blocks.length > 1 ? ' Block ' + (b + 1) + ' of ' + blocks.length + '.' : '') + '</div>';
  }
  var pl = CC.ui.player(host, {
    count: function () { return blocks.reduce(function (a, b) { return a + b.length; }, 0); },
    show: function (i) {
      if (i < 0) { draw(0, -1); return ''; }
      var b = 0, j = i; while (blocks[b] && j >= blocks[b].length) { j -= blocks[b].length; b++; }
      draw(b, j);
      var k = api.keys(), row = mod(+k.row || 0, 26) || 1, D = CC.m94[CC.m94Order(k)[j]];
      return 'letter ' + (i + 1) + ': disk ' + 'BCDEFGHIJKLMNOPQRSTUVWXYZ'[CC.m94Order(k)[j]] + ' turned to ' + blocks[b][j] + ' &rarr; ' + D[mod(D.indexOf(blocks[b][j]) + row, 26)];
    }
  });
  return { refresh: function () { build(); draw(0, -1); pl.reset(); }, stop: pl.stop };
};

/* ======================= ADFGVX: square, then columns ======================= */
OBJ.adfgvx = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  function draw(hl) {
    var k = api.keys(), Q = CC.adfgvxSquare(k), L = k.variant === 'ADFGX' ? 'ADFGX' : 'ADFGVX', n = L.length, cs = 30, h = '<div style="display:flex;gap:22px;flex-wrap:wrap;justify-content:center;align-items:flex-start">';
    h += '<svg viewBox="0 0 ' + (cs * (n + 1) + 4) + ' ' + (cs * (n + 1) + 4) + '" width="' + (cs * (n + 1) + 4) + '">';
    for (var i = 0; i < n; i++) { h += '<text x="' + (cs * (i + 1) + cs / 2) + '" y="20" text-anchor="middle" fill="#e8c766" font-family="Consolas" font-size="15" font-weight="bold">' + L[i] + '</text><text x="' + cs / 2 + '" y="' + (cs * (i + 1) + 20) + '" text-anchor="middle" fill="#e8c766" font-family="Consolas" font-size="15" font-weight="bold">' + L[i] + '</text>'; }
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) { var on = hl && hl.sq === r * n + c; h += '<rect x="' + (cs * (c + 1)) + '" y="' + (cs * (r + 1)) + '" width="' + (cs - 2) + '" height="' + (cs - 2) + '" rx="3" fill="' + (on ? HI : (r + c) % 2 ? '#1a2021' : '#20262a') + '"/><text x="' + (cs * (c + 1) + cs / 2 - 1) + '" y="' + (cs * (r + 1) + 20) + '" text-anchor="middle" fill="' + (on ? '#111' : TXT) + '" font-family="Consolas" font-size="15">' + Q[r * n + c] + '</text>'; }
    h += '</svg>';
    var mid = CC.byId.adfgvx.pairs(api.input(), k), key = CC.letters(k.key) || 'A', m = key.length, ord = CC.keyOrder(key), rows = Math.ceil(mid.length / m), w = 26;
    h += '<svg viewBox="0 0 ' + (m * w + 10) + ' ' + ((rows + 2) * 22 + 10) + '" width="' + (m * w + 10) + '" style="max-width:100%">';
    for (c = 0; c < m; c++) {
      var col = hl && hl.col === c;
      h += '<text x="' + (5 + c * w + w / 2) + '" y="16" text-anchor="middle" fill="' + (col ? HI : '#e8c766') + '" font-family="Consolas" font-size="15" font-weight="bold">' + key[c] + '</text><text x="' + (5 + c * w + w / 2) + '" y="34" text-anchor="middle" fill="#97a3a0" font-family="Consolas" font-size="11">' + (ord[c] + 1) + '</text>';
      for (r = 0; r < rows; r++) { var ch = mid[r * m + c]; if (!ch) continue; var on2 = col || (hl && hl.cells && hl.cells.indexOf(r * m + c) >= 0); h += '<text x="' + (5 + c * w + w / 2) + '" y="' + (56 + r * 22) + '" text-anchor="middle" fill="' + (on2 ? HI : GRN) + '" font-family="Consolas" font-size="15" font-weight="' + (on2 ? 'bold' : 'normal') + '">' + ch + '</text>'; }
    }
    h += '</svg></div>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Left: the mixed square; each character becomes its row letter and column letter. Right: the letter pairs written under the keyword; the columns are sent in the order of the numbers.</div>';
  }
  function build() {
    steps = []; var k = api.keys(), Q = CC.adfgvxSquare(k), L = k.variant === 'ADFGX' ? 'ADFGX' : 'ADFGVX', n = L.length, t = CC.adfgvxPrep(api.input(), k), key = CC.letters(k.key) || 'A', m = key.length, ord = CC.keyOrder(key);
    t.split('').forEach(function (c, i) { var q = Q.indexOf(c); steps.push({ ch: c, sq: q, pair: L[Math.floor(q / n)] + L[q % n], cells: [2 * i, 2 * i + 1] }); });
    var byRank = []; ord.forEach(function (rk, c) { byRank[rk] = c; });
    var mid = CC.byId.adfgvx.pairs(api.input(), k);
    byRank.forEach(function (c, rk) { var s = ''; for (var i = c; i < mid.length; i += m) s += mid[i]; steps.push({ col: c, rank: rk, text: s, key: key[c] }); });
  }
  var pl = CC.ui.player(host, {
    count: function () { return steps.length; },
    show: function (i) {
      if (i < 0) { draw(null); return ''; }
      var s = steps[i]; draw(s);
      if (s.ch !== undefined) return 'step ' + (i + 1) + ': ' + s.ch + ' is in row ' + s.pair[0] + ', column ' + s.pair[1] + ' &rarr; ' + s.pair;
      return 'column ' + (s.rank + 1) + ' (under ' + s.key + ') is sent: ' + s.text;
    }
  });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Hill: matrix times block ======================= */
OBJ.hill = function (host, api) {
  var box = CC.ui.mk(host, ''), steps = [];
  function build() {
    steps = []; var M; try { M = CC.hillMatrix(api.keys()); } catch (e) { return; }
    var n = M.length, t = CC.letters(api.input()); while (t.length % n) t += 'X';
    for (var b = 0; b < t.length; b += n) { var blk = t.substr(b, n); steps.push({ blk: blk, out: CC.hillApply(M, blk), M: M }); }
  }
  function mat(M, x, y, cs, col) {
    var n = M.length, h = '<path d="M' + (x + 6) + ' ' + y + ' h-6 v' + (n * cs) + ' h6 M' + (x + n * cs - 6) + ' ' + y + ' h6 v' + (n * cs) + ' h-6" stroke="' + col + '" fill="none" stroke-width="2"/>';
    M.forEach(function (row, r) { row.forEach(function (v, c) { h += '<text x="' + (x + c * cs + cs / 2) + '" y="' + (y + r * cs + cs / 2 + 6) + '" text-anchor="middle" font-family="Consolas" font-size="17" fill="' + col + '">' + v + '</text>'; }); });
    return h;
  }
  function draw(s) {
    var M; try { M = CC.hillMatrix(api.keys()); } catch (e) { box.innerHTML = '<div class="hint err" style="text-align:center">' + esc(e.message) + '</div>'; return; }
    var n = M.length, cs = 40, h = '<svg viewBox="0 0 560 ' + (n * cs + 70) + '" width="560" style="max-width:100%">';
    h += '<text x="20" y="20" fill="#97a3a0" font-family="Georgia" font-size="13">key matrix</text>' + mat(M, 20, 32, cs, '#e8c766');
    var inv = null; try { inv = CC.hillInverse(M); } catch (e) { }
    var x = 20 + n * cs + 30;
    h += '<text x="' + (x - 18) + '" y="' + (32 + n * cs / 2 + 6) + '" fill="' + TXT + '" font-size="20">&#215;</text>';
    var P1 = s ? s.blk.split('').map(function (c) { return [AZ.indexOf(c)]; }) : M.map(function () { return ['?']; });
    h += mat(P1, x, 32, cs, GRN);
    if (s) s.blk.split('').forEach(function (c, r) { h += '<text x="' + (x + cs + 10) + '" y="' + (32 + r * cs + cs / 2 + 6) + '" fill="' + GRN + '" font-family="Georgia" font-size="15">' + c + '</text>'; });
    x += cs + 40; h += '<text x="' + x + '" y="' + (32 + n * cs / 2 + 6) + '" fill="' + TXT + '" font-size="20">=</text>';
    x += 24;
    if (s) {
      var raw = M.map(function (row) { return [row.reduce(function (a, v, c) { return a + v * AZ.indexOf(s.blk[c]); }, 0)]; });
      h += mat(raw, x, 32, cs + 14, '#97a3a0'); x += cs + 34;
      h += '<text x="' + x + '" y="' + (32 + n * cs / 2 + 6) + '" fill="' + TXT + '" font-size="14" font-family="Georgia">mod 26 =</text>'; x += 70;
      h += mat(raw.map(function (r) { return [mod(r[0], 26)]; }), x, 32, cs, HI);
      s.out.split('').forEach(function (c, r) { h += '<text x="' + (x + cs + 10) + '" y="' + (32 + r * cs + cs / 2 + 6) + '" fill="' + HI + '" font-family="Georgia" font-size="17" font-weight="bold">' + c + '</text>'; });
    }
    h += '<text x="20" y="' + (n * cs + 60) + '" fill="#97a3a0" font-family="Georgia" font-size="13">' + (inv ? 'inverse (to decipher): ' + inv.map(function (r) { return '[' + r.join(' ') + ']'; }).join(' ') : 'this key has no inverse, so messages could not be read back') + '</text></svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">A = 0, B = 1 ... Z = 25. Each block of ' + n + ' letters is multiplied by the key matrix and counted round 26.</div>';
  }
  var pl = CC.ui.player(host, {
    count: function () { return steps.length; },
    show: function (i) { if (i < 0) { draw(null); return ''; } var s = steps[i]; draw(s); return 'block ' + (i + 1) + ': ' + s.blk + ' &rarr; ' + s.out; }
  });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Chaocipher: two stirred wheels ======================= */
OBJ.chao = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [];
  function wheel(cx, w, hlIdx, label, col) {
    var h = '<circle cx="' + cx + '" cy="170" r="150" fill="#1b1f12" stroke="' + GOLD + '" stroke-width="2"/><text x="' + cx + '" y="175" text-anchor="middle" fill="#97a3a0" font-family="Georgia" font-size="14">' + label + '</text>';
    for (var i = 0; i < 26; i++) {
      var a = i / 26 * 2 * P, p = polar(cx, 170, 128, a), on = i === hlIdx, z = i === 0 || i === 13;
      h += '<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" dominant-baseline="central" font-family="Georgia" font-size="' + (on ? 24 : 17) + '" font-weight="' + (on || z ? 'bold' : 'normal') + '" fill="' + (on ? HI : z ? '#e0605a' : col) + '"' + rt(p[0], p[1], i / 26 * 360) + '>' + w[i] + '</text>';
    }
    return h + '<text x="' + cx + '" y="14" text-anchor="middle" fill="#e0605a" font-size="10" font-family="Georgia">zenith</text><text x="' + cx + '" y="334" text-anchor="middle" fill="#e0605a" font-size="10" font-family="Georgia">nadir</text>';
  }
  function draw(s) {
    var k = api.keys(), L = CC.chaoWheel(k.left), R = CC.chaoWheel(k.right);
    if (s) { L = s.L; R = s.R; }
    var h = '<svg viewBox="0 0 680 340" width="680" style="max-width:100%">' + wheel(170, L, s ? s.i : -1, 'left: cipher', '#8fe0bd') + wheel(510, R, s ? s.i : -1, 'right: plain', TXT) + '</svg>';
    box.innerHTML = h + '<div class="hint" style="text-align:center">Find the plain letter on the right wheel and read the letter in the same place on the left. Then both wheels are turned and one letter on each is moved to the nadir, so the alphabets keep changing.</div>';
  }
  function build() { try { CC.chaoRun(api.input(), api.keys(), 1); trace = CC.chaoTrace.slice(); } catch (e) { trace = []; } }
  var pl = CC.ui.player(host, {
    count: function () { return trace.length; },
    show: function (i) { if (i < 0) { draw(null); return ''; } var s = trace[i]; draw(s); return 'letter ' + (i + 1) + ': plain ' + s.p + ' (right wheel, place ' + (s.i + 1) + ') &rarr; ' + s.c; }
  });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};

/* ======================= Solitaire: the pack ======================= */
OBJ.cards = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [], need = 0;
  var SU = ['&#9827;', '&#9830;', '&#9829;', '&#9824;'], RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  function face(v) { return v === 53 ? 'J<tspan font-size="9">A</tspan>' : v === 54 ? 'J<tspan font-size="9">B</tspan>' : RK[(v - 1) % 13] + SU[Math.floor((v - 1) / 13)]; }
  function draw(s) {
    var d = s ? s.deck : CC.solDeck(api.keys()), cw = 30, per = 27, h = '<svg viewBox="0 0 ' + (per * cw + 20) + ' 150" width="' + (per * cw + 20) + '" style="max-width:100%">';
    d.forEach(function (v, i) {
      var x = 10 + (i % per) * cw, y = 10 + Math.floor(i / per) * 68, red = v <= 26 && v > 13, jk = v > 52, top = s && i === 0, hit = s && v === s.card && i === Math.min(s.top, 53);
      h += '<rect x="' + x + '" y="' + y + '" width="' + (cw - 3) + '" height="58" rx="4" fill="' + (hit ? HI : top ? '#e8c766' : jk ? '#3a2a14' : '#efe9dc') + '" stroke="' + (hit ? '#fff' : '#555') + '"/>';
      h += '<text x="' + (x + cw / 2 - 1) + '" y="' + (y + 34) + '" text-anchor="middle" font-family="Georgia" font-size="12" font-weight="bold" fill="' + (jk ? HI : (red || (v > 26 && v <= 39)) ? '#b0201b' : '#111') + '">' + face(v) + '</text>';
    });
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">The pack after each shuffle step (top card first). Gold: the top card, whose value says how far down to count. Yellow: the card found there, which gives the key number (jokers are skipped).</div>';
  }
  function build() {
    var t = CC.letters(api.input()); while (t.length % 5) t += 'X'; need = t.length; trace = [];
    if (need) CC.solStream(api.keys(), need, trace);
  }
  var pl = CC.ui.player(host, {
    count: function () { return trace.length; },
    show: function (i) {
      if (i < 0) { draw(null); return ''; }
      var s = trace[i]; draw(s);
      var used = trace.slice(0, i + 1).filter(function (x) { return x.use; }).length;
      return 'shuffle ' + (i + 1) + ': top card ' + (s.top > 52 ? 'a joker (53)' : s.top) + ', count down &rarr; ' + (s.use ? 'card ' + s.card + ', key number ' + (((s.card - 1) % 26) + 1) + ' for letter ' + used : 'a joker, so no key number this time');
    }
  });
  return { refresh: function () { build(); draw(null); pl.reset(); }, stop: pl.stop };
};
})();
