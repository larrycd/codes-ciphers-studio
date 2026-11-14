# How it works

- `src/server.ps1` is a small Windows PowerShell web server on port 8771 that serves `src/app`.
- `src/app/js/core.js`, `trans.js`, `poly.js`, `misc.js`, `devices.js` (1.1), `devices2.js` (1.2) and `devices3.js` (1.3) are the engine: every code and cipher is one `CC.reg({...})`
  entry with its key fields, `enc`, `dec`, a sample and test vectors.
- `src/app/js/objects.js` to `objects5.js` draw the working models (SVG) and step through each letter.
- `src/app/js/ui.js` is the page: cipher list, workbench, codebreaker, famous cryptograms, self-test, about.
- `installer/Install.ps1` installs per user, verifies every file over HTTP and rolls back on failure;
  `installer/ciphers.nsi` builds the setup program with NSIS.
- `src/app/fonts` holds five small script fonts (runes, Ogham, Tengwar, hieroglyphs, Theban) for the alphabet wheels;
  the installer checks each one is served as a real font.
