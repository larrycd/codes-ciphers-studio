/* Codes & Ciphers Studio - working objects, part 2 (machines, grilles, squares, modern, hiding) - by Larry Dalton */
(function () {
'use strict';
var CC = window.CC, AZ = CC.AZ, mod = CC.mod, OBJ = CC.OBJ, esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }, polar = CC.ui.polar, P = Math.PI;

/* ======================= Enigma ======================= */
OBJ.enigma = function (host, api) {
  var m = null, typed = '', lit = null, lastPath = null, plugSel = null;
  var box = CC.ui.mk(host, '<div style="display:flex;flex-direction:column;align-items:center;gap:10px">' +
    '<div id="erot" style="display:flex;gap:10px;align-items:flex-end"></div>' +
    '<div class="kbd" id="elamps"></div><div class="kbd" id="ekeys"></div>' +
    '<div><div class="hint" style="text-align:center">Plugboard: click two letters to join them with a cable; click a plugged letter to unplug it.</div><svg id="eplug" viewBox="0 0 560 110" width="560"></svg></div>' +
    '<div class="row"><button class="b" id="ereset">Reset machine to the key settings</button><span class="hint">Typed:</span><span class="out" id="etyped" style="min-width:200px;min-height:auto;padding:4px 8px"></span><span class="hint">Lamps:</span><span class="out" id="elit" style="min-width:200px;min-height:auto;padding:4px 8px"></span></div>' +
    '<svg id="epath" viewBox="0 0 700 300" width="700" style="max-width:100%"></svg><div class="hint" id="epathnote" style="text-align:center"></div></div>');
  var rows = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
  function kb(id, cls) { box.querySelector(id).innerHTML = rows.map(function (r) { return '<div class="r">' + r.split('').map(function (c) { return '<div class="' + cls + '" data-c="' + c + '">' + c + '</div>'; }).join('') + '</div>'; }).join(''); }
  kb('#elamps', 'lamp'); kb('#ekeys', 'key');
  function cfg() { return CC.enigmaCfg(api.keys()); }
  function reset() { m = new CC.Enigma(cfg()); typed = ''; lit = ''; lastPath = null; draw(); }
  function rotorsHtml() {
    var names = m.names.slice(), pos = m.pos.slice(), h = '';
    if (m.fourth) h += win(m.fourth, AZ[m.fourthPos], -1);
    names.forEach(function (n, i) { h += win(n, AZ[pos[i]], i); });
    return h + '<div style="text-align:center"><div class="hint">reflector</div><div style="font:600 18px Georgia;color:#e8c766;padding:14px 8px;border:1px solid #5f5418;border-radius:6px">' + esc(api.keys().model === 'M4' && !/thin/.test(api.keys().reflector) ? 'B-thin' : api.keys().reflector) + '</div></div>';
    function win(name, letter, i) {
      var prev = AZ[mod(AZ.indexOf(letter) - 1, 26)], next = AZ[mod(AZ.indexOf(letter) + 1, 26)];
      return '<div style="text-align:center"><div class="hint">' + esc(name) + '</div><button class="b" data-up="' + i + '" style="padding:0 10px">&#9650;</button>' +
        '<div style="width:46px;background:#0b0f0f;border:2px solid #5f5418;border-radius:6px;overflow:hidden;margin:3px auto"><div style="color:#555;font:14px Georgia">' + prev + '</div><div style="background:#e8dcb8;color:#111;font:700 22px Georgia;padding:2px 0">' + letter + '</div><div style="color:#555;font:14px Georgia">' + next + '</div></div>' +
        '<button class="b" data-dn="' + i + '" style="padding:0 10px">&#9660;</button></div>';
    }
  }
  function drawPlug() {
    var svg = box.querySelector('#eplug'), h = '', xs = {}, pairs = String(api.keys().plugboard || '').toUpperCase().split(/[\s,]+/).filter(function (p) { return /^[A-Z]{2}$/.test(p); });
    AZ.split('').forEach(function (c, i) { var x = 15 + i * 20.7, y = 30; xs[c] = x; var plugged = pairs.some(function (p) { return p.indexOf(c) >= 0; });
      h += '<g data-p="' + c + '" style="cursor:pointer"><circle cx="' + x + '" cy="' + y + '" r="8" fill="' + (c === plugSel ? '#ffd75e' : plugged ? '#4fb38a' : '#262b2b') + '" stroke="#555"/><text x="' + x + '" y="' + (y - 13) + '" text-anchor="middle" font-size="11" fill="#97a3a0">' + c + '</text></g>'; });
    pairs.forEach(function (p, k) { var a = xs[p[0]], b = xs[p[1]], dip = 40 + (k % 5) * 12; h += '<path d="M' + a + ' 38 C' + a + ' ' + (38 + dip) + ' ' + b + ' ' + (38 + dip) + ' ' + b + ' 38" fill="none" stroke="hsl(' + (k * 47) + ',60%,55%)" stroke-width="3"/>'; });
    svg.innerHTML = h;
  }
  function drawPath() {
    var svg = box.querySelector('#epath'), note = box.querySelector('#epathnote');
    if (!lastPath) { svg.innerHTML = '<text x="350" y="150" text-anchor="middle" fill="#97a3a0" font-size="14">Press a key to see the current\'s path through the machine.</text>'; note.textContent = ''; return; }
    var stages = ['Key', 'Plugs'].concat(m.names.slice().reverse().map(function (n) { return 'Rotor ' + n; }), m.fourth ? [m.fourth] : [], ['Reflector'], m.fourth ? [m.fourth] : [], m.names.map(function (n) { return 'Rotor ' + n; }), ['Plugs']);
    var W = 700, n = lastPath.length, dx = (W - 60) / (n - 1), h = '', pts = [];
    lastPath.forEach(function (c, i) { var x = 30 + i * dx, y = 40 + AZ.indexOf(c) * 9.4; pts.push([x, y]);
      h += '<line x1="' + x + '" y1="36" x2="' + x + '" y2="' + (40 + 25 * 9.4 + 4) + '" stroke="#2c3638"/><text x="' + x + '" y="20" text-anchor="middle" font-size="9" fill="#97a3a0">' + esc(stages[i] || 'Lamp') + '</text>'; });
    h += '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="#ffd75e" stroke-width="2.5"/>';
    pts.forEach(function (p, i) { h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#2b2a14" stroke="#ffd75e"/><text x="' + p[0] + '" y="' + (p[1] + 4) + '" text-anchor="middle" font-size="11" fill="#fff" font-family="Consolas">' + lastPath[i] + '</text>'; });
    svg.innerHTML = h; note.textContent = 'The current enters at ' + lastPath[0] + ', is changed by every part in turn, bounces off the reflector, comes back by a different route and lights ' + lastPath[lastPath.length - 1] + '.';
  }
  function draw() {
    box.querySelector('#erot').innerHTML = rotorsHtml(); drawPlug(); drawPath();
    box.querySelectorAll('.lamp').forEach(function (l) { l.classList.toggle('on', l.dataset.c === lit); });
    box.querySelector('#etyped').textContent = CC.group(typed); box.querySelector('#elit').textContent = CC.group(lit !== null ? litStr : '');
  }
  var litStr = '';
  function press(c) { var r = m.press(c); typed += c; litStr += r.out; lit = r.out; lastPath = r.path; draw(); var k = box.querySelector('.key[data-c="' + c + '"]'); if (k) { k.classList.add('down'); setTimeout(function () { k.classList.remove('down'); }, 150); } }
  box.querySelector('#ekeys').onclick = function (e) { var c = e.target.dataset.c; if (c) press(c); };
  box.querySelector('#erot').onclick = function (e) {
    var u = e.target.dataset.up, d = e.target.dataset.dn; if (u === undefined && d === undefined) return;
    var i = +(u !== undefined ? u : d), step = u !== undefined ? -1 : 1, k = api.keys();
    if (i === -1) { api.set('fourthPos', AZ[mod(m.fourthPos + step, 26)]); return; }
    var p = m.pos.map(function (x) { return AZ[x]; }); p[i] = AZ[mod(AZ.indexOf(p[i]) + step, 26)]; api.set('pos', p.join(''));
  };
  box.querySelector('#eplug').onclick = function (e) {
    var g = e.target.closest('[data-p]'); if (!g) return; var c = g.dataset.p, pairs = String(api.keys().plugboard || '').toUpperCase().split(/[\s,]+/).filter(function (p) { return /^[A-Z]{2}$/.test(p); });
    var has = pairs.filter(function (p) { return p.indexOf(c) >= 0; });
    if (has.length) { pairs = pairs.filter(function (p) { return p.indexOf(c) < 0; }); plugSel = null; api.set('plugboard', pairs.join(' ')); return; }
    if (!plugSel) { plugSel = c; drawPlug(); return; }
    if (plugSel !== c && pairs.length < 13) pairs.push(plugSel + c); plugSel = null; api.set('plugboard', pairs.join(' '));
  };
  box.querySelector('#ereset').onclick = function () { litStr = ''; reset(); };
  var kd = function (e) { if (/^[a-z]$/i.test(e.key) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { press(e.key.toUpperCase()); e.preventDefault(); } };
  document.addEventListener('keydown', kd);
  CC.ui.mk(host, '<div class="hint" style="text-align:center">Type on your keyboard (outside the text boxes) or click the keys. Or use Encipher below for a whole message.</div>');
  return { refresh: function () { litStr = ''; reset(); }, stop: function () { document.removeEventListener('keydown', kd); } };
};

/* ======================= Lorenz SZ42 ======================= */
OBJ.lorenz = function (host, api) {
  var mach = null, out = [], box = CC.ui.mk(host, ''), names = ['χ1', 'χ2', 'χ3', 'χ4', 'χ5', 'ψ1', 'ψ2', 'ψ3', 'ψ4', 'ψ5', 'μ61', 'μ37'];
  function wheels() { var L = CC.lorenz; return L.chi.map(function (n, i) { return { n: n, pos: mach.chi[i], pins: mach.pins.chi[i] }; }).concat(L.psi.map(function (n, i) { return { n: n, pos: mach.psi[i], pins: mach.pins.psi[i] }; }), [{ n: 61, pos: mach.mu[0], pins: mach.pins.mu[0] }, { n: 37, pos: mach.mu[1], pins: mach.pins.mu[1] }]); }
  function draw(info) {
    var ws = wheels(), h = '<svg viewBox="0 0 800 210" width="800" style="max-width:100%">';
    var order = [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], xs = [40, 100, 175, 235, 295, 355, 415, 490, 550, 610, 670, 730];
    order.forEach(function (wi, k) {
      var w = ws[wi], cx = xs[k], cy = 100, r = 26;
      h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 5) + '" fill="#1e2526" stroke="' + (wi >= 10 ? '#c9a227' : wi >= 5 ? '#4fb38a' : '#6d8cd8') + '" stroke-width="2"/>';
      for (var j = -8; j <= 8; j++) { var pi = mod(w.pos + j, w.n), a = j / 17 * 2 * P, p = polar(cx, cy, r, a); h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (j === 0 ? 4.5 : 2.6) + '" fill="' + (w.pins[pi] ? (j === 0 ? '#ffd75e' : '#e8dcb8') : '#333') + '"/>'; }
      h += '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="13" fill="#edf0ee" font-family="Georgia">' + names[wi] + '</text><text x="' + cx + '" y="' + (cy + 52) + '" text-anchor="middle" font-size="10" fill="#97a3a0">' + (w.pos + 1) + '/' + w.n + '</text>';
    });
    h += '<text x="70" y="22" text-anchor="middle" fill="#c9a227" font-size="12">motor wheels</text><text x="295" y="22" text-anchor="middle" fill="#6d8cd8" font-size="12">chi wheels (move every letter)</text><text x="610" y="22" text-anchor="middle" fill="#4fb38a" font-size="12">psi wheels (move when μ37 allows)</text>';
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">The pin at the top of each wheel (bright = active, dark = inactive) is the one being read.</div>' + (info || '');
  }
  function seq() { return CC.ita2Encode(api.input()); }
  var pl = CC.ui.player(host, {
    count: function () { return seq().length; },
    show: function (i) {
      mach = new CC.LorenzMachine(api.keys()); out = [];
      var codes = seq(), info = '';
      for (var j = 0; j <= i; j++) {
        var key = mach.key(), chi = '', psi = '';
        for (var b = 0; b < 5; b++) { chi += mach.pins.chi[b][mach.chi[b]]; psi += mach.pins.psi[b][mach.psi[b]]; }
        var c = codes[j].split('').map(function (x, q) { return x === key[q] ? '0' : '1'; }).join('');
        if (j === i) info = '<table style="width:auto;margin:6px auto;font-family:Consolas"><tr><td>plain letter</td><td>' + codes[j] + '</td></tr><tr><td>chi wheels</td><td>' + chi + '</td></tr><tr><td>psi wheels</td><td>' + psi + '</td></tr><tr><td>key = chi XOR psi</td><td>' + key + '</td></tr><tr><td><b>sent = plain XOR key</b></td><td><b style="color:#ffd75e">' + c + '</b></td></tr></table>';
        if (j < i) mach.advance(); else { draw(info); }
      }
      if (i < 0) { draw(); return ''; }
      return 'letter ' + (i + 1) + ' of ' + codes.length + (mach.pins.mu[1][mach.mu[1]] ? ' - motor pin active: psi wheels will step' : ' - motor pin inactive: psi wheels stand still');
    }
  });
  return { refresh: function () { mach = new CC.LorenzMachine(api.keys()); pl.reset(); draw(); }, stop: pl.stop };
};

/* ======================= Hagelin M-209 ======================= */
OBJ.m209 = function (host, api) {
  var box = CC.ui.mk(host, ''), trace = [];
  function build() { trace = []; CC.m209Run(String(api.input()).toUpperCase().replace(/ /g, 'Z').replace(/[^A-Z]/g, ''), api.keys(), trace); }
  function draw(i) {
    var st = CC.m209Parse(api.keys()), t = trace[i], W = CC.m209.wheels, h = '<svg viewBox="0 0 720 300" width="720" style="max-width:100%">';
    var win = t ? t.window : W.map(function (w, k) { return w[st.pos[k]]; }).join('');
    for (var k = 0; k < 6; k++) {
      var x = 40 + k * 70, wl = W[k], p = wl.indexOf(win[k]);
      h += '<rect x="' + (x - 26) + '" y="20" width="52" height="150" rx="8" fill="#2a2f2f" stroke="#555"/>';
      for (var j = -3; j <= 3; j++) { var L = wl[mod(p + j, wl.length)], y = 95 + j * 20; h += '<text x="' + (x - 6) + '" y="' + (y + 5) + '" text-anchor="middle" font-family="Consolas" font-size="' + (j ? 12 : 17) + '" fill="' + (j ? '#777' : '#fff') + '">' + L + '</text>'; }
      var act = t ? t.active[k] : st.act[k][(p + CC.m209.offsets[k]) % wl.length];
      h += '<rect x="' + (x - 28) + '" y="84" width="56" height="22" fill="none" stroke="#ffd75e"/><circle cx="' + (x + 16) + '" cy="95" r="6" fill="' + (act ? '#4fb38a' : '#333') + '" stroke="#999"/>';
      h += '<text x="' + x + '" y="188" text-anchor="middle" font-size="11" fill="#97a3a0">wheel ' + (k + 1) + ' (' + wl.length + ')</text>';
    }
    /* the cage: 27 bars; a bar is kicked out if one of its lugs faces an active pin */
    for (var b = 0; b < st.bars.length; b++) {
      var bx = 470 + (b % 9) * 26, by = 30 + Math.floor(b / 9) * 50, kicked = t && st.bars[b].some(function (w) { return t.active[w]; });
      h += '<rect x="' + bx + '" y="' + by + '" width="20" height="40" rx="3" fill="' + (kicked ? '#a8871d' : '#1e2526') + '" stroke="#555"/><text x="' + (bx + 10) + '" y="' + (by + 24) + '" text-anchor="middle" font-size="9" fill="#ccc">' + st.bars[b].map(function (w) { return w + 1; }).join('') + '</text>';
    }
    h += '<text x="586" y="200" text-anchor="middle" font-size="12" fill="#97a3a0">the cage: 27 bars (numbers = wheels its lugs face)</text>';
    if (t) h += '<text x="360" y="250" text-anchor="middle" font-size="18" fill="#ffd75e" font-family="Consolas">' + t.shift + ' bars kicked: ' + t.inp + ' &#8594; 25 + ' + t.shift + ' - ' + AZ.indexOf(t.inp) + ' = ' + t.out + '</text>';
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">Green dot: the active pin sensed on that wheel (it sits ' + CC.m209.offsets.join(', ') + ' places beyond the window letter). Gold bars were pushed out and add one to the shift each.</div>';
  }
  var pl = CC.ui.player(host, { count: function () { return trace.length; }, show: function (i) { draw(i); return i < 0 ? '' : 'letter ' + (i + 1) + ': window ' + trace[i].window; } });
  return { refresh: function () { build(); pl.reset(); draw(-1); }, stop: pl.stop };
};

/* ======================= grilles ======================= */
OBJ.trellis = function (host, api) {
  var box = CC.ui.mk(host, ''), flipped = false;
  function draw() {
    var N = Math.max(4, +api.keys().size || 8), t = CC.letters(api.input()), cs = 32, W = N * cs + 20, cells = CC.byId.trellis.cells(N), g = [];
    cells.forEach(function (c, i) { g[c] = t[i] || '·'; });
    var h = '<svg viewBox="0 0 ' + W + ' ' + W + '" width="' + W + '">';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) { var open = ((r + c) % 2 === 0) !== flipped; h += '<rect x="' + (10 + c * cs) + '" y="' + (10 + r * cs) + '" width="' + cs + '" height="' + cs + '" fill="' + (open ? '#e8dcb8' : '#111') + '" style="transition:fill .6s"/>' + (open ? '<text x="' + (10 + c * cs + cs / 2) + '" y="' + (10 + r * cs + cs / 2 + 6) + '" text-anchor="middle" font-family="Georgia" font-size="17" fill="#222">' + g[r * N + c] + '</text>' : ''); }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">' + (flipped ? 'Grille flipped: the rest of the message shows through the other squares.' : 'The chessboard grille: the first half of the message is written through the light squares.') + ' The ciphertext is the full grid read column by column.</div>';
  }
  CC.ui.mk(host, '<div class="ctl noprint"><button class="b p" id="tflip">Flip the grille</button></div>').onclick = function (e) { if (e.target.id === 'tflip') { flipped = !flipped; draw(); } };
  return { refresh: function () { flipped = false; draw(); } };
};
OBJ.turning = function (host, api) {
  var box = CC.ui.mk(host, ''), turns = 0;
  function draw() {
    var k = api.keys(), N = (+k.size || 6) & ~1, cs = 40, W = N * cs + 40, holes = CC.fleissnerHoles(N, k.key), ord = CC.fleissnerOrder(N, holes), t = CC.letters(api.input()), g = [], q = N * N / 4;
    ord.forEach(function (cell, i) { g[cell] = { ch: t[i] || '·', turn: Math.floor(i / q) }; });
    var h = '<svg viewBox="0 0 ' + W + ' ' + W + '" width="' + W + '">';
    for (var i = 0; i < N * N; i++) { var r = Math.floor(i / N), c = i % N, v = g[i]; h += '<text x="' + (20 + c * cs + cs / 2) + '" y="' + (20 + r * cs + cs / 2 + 7) + '" text-anchor="middle" font-family="Georgia" font-size="20" fill="' + (v.turn < turns ? '#edf0ee' : '#3b4444') + '">' + v.ch + '</text>'; }
    /* the card, rotated by CSS so it visibly turns */
    var card = '<g style="transition:transform .8s;transform-origin:' + (W / 2) + 'px ' + (W / 2) + 'px;transform:rotate(' + (Math.min(turns, 4) % 4 * 90 - (turns ? 90 : 0)) + 'deg)"><path fill="#7a5a2a" fill-opacity="' + (turns >= 5 ? 0 : 0.92) + '" fill-rule="evenodd" d="M15 15H' + (W - 15) + 'V' + (W - 15) + 'H15Z ' + holes.map(function (hc) { var r = Math.floor(hc / N), c = hc % N; return 'M' + (22 + c * cs) + ' ' + (22 + r * cs) + 'h' + (cs - 4) + 'v' + (cs - 4) + 'h-' + (cs - 4) + 'z'; }).join(' ') + '"/><circle cx="' + (W / 2) + '" cy="24" r="4" fill="#ffd75e"/></g>';
    box.innerHTML = h + (turns > 0 && turns < 5 ? card : '') + '</svg><div class="hint" style="text-align:center">' + (turns === 0 ? 'Press "Lay the grille and write" to begin.' : turns < 5 ? 'Position ' + turns + ' of 4: letters written through the holes so far are bright. The gold dot shows which way up the card is.' : 'Grille removed: read the grid ' + (k.read === 'row' ? 'row by row' : 'column by column') + '.') + '</div>';
  }
  CC.ui.mk(host, '<div class="ctl noprint"><button class="b p" id="tgo">Lay the grille and write</button><button class="b" id="treset">Start again</button></div>').onclick = function (e) {
    if (e.target.id === 'tgo') { turns = Math.min(5, turns + 1); e.target.textContent = turns < 4 ? 'Turn the grille 90° and write' : turns === 4 ? 'Lift the grille off' : 'Done'; draw(); }
    if (e.target.id === 'treset') { turns = 0; host.querySelector('#tgo').textContent = 'Lay the grille and write'; draw(); }
  };
  return { refresh: function () { turns = 0; var b = host.querySelector('#tgo'); if (b) b.textContent = 'Lay the grille and write'; draw(); } };
};
OBJ.crossword = function (host, api) {
  var box = CC.ui.mk(host, '');
  function draw(upto) {
    var k = api.keys(), rows = CC.crosswords[k.grid] || CC.crosswords.daily, R = rows.length, C = rows[0].length, cs = R > 6 ? 26 : 40, cl = CC.byId.crossword.cells(rows), t = CC.letters(api.input()), g = {};
    cl.rowOrder.forEach(function (cell, i) { g[cell] = t[i] || ''; });
    var W = C * cs + 20, h = '<svg viewBox="0 0 ' + W + ' ' + (R * cs + 20) + '" width="' + W + '">';
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) { var black = rows[r][c] === '#', cell = r * C + c, i = cl.colOrder.indexOf(cell);
      h += '<rect x="' + (10 + c * cs) + '" y="' + (10 + r * cs) + '" width="' + cs + '" height="' + cs + '" fill="' + (black ? '#111' : upto >= 0 && i === upto ? '#f7d36b' : '#e8dcb8') + '" stroke="#555"/>' + (black ? '' : '<text x="' + (10 + c * cs + cs / 2) + '" y="' + (10 + r * cs + cs / 2 + 5) + '" text-anchor="middle" font-family="Georgia" font-size="' + (cs * 0.5) + '" fill="' + (g[cell] ? '#222' : '#2c7a5a') + '">' + (g[cell] || '·') + '</text>'); }
    box.innerHTML = h + '</svg><div class="hint" style="text-align:center">Message written row by row in the white squares (dots will be filled with random letters). Play to read it out column by column.</div>';
  }
  var pl = CC.ui.player(host, { speed: 8, count: function () { var rows = CC.crosswords[api.keys().grid] || CC.crosswords.daily; return CC.byId.crossword.cells(rows).colOrder.length; }, show: function (i) { draw(i); return i < 0 ? '' : 'square ' + (i + 1); } });
  return { refresh: function () { pl.reset(); draw(-1); }, stop: pl.stop };
};

/* ======================= Bifid and Trifid ======================= */
OBJ.bifid = function (host, api) {
  var box = CC.ui.mk(host, '');
  return { refresh: function () {
    var k = api.keys(), sq = CC.square(k.key, 5), t = CC.letters(api.input()).replace(/J/g, 'I').slice(0, 30), rs = [], cs = [];
    t.split('').forEach(function (c) { var i = sq.indexOf(c); rs.push(Math.floor(i / 5) + 1); cs.push(i % 5 + 1); });
    var all = rs.concat(cs), pairs = []; for (var i = 0; i < all.length; i += 2) pairs.push([all[i], all[i + 1]]);
    var cell = function (x, hl) { return '<td style="text-align:center;font-family:Consolas;' + (hl ? 'color:#ffd75e' : '') + '">' + x + '</td>'; };
    box.innerHTML = '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;align-items:flex-start"><table style="width:auto">' + [0, 1, 2, 3, 4].map(function (r) { return '<tr>' + [0, 1, 2, 3, 4].map(function (c) { return '<td style="text-align:center;font:16px Georgia;border:1px solid #2c3638;padding:4px 8px">' + sq[r * 5 + c] + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
      '<div><table style="width:auto"><tr><td class="hint">letter</td>' + t.split('').map(function (c) { return cell(c); }).join('') + '</tr><tr><td class="hint">row</td>' + rs.map(function (x) { return cell(x, 1); }).join('') + '</tr><tr><td class="hint">column</td>' + cs.map(function (x) { return cell(x, 1); }).join('') + '</tr></table>' +
      '<div class="hint" style="margin:6px 0">Read the rows line then the columns line, in pairs:</div><div class="out" style="font-size:14px">' + pairs.map(function (p) { return p.join(''); }).join(' ') + '\n' + pairs.map(function (p) { return ' ' + sq[(p[0] - 1) * 5 + p[1] - 1] + ' '; }).join('') + '</div></div></div>' + (CC.letters(api.input()).length > 30 ? '<div class="hint" style="text-align:center">(first 30 letters shown)</div>' : '');
  } };
};
OBJ.trifid = function (host, api) {
  var box = CC.ui.mk(host, '');
  return { refresh: function () {
    var k = api.keys(), sq = CC.trifidKey(k.key), h = '<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;perspective:600px">';
    for (var L = 0; L < 3; L++) { h += '<div style="transform:rotateX(35deg) rotateZ(-8deg);background:#1e2526;padding:6px;border:1px solid #5f5418;border-radius:6px"><div class="hint" style="text-align:center">layer ' + (L + 1) + '</div><table style="width:auto">'; for (var r = 0; r < 3; r++) { h += '<tr>'; for (var c = 0; c < 3; c++) h += '<td style="text-align:center;font:18px Georgia;padding:4px 10px;border:1px solid #2c3638">' + sq[L * 9 + r * 3 + c] + '</td>'; h += '</tr>'; } h += '</table></div>'; }
    var t = String(api.input()).toUpperCase().replace(/[^A-Z+]/g, '').slice(0, +k.period || 5), d = [[], [], []];
    t.split('').forEach(function (c) { var i = sq.indexOf(c); d[0].push(Math.floor(i / 9) + 1); d[1].push(Math.floor(i / 3) % 3 + 1); d[2].push(i % 3 + 1); });
    var flat = d[0].concat(d[1], d[2]), trip = []; for (var i = 0; i < flat.length; i += 3) trip.push(flat.slice(i, i + 3).join(''));
    box.innerHTML = h + '</div><div style="text-align:center;margin-top:10px" class="hint">First block "' + t + '": layer, row and column numbers written under each letter, read across, then taken in threes:</div><div class="out" style="text-align:center">' + t.split('').join('   ') + '\n' + d.map(function (r) { return r.join('   '); }).join('\n') + '\n\n' + trip.join(' ') + '  →  ' + trip.map(function (x) { return sq[(x[0] - 1) * 9 + (x[1] - 1) * 3 + (x[2] - 1)]; }).join('') + '</div>';
  } };
};

/* ======================= Playfair, two-square, four-square with the rectangle drawn ======================= */
function squareSVG(sq, x0, y0, hl, label) {
  var cs = 30, h = label ? '<text x="' + (x0 + 75) + '" y="' + (y0 - 6) + '" text-anchor="middle" font-size="11" fill="#97a3a0">' + label + '</text>' : '';
  for (var i = 0; i < 25; i++) { var r = Math.floor(i / 5), c = i % 5, col = hl && hl[i]; h += '<rect x="' + (x0 + c * cs) + '" y="' + (y0 + r * cs) + '" width="' + (cs - 2) + '" height="' + (cs - 2) + '" fill="' + (col || '#1e2526') + '"/><text x="' + (x0 + c * cs + 14) + '" y="' + (y0 + r * cs + 20) + '" text-anchor="middle" font-family="Georgia" font-size="15" fill="#edf0ee">' + (sq[i] === 'I' ? 'I/J' : sq[i]) + '</text>'; }
  return h;
}
function pairPlayer(host, api, render, getPairs) {
  var box = CC.ui.mk(host, '');
  var pl = CC.ui.player(host, { count: function () { return getPairs().length; }, show: function (i) { box.innerHTML = render(i); if (i < 0) return ''; var p = getPairs()[i]; return p.p + ' → ' + p.c + (p.why ? '  (' + p.why + ')' : ''); } });
  return { refresh: function () { pl.reset(); box.innerHTML = render(-1); }, stop: pl.stop };
}
OBJ.playfair = function (host, api) {
  function pairs() {
    var k = api.keys(), sq = CC.square(k.key, 5), bg = CC.bigrams(api.input(), { splitDoubles: k.doubles === 'book' ? 'both' : true, filler: CC.letters(k.filler || 'X')[0] || 'X' });
    return bg.map(function (p) { var a = sq.indexOf(p[0]), b = sq.indexOf(p[1]), why = Math.floor(a / 5) === Math.floor(b / 5) ? 'same row: take the letter to the right' : a % 5 === b % 5 ? 'same column: take the letter below' : 'rectangle: take the other corners'; return { p: p, c: CC.byId.playfair.pair(sq, p, 1), why: why }; });
  }
  return pairPlayer(host, api, function (i) {
    var sq = CC.square(api.keys().key, 5), hl = {};
    if (i >= 0) { var p = pairs()[i]; hl[sq.indexOf(p.p[0])] = '#4a3f12'; hl[sq.indexOf(p.p[1])] = '#4a3f12'; hl[sq.indexOf(p.c[0])] = '#a8871d'; hl[sq.indexOf(p.c[1])] = '#a8871d'; }
    return '<svg viewBox="0 0 180 170" width="260">' + squareSVG(sq, 15, 15, hl) + '</svg><div class="hint" style="text-align:center">Dark gold: the plain pair. Bright gold: the cipher pair.</div>';
  }, pairs);
};
OBJ.twosquare = function (host, api) {
  function pairs() { var k = api.keys(); return CC.bigrams(api.input()).map(function (p) { return { p: p, c: CC.byId.twosquare.pair(CC.square(k.key, 5), CC.square(k.key2, 5), p, k.layout === 'v', false) }; }); }
  return pairPlayer(host, api, function (i) {
    var k = api.keys(), A = CC.square(k.key, 5), B = CC.square(k.key2, 5), v = k.layout === 'v', ha = {}, hb = {};
    if (i >= 0) { var p = pairs()[i]; ha[A.indexOf(p.p[0])] = '#4a3f12'; hb[B.indexOf(p.p[1])] = '#4a3f12'; if (v) { ha[A.indexOf(p.c[0])] = '#a8871d'; hb[B.indexOf(p.c[1])] = '#a8871d'; } else { hb[B.indexOf(p.c[0])] = '#a8871d'; ha[A.indexOf(p.c[1])] = '#a8871d'; } }
    return v ? '<svg viewBox="0 0 180 340" width="190">' + squareSVG(A, 15, 20, ha, 'first square') + squareSVG(B, 15, 185, hb, 'second square') + '</svg>' : '<svg viewBox="0 0 350 180" width="380">' + squareSVG(A, 15, 20, ha, 'first square') + squareSVG(B, 185, 20, hb, 'second square') + '</svg>';
  }, pairs);
};
OBJ.foursquare = function (host, api) {
  function pairs() { var k = api.keys(); return CC.bigrams(api.input()).map(function (p) { return { p: p, c: CC.byId.foursquare.enc(p, k) }; }); }
  return pairPlayer(host, api, function (i) {
    var k = api.keys(), Pl = CC.square('', 5), A = CC.square(k.key, 5), B = CC.square(k.key2, 5), h1 = {}, h2 = {}, h3 = {}, h4 = {};
    if (i >= 0) { var p = pairs()[i]; h1[Pl.indexOf(p.p[0])] = '#4a3f12'; h4[Pl.indexOf(p.p[1])] = '#4a3f12'; h2[A.indexOf(p.c[0])] = '#a8871d'; h3[B.indexOf(p.c[1])] = '#a8871d'; }
    return '<svg viewBox="0 0 350 345" width="360">' + squareSVG(Pl, 15, 20, h1, 'plain') + squareSVG(A, 185, 20, h2, 'keyed: ' + esc(k.key)) + squareSVG(B, 15, 185, h3, 'keyed: ' + esc(k.key2)) + squareSVG(Pl, 185, 185, h4, 'plain') + '</svg>';
  }, pairs);
};

/* ======================= tables: homophones, codebook, nomenclator ======================= */
OBJ.homophones = function (host, api) { var box = CC.ui.mk(host, ''); return { refresh: function () { var t = CC.homTable(api.keys().key); box.innerHTML = '<table style="width:auto;margin:auto">' + AZ.split('').map(function (c) { return '<tr><td style="font:700 15px Georgia;color:#ffd75e">' + c + '</td><td style="font-family:Consolas">' + t[c].join(' ') + '</td></tr>'; }).join('') + '</table><div class="hint" style="text-align:center">Common letters own more numbers, so every number turns up about equally often.</div>'; } }; };
OBJ.codebook = function (host, api) { var box = CC.ui.mk(host, ''); return { refresh: function () { var t = CC.codePage(api.keys().page), ks = Object.keys(t).sort(); box.innerHTML = '<div class="hint" style="text-align:center">Codebook page ' + esc(api.keys().page) + ' (each page is used for one message only)</div><div style="columns:4 160px;font:13px Consolas;margin-top:6px">' + ks.map(function (w) { return '<div><b style="color:#ffd75e">' + t[w] + '</b> ' + esc(w) + '</div>'; }).join('') + '</div><div class="row noprint" style="justify-content:center"><button class="b" onclick="window.print()">Print this page</button></div>'; } }; };
OBJ.nomen = function (host) { var N = CC.nomen, box = CC.ui.mk(host, '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center"><table style="width:auto">' + Object.keys(N.letters).map(function (c) { return '<tr><td style="font:700 14px Georgia">' + c + '</td><td style="font-size:20px;color:#ffd75e">' + N.letters[c].join(' ') + '</td></tr>'; }).join('') + '</table><table style="width:auto">' + Object.keys(N.words).map(function (w) { return '<tr><td>' + w + '</td><td style="font-size:22px;color:#4fb38a">' + N.words[w] + '</td></tr>'; }).join('') + '<tr><td>nulls</td><td style="font-size:22px;color:#e0605a">' + N.nulls.join(' ') + '</td></tr></table></div>'); return {}; };

/* ======================= book view ======================= */
OBJ.book = function (host, api) {
  var box = CC.ui.mk(host, '');
  return { refresh: function () {}, ran: function (dir, r) {
    var id = api.def.id, k = api.keys(), text = k.book || CC.book.text, hl = {};
    if (id === 'bookletter') { var nums = (String(dir === 'enc' ? r : api.input()).match(/\d+/g) || []).map(Number); nums.forEach(function (n) { hl[n] = 1; }); var i = 0;
      box.innerHTML = '<div class="hint">' + esc(k.book ? 'Your book' : CC.book.name) + ': highlighted words are the ones used.</div><div style="max-height:240px;overflow:auto;font:14px/1.7 Georgia;padding:8px;background:#efe3c2;color:#222;border-radius:6px">' + esc(text).replace(/[A-Za-z']+/g, function (w) { i++; return hl[i] ? '<b style="background:#f7d36b" title="' + i + '">' + w + '<sup>' + i + '</sup></b>' : w; }) + '</div>'; }
    else if (id === 'bookword') { var refs = (String(dir === 'enc' ? r : api.input()).match(/\d+\.\d+/g) || []); refs.forEach(function (x) { hl[x] = 1; }); var lines = String(text).replace(/\r/g, '').split('\n').filter(function (l) { return /[A-Za-z]/.test(l); });
      box.innerHTML = '<div class="hint">' + esc(k.book ? 'Your book' : CC.book.name) + ', line by line: the words used are highlighted.</div><div style="max-height:240px;overflow:auto;font:13px/1.6 Georgia;padding:8px;background:#efe3c2;color:#222;border-radius:6px">' + lines.map(function (l, li) { var wi = 0; return '<div><span style="color:#999;font-size:10px">' + (li + 1) + '</span> ' + esc(l).replace(/[A-Za-z']+/g, function (w) { wi++; return hl[(li + 1) + '.' + wi] ? '<b style="background:#f7d36b">' + w + '</b>' : w; }) + '</div>'; }).join('') + '</div>'; }
  } };
};

/* ======================= one-time pad sheet and Vernam tape ======================= */
OBJ.pad = function (host, api) {
  var box = CC.ui.mk(host, '<div class="ctl noprint"><button class="b p" id="pnew">Make a new random pad</button><button class="b" onclick="window.print()">Print the pad</button></div><div id="psheet" style="font:16px Consolas;text-align:center;line-height:1.8"></div><div class="hint" style="text-align:center">Made with your computer\'s cryptographic random numbers. Both people need the same sheet; burn it after one use.</div>');
  box.querySelector('#pnew').onclick = function () { var n = Math.max(50, Math.ceil(CC.letters(api.input()).length / 5) * 5 + 25); api.set('key', CC.randLetters(n)); };
  return { refresh: function () { var K = CC.letters(api.keys().key); box.querySelector('#psheet').innerHTML = K ? CC.group(K).replace(/(\S+ \S+ \S+ \S+ \S+ )/g, '$1<br>') : '<span class="hint">No pad yet - make one.</span>'; } };
};
OBJ.vernam = function (host, api) {
  var box = CC.ui.mk(host, '');
  return { refresh: function () {
    var codes = CC.ita2Encode(api.input()).slice(0, 24), key = CC.byId.vernam.keyCodes(api.keys(), codes.length), x = CC.byId.vernam.xor(codes, key);
    box.innerHTML = '<div class="hint" style="text-align:center">message tape</div>' + CC.ui.tape(codes) + '<div class="hint" style="text-align:center">key tape' + (api.keys().key ? '' : ' (none given: an example random tape)') + '</div>' + CC.ui.tape(key.slice(0, codes.length)) + '<div class="hint" style="text-align:center">sent = message XOR key (a hole where exactly one of the two tapes has a hole)</div>' + CC.ui.tape(x);
  } };
};

/* ======================= modern ======================= */
OBJ.modern = function (host) { CC.ui.mk(host, '<div class="note" style="margin:0">AES scrambles 16-byte blocks through 14 rounds of substitution, row shifting, column mixing and key mixing. It has no moving parts to watch - its strength is that nobody has found a shortcut. Try changing one letter of the password: the result is completely different.</div>'); return {}; };
OBJ.rsa = function (host, api) {
  var box = CC.ui.mk(host, '<div class="ctl noprint"><label class="hint">key size <select id="rbits"><option>128</option><option selected>256</option><option>512</option><option>1024</option></select> bits</label><button class="b p" id="rgen">New key pair</button></div><div id="rinfo" class="hint" style="text-align:center"></div>');
  box.querySelector('#rgen').onclick = function () {
    var info = box.querySelector('#rinfo'); info.textContent = 'Finding two large primes...';
    setTimeout(function () { var t0 = performance.now(), kp = CC.rsaGenerate(+box.querySelector('#rbits').value); api.set('n', kp.n.toString()); api.set('e', kp.e.toString()); api.set('d', kp.d.toString());
      info.innerHTML = 'p = ' + kp.p + '<br>q = ' + kp.q + '<br>n = p &times; q has ' + kp.n.toString().length + ' digits. Found in ' + Math.round(performance.now() - t0) + ' ms. Give out n and e; keep d (and p, q) secret.'; }, 20);
  };
  return {};
};
OBJ.hash = function (host, api) {
  var box = CC.ui.mk(host, '<div class="grid2"><div><h3 style="margin-top:0">Avalanche</h3><div class="hint">The message, and the same message with its first letter changed:</div><div class="out" id="hav" style="font-size:13px"></div></div>' +
    '<div><h3 style="margin-top:0">Digital signature (ECDSA P-256)</h3><div class="row"><button class="b p" id="hkey">Make my signing keys</button><button class="b" id="hsign">Sign the message</button><button class="b" id="hver">Verify</button></div><div class="out" id="hsig" style="font-size:12px"></div></div></div>');
  var keys = null, sig = '';
  async function av() { var t = api.input(), t2 = t ? String.fromCharCode(t.charCodeAt(0) ^ 1) + t.slice(1) : 'x', a = await CC.byId.hash.enc(t, api.keys()), b = await CC.byId.hash.enc(t2, api.keys()), diff = 0;
    for (var i = 0; i < a.length; i++) { var x = parseInt(a[i], 16) ^ parseInt(b[i], 16); diff += (x & 1) + (x >> 1 & 1) + (x >> 2 & 1) + (x >> 3 & 1); }
    box.querySelector('#hav').textContent = esc(t.slice(0, 40)) + '\n' + a + '\n\n' + esc(t2.slice(0, 40)) + '\n' + b + '\n\n' + diff + ' of ' + a.length * 4 + ' bits differ (about half is what a good hash gives).'; }
  box.querySelector('#hkey').onclick = async function () { keys = await CC.signPair(); box.querySelector('#hsig').textContent = 'Keys made. The private key never leaves this page.'; };
  box.querySelector('#hsign').onclick = async function () { if (!keys) keys = await CC.signPair(); sig = await CC.sign(keys.privateKey, api.input()); box.querySelector('#hsig').textContent = 'Signature:\n' + sig + '\n\nNow change the message and press Verify.'; };
  box.querySelector('#hver').onclick = async function () { if (!sig) { box.querySelector('#hsig').textContent = 'Sign something first.'; return; } var ok = await CC.verify(keys.publicKey, api.input(), sig); box.querySelector('#hsig').innerHTML = ok ? '<span class="badge ok">Genuine: signed by this key, not changed</span>' : '<span class="badge bad">Does not verify: the message was changed or signed by someone else</span>'; };
  return { refresh: function () { av(); } };
};

/* ======================= hiding ======================= */
OBJ.nullcipher = function (host, api) { var box = CC.ui.mk(host, ''); return { refresh: function () {}, ran: function (dir, r) { var src = dir === 'enc' ? r : api.input(), rule = api.keys().rule, n = 0;
  box.innerHTML = '<div style="font:16px/1.8 Georgia;padding:8px;background:#efe3c2;color:#222;border-radius:6px;white-space:pre-wrap">' + (rule === 'lines' ? esc(src).replace(/^(\s*)([A-Za-z])/gm, '$1<b style="color:#b0301f;font-size:20px">$2</b>') : esc(src).replace(/[A-Za-z']+/g, function (w) { var i = rule === 'second' ? 1 : rule === 'last' ? w.length - 1 : 0; if (w.length <= i) return w; return w.slice(0, i) + '<b style="color:#b0301f">' + w[i] + '</b>' + w.slice(i + 1); })) + '</div><div class="hint" style="text-align:center">The marked letters carry the message.</div>'; } }; };
OBJ.bacon = function (host, api) { var box = CC.ui.mk(host, ''); return { refresh: function () {}, ran: function (dir, r) { var src = dir === 'enc' ? r : api.input(); if (api.keys().mode === 'ab' && dir === 'enc') { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="hint">How it would be printed: letters in the second typeface are the "b"s.</div><div style="font-size:20px;line-height:1.8;padding:8px;background:#20262a;border-radius:6px">' + Array.from(src).map(function (c) { return /[A-Z]/.test(c) ? '<span class="bacon-b">' + c.toLowerCase() + '</span>' : /[a-z]/.test(c) ? '<span class="bacon-a">' + c + '</span>' : esc(c); }).join('') + '</div>'; } }; };
OBJ.cardan = function (host, api) {
  var box = CC.ui.mk(host, ''), on = true, pos = [];
  function draw() { var cover = api.keys().cover || '', set = {}; pos.forEach(function (p) { set[p] = 1; });
    box.innerHTML = '<div style="font:18px/1.9 Georgia;padding:10px;background:' + (on && pos.length ? '#3a2f1d' : '#efe3c2') + ';border-radius:6px;transition:background .5s">' + Array.from(cover).map(function (c, i) { return set[i] ? '<span style="background:#efe3c2;color:#b0301f;font-weight:700;padding:0 1px;border-radius:2px">' + esc(c) + '</span>' : '<span style="color:' + (on && pos.length ? 'transparent' : '#222') + '">' + esc(c) + '</span>'; }).join('') + '</div>'; }
  CC.ui.mk(host, '<div class="ctl noprint"><button class="b p" id="cgr">Lift / lay the grille</button></div>').onclick = function (e) { if (e.target.id === 'cgr') { on = !on; draw(); } };
  return { refresh: function () { pos = []; draw(); }, ran: function (dir, r) { pos = (String(dir === 'enc' ? r : api.input()).match(/\d+/g) || []).map(Number); on = true; draw(); } };
};
OBJ.zerowidth = function (host, api) { var box = CC.ui.mk(host, ''); return { refresh: function () {}, ran: function (dir, r) { var src = dir === 'enc' ? r : api.input(), n = Array.from(src).filter(function (c) { return /[​‌⁠]/.test(c); }).length;
  box.innerHTML = '<div class="hint">What a reader sees:</div><div class="out">' + esc(src.replace(/[​‌⁠]/g, '')) + '</div><div class="hint" style="margin-top:6px">What is really there (' + n + ' invisible characters shown as ◦ and •):</div><div class="out" style="font-size:13px">' + esc(src).replace(/​/g, '<span style="color:#4fb38a">◦</span>').replace(/‌/g, '<span style="color:#ffd75e">•</span>').replace(/⁠/g, '|') + '</div>'; } }; };

/* picture hiding: load or make a picture, hide, save as PNG, reveal */
OBJ.image = function (host, api) {
  var box = CC.ui.mk(host, '<div class="row" style="justify-content:center"><label class="b">Choose a picture&hellip;<input type="file" id="ifile" accept="image/*" style="display:none"></label><button class="b" id="imake">Use a made-up landscape</button>' +
    '<label class="hint">bits per colour <select id="ibits"><option>1</option><option>2</option><option>3</option></select></label><button class="b p" id="ihide">Hide the message in it</button><button class="b" id="ishow">Reveal</button><button class="b" id="isave">Save as PNG</button></div>' +
    '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><div style="text-align:center"><canvas id="ican" style="max-width:420px;border-radius:6px"></canvas><div class="hint" id="icap"></div></div><div style="text-align:center"><canvas id="idiff" style="max-width:420px;border-radius:6px"></canvas><div class="hint">Lowest bits only, magnified: the hidden data looks like noise</div></div></div><div id="imsg" class="hint" style="text-align:center"></div>');
  var can = box.querySelector('#ican'), ctx = can.getContext('2d', { willReadFrequently: true });
  function landscape() { can.width = 480; can.height = 300; var g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#79a6d8'); g.addColorStop(.6, '#f2d39b'); g.addColorStop(1, '#4c7a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 300);
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(370, 90, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#3d5a3a'; ctx.beginPath(); ctx.moveTo(0, 220); for (var x = 0; x <= 480; x += 20) ctx.lineTo(x, 200 - 40 * Math.sin(x / 70) - 15 * Math.sin(x / 23)); ctx.lineTo(480, 300); ctx.lineTo(0, 300); ctx.fill(); cap(); diff(); }
  function cap() { box.querySelector('#icap').textContent = can.width + ' x ' + can.height + ' pixels: room for about ' + CC.stegoCapacity(can.width, can.height, +box.querySelector('#ibits').value).toLocaleString('en-AU') + ' bytes'; }
  function diff() { var d = box.querySelector('#idiff'); d.width = can.width; d.height = can.height; var src = ctx.getImageData(0, 0, can.width, can.height), out = d.getContext('2d').createImageData(can.width, can.height), b = +box.querySelector('#ibits').value, m = (1 << b) - 1;
    for (var i = 0; i < src.data.length; i += 4) { out.data[i] = (src.data[i] & m) * 255 / m; out.data[i + 1] = (src.data[i + 1] & m) * 255 / m; out.data[i + 2] = (src.data[i + 2] & m) * 255 / m; out.data[i + 3] = 255; } d.getContext('2d').putImageData(out, 0, 0); }
  box.querySelector('#imake').onclick = landscape;
  box.querySelector('#ibits').onchange = function () { cap(); diff(); };
  box.querySelector('#ifile').onchange = function (e) { var f = e.target.files[0]; if (!f) return; var img = new Image(); img.onload = function () { var s = Math.min(1, 1600 / Math.max(img.width, img.height)); can.width = Math.round(img.width * s); can.height = Math.round(img.height * s); ctx.drawImage(img, 0, 0, can.width, can.height); cap(); diff(); box.querySelector('#imsg').textContent = 'Loaded ' + f.name + '. Press Reveal to look for a hidden message, or Hide to put one in.'; }; img.src = URL.createObjectURL(f); };
  box.querySelector('#ihide').onclick = function () { try { var id = ctx.getImageData(0, 0, can.width, can.height); CC.stegoEmbed(id.data, new TextEncoder().encode(api.input()), +box.querySelector('#ibits').value); ctx.putImageData(id, 0, 0); diff(); box.querySelector('#imsg').innerHTML = '<span class="badge ok">Hidden</span> ' + new TextEncoder().encode(api.input()).length + ' bytes. Save as PNG to keep it.'; api.setOutput('(hidden in the picture)'); } catch (e) { box.querySelector('#imsg').innerHTML = '<span class="err">' + esc(e.message) + '</span>'; } };
  box.querySelector('#ishow').onclick = function () { var r = CC.stegoExtract(ctx.getImageData(0, 0, can.width, can.height).data, +box.querySelector('#ibits').value); if (!r) { box.querySelector('#imsg').textContent = 'No message from this studio found in the picture (try another "bits per colour" setting).'; return; } var t = new TextDecoder().decode(r); api.setOutput(t); box.querySelector('#imsg').innerHTML = '<span class="badge ok">Found</span> ' + r.length + ' bytes.'; };
  box.querySelector('#isave').onclick = function () { can.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'picture-with-secret.png'; a.click(); }, 'image/png'); };
  landscape();
  return { ran: function () { api.setOutput('', 'Use the buttons on the picture above: Hide puts the message in, Reveal reads one out.'); } };
};

})();
