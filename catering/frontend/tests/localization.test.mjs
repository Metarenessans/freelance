import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ignored = new Set(['node_modules', '.next', '.git', 'scratch', 'tests']);
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => ignored.has(entry.name) ? [] : entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
test('demo mutations fail closed before making an API request', () => {
  const baseQuery = readFileSync(join(root, 'src/api/baseQuery.ts'), 'utf8');
  assert.match(baseQuery, /NEXT_PUBLIC_DEMO_MODE !== 'false'/);
  assert.ok(baseQuery.indexOf('DEMO_READ_ONLY') < baseQuery.indexOf('await axiosInstance'));
  const webhook = readFileSync(join(root, 'app/api/revalidate-schema/route.ts'), 'utf8');
  assert.doesNotMatch(webhook, /REVALIDATION_SECRET\s*\|\|/);
  assert.equal((webhook.match(/!EXPECTED_SECRET/g) || []).length, 2);
});
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function loadTs(name, dependencies = {}, env = {}) {
  const moduleRecord = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(join(root, name), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('module', 'exports', 'require', 'process', compiled)(moduleRecord, moduleRecord.exports, id => id in dependencies ? dependencies[id] : require(id), { env });
  return moduleRecord.exports;
}
test('demo mutation guard blocks actual submission execution', async () => {
  let calls = 0;
  const { axiosBaseQuery } = loadTs('src/api/baseQuery.ts', { './axiosInstance': { default: async () => { calls++; return { data: {} }; } } });
  const result = await axiosBaseQuery()({ url: 'orders/', method: 'POST', data: {} });
  assert.equal(result.error.status, 'DEMO_READ_ONLY');
  assert.equal(calls, 0);
});
test('generated SEO copy has natural word and dash spacing', () => {
  const seo = loadTs('src/utils/seo.ts');
  assert.equal(seo.formatCategoryList(['Salads', 'Canapes']), 'Salads and Canapes');
  assert.match(seo.buildProductTitle('Canapes'), /Canapes — /);
  assert.match(seo.getProductAltText({ name: 'Party box' }, '12 pieces'), /\) — delivery of ready-made platters/);
  assert.equal(loadTs('src/utils/slugify.ts').slugify('\u0441\u0435\u0442'), 'set');
});
test('debug and unrestricted proxy endpoints are unavailable publicly', () => {
  for (const name of ['debug-jsonld', 'proxy-image']) {
    assert.match(readFileSync(join(root, `app/api/${name}/route.ts`), 'utf8'), /NODE_ENV !== "development"/);
  }
});
test('demo copy does not publish original business contact defaults', () => {
  assert.doesNotMatch(readFileSync(join(root, 'app/llms.txt/route.ts'), 'utf8'), /phoneNumber\s*\|\|\s*"\+7/);
  assert.doesNotMatch(readFileSync(join(root, 'src/components/blocks/header/index.tsx'), 'utf8'), /avito\.ru/);
});
test('public API proxy refuses mutations server-side in demo mode', () => {
  assert.ok(existsSync(join(root, 'proxy.ts')), 'A server-side demo guard must exist');
  const dependencies = { 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }), next: () => ({ allowed: true }) } } };
  const guard = loadTs('proxy.ts', dependencies).proxy;
  assert.equal(guard({ method: 'POST' }).status, 403);
  assert.equal(guard({ method: 'GET' }).allowed, true);
  assert.equal(loadTs('proxy.ts', dependencies, { NEXT_PUBLIC_DEMO_MODE: 'false' }).proxy({ method: 'POST' }).allowed, true);
});
const source = () => files(root).filter(file => /\.(tsx?|jsx?|mjs|scss|css|md|html|ya?ml|json)$/.test(file) && !/package-lock\.json$|tsconfig\.tsbuildinfo$/.test(file));
test('first-party text uses English rather than untranslated Cyrillic', () => {
  const untranslated = source().filter(file => /[\u0400-\u04ff]/u.test(readFileSync(file, 'utf8'))).map(file => relative(root, file));
  assert.deepEqual(untranslated, []);
});
test('document and metadata declare English', () => {
  const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
  assert.match(layout, /<html lang="en">/);
  assert.match(layout, /locale: "en_US"/);
  assert.doesNotMatch(layout, /mc\.yandex\.ru|verification:/);
});
test('local environment files are absent and public copy has no production endpoints', () => {
  assert.deepEqual(files(root).filter(file => /(?:^|[\\/])\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example')), []);
  const matches = source().filter(file => /chefmil-furshet\.ru|api\.chef-meal\.ru|157\.22\.192\.108|109706875/.test(readFileSync(file, 'utf8'))).map(file => relative(root, file));
  assert.deepEqual(matches, []);
});
