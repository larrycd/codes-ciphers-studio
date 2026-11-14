/* Codes & Ciphers Studio - user interface - by Larry Dalton */
(function () {
'use strict';
var CC = window.CC, $ = function (s, r) { return (r || document).querySelector(s); };
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
CC.esc = esc;
$('#ver').innerHTML = 'Version ' + CC.version + ' &middot; ' + CC.list.length + ' codes and ciphers &middot; runs on this computer';

/* ---------- navigation ---------- */
document.querySelectorAll('nav.main button').forEach(function (b) {
  b.onclick = function () { show(b.dataset.v); };
});
function show(v) {
  document.querySelectorAll('nav.main button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === v); });
  document.querySelectorAll('.view').forEach(function (x) { x.classList.toggle('on', x.id === 'v-' + v); });
  if (v === 'break' && !$('#v-break').dataset.done) buildBreaker();
  if (v === 'chal' && !$('#v-chal').dataset.done) buildChallenges();
  if (v === 'test' && !$('#v-test').dataset.done) runSelfTest();
  if (v === 'about' && !$('#v-about').dataset.done) buildAbout();
}
CC.show = show;

/* ---------- data ---------- */
var ready = Promise.all([
  fetch('data/beale.json').then(function (r) { return r.json(); }).then(function (b) { CC.beale = b; CC.book.text = b.doi; }),
  fetch('data/quadgrams.json').then(function (r) { return r.json(); }).then(function (q) { CC.quad = q; }),
  fetch('data/purple14.json').then(function (r) { return r.json(); }).then(function (q) { CC.purple14 = q; })
]).catch(function (e) { console.warn('data', e); });
CC.ready = ready;

/* ---------- cipher list ---------- */
var list = $('#list'), cur = null;
function buildList(filter) {
  list.querySelectorAll('.ch, button').forEach(function (n) { n.remove(); });
  var f = (filter || '').toLowerCase();
  Object.keys(CC.chapters).forEach(function (ch) {
    var items = CC.list.filter(function (d) { return d.ch === +ch && (!f || (d.name + ' ' + d.about + ' ' + d.id).toLowerCase().indexOf(f) >= 0); });
    if (!items.length) return;
    var h = document.createElement('div'); h.className = 'ch'; h.textContent = ch + '. ' + CC.chapters[ch]; list.appendChild(h);
    items.forEach(function (d) {
      var b = document.createElement('button'); b.dataset.id = d.id;
      b.innerHTML = esc(d.name) + (CC.MOVING[d.object] ? '<span class="m">moves</span>' : '');
      if (cur && cur.def.id === d.id) b.classList.add('on');
      b.onclick = function () { open(d.id); }; list.appendChild(b);
    });
  });
}
$('#find').oninput = function () { buildList(this.value); };

/* ---------- one cipher's workbench ---------- */
function keyField(k, val) {
  var id = 'k_' + k.id, h = '<div class="' + (k.type === 'textarea' ? 'wide' : '') + '"><label for="' + id + '">' + esc(k.label) + '</label>';
  if (k.type === 'select') h += '<select id="' + id + '">' + k.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  else if (k.type === 'textarea') h += '<textarea id="' + id + '" style="min-height:60px">' + esc(val) + '</textarea>';
  else h += '<input type="' + (k.type === 'number' ? 'number' : 'text') + '" id="' + id + '" value="' + esc(val) + '"' + (k.min !== undefined ? ' min="' + k.min + '"' : '') + (k.max !== undefined ? ' max="' + k.max + '"' : '') + (k.step ? ' step="' + k.step + '"' : '') + '>';
  return h + '</div>';
}
var saved = {}, groupSize = 0;
try { groupSize = +localStorage.getItem('cc-groups') || 0; } catch (e) { }
/* traditional groups: letters and digits only, in blocks of 3, 4 or 5; left alone for Morse, bits, Base64, symbols and plain text */
function open(id) {
  var d = CC.byId[id]; if (!d) return;
  if (cur && cur.obj && cur.obj.stop) cur.obj.stop();
  var vals = saved[id] || {}; d.keys.forEach(function (k) { if (vals[k.id] === undefined) vals[k.id] = k.def; }); saved[id] = vals;
  var w = $('#work');
  w.innerHTML = '<section><h2>' + esc(d.name) + '</h2><p class="about">' + esc(d.about || '') + '</p>' +
    '<div class="obj" id="objhost"></div>' +
    (d.keys.length ? '<h3>Key</h3><div class="keys">' + d.keys.map(function (k) { return keyField(k, vals[k.id]); }).join('') + '</div>' : '') +
    '<h3>Message</h3><textarea id="inp">' + esc(vals.__input !== undefined ? vals.__input : d.sample || '') + '</textarea>' +
    '<div class="row noprint"><button class="b p" id="enc">' + (d.kind === 'code' ? 'Encode' : d.kind === 'stego' ? 'Hide' : d.kind === 'tool' ? 'Compute' : 'Encipher') + ' &darr;</button>' +
    '<button class="b" id="dec">' + (d.kind === 'code' ? 'Decode' : d.kind === 'stego' ? 'Reveal' : d.kind === 'tool' ? 'Reverse' : 'Decipher') + ' &darr;</button>' +
    '<button class="b" id="swap" title="Move the result up into the message box">&uarr; Use result as message</button>' +
    '<label class="hint">Groups <select id="gsz"><option value="0">off</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label><span class="sp"></span>' +
    '<button class="b" id="copy">Copy result</button></div>' +
    '<h3>Result</h3><div class="out" id="out"></div><div id="msg" class="hint"></div>' +
    '<div id="vec"></div></section>';
  cur = { def: d, vals: vals, last: '' };
  buildList($('#find').value);
  var api = {
    def: d,
    keys: function () { var o = {}; d.keys.forEach(function (k) { var el = $('#k_' + k.id); o[k.id] = el ? el.value : k.def; }); return o; },
    set: function (kid, v) { var el = $('#k_' + kid); if (el) { el.value = v; vals[kid] = v; } refresh(); },
    input: function () { return $('#inp').value; },
    setInput: function (v) { $('#inp').value = v; vals.__input = v; refresh(); },
    output: function () { return cur.last; },
    setOutput: function (v, note) {
      cur.last = v; var g = cur.dir === 'dec' ? { text: v, note: groupSize && v ? 'Deciphered text is not put into groups.' : '' } : CC.groupOut(v, d, groupSize, api.keys());
      cur.shown = g.text; $('#out').textContent = cur.shown; $('#msg').textContent = note || g.note || ''; },
    run: run
  };
  cur.api = api;
  var host = $('#objhost'), maker = CC.OBJ[d.object];
  if (maker) { try { cur.obj = maker(host, api) || {}; } catch (e) { host.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; cur.obj = {}; } }
  else { host.style.display = 'none'; cur.obj = {}; }
  function refresh() { if (cur.obj && cur.obj.refresh) try { cur.obj.refresh(); } catch (e) { console.error(e); } }
  cur.refresh = refresh;
  d.keys.forEach(function (k) { var el = $('#k_' + k.id); el.oninput = el.onchange = function () { vals[k.id] = el.value; refresh(); }; });
  $('#inp').oninput = function () { vals.__input = this.value; refresh(); };
  $('#enc').onclick = function () { run('enc'); };
  $('#dec').onclick = function () { run('dec'); };
  $('#swap').onclick = function () { if (cur.last) api.setInput(cur.shown || cur.last); };
  $('#gsz').value = String(groupSize);
  $('#gsz').onchange = function () { groupSize = +this.value; try { localStorage.setItem('cc-groups', groupSize); } catch (e) { } api.setOutput(cur.last); };
  $('#copy').onclick = function () { navigator.clipboard.writeText(cur.shown || cur.last || '').then(function () { $('#msg').textContent = 'Copied.'; }); };
  showVectors(d);
  refresh();
  window.scrollTo(0, 0);
  location.hash = id;
}
CC.open = open;
async function run(dir) {
  var d = cur.def, api = cur.api;
  try {
    await ready;
    cur.dir = dir;
    d.lastNote = '';
    var r = await d[dir](api.input(), api.keys());
    api.setOutput(r, d.lastNote || (d.random && dir === 'enc' ? 'This cipher makes random choices, so enciphering again gives a different (equally valid) result.' : ''));
    if (cur.obj && cur.obj.ran) cur.obj.ran(dir, r);
  } catch (e) { api.setOutput(''); $('#msg').innerHTML = '<span class="err">' + esc(e.message) + '</span>'; }
}
function showVectors(d) {
  var v = (d.vectors || []).filter(function (x) { return x.src; });
  if (!v.length) return;
  $('#vec').innerHTML = '<div class="note" style="overflow-wrap:anywhere">' + v.map(function (x) {
    return 'Checked against ' + esc(x.src) + ': <b>' + esc(x.p) + '</b> &harr; <b>' + esc(x.c) + '</b>' + (x.note ? ' (' + esc(x.note) + ')' : '');
  }).join('<br>') + '. The Self-test page runs these checks.</div>';
}

/* ---------- codebreaker ---------- */
function buildBreaker() {
  var v = $('#v-break'); v.dataset.done = 1;
  v.innerHTML = '<section><h2>Codebreaker\'s bench</h2><p class="about">Paste a ciphertext. Letter counts, coincidence index and four automatic attacks. Everything is worked out on this computer.</p>' +
    '<textarea id="bt">' + esc(CC.byId.keyword.enc('It was a bright cold day in April and the clocks were striking thirteen. The hallway smelt of boiled cabbage and old rag mats. At one end of it a coloured poster, too large for indoor display, had been tacked to the wall.', { key: 'ORWELL' })) + '</textarea>' +
    '<div class="row"><button class="b p" id="ban">Count letters</button><button class="b" id="bcz">Try all Caesar shifts</button><button class="b" id="bvg">Break Vigen&egrave;re</button><button class="b" id="bsb">Solve substitution</button><button class="b" id="brf">Try all rail fences</button></div></section>' +
    '<div class="grid2"><section><h3>Letter frequencies (dashes: normal English)</h3><div class="bars" id="bbars"></div><div style="height:22px"></div><div id="bstats" class="hint"></div></section>' +
    '<section><h3>Result</h3><div id="bres" class="out" style="min-height:160px"></div></section></div>' +
    '<section><h3>Substitution workbench</h3><p class="hint">Type your guess for each cipher letter; the text updates as you go.</p><div id="bwork"></div><div id="bwtext" class="out" style="margin-top:8px"></div></section>' +
    '<section><h3>Crib dragging</h3><p class="hint">Guess a word that is in the message. Every place it could sit shows the key letters it implies: a real word in the key is a strong clue.</p>' +
    '<div class="row"><input type="text" id="bcrib" value="THE" style="max-width:240px"><button class="b" id="bdrag">Drag the crib</button></div><div id="bdr" class="out" style="max-height:260px;overflow:auto"></div></section>';
  var T = function () { return $('#bt').value; };
  function analyse() {
    var t = CC.letters(T()), c = CC.counts(t), n = t.length || 1, mx = 0, h = '';
    for (var k in c) mx = Math.max(mx, c[k] / n * 100, CC.engFreq[k]);
    CC.AZ.split('').forEach(function (L) { h += '<div style="height:' + (c[L] / n * 100 / mx * 100) + '%" title="' + L + ': ' + c[L] + '"><b style="bottom:' + (CC.engFreq[L] / mx * 100) + '%"></b><i>' + L + '</i></div>'; });
    $('#bbars').innerHTML = h;
    var ioc = CC.ioc(t);
    $('#bstats').innerHTML = n + ' letters &middot; index of coincidence ' + ioc.toFixed(4) + ' (English text about 0.066, random letters about 0.038). ' +
      (ioc > 0.058 ? 'High: probably one alphabet (substitution or transposition).' : ioc < 0.048 ? 'Low: probably several alphabets (Vigen&egrave;re-type) or a machine.' : 'In between.');
    workbench();
  }
  var guess = {};
  function workbench() {
    var t = T().toUpperCase(), used = CC.AZ.split('').filter(function (L) { return t.indexOf(L) >= 0; });
    $('#bwork').innerHTML = '<div class="row">' + used.map(function (L) { return '<label style="text-align:center;font:13px Consolas">' + L + '<br><input type="text" maxlength="1" data-l="' + L + '" value="' + (guess[L] || '') + '" style="width:30px;text-align:center;padding:4px"></label>'; }).join('') + '</div>';
    $('#bwork').querySelectorAll('input').forEach(function (i) { i.oninput = function () { guess[i.dataset.l] = i.value.toUpperCase(); wtext(); }; });
    wtext();
  }
  function wtext() { $('#bwtext').innerHTML = esc(T().toUpperCase()).replace(/[A-Z]/g, function (L) { return guess[L] ? '<span style="color:var(--hi)">' + guess[L].toLowerCase() + '</span>' : '<span style="color:#666">' + L + '</span>'; }); }
  $('#ban').onclick = analyse; $('#bt').oninput = analyse;
  $('#bcz').onclick = async function () { await ready; var r = CC.solveCaesar(T()); $('#bres').innerHTML = r.slice(0, 26).map(function (x, i) { return (i === 0 ? '<b style="color:var(--hi)">' : '') + 'shift ' + ('0' + x.shift).slice(-2) + ': ' + esc(x.text.slice(0, 70)) + (i === 0 ? '</b>' : ''); }).join('\n'); };
  $('#bvg').onclick = async function () { await ready; var ps = CC.kasiskiPeriods(T(), 16); var r = CC.solveVigenere(T()); $('#bres').innerHTML = 'Likely key length ' + r.period + ', key <b style="color:var(--hi)">' + r.key + '</b>\n\n' + esc(r.text) + '\n\nAverage coincidence index for each key length:\n' + ps.map(function (p) { return ('  ' + p.period).slice(-2) + ' ' + Array(Math.round(p.ioc * 400)).join('#') + ' ' + p.ioc.toFixed(3); }).join('\n'); };
  $('#bsb').onclick = async function () {
    await ready; $('#bres').textContent = 'Searching (hill climbing on English four-letter groups)...';
    setTimeout(function () { var r = CC.solveSubstitution(T(), { restarts: 10, iters: 2500, seed: Date.now() % 100000 }); var inv = {}; for (var i = 0; i < 26; i++) inv[r.key[i]] = CC.AZ[i]; guess = inv; workbench();
      $('#bres').innerHTML = 'Best key found (cipher letter for A..Z): <b style="color:var(--hi)">' + r.key + '</b>\n\n' + esc(r.text) + '\n\nShort messages may not come out fully; fix the last letters by hand in the workbench below.'; }, 30);
  };
  $('#brf').onclick = function () { var t = T(), o = ''; for (var r = 2; r <= 10; r++) o += r + ' rails: ' + CC.byId.railfence.dec(t, { rails: r }).slice(0, 80) + '\n'; $('#bres').textContent = o; };
  $('#bdrag').onclick = function () { $('#bdr').textContent = CC.cribDrag(T(), $('#bcrib').value).map(function (x) { return ('   ' + x.at).slice(-4) + '  ' + x.key; }).join('\n'); };
  analyse();
}

/* ---------- famous cryptograms and challenges ---------- */
function buildChallenges() {
  var v = $('#v-chal'); v.dataset.done = 1;
  ready.then(function () {
    var h = '<section><h2>Famous cryptograms you can work here</h2>';
    h += '<div class="card"><h4>Beale cipher no. 2 <span class="status solved">solved in the 1880s</span></h4><p>761 numbers. Each one counts words in the Declaration of Independence; the first letter of that word is the message. Press the button to decode it here with the Declaration itself.</p><div class="row"><button class="b p" id="cbeale">Decode with the Declaration</button><button class="b" id="cbeale2">Show the numbers</button></div><div class="out" id="obeale" style="max-height:260px;overflow:auto"></div></div>';
    h += '<div class="card"><h4>"The Magic Words are Squeamish Ossifrage" <span class="status solved">solved 1994</span></h4><p>In 1977 Martin Gardner\'s column printed a message locked with a 129-digit RSA number and said it would take millions of years to read. In 1994 about 600 volunteers split the number into its two primes. With those primes this studio rebuilds the private key and unlocks the message, live, below.</p><div class="row"><button class="b p" id="crsa">Unlock it</button></div><div class="out" id="orsa"></div></div>';
    h += '<div class="card"><h4>PURPLE: the 14-part message of 7 December 1941 <span class="status solved">read the same day</span></h4><p>Japan\'s reply breaking off talks with the United States went out in 14 parts on PURPLE. American codebreakers, reading it on their rebuilt machines, had it decrypted before the Japanese embassy did. Part 1 is deciphered here, live, on the studio\'s PURPLE with that day\'s settings (switches 9-1,24,6-23).</p><div class="row"><button class="b p" id="cpurple">Decipher part 1</button><button class="b" id="cpurple2">Show the ciphertext</button></div><div class="out" id="opurple" style="max-height:260px;overflow:auto"></div></div>';
    h += '<div class="card"><h4>Kryptos, panel K1 <span class="status solved">solved 1999</span></h4><p>The sculpture by Jim Sanborn at CIA headquarters (1990). Its first panel is a Vigen&egrave;re cipher on a mixed alphabet keyed KRYPTOS, with the keyword PALIMPSEST. It is deciphered here live; the misspelling is Sanborn\'s own and deliberate. Panels K2 and K3 were also solved in 1999; K4 is still open.</p><div class="row"><button class="b p" id="ckryptos">Decipher K1</button></div><div class="out" id="okryptos"></div></div>';
    h += '<div class="card"><h4>Practice cryptograms (made by this studio)</h4><p>Each is real ciphertext from the studio\'s own machines. Try the Codebreaker first; the answers check themselves.</p><div id="cprac"></div></div>';
    h += '</section><section><h2>Still unsolved, or solved only recently</h2><p class="hint">Short notes on the other cryptograms in the book\'s last chapter, as of 2026. Nobody can decipher the unsolved ones, so the studio does not pretend to.</p>' +
      [['Voynich manuscript', 'unsolved', 'A 15th-century illustrated book in an unknown script. Radiocarbon dating puts the vellum around 1404-1438. Many claimed solutions; none accepted.'],
       ['Beale ciphers no. 1 and 3', 'unsolved', 'The location and the names. Number 2\'s key does not work on them; many suspect a hoax.'],
       ['Dorabella cipher', 'unsolved', 'A note of 87 semicircle symbols that Edward Elgar sent to Dora Penny in 1897.'],
       ['D\'Agapeyeff cipher', 'unsolved', 'A challenge printed in his 1939 book; even the author later said he had forgotten how he made it.'],
       ['Rohonc Codex', 'unsolved', 'About 450 pages in an unknown script with Christian illustrations, found in Hungary.'],
       ['Shugborough inscription', 'unsolved', 'The letters O U O S V A V V carved below a copy of a Poussin painting in Staffordshire.'],
       ['Ricky McCormick\'s notes', 'unsolved', 'Two pages found on a murder victim in Missouri in 1999; the FBI asked the public for help.'],
       ['Kryptos', 'partial', 'A sculpture at CIA headquarters (1990). Three of its four panels were solved in 1999 (K1 is deciphered live above); the fourth, K4, is still open despite clues the sculptor released in 2010, 2014 and 2020.'],
       ['Zodiac Killer ciphers', 'partial', 'The 408-symbol cipher (1969) was a homophonic substitution, solved within a week by a schoolteacher and his wife. The 340-symbol cipher resisted for 51 years until David Oranchak, Sam Blake and Jarl Van Eycke solved it in December 2020: a homophonic substitution whose letters had been written out diagonally, with extra steps. Two short ciphers remain unsolved. The studio\'s Homophonic substitution and Codebreaker show the methods.'],
       ['Copiale cipher', 'solved', 'A 105-page German secret-society manuscript, broken by computer in 2011: a homophonic substitution with nulls.'],
       ['Babington plot ciphers', 'solved', 'Mary, Queen of Scots\' nomenclator letters were read by Walsingham\'s codebreaker Thomas Phelippes in 1586 (see the Nomenclator in this studio).'],
       ['Zimmermann telegram', 'solved', 'A 1917 German codebook message read by Britain\'s Room 40; it helped bring the USA into the First World War.'],
       ['The Gold-Bug', 'solved', 'Edgar Allan Poe\'s 1843 story about breaking a substitution cipher by letter counting - which the Codebreaker page does.'],
       ['Olivier Levasseur\'s cryptogram', 'unsolved', 'A pirate\'s supposed treasure cipher from 1730; its origin is doubtful.'],
       ['Smithy code', 'solved', 'A judge hid a message in his 2006 Da Vinci Code ruling; it was solved within weeks.']
      ].map(function (x) { return '<div class="card"><h4>' + esc(x[0]) + ' <span class="status ' + x[1] + '">' + (x[1] === 'partial' ? 'partly solved' : x[1]) + '</span></h4>' + esc(x[2]) + '</div>'; }).join('') + '</section>';
    v.innerHTML = h;
    $('#cbeale').onclick = function () {
      var w = CC.bookWords(CC.beale.doi), out = CC.beale.beale2.map(function (n) { var x = w[n - 1]; return x ? x[0].toLowerCase() : '?'; }).join('');
      $('#obeale').innerHTML = '<b>Decoded here:</b>\n' + esc(out) + '\n\n<b>Accepted reading:</b>\n' + esc(CC.beale.solution) + '\n\n<span class="hint">The decoded letters agree with the accepted reading about 80% of the way, in order. The rest is Beale\'s own miscounting of the Declaration\'s words, which is well known. Data: ' + esc(CC.beale.source) + '</span>';
    };
    $('#cbeale2').onclick = function () { $('#obeale').textContent = CC.beale.beale2.join(', '); };
    $('#cpurple').onclick = function () {
      var P = CC.purple14, got = CC.byId.purple.dec(P.ct, P.key), same = 0;
      for (var i = 0; i < got.length; i++) if (got[i] === P.pt[i]) same++;
      $('#opurple').innerHTML = '<b>Deciphered here:</b>\n' + esc(got) + '\n\n<span class="hint">' + same + ' of ' + P.pt.length + ' letters agree with the published decrypt (dashes are letters garbled in transmission). The opening is Japanese telegraphese; then the English text begins: MEMORANDUM ... THE GOVERNMENT OF JAPAN, PROMPTED BY A GENUINE DESIRE TO COME TO AN AMICABLE UNDERSTANDING WITH THE GOVERNMENT OF THE UNITED STATES ... Source: ' + esc(P.source) + '</span>';
    };
    $('#cpurple2').onclick = function () { $('#opurple').textContent = CC.purple14.ct; };
    $('#ckryptos').onclick = function () {
      var ct = 'EMUFPHZLRFAXYUSDJKZLDKRNSHGNFIVJYQTQUXQBQVYUVLLTREVJYQTMKYRDMFD', A = CC.keyAlpha('KRYPTOS'), key = 'PALIMPSEST', pt = '';
      for (var i = 0; i < ct.length; i++) pt += A[CC.mod(A.indexOf(ct[i]) - A.indexOf(key[i % key.length]), 26)];
      $('#okryptos').innerHTML = 'Ciphertext: ' + esc(ct) + '\nAlphabet:   ' + esc(A) + '  (keyword KRYPTOS)\nKey:        PALIMPSEST\n\n<b style="color:var(--hi);font-size:18px">' + esc(pt) + '</b>\n<span class="hint">BETWEEN SUBTLE SHADING AND THE ABSENCE OF LIGHT LIES THE NUANCE OF IQLUSION</span>';
    };
    $('#crsa').onclick = function () {
      var R = CC.rsa129; $('#orsa').innerHTML = 'n = ' + R.n + '\n  = ' + R.p + '\n  &times; ' + R.q + '\ne = ' + R.e + '\nciphertext = ' + R.c + '\n\nDecoded (00 = space, 01 = A ... 26 = Z):\n<b style="color:var(--hi);font-size:20px">' + esc(CC.rsa129Solve()) + '</b>';
    };
    var prac = [
      ['Caesar', 'caesar', { shift: 7 }, 'The die is cast and the river is crossed'],
      ['Atbash', 'atbash', {}, 'Wisdom begins in wonder'],
      ['Rail fence (3 rails)', 'railfence', { rails: 3 }, 'All roads lead to Rome'],
      ['Keyword substitution', 'keyword', { key: 'LIGHTHOUSE' }, 'The keeper lit the lamp at dusk every night of the year for forty years and never once missed'],
      ['Vigenère', 'vigenere', { key: 'ANZAC' }, 'Lest we forget the men and women who served in all wars and conflicts'],
      ['Playfair', 'playfair', { key: 'KANGAROO' }, 'Meet me at the bridge after dark'],
      ['Enigma (I II III, rings AAA, start QWE, plugs AB CD)', 'enigma', { model: 'M3', rotors: 'I II III', reflector: 'B', rings: 'AAA', pos: 'QWE', plugboard: 'AB CD' }, 'Weather report clear skies over the channel']
    ];
    $('#cprac').innerHTML = prac.map(function (p, i) {
      var d = CC.byId[p[1]], k = {}; d.keys.forEach(function (x) { k[x.id] = x.def; }); Object.assign(k, p[2]);
      var c = d.enc(p[3], k), ans = CC.letters(p[3]);
      return '<div style="margin:8px 0"><b>' + (i + 1) + '. ' + esc(p[0]) + '</b><div class="out" style="font-size:15px">' + esc(CC.group(CC.letters(c))) + '</div><div class="row"><input type="text" id="pa' + i + '" placeholder="Your answer" style="max-width:420px"><button class="b" data-i="' + i + '">Check</button><button class="b" data-o="' + i + '" data-c="' + esc(c) + '" data-id="' + p[1] + '" data-k="' + esc(JSON.stringify(p[2])) + '">Open in the workbench</button><span id="pr' + i + '"></span></div></div>';
    }).join('');
    v.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i, ok = CC.letters($('#pa' + i).value).replace(/X/g, '') === CC.letters(prac[i][3]).replace(/X/g, ''); $('#pr' + i).innerHTML = ok ? '<span class="badge ok">Correct</span>' : '<span class="badge bad">Not yet</span>'; }; });
    v.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { show('lib'); open(b.dataset.id); var k = JSON.parse(b.dataset.k); for (var x in k) cur.api.set(x, k[x]); cur.api.setInput(b.dataset.c); }; });
  });
}

