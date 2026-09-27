import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, LOCAL_DIR, readTokens, tokensToCss } from './tokens-to-css.mjs';

const COMPONENTS = join(ROOT, 'project', 'components');
const MARKER = /^\s*<!--\s*@dsCard\b(.*?)-->\s*$/;

function parseMarker(line) {
  const m = line.match(MARKER);
  if (!m) return null;
  const attrs = {};
  for (const [, k, q, uq] of m[1].matchAll(/([\w-]+)=(?:"([^"]*)"|(\S+))/g)) attrs[k] = q ?? uq;
  return attrs;
}

// Inlined CSS resolves url() against the preview's folder, while the host loads bundle.css from components/.
function absolutizeUrls(css, baseDir) {
  const base = pathToFileURL(baseDir + '/');
  return css.replace(/url\(\s*(['"]?)(?!data:|https?:|file:|#|\/)([^'")]+)\1\s*\)/g,
    (_, q, ref) => `url(${q}${new URL(ref, base).href}${q})`);
}

function escapeScript(js) {
  return js.replace(/<\/script/gi, '<\\/script');
}

function buildPage(source, { tokensCss, bundleCss, bundleJs, baseHref }) {
  const lines = source.split(/\r?\n/);
  const marker = parseMarker(lines[0]);
  if (!marker) throw new Error(`line 1 is not an @dsCard marker: ${lines[0]}`);
  let html = lines.slice(1).join('\n');

  const inject = [
    `<base href="${baseHref}">`,
    `<style data-src="tokens.css">\n${tokensCss}</style>`,
    `<style data-src="bundle.css">\n${bundleCss}</style>`,
    `<script data-src="bundle.js">\n${escapeScript(bundleJs)}</script>`,
  ].join('\n');

  const HEAD = /<head(\s[^>]*)?>/i;
  if (!HEAD.test(html)) throw new Error('preview has no <head>');
  html = html.replace(HEAD, (m) => `${m}\n${inject}`);
  html = html.replace(/<html\b([^>]*)>/i, (_, attrs) =>
    `<html${attrs.replace(/\sdata-theme=("[^"]*"|'[^']*'|\S+)/i, '')} data-theme="light">`);
  return { html, marker };
}

function buildAll() {
  const bundleCssPath = join(COMPONENTS, 'bundle.css');
  const bundleJsPath = join(COMPONENTS, 'bundle.js');
  for (const p of [bundleCssPath, bundleJsPath]) if (!existsSync(p)) throw new Error(`missing ${p}`);

  const tokensCss = tokensToCss(readTokens());
  const bundleCss = absolutizeUrls(readFileSync(bundleCssPath, 'utf8'), COMPONENTS);
  const bundleJs = readFileSync(bundleJsPath, 'utf8');

  mkdirSync(LOCAL_DIR, { recursive: true });
  writeFileSync(join(LOCAL_DIR, 'tokens.css'), tokensCss);

  const manifest = [];
  for (const entry of readdirSync(COMPONENTS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(COMPONENTS, entry.name);
    const preview = join(dir, 'preview.html');
    if (!existsSync(preview)) continue;
    const { html, marker } = buildPage(readFileSync(preview, 'utf8'), {
      tokensCss, bundleCss, bundleJs, baseHref: pathToFileURL(dir + '/').href,
    });
    const file = join(LOCAL_DIR, `${entry.name}.html`);
    writeFileSync(file, html);
    manifest.push({ name: entry.name, file, url: pathToFileURL(file).href, marker });
  }
  writeFileSync(join(LOCAL_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

const manifest = buildAll();
console.log(`built ${manifest.length} previews into ${LOCAL_DIR}: ${manifest.map((m) => m.name).join(', ')}`);
