/* Codes & Ciphers Studio engine - by Larry Dalton
   Chapter 4 (transposition), Chapter 5 (fractionation), Chapter 6 (polygraphic) */
(function (G) {
'use strict';
var CC = G.CC, AZ = CC.AZ, mod = CC.mod;
var padOpt = { id: 'pad', label: 'Empty cells', type: 'select', def: 'blank', options: [['blank', 'Leave blank (irregular)'], ['x', 'Fill with X'], ['random', 'Fill with random letters']] };
function padChars(n, how) { if (how === 'x') return Array(n + 1).join('X'); if (how === 'random') return CC.randLetters(n); return ''; }

/* ---------- Scytale ---------- */
CC.scytaleGrid = function (s, faces) {
  var t = CC.letters(s), cols = Math.ceil(t.length / faces), g = [];
  for (var r = 0; r < faces; r++) g.push(t.slice(r * cols, r * cols + cols).split(''));
  return { grid: g, cols: cols };
};
CC.reg({ id: 'scytale', ch: 4, name: 'Scytale', kind: 'cipher', object: 'scytale',
  keys: [{ id: 'faces', label: 'Letters around the rod', type: 'number', def: 4, min: 2, max: 12 }, padOpt],
  about: 'A strip of leather wound round a rod. Write along the rod, unwind it, and the letters are scrambled until the strip is wound on a rod of the same thickness.',
  enc: function (s, k) {
    var f = Math.max(2, +k.faces || 4), t = CC.letters(s), cols = Math.ceil(t.length / f);
    t += padChars(f * cols - t.length, k.pad === 'blank' ? 'x' : k.pad);
    var o = ''; for (var c = 0; c < cols; c++) for (var r = 0; r < f; r++) o += t[r * cols + c] || '';
    return o;
  },
  dec: function (s, k) {
    var f = Math.max(2, +k.faces || 4), t = CC.letters(s), cols = Math.ceil(t.length / f), o = '';
    for (var r = 0; r < f; r++) for (var c = 0; c < cols; c++) o += t[c * f + r] || '';
    return o;
  },
  vectors: [{ k: { faces: 4, pad: 'x' }, p: 'IAMHURTVERYBADLYHELP', c: 'IRYYATBHMVAEHEDLURLP' }],
  sample: 'I AM HURT VERY BADLY HELP'
});

/* ---------- Rail fence ---------- */
CC.railPattern = function (n, rails) { var p = [], r = 0, d = 1; for (var i = 0; i < n; i++) { p.push(r); if (rails > 1) { if (r === 0) d = 1; else if (r === rails - 1) d = -1; r += d; } } return p; };
CC.reg({ id: 'railfence', ch: 4, name: 'Rail fence', kind: 'cipher', object: 'rails',
  keys: [{ id: 'rails', label: 'Rails', type: 'number', def: 3, min: 2, max: 12 }],
  about: 'Write the message in a zig-zag down and up across the rails, then read each rail in turn.',
  enc: function (s, k) { var t = CC.letters(s), R = +k.rails || 3, p = CC.railPattern(t.length, R), o = ''; for (var r = 0; r < R; r++) for (var i = 0; i < t.length; i++) if (p[i] === r) o += t[i]; return o; },
  dec: function (s, k) { var t = CC.letters(s), R = +k.rails || 3, p = CC.railPattern(t.length, R), o = [], j = 0; for (var r = 0; r < R; r++) for (var i = 0; i < t.length; i++) if (p[i] === r) o[i] = t[j++]; return o.join(''); },
  vectors: [{ k: { rails: 5 }, p: 'LEAVE AREA IMMEDIATELY PROCEED NORTH AT ONCE', c: 'LATEAEEIAECEHTARMILODTOVAMDYRNRNEEEPOC', src: 'book' },
            { k: { rails: 4 }, p: 'FUELSUPPLIESRUNNINGLOW', c: 'FPRGUUPSUNLESLENIOLINW', src: 'book' },
            { k: { rails: 3 }, p: 'WEAREDISCOVEREDFLEEATONCE', c: 'WECRLTEERDSOEEFEAOCAIVDEN' }],
  sample: 'Leave area immediately proceed north at once'
});

/* ---------- Route ---------- */
CC.routeOrder = function (rows, cols, route) {
  var o = [], r, c;
  if (route === 'book') {
    for (r = 0; r < rows; r++) o.push([r, 0]);
    if (cols > 1) for (r = rows - 1; r >= 0; r--) o.push([r, 1]);
    for (r = 0; r < rows; r++) { if (r % 2 === 0) for (c = cols - 1; c >= 2; c--) o.push([r, c]); else for (c = 2; c < cols; c++) o.push([r, c]); }
  } else if (route === 'spiral') {
    var t = 0, b = rows - 1, l = 0, R = cols - 1;
    while (t <= b && l <= R) {
      for (c = l; c <= R; c++) o.push([t, c]); t++;
      for (r = t; r <= b; r++) o.push([r, R]); R--;
      if (t <= b) { for (c = R; c >= l; c--) o.push([b, c]); b--; }
      if (l <= R) { for (r = b; r >= t; r--) o.push([r, l]); l++; }
    }
  } else if (route === 'snake') {
    for (c = 0; c < cols; c++) { if (c % 2 === 0) for (r = 0; r < rows; r++) o.push([r, c]); else for (r = rows - 1; r >= 0; r--) o.push([r, c]); }
  } else { /* diagonals */
    for (var d = 0; d < rows + cols - 1; d++) for (r = 0; r < rows; r++) { c = d - r; if (c >= 0 && c < cols) o.push([r, c]); }
  }
  return o;
};
CC.reg({ id: 'route', ch: 4, name: 'Route cipher', kind: 'cipher', object: 'grid',
  keys: [{ id: 'cols', label: 'Columns', type: 'number', def: 7, min: 2, max: 20 },
         { id: 'route', label: 'Route', type: 'select', def: 'book', options: [['book', 'Book\'s route: down column 1, up column 2, then rows back and forth from the top right'], ['spiral', 'Clockwise spiral from the top left'], ['snake', 'Down and up the columns'], ['diag', 'Diagonals from the top left']] },
         { id: 'pad', label: 'Empty cells', type: 'select', def: 'random', options: [['x', 'Fill with X'], ['random', 'Fill with random letters']] }],
  about: 'Write the message in rows, then read it out along an agreed path through the grid.',
  enc: function (s, k) { var t = CC.letters(s), C = +k.cols || 7, R = Math.ceil(t.length / C); t += padChars(R * C - t.length, k.pad || 'random'); return CC.routeOrder(R, C, k.route).map(function (p) { return t[p[0] * C + p[1]]; }).join(''); },
  dec: function (s, k) { var t = CC.letters(s), C = +k.cols || 7, R = Math.ceil(t.length / C), g = []; CC.routeOrder(R, C, k.route).forEach(function (p, i) { g[p[0] * C + p[1]] = t[i] || ''; }); return g.join(''); },
  sample: 'Increase alert level as enemy attack imminent'
});

/* ---------- Columnar family ---------- */
CC.columnarEnc = function (t, key, pad) {
  var C = key.length, R = Math.ceil(t.length / C); t += padChars(R * C - t.length, pad);
  var rank = CC.keyOrder(key), order = []; rank.forEach(function (rk, col) { order[rk] = col; });
  var o = ''; order.forEach(function (col) { for (var r = 0; r < R; r++) o += t[r * C + col] || ''; });
  return o;
};
CC.columnarDec = function (t, key) {
  var C = key.length, n = t.length, R = Math.ceil(n / C), full = n % C || C;
  var rank = CC.keyOrder(key), order = []; rank.forEach(function (rk, col) { order[rk] = col; });
  var g = [], p = 0; order.forEach(function (col) { var h = col < full ? R : R - 1; for (var r = 0; r < h; r++) g[r * C + col] = t[p++]; });
  return g.join('');
};
CC.reg({ id: 'columnar', ch: 4, name: 'Columnar transposition', kind: 'cipher', object: 'columns',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'RELIANT' }, padOpt],
  about: 'Write the message in rows under a keyword, sort the columns into the keyword\'s alphabetical order, then read down each column.',
  enc: function (s, k) { return CC.columnarEnc(CC.letters(s), CC.letters(k.key) || 'KEY', k.pad); },
  dec: function (s, k) { return CC.columnarDec(CC.letters(s), CC.letters(k.key) || 'KEY'); },
  vectors: [{ k: { key: 'RELIANT', pad: 'blank' }, p: 'INCREASE ALERT LEVEL AS ENEMY ATTACK IMMINENT', c: 'ERAAMNAVECERELYITCLEMKNATSTMIEENANSLETI', src: 'book' },
            { k: { key: 'ZEBRAS', pad: 'blank' }, p: 'WEAREDISCOVEREDFLEEATONCE', c: 'EVLNACDTESEAROFODEECWIREE' }],
  sample: 'Increase alert level as enemy attack imminent'
});
CC.reg({ id: 'double', ch: 4, name: 'Double columnar transposition', kind: 'cipher', object: 'columns',
  keys: [{ id: 'key', label: 'First keyword', type: 'text', def: 'RELIANT' }, { id: 'key2', label: 'Second keyword', type: 'text', def: 'FORTUNE' }, padOpt],
  about: 'Columnar transposition done twice, usually with two different keywords. Undo it in the reverse order.',
  enc: function (s, k) { return CC.columnarEnc(CC.columnarEnc(CC.letters(s), CC.letters(k.key) || 'KEY', k.pad), CC.letters(k.key2) || 'KEY', 'blank'); },
  dec: function (s, k) { return CC.columnarDec(CC.columnarDec(CC.letters(s), CC.letters(k.key2) || 'KEY'), CC.letters(k.key) || 'KEY'); },
  sample: 'Increase alert level as enemy attack imminent'
});
CC.reg({ id: 'myszkowski', ch: 4, name: 'Myszkowski transposition', kind: 'cipher', object: 'columns',
  keys: [{ id: 'key', label: 'Keyword (with repeated letters)', type: 'text', def: 'ATHLETE' }, padOpt],
  about: 'Like columnar, but columns that share a keyword letter are read together, row by row, left to right.',
  plan: function (n, key) {
    var C = key.length, R = Math.ceil(n / C), letters = CC.dedupe(key.split('').sort().join('')), cells = [];
    letters.split('').forEach(function (L) {
      var cols = []; for (var c = 0; c < C; c++) if (key[c] === L) cols.push(c);
      for (var r = 0; r < R; r++) cols.forEach(function (c) { var i = r * C + c; if (i < n) cells.push(i); });
    });
    return cells;
  },
  enc: function (s, k) { var key = CC.letters(k.key) || 'KEY', t = CC.letters(s), C = key.length; t += padChars(Math.ceil(t.length / C) * C - t.length, k.pad); return this.plan(t.length, key).map(function (i) { return t[i]; }).join(''); },
  dec: function (s, k) { var key = CC.letters(k.key) || 'KEY', t = CC.letters(s), g = []; this.plan(t.length, key).forEach(function (i, j) { g[i] = t[j]; }); return g.join(''); },
  vectors: [{ k: { key: 'ATHLETE', pad: 'blank' }, p: 'INCREASE ALERT LEVEL AS ENEMY ATTACK IMMINENT', c: 'IEENANESRLAEATMICLEMKNRELYITNAATVSETCME', src: 'book' }],
  sample: 'Increase alert level as enemy attack imminent'
});
/* Disrupted: fill row by row, jumping to a new row after any letter that is in the keyword; when the bottom is reached,
   go back and fill the gaps row by row; then read out by columnar transposition. */
