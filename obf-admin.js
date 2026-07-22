const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

const OBF = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.7,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

const file = 'admin.html';
let html = fs.readFileSync(file, 'utf8');

// Extract inline script (first <script> block that is NOT src=)
const scriptRegex = /<script>([\s\S]*?)<\/script>/;
const match = html.match(scriptRegex);
if (!match) { console.error('No inline script found'); process.exit(1); }

const rawJS = match[1];
console.log('Original JS length:', rawJS.length, 'bytes');

const result = JavaScriptObfuscator.obfuscate(rawJS, OBF);
const obfJS = result.getObfuscatedCode();
console.log('Obfuscated JS length:', obfJS.length, 'bytes');

html = html.replace(scriptRegex, '<script>' + obfJS + '</script>');
fs.writeFileSync(file, html, 'utf8');
console.log('admin.html obfuscated successfully');
