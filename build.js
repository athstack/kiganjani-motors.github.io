const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');

// Short content hash used to cache-bust the generated JS files
function jsVersion(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 10);
}

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src-html');
const HTML_FILES = [
  'index.html','about.html','rental.html','services.html',
  'booking.html','finance.html','reviews.html','blog.html',
  'parts.html','support.html','admin.html'
];

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

// Step 1: Minify CSS
console.log('Step 1: Minifying CSS...');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const cssMin = new CleanCSS({level:2}).minify(css);
fs.writeFileSync(path.join(ROOT, 'style.min.css'), cssMin.styles);
console.log('  style.min.css (' + cssMin.styles.length + ' bytes)');

// Step 2: Obfuscate common sidebar JS
console.log('Step 2: Obfuscating common.js...');
const commonJS = fs.readFileSync(path.join(ROOT, 'src', 'common.js'), 'utf8');
const commonObf = JavaScriptObfuscator.obfuscate(commonJS, OBF).getObfuscatedCode();
fs.writeFileSync(path.join(ROOT, 'common.min.js'), commonObf);
const commonSrc = 'common.min.js?v=' + jsVersion(path.join(ROOT, 'common.min.js'));
console.log('  common.min.js (' + commonObf.length + ' bytes)');

// Step 3: Process each HTML
console.log('Step 3: Processing HTML files...');
HTML_FILES.forEach(function(file) {
  let html = fs.readFileSync(path.join(SRC, file), 'utf8');

  var isAdmin = (file === 'admin.html');

  // Extract inline <script>...</script> content
  const re = /<script>\s*([\s\S]*?)\s*<\/script>/;
  const m = html.match(re);
  if (m) {
    let js = m[1].trim();
    if (js.length > 10) {
      const obf = JavaScriptObfuscator.obfuscate(js, OBF).getObfuscatedCode();
      const jsFile = file.replace('.html', '.min.js');
      const jsPath = path.join(ROOT, 'dist', jsFile);
      fs.writeFileSync(jsPath, obf);
      const jsSrc = 'dist/' + jsFile + '?v=' + jsVersion(jsPath);
      if (isAdmin) {
        html = html.replace(re, '<script src="' + jsSrc + '"></script>');
      } else {
        html = html.replace(re, '<script src="' + commonSrc + '"></script>\n<script src="' + jsSrc + '"></script>');
      }
      console.log('  ' + file + ' -> dist/' + jsFile + ' (' + obf.length + ' bytes)');
    } else if (!isAdmin) {
      html = html.replace(re, '<script src="' + commonSrc + '"></script>');
    }
  }

  if (isAdmin) {
    // Minify admin's inline <style> block
    html = html.replace(/<style>([\s\S]*?)<\/style>/g, function(match, cssContent) {
      return '<style>' + new CleanCSS({level:2}).minify(cssContent).styles + '</style>';
    });
  } else {
    // Inline minified CSS (replace style.css link)
    html = html.replace(/<link rel="stylesheet" href="style\.css\?v=\d+">/g, '<style>' + cssMin.styles + '</style>');
  }

  // Minify HTML whitespace
  html = html.replace(/>\s+</g, '><');

  fs.writeFileSync(path.join(ROOT, file), html);
  console.log('  ' + file + ' updated');
});

console.log('\nDone! All files obfuscated and overwritten.');
console.log('Run: git add -A && git commit -m "build: obfuscate frontend" && git push');