CC.disruptGrid = function (n, key, text) {
  var C = key.length, R = Math.ceil(n / C), g = new Array(R * C), r = 0, c = 0, i = 0;
  while (i < n && r < R) {
    g[r * C + c] = i; var ch = text ? text[i] : null; i++;
    if (ch && key.indexOf(ch) >= 0) { r++; c = 0; } else { c++; if (c >= C) { r++; c = 0; } }
  }
  for (var p = 0; p < R * C && i < n; p++) if (g[p] === undefined) g[p] = i++;
  return { grid: g, R: R, C: C };
};
/* Undo it exactly: the empty cells are the last gaps in row order, so try each possible shape of empty cells,
   rebuild the columns, walk the rows the way the writer did, and keep every answer that enciphers back to the
   same ciphertext. When more than one does (the rule can be ambiguous), keep the one that reads most like English. */
CC.disruptSolve = function (t, key) {
  var n = t.length, C = key.length, R = Math.ceil(n / C), E = R * C - n, rank = CC.keyOrder(key), order = [];
  rank.forEach(function (rk, col) { order[rk] = col; });
  var sets = [], seen = {};
  (function gen(r, rem, acc) {
    if (sets.length >= 20000) return;
    if (rem === 0) { var kk = acc.slice().sort(function (a, b) { return a - b; }).join(); if (!seen[kk]) { seen[kk] = 1; sets.push(acc.slice()); } return; }
    if (r < 0) return;
    for (var g = rem; g >= 0; g--) { if (g > C) continue; var cells = []; for (var c = C - g; c < C; c++) cells.push(r * C + c); gen(r - 1, rem - g, acc.concat(cells)); }
    if (rem < C) { cells = []; for (c = C - rem; c < C; c++) cells.push(r * C + c); gen(-1, 0, acc.concat(cells)); }
  })(R - 1, E, []);
  var best = null, count = 0;
  sets.forEach(function (em) {
    var empty = {}; em.forEach(function (x) { empty[x] = 1; });
    var start = {}, p = 0; order.forEach(function (col) { start[col] = p; for (var r = 0; r < R; r++) if (!empty[r * C + col]) p++; });
    var at = function (cell) { var r = Math.floor(cell / C), col = cell % C, above = 0; for (var q = 0; q < r; q++) if (!empty[q * C + col]) above++; return t[start[col] + above]; };
    var used = {}, out = '', r = 0, c = 0, i = 0, bad = false;
    while (i < n && r < R) { var cell = r * C + c; if (empty[cell]) { bad = true; break; } var ch = at(cell); used[cell] = 1; out += ch; i++; if (key.indexOf(ch) >= 0) { r++; c = 0; } else { c++; if (c >= C) { r++; c = 0; } } }
    if (bad) return;
    for (cell = 0; cell < R * C && i < n; cell++) { if (used[cell]) continue; if (empty[cell]) { bad = true; break; } out += at(cell); used[cell] = 1; i++; }
    if (bad || i < n || CC.byId.disrupted.enc(out, { key: key }) !== t) return;
    count++; var f = CC.fitness(out); if (!best || f > best.f) best = { text: out, f: f };
  });
  return best ? { text: best.text, count: count } : null;
};
CC.reg({ id: 'disrupted', ch: 4, name: 'Disrupted transposition', kind: 'cipher', object: 'columns',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'ALIMONY' }],
  about: 'The grid is not filled in order: after any letter that is in the keyword, writing jumps to a new row. Leftover letters fill the gaps, then the columns are read in keyword order.',
  enc: function (s, k) {
    var key = CC.letters(k.key) || 'KEY', t = CC.letters(s), d = CC.disruptGrid(t.length, key, t), rank = CC.keyOrder(key), order = [];
    rank.forEach(function (rk, col) { order[rk] = col; });
    var o = ''; order.forEach(function (col) { for (var r = 0; r < d.R; r++) { var v = d.grid[r * d.C + col]; if (v !== undefined) o += t[v]; } });
    return o;
  },
  dec: function (s, k) {
    var key = CC.letters(k.key) || 'KEY', t = CC.letters(s), r = CC.disruptSolve(t, key);
    if (!r) throw new Error('This ciphertext cannot be undone with this keyword.');
    this.lastNote = r.count > 1 ? 'With this keyword ' + r.count + ' different messages give exactly the same ciphertext (the book\'s rule can be ambiguous); the one that reads most like English is shown.' : '';
    return r.text;
  },
  vectors: [{ k: { key: 'ALIMONY' }, p: 'INCREASE ALERT LEVEL AS ENEMY ATTACK IMMINENT', c: 'INCSLEVNEAITEEREMREEACNLAYTINLMTKESAAMT', src: 'book' }],
  sample: 'Increase alert level as enemy attack imminent'
});