/* ---------- self-test ---------- */
async function runSelfTest() {
  var v = $('#v-test'); v.dataset.done = 1; v.innerHTML = '<section><h2>Self-test</h2><p class="hint">Running every published example and a full round trip through every cipher...</p></section>';
  await ready;
  var rows = [], pass = 0, fail = 0;
  var norm = function (s) { return String(s).toUpperCase().replace(/J/g, 'I').replace(/[^A-Z0-9+֐-׿]/g, ''); };
  function add(name, ok, info) { ok ? pass++ : fail++; rows.push('<tr><td>' + (ok ? '<span class="badge ok">pass</span>' : '<span class="badge bad">FAIL</span>') + '</td><td>' + esc(name) + '</td><td class="hint">' + esc(info || '') + '</td></tr>'); }
  for (var i = 0; i < CC.list.length; i++) {
    var d = CC.list[i], def = {}; d.keys.forEach(function (k) { def[k.id] = k.def; });
    for (var j = 0; j < (d.vectors || []).length; j++) {
      var x = d.vectors[j], k = Object.assign({}, def, x.k), raw = /ascii|polybius|tapcode|morse|baudot|ita2|hash|bacon|braille/.test(d.id), nx = /playfair|square/.test(d.id) ? function (s) { return norm(s).replace(/X/g, ''); } : norm;
      try {
        if (x.dir !== 'dec') { var c = await d.enc(x.p, k); add(d.name + ': example ' + (x.src ? 'from the ' + x.src : x.p), raw ? String(c).trim() === x.c : norm(c) === norm(x.c), 'got ' + String(c).slice(0, 60)); }
        if (x.dir !== 'enc') { var p = await d.dec(x.c, k); add(d.name + ': reverse ' + (x.src ? 'of the ' + x.src : 'example'), nx(p) === nx(x.p), 'got ' + String(p).slice(0, 60)); }
      } catch (e) { add(d.name, false, e.message); }
    }
  }
  var t = CC.randLetters(200);
  add('Enigma: a letter is never enciphered as itself (200 random letters)', CC.byId.enigma.enc(t, { model: 'M3', rotors: 'III I II', reflector: 'C', rings: 'XYZ', pos: 'ABC', plugboard: 'AB CD' }).split('').every(function (c, i) { return c !== t[i]; }));
  var e = new CC.Enigma({ rotors: ['I', 'II', 'III'], pos: 'ADU' }); var ps = ['A', 'A', 'A', 'A'].map(function (c) { return e.press(c).pos; }).join(' ');
  add('Enigma: middle-rotor double step (ADU to ADV AEW BFX BFY)', ps === 'ADV AEW BFX BFY', ps);
  add('M-209: the same setting deciphers', CC.m209Run(CC.byId.m209.enc('ATTACK AT DAWN', {}), {}) === 'ATTACKZATZDAWN');
  var lz = CC.byId.lorenz, lk = { start: '5 9 2 7 1 3 3 8 9 4 11 12', seed: 77 }; add('Lorenz: the same setting deciphers', lz.dec(lz.enc('ROUND TRIP 42', lk), lk) === 'ROUND TRIP 42');
  add('RSA-129: the 1994 factors rebuild the key and read the 1977 message', CC.rsa129Solve() === 'THE MAGIC WORDS ARE SQUEAMISH OSSIFRAGE');
  var kp = CC.rsaGenerate(256), rk = { n: kp.n.toString(), e: '65537', d: kp.d.toString() }; add('RSA: new 256-bit key pair locks and unlocks', CC.byId.rsa.dec(CC.byId.rsa.enc('test', rk), rk) === 'test');
  var aes = await CC.byId.aes.enc('Top secret', { pass: 'pw' }); add('AES-256: password unlocks', (await CC.byId.aes.dec(aes, { pass: 'pw' })) === 'Top secret');
  var wrong = false; try { await CC.byId.aes.dec(aes, { pass: 'nope' }); } catch (er) { wrong = true; } add('AES-256: wrong password is refused', wrong);
  var sp = await CC.signPair(), sg = await CC.sign(sp.privateKey, 'pay 10'); add('Signature: genuine message verifies, altered one fails', (await CC.verify(sp.publicKey, 'pay 10', sg)) && !(await CC.verify(sp.publicKey, 'pay 90', sg)));
  var px = new Uint8ClampedArray(40 * 40 * 4).map(function (_, i) { return (i * 37) & 255; }); CC.stegoEmbed(px, new TextEncoder().encode('hidden'), 1);
  add('Picture: hides and gives back a message', new TextDecoder().decode(CC.stegoExtract(px, 1)) === 'hidden');
  var hf = CC.heath.faces, hok = true, hn = 0; hf[0].forEach(function (a) { hf[1].forEach(function (b) { hf[2].forEach(function (c) { hf[3].forEach(function (d4) { hf[4].forEach(function (e5) { var t = CC.heathTotal([a, b, c, d4, e5]); hn++; if (t.quick !== t.real) hok = false; }); }); }); }); });
  add('Heath\'s dice: the quick rule gives the true total for all ' + hn + ' rolls', hok);
  var jm = 'We hold these truths to be self evident that all men are created equal', jk = { key: 'MONTICELLO', row: 11 }, jc = CC.byId.jefferson.enc(jm, jk);
  add('Jefferson wheel: the readable row is found without being told', CC.byId.jefferson.dec(jc, { key: 'MONTICELLO', row: 0 }) === CC.letters(jm));
  add('Mexican Army and Janelle wheels: random numbers read back', CC.byId.mexican.dec(CC.byId.mexican.enc('Viva Mexico', { key: 'SOL' + 'O' }), { key: 'SOLO' }) === 'VIVAMEXICO' && CC.byId.janelle.dec(CC.byId.janelle.enc('Room 12@noon', { key: '145 88 67 30' }), { key: '145 88 67 30' }) === 'ROOM 12@NOON');
  (CC.extraChecks || []).forEach(function (c) { var ok = false; try { ok = c.fn(); } catch (e) { } add(c.name, ok); });
  add('PURPLE: the 14-part message, part 1, deciphers as published', (function () { var P = CC.purple14; if (!P) return false; var g = CC.byId.purple.dec(P.ct, P.key); return g === P.pt; })());
  add('Codebreaker: finds a Caesar shift', CC.solveCaesar(CC.shift('it was the best of times it was the worst of times', 11))[0].shift === 11);
  add('Codebreaker: finds a Vigenere key', CC.solveVigenere(CC.byId.vigenere.enc('We hold these truths to be self evident that all men are created equal that they are endowed by their creator with certain unalienable rights that among these are life liberty and the pursuit of happiness', { key: 'LIBERTY' })).key === 'LIBERTY');
  v.innerHTML = '<section><h2>Self-test</h2><p>' + (fail ? '<span class="badge bad">' + fail + ' failed</span> ' : '<span class="badge ok">All passed</span> ') + pass + ' checks passed. Examples marked "from the book" are the worked examples printed in Tanna\'s book; the others are standard published examples.</p><table>' + rows.join('') + '</table><div class="row"><button class="b" id="rerun">Run again</button></div></section>';
  $('#rerun').onclick = runSelfTest;
  CC.selfTest = { pass: pass, fail: fail };
}

