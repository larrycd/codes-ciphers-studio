// Loads the studio engine into Node the same way the browser does (script files in order).
const fs = require('fs'), path = require('path'), vm = require('vm');
const APP = fs.existsSync(path.join(__dirname, '..', 'app')) ? path.join(__dirname, '..', 'app') : path.join(__dirname, '..', 'src', 'app');
module.exports = function () {
  for (const f of ['core.js', 'trans.js', 'poly.js', 'misc.js', 'devices.js', 'devices2.js', 'devices3.js']) vm.runInThisContext(fs.readFileSync(path.join(APP, 'js', f), 'utf8'), { filename: f });
  const CC = globalThis.CC;
  const b = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'beale.json'), 'utf8'));
  CC.book.text = b.doi; CC.beale = b;
  CC.quad = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'quadgrams.json'), 'utf8'));
  return CC;
};