/* ---------- Grilles ---------- */
/* Trellis: chessboard grille, write through the light squares row by row, flip, write the rest, read columns */
CC.reg({ id: 'trellis', ch: 4, name: 'Trellis cipher', kind: 'cipher', object: 'trellis',
  keys: [{ id: 'size', label: 'Grid size', type: 'number', def: 8, min: 4, max: 12 }, { id: 'pad', label: 'Empty cells', type: 'select', def: 'random', options: [['x', 'Fill with X'], ['random', 'Fill with random letters']] }],
  about: 'A chessboard grille: write through the open squares, flip it so the other squares open, carry on, then read the grid column by column.',
  cells: function (N) { var a = [], b = []; for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) ((r + c) % 2 === 0 ? a : b).push(r * N + c); return a.concat(b); },
  enc: function (s, k) {
    var N = +k.size || 8, t = CC.letters(s), out = [];
    while (t.length % (N * N)) t += padChars(1, k.pad || 'random');
    for (var blk = 0; blk < t.length; blk += N * N) {
      var g = []; this.cells(N).forEach(function (cell, i) { g[cell] = t[blk + i]; });
      for (var c = 0; c < N; c++) for (var r = 0; r < N; r++) out.push(g[r * N + c]);
    }
    return out.join('');
  },
  dec: function (s, k) {
    var N = +k.size || 8, t = CC.letters(s), o = '', self = this;
    for (var blk = 0; blk < t.length; blk += N * N) {
      var g = []; for (var c = 0; c < N; c++) for (var r = 0; r < N; r++) g[r * N + c] = t[blk + c * N + r];
      self.cells(N).forEach(function (cell) { o += g[cell] || ''; });
    }
    return o;
  },
  sample: 'Increase alert level as enemy attack imminent'
});
/* Fleissner turning grille: a key picks one cell of every group of four rotations */
CC.fleissnerHoles = function (N, key) {
  var h = N / 2, r = CC.seeded(Array.from(String(key || 'GRILLE')).reduce(function (a, ch) { return (a * 33 + ch.charCodeAt(0)) >>> 0; }, 5381)), holes = [];
  for (var i = 0; i < h; i++) for (var j = 0; j < h; j++) {
    var q = r(4), y = i, x = j; for (var t = 0; t < q; t++) { var ny = x, nx = N - 1 - y; y = ny; x = nx; }
    holes.push(y * N + x);
  }
  return holes.sort(function (a, b) { return a - b; });
};
CC.rot90 = function (cell, N) { var y = Math.floor(cell / N), x = cell % N; return x * N + (N - 1 - y); };
CC.fleissnerOrder = function (N, holes) {
  var order = [], cur = holes.slice();
  for (var turn = 0; turn < 4; turn++) { cur.slice().sort(function (a, b) { return a - b; }).forEach(function (c) { order.push(c); }); cur = cur.map(function (c) { return CC.rot90(c, N); }); }
  return order;
};
CC.reg({ id: 'fleissner', ch: 4, name: 'Fleissner turning grille', kind: 'cipher', object: 'turning',
  keys: [{ id: 'size', label: 'Grille size (even)', type: 'number', def: 6, min: 4, max: 10, step: 2 }, { id: 'key', label: 'Grille key (picks the holes)', type: 'text', def: 'SANDORF' },
         { id: 'read', label: 'Read the grid', type: 'select', def: 'col', options: [['col', 'Column by column (as in the book)'], ['row', 'Row by row']] }, { id: 'pad', label: 'Empty cells', type: 'select', def: 'random', options: [['x', 'Fill with X'], ['random', 'Fill with random letters']] }],
  about: 'A square card with holes is turned a quarter at a time; each turn opens fresh squares until every square has been used exactly once.',
  enc: function (s, k) {
    var N = (+k.size || 6) & ~1, t = CC.letters(s), ord = CC.fleissnerOrder(N, CC.fleissnerHoles(N, k.key)), out = '';
    while (t.length % (N * N)) t += padChars(1, k.pad || 'random');
    for (var b = 0; b < t.length; b += N * N) {
      var g = []; ord.forEach(function (cell, i) { g[cell] = t[b + i]; });
      if (k.read === 'row') out += g.join(''); else for (var c = 0; c < N; c++) for (var r = 0; r < N; r++) out += g[r * N + c];
    }
    return out;
  },
  dec: function (s, k) {
    var N = (+k.size || 6) & ~1, t = CC.letters(s), ord = CC.fleissnerOrder(N, CC.fleissnerHoles(N, k.key)), out = '';
    for (var b = 0; b < t.length; b += N * N) {
      var g = [], blk = t.slice(b, b + N * N);
      if (k.read === 'row') g = blk.split(''); else for (var c = 0; c < N; c++) for (var r = 0; r < N; r++) g[r * N + c] = blk[c * N + r];
      ord.forEach(function (cell) { out += g[cell] || ''; });
    }
    return out;
  },
  sample: 'Meet me at the old bridge at midnight bring the map'
});
/* Crossword: the white squares of an agreed crossword are the grille */
CC.crosswords = {
  daily: ['#...#.....#...#', '.#.#.#.#.#.#.#.', '...............', '.#.#.#.#.#.#.#.', '.....#...#.....', '.#.###.#.###.#.', '.......#.......', '##.#.#...#.#.##', '.......#.......', '.#.###.#.###.#.', '.....#...#.....', '.#.#.#.#.#.#.#.', '...............', '.#.#.#.#.#.#.#.', '#...#.....#...#'],
  small: ['....#', '.#.#.', '.....', '.#.#.', '#....']
};
CC.reg({ id: 'crossword', ch: 4, name: 'Crossword cipher', kind: 'cipher', object: 'crossword',
  keys: [{ id: 'grid', label: 'Crossword', type: 'select', def: 'daily', options: [['daily', '15 x 15 crossword'], ['small', '5 x 5 mini crossword']] }, { id: 'pad', label: 'Empty squares', type: 'select', def: 'random', options: [['x', 'Fill with X'], ['random', 'Fill with random letters']] }],
  about: 'Write the message row by row into the white squares of an agreed crossword, fill the rest, then read the white squares column by column.',
  cells: function (rows) { var R = rows.length, C = rows[0].length, w = [], byCol = []; for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (rows[r][c] !== '#') w.push(r * C + c); for (c = 0; c < C; c++) for (r = 0; r < R; r++) if (rows[r][c] !== '#') byCol.push(r * C + c); return { rowOrder: w, colOrder: byCol }; },
  enc: function (s, k) {
    var rows = CC.crosswords[k.grid] || CC.crosswords.daily, cl = this.cells(rows), n = cl.rowOrder.length, t = CC.letters(s), out = '';
    while (t.length % n) t += padChars(1, k.pad || 'random');
    for (var b = 0; b < t.length; b += n) { var g = {}; cl.rowOrder.forEach(function (cell, i) { g[cell] = t[b + i]; }); cl.colOrder.forEach(function (cell) { out += g[cell]; }); }
    return out;
  },
  dec: function (s, k) {
    var rows = CC.crosswords[k.grid] || CC.crosswords.daily, cl = this.cells(rows), n = cl.rowOrder.length, t = CC.letters(s), out = '';
    for (var b = 0; b < t.length; b += n) { var g = {}; cl.colOrder.forEach(function (cell, i) { g[cell] = t[b + i] || ''; }); cl.rowOrder.forEach(function (cell) { out += g[cell]; }); }
    return out;
  },
  sample: 'The package will be left under the third bench in the park on Tuesday'
});