/* ---------- about ---------- */
function buildAbout() {
  var v = $('#v-about'); v.dataset.done = 1;
  var byKind = {}; CC.list.forEach(function (d) { byKind[d.kind] = (byKind[d.kind] || 0) + 1; });
  v.innerHTML = '<section><h2>About</h2><p>Codes &amp; Ciphers Studio ' + CC.version + ' by Larry Dalton. ' + CC.list.length + ' working codes, ciphers and hiding methods (' + (byKind.cipher || 0) + ' ciphers, ' + (byKind.code || 0) + ' codes, ' + (byKind.stego || 0) + ' ways of hiding messages, ' + (byKind.tool || 0) + ' tool' + (byKind.tool === 1 ? '' : 's') + '), following the chapters of Sunil Tanna\'s book <i>Codes, Ciphers, Steganography &amp; Secret Messages</i> (2020), plus chapters added in version 1.1 (cipher wheels and devices) and 1.2 (spy ciphers and cipher machines; stream ciphers in your pocket), with ADFGVX, Hill, affine and Diffie-Hellman added to the book\'s chapters, and in version 1.3 the Kama Sutra, AMSCO, Fractionated Morse, Porta, Gronsfeld, Quagmire III, DES, ElGamal, Nihilist, Hebern and ChaCha20 ciphers. The explanations and drawings are the studio\'s own; nothing is copied from the book.</p>' +
    '<h3>Honest notes</h3><ul>' +
    '<li>Where the book prints a worked example, the studio checks itself against it (see Self-test). Three book examples disagree with the standard rules, and the studio follows the rules: the Autokey example prints the Vigen&egrave;re result with an extra letter; the vertical Two-square example swaps a same-column pair, which cannot always be undone; the Four-square example runs the squares in the opposite direction (the studio\'s Decipher reproduces it).</li>' +
    '<li>Chappe\'s telegraph really sent numbers that pointed into a codebook. The studio gives each letter its own arm position so you can watch it move; that letter table is the studio\'s, not Chappe\'s.</li>' +
    '<li>The M-209 follows the published mechanism (pin wheels of 26, 25, 23, 21, 19 and 17, 27 lug bars, ciphertext = 25 + shift &minus; plaintext). The pin and lug settings are examples made for the studio; it has not been checked against a real machine\'s output.</li>' +
    '<li>The Lorenz wheel sizes and stepping are the real SZ42 ones; the pin patterns are examples.</li>' +
    '<li>Enigma uses the historical rotor and reflector wirings and is checked against a 1941 message.</li>' +
    '<li>AES, signatures and hashes are the browser\'s own Web Crypto: real, strong cryptography. The RSA page is the real algorithm without padding, for learning.</li>' +
    '<li>Chapter 14 (version 1.1): ADFGVX, Hill, Chaocipher and Solitaire are checked against their published test examples, and the Mexican Army wheel against dCode\'s example. The Janelle cipher, the Enigma slide and Heath\'s dice are wooden products by Creative Crafthouse: the Janelle rings follow the maker\'s description (40 characters, four rings of 40, 2,560,000 settings); the maker does not publish how the slide is used, so its method here is the studio\'s reading of the rows; Heath\'s dice follow his 1927 rule with face numbers made for the studio.</li>' +
    '<li>The letter tables on the rune, Tengwar, hieroglyph, Ogham and Theban wheels give each English letter one sign, as cipher wheels do. Real runes, Tengwar and hieroglyphs were written by sound, so these are ciphers in those scripts, not translations into them. Jefferson\'s own disk alphabets are lost; the cylinder uses the US Army M-94\'s 25 disks.</li>' +
    '<li>Version 1.2: PURPLE uses the wiring published in "PURPLE Revealed" (2003) and deciphers part 1 of the 7 December 1941 message exactly. A5/1 reproduces the 1999 reference implementation\'s test frame; Salsa20 and Trivium reproduce eSTREAM test vectors; RC4, the straddling checkerboard, affine and Diffie-Hellman reproduce Wikipedia\'s examples; Crypto-1 agrees with the Proxmark3 crapto1 library. The VIC key derivation reproduces the published example line by line (A to S); no complete published VIC message with all its keys was available, and the triangular second transposition follows the general description, so whole VIC messages are checked by round trips. SIGABA follows the published mechanism, but its real rotor wirings were never made public, so its wirings are examples made for the studio.</li>' +
    '<li>Version 1.3: DES reproduces the classic worked example round by round and ChaCha20 the RFC 8439 examples; both also agreed with the PyCryptodome library on 400 random keys and messages when they were built. AMSCO reproduces the American Cryptogram Association\'s example; Porta the published FORTIFICATION example; Nihilist and Quagmire III (Kryptos K1) Wikipedia\'s and Sanborn\'s; Fractionated Morse a published open-source example; ElGamal the worked example in the Handbook of Applied Cryptography. The Kama Sutra cipher is the pairing method from Yashodhara\'s commentary; the Kama Sutra itself does not say how the letters are paired, so the keyword pairing is the studio\'s. Every Hebern rotor was wired differently and no wiring is published as standard, so the rotor wiring is an example. DES here enciphers each block on its own (ECB), and ElGamal has no padding: teaching versions of the real algorithms.</li></ul>' +
    '<h3>Data</h3><ul><li>Beale cipher 2, its solution and the Declaration of Independence: transcription by John Burkardt (people.math.sc.edu, LGPL).</li><li>Fonts (in the fonts folder, licences in the licenses folder): runes from Noto Sans Runic and Ogham from Noto Sans Ogham (The Noto Project Authors), Tengwar from Alcarin Tengwar (Toshi Omagari), hieroglyphs from NewGardiner (Mark-Jan Nederhof), all SIL Open Font License, cut down to the signs the wheels use and renamed as the licence requires; Theban from public-domain outlines on Wikimedia Commons.</li><li>M-94 disk alphabets: the M-94 identification matrix (George Mace) as published at jproc.ca.</li><li>PURPLE switch wiring and the 1941 message: Freeman, Sullivan and Weierud, "PURPLE Revealed" (Cryptologia, 2003), as published in Brian Neal\'s purple simulator (MIT licence).</li><li>English four-letter group scores for the codebreaker: counted from Shakespeare (public domain) and the Declaration.</li></ul>' +
    '<h3>Everything stays here</h3><p class="hint">The studio runs on this computer at http://localhost:8771/. Nothing you type is sent anywhere.</p></section>';
}

/* ---------- start ---------- */
buildList('');
open(CC.byId[(location.hash || '').slice(1)] ? location.hash.slice(1) : 'caesar');
})();
