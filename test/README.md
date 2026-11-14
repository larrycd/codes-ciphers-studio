# Tests

- `node test/vectors.js`: every published test vector and a round trip through every cipher (engine only).
- `node test/exhaustive.js`: every code and cipher x 10 messages x every key option x groups off/3/4/5 (26,008 round trips).
- Browser tests (serve `src/app` on port 8771 first; Playwright):
  - `ui.js`: opens every cipher, steps its model, enciphers and deciphers, runs the Self-test page.
  - `ui-exhaustive.js`: the buttons, groups, Use result, Decipher, full Play of every model, page width (834 checks).
  - `play-matches.js`, `tabula.js`: what the models highlight agrees with the enciphered letters.
  - `groups.js`, `width.js`: grouping round trips; no page wider than the window.
  - `selftest-run.js`: runs the Self-test page in the browser and reports passes and failures (143 checks).