/* =====================================================================
   Chapter 5 - fractionation
   ===================================================================== */
CC.reg({ id: 'bifid', ch: 5, name: 'Bifid', kind: 'cipher', object: 'bifid',
  keys: [{ id: 'key', label: 'Square keyword or full 25-letter square', type: 'text', def: 'AQUXZFBRVYKGCSWNLHDTPOMIE' }, { id: 'period', label: 'Block length (0 = whole message)', type: 'number', def: 0, min: 0, max: 50 }],
  about: 'Each letter becomes a row and a column number. Write all the rows, then all the columns, and read the digits back in pairs.',
  enc: function (s, k) {
    var sq = CC.square(k.key, 5), t = CC.letters(s).replace(/J/g, 'I'), per = +k.period || t.length, o = '';
    for (var b = 0; b < t.length; b += per) {
      var blk = t.slice(b, b + per), rs = [], cs = [];
      blk.split('').forEach(function (c) { var i = sq.indexOf(c); rs.push(Math.floor(i / 5)); cs.push(i % 5); });
      var all = rs.concat(cs); for (var i = 0; i < all.length; i += 2) o += sq[all[i] * 5 + all[i + 1]];
    }
    return o;
  },
  dec: function (s, k) {
    var sq = CC.square(k.key, 5), t = CC.letters(s).replace(/J/g, 'I'), per = +k.period || t.length, o = '';
    for (var b = 0; b < t.length; b += per) {
      var blk = t.slice(b, b + per), d = [];
      blk.split('').forEach(function (c) { var i = sq.indexOf(c); d.push(Math.floor(i / 5), i % 5); });
      var n = blk.length; for (var i = 0; i < n; i++) o += sq[d[i] * 5 + d[n + i]];
    }
    return o;
  },
  vectors: [{ k: { key: 'AQUXZFBRVYKGCSWNLHDTPOMIE', period: 0 }, p: 'SUPPLY DROP AT MIDNIGHT', c: 'KELLEXEDMDHAYHFZSNLW', src: 'book' }],
  sample: 'Supply drop at midnight'
});
CC.trifidKey = function (key) { return CC.keyAlpha(key, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ+'); };
CC.reg({ id: 'trifid', ch: 5, name: 'Trifid', kind: 'cipher', object: 'trifid',
  keys: [{ id: 'key', label: 'Keyword phrase', type: 'text', def: 'MY SECRET TRIFID KEY' }, { id: 'period', label: 'Block length', type: 'number', def: 5, min: 1, max: 50 }],
  about: 'Bifid in three dimensions: 27 symbols in a 3 x 3 x 3 cube, each named by layer, row and column.',
  enc: function (s, k) {
    var sq = CC.trifidKey(k.key), t = String(s).toUpperCase().replace(/[^A-Z+]/g, ''), per = +k.period || 5, o = '';
    for (var b = 0; b < t.length; b += per) {
      var blk = t.slice(b, b + per), L = [], R = [], C = [];
      blk.split('').forEach(function (c) { var i = sq.indexOf(c); L.push(Math.floor(i / 9)); R.push(Math.floor(i / 3) % 3); C.push(i % 3); });
      var d = L.concat(R, C); for (var i = 0; i < d.length; i += 3) o += sq[d[i] * 9 + d[i + 1] * 3 + d[i + 2]];
    }
    return o;
  },
  dec: function (s, k) {
    var sq = CC.trifidKey(k.key), t = String(s).toUpperCase().replace(/[^A-Z+]/g, ''), per = +k.period || 5, o = '';
    for (var b = 0; b < t.length; b += per) {
      var blk = t.slice(b, b + per), d = [], n = blk.length;
      blk.split('').forEach(function (c) { var i = sq.indexOf(c); d.push(Math.floor(i / 9), Math.floor(i / 3) % 3, i % 3); });
      for (var i = 0; i < n; i++) o += sq[d[i] * 9 + d[n + i] * 3 + d[2 * n + i]];
    }
    return o;
  },
  vectors: [{ k: { key: 'MY SECRET TRIFID KEY', period: 5 }, p: 'REINFORCEMENTS NEEDED URGENTLY', c: 'MKNXNOMGSDECXQFYCKMMPCGQAEXC', src: 'book' }],
  sample: 'Reinforcements needed urgently'
});

/* =====================================================================
   Chapter 6 - polygraphic
   ===================================================================== */
CC.bigrams = function (s, opt) {
  var t = CC.letters(s).replace(/J/g, 'I'), out = [], filler = (opt && opt.filler) || 'X';
  if (opt && opt.splitDoubles) {
    var i = 0;
    while (i < t.length) {
      var a = t[i], b = t[i + 1];
      if (b === undefined) { out.push(a + (a === filler ? 'Q' : filler)); i++; }
      else if (a === b) { out.push(a + (a === filler ? 'Q' : filler)); i++; if (opt.splitDoubles === 'both') { out.push(b + (b === filler ? 'Q' : filler)); i++; } }
      else { out.push(a + b); i += 2; }
    }
  } else { if (t.length % 2) t += filler; for (var j = 0; j < t.length; j += 2) out.push(t.slice(j, j + 2)); }
  return out;
};
CC.reg({ id: 'playfair', ch: 6, name: 'Playfair', kind: 'cipher', object: 'playfair',
  keys: [{ id: 'key', label: 'Keyword', type: 'text', def: 'SECRET' }, { id: 'filler', label: 'Filler letter', type: 'text', def: 'X' },
         { id: 'doubles', label: 'Double letters', type: 'select', def: 'standard', options: [['standard', 'Put X between them (FLEE: FL EX EN ...)'], ['book', 'Pad each one (FLEE: FL EX EX ..., as in the book\'s example)']] }],
  about: 'Pairs of letters on a 5 x 5 square. Same row: take the letters to the right. Same column: take the letters below. Otherwise: the other two corners of their rectangle.',
  pair: function (sq, p, dir) {
    var a = sq.indexOf(p[0]), b = sq.indexOf(p[1]), ra = Math.floor(a / 5), ca = a % 5, rb = Math.floor(b / 5), cb = b % 5;
    if (ra === rb) return sq[ra * 5 + mod(ca + dir, 5)] + sq[rb * 5 + mod(cb + dir, 5)];
    if (ca === cb) return sq[mod(ra + dir, 5) * 5 + ca] + sq[mod(rb + dir, 5) * 5 + cb];
    return sq[ra * 5 + cb] + sq[rb * 5 + ca];
  },
  enc: function (s, k) { var sq = CC.square(k.key, 5), self = this; return CC.bigrams(s, { splitDoubles: k.doubles === 'book' ? 'both' : true, filler: CC.letters(k.filler || 'X')[0] || 'X' }).map(function (p) { return self.pair(sq, p, 1); }).join(''); },
  dec: function (s, k) { var sq = CC.square(k.key, 5), self = this; return CC.bigrams(s).map(function (p) { return self.pair(sq, p, -1); }).join(''); },
  vectors: [{ k: { key: 'SECRET', doubles: 'book' }, p: 'UNSAFE FLEE NOW', c: 'NOAHBRLQCWCWOPXY', src: 'book' },
            { k: { key: 'PLAYFAIR EXAMPLE' }, p: 'HIDE THE GOLD IN THE TREE STUMP', c: 'BMODZBXDNABEKUDMUIXMMOUVIF' }],
  sample: 'Unsafe flee now'
});
CC.reg({ id: 'twosquare', ch: 6, name: 'Two-square (double Playfair)', kind: 'cipher', object: 'twosquare',
  keys: [{ id: 'key', label: 'First square keyword', type: 'text', def: 'SECRET' }, { id: 'key2', label: 'Second square keyword', type: 'text', def: 'CRYPTOGRAM' },
         { id: 'layout', label: 'Layout', type: 'select', def: 'h', options: [['h', 'Side by side (horizontal)'], ['v', 'One above the other (vertical)']] }],
  about: 'Two keyed squares. The first letter is found in one, the second in the other, and the opposite corners of their rectangle give the cipher pair.',
  pair: function (A, B, p, v, dec) {
    var a = (dec && !v ? B : A).indexOf(p[0]), b = (dec && !v ? A : B).indexOf(p[1]);
    var r1 = Math.floor(a / 5), c1 = a % 5, r2 = Math.floor(b / 5), c2 = b % 5;
    if (!v) return dec ? A[r1 * 5 + c2] + B[r2 * 5 + c1] : B[r1 * 5 + c2] + A[r2 * 5 + c1];
    if (c1 === c2) return p[0] + p[1];   /* standard rule: same column, pair unchanged (the book swaps them, which cannot always be undone) */
    return A[r1 * 5 + c2] + B[r2 * 5 + c1];
  },
  enc: function (s, k) { var A = CC.square(k.key, 5), B = CC.square(k.key2, 5), v = k.layout === 'v', self = this; return CC.bigrams(s).map(function (p) { return self.pair(A, B, p, v, false); }).join(''); },
  dec: function (s, k) { var A = CC.square(k.key, 5), B = CC.square(k.key2, 5), v = k.layout === 'v', self = this; return CC.bigrams(s).map(function (p) { return self.pair(A, B, p, v, true); }).join(''); },
  vectors: [{ k: { key: 'SECRET', key2: 'CRYPTOGRAM', layout: 'h' }, p: 'UNSAFE FLEE NOW', c: 'NUYAGLGQRJKAXW', src: 'book' },
            { k: { key: 'SECRET', key2: 'CRYPTOGRAM', layout: 'v' }, p: 'UNSAFE FLEE NOW', c: 'PSCOBHBQEENOYV', src: 'book (the book prints ON where the standard rule leaves NO)' }],
  sample: 'Unsafe flee now'
});
CC.reg({ id: 'foursquare', ch: 6, name: 'Four-square', kind: 'cipher', object: 'foursquare',
  keys: [{ id: 'key', label: 'Top-right square keyword', type: 'text', def: 'SECRET' }, { id: 'key2', label: 'Bottom-left square keyword', type: 'text', def: 'CRYPTOGRAM' }],
  about: 'Plain squares top-left and bottom-right, keyed squares top-right and bottom-left. Find the pair in the plain squares and read the other corners from the keyed squares. (The book\'s worked example goes the other way round: its "LANDING AT DAWN" result is what this studio\'s Decipher button gives.)',
  enc: function (s, k) {
    var P = CC.square('', 5), A = CC.square(k.key, 5), B = CC.square(k.key2, 5);
    return CC.bigrams(s).map(function (p) { var a = P.indexOf(p[0]), b = P.indexOf(p[1]); return A[Math.floor(a / 5) * 5 + b % 5] + B[Math.floor(b / 5) * 5 + a % 5]; }).join('');
  },
  dec: function (s, k) {
    var P = CC.square('', 5), A = CC.square(k.key, 5), B = CC.square(k.key2, 5);
    return CC.bigrams(s).map(function (p) { var a = A.indexOf(p[0]), b = B.indexOf(p[1]); return P[Math.floor(a / 5) * 5 + b % 5] + P[Math.floor(b / 5) * 5 + a % 5]; }).join('');
  },
  vectors: [{ k: { key: 'SECRET', key2: 'CRYPTOGRAM' }, dir: 'dec', p: 'NIQLNRHKAPHVTV', c: 'LANDINGATDAWNX', src: 'book (worked in the opposite direction)' }],
  sample: 'Landing at dawn'
});

})(typeof window !== 'undefined' ? window : globalThis);
