import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function load(path, env, dependencies) {
  const record = { exports: {} };
  const code = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('module', 'exports', 'require', 'process', code)(record, record.exports, id => dependencies[id], { env });
  return record.exports;
}
const env = { NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED: 'true', NEXT_PUBLIC_DEMO_MODE: 'true' };
for (const flag of [undefined, 'false', 'TRUE', '1', 'true']) {
  test(`client sandbox requires exact opt-in (${flag}) and restricts writes`, async () => {
    const calls = [];
    const query = load('src/api/baseQuery.ts', { ...env, NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED: flag }, { './axiosInstance': { default: async config => { calls.push(config); return { data: { id: 42, status: 'pending' } }; } } }).axiosBaseQuery();
    for (const url of ['orders/', 'menu-requests/']) {
      const result = await query({ url, method: 'POST', data: { name: 'Test' } });
      if (flag === 'true') assert.equal(result.data.id, 42);
      else assert.equal(result.error.status, 'DEMO_READ_ONLY');
    }
    for (const [url, method] of [['orders/1/', 'POST'], ['orders/', 'DELETE'], ['company/', 'POST'], ['menu-requests/formats/', 'POST'], ['https://other.test/orders/', 'POST'], ['orders/?override=true', 'POST']]) {
      assert.equal((await query({ url, method })).error.status, 'DEMO_READ_ONLY');
    }
    assert.equal(calls.length, flag === 'true' ? 2 : 0);
  });
}
test('server sandbox permits only exact order and quote POST routes', () => {
  const proxy = load('proxy.ts', env, { 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }), next: () => ({ allowed: true }) } } }).proxy;
  for (const pathname of ['/api/v1/orders/', '/api/v1/menu-requests/']) assert.equal(proxy({ method: 'POST', nextUrl: { pathname } }).allowed, true);
  for (const [pathname, method] of [['/api/v1/orders/1/', 'POST'], ['/api/v1/orders/', 'PUT'], ['/api/v1/menu-requests/formats/', 'POST'], ['/api/v1/company/', 'POST']]) assert.equal(proxy({ method, nextUrl: { pathname } }).status, 403);
});
test('sandbox remains narrow even if legacy real mode is also set', async () => {
  const mixedEnv = { ...env, NEXT_PUBLIC_DEMO_MODE: 'false' };
  const query = load('src/api/baseQuery.ts', mixedEnv, { './axiosInstance': { default: async () => { throw new Error('unexpected API call'); } } }).axiosBaseQuery();
  assert.equal((await query({ url: 'company/', method: 'POST' })).error.status, 'DEMO_READ_ONLY');
  const guard = load('proxy.ts', mixedEnv, { 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }), next: () => ({ allowed: true }) } } }).proxy;
  assert.equal(guard({ method: 'POST', nextUrl: { pathname: '/api/v1/company/' } }).status, 403);
});
test('home notice follows exact pathname through client navigation and is not global', () => {
  let pathname = '/';
  const jsx = (type, props) => ({ type, props });
  const Notice = load('src/components/common/home-demo-notice.tsx', env, { 'next/navigation': { usePathname: () => pathname }, 'react/jsx-runtime': { jsx, jsxs: jsx } }).HomeDemoNotice;
  assert.equal(Notice().type, 'aside');
  for (pathname of ['/cart', '/calculate', '/catalog/party', '/blog', '/privacy-policy', '/product/1']) assert.equal(Notice(), null);
  pathname = '/'; assert.equal(Notice().type, 'aside');
  assert.doesNotMatch(read('app/layout.tsx'), /<aside|HomeDemoNotice/);
  assert.match(read('src/components/pages/sections-page/index.tsx'), /<HomeDemoNotice/);
});

test('home notice overlays a positioned hero without adding flow spacing', () => {
  const jsx = (type, props) => ({ type, props });
  const Notice = load('src/components/common/home-demo-notice.tsx', env, { 'next/navigation': { usePathname: () => '/' }, 'react/jsx-runtime': { jsx, jsxs: jsx } }).HomeDemoNotice;
  const notice = Notice();
  assert.equal(notice.props.style.position, 'absolute');
  assert.equal(notice.props.style.marginTop, undefined);
  assert.equal(notice.props.style.marginBottom, undefined);
  assert.match(read('src/components/pages/sections-page/index.tsx'), /<div className=\{style\.heroWithNotice\}>\s*<HomeDemoNotice\s*\/>\s*<Hero[^>]*\/>\s*<\/div>/);
  assert.match(read('src/components/pages/sections-page/style.module.scss'), /\.heroWithNotice\s*\{\s*position:\s*relative/);
  assert.doesNotMatch(read('src/components/pages/sections-page/style.module.scss'), />\s*aside\[role="note"\]/, 'error-boundary wrappers must not prevent notice positioning');
});

test('transport rejects failures without logging response bodies or request contacts', async () => {
  const logs = [];
  let rejected;
  const instance = { interceptors: { request: { use() {} }, response: { use(ok, fail) { rejected = fail; } } } };
  const record = { exports: {} };
  const code = ts.transpileModule(read('src/api/axiosInstance.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', 'process', 'console', code)(record, record.exports, () => ({ default: { create: () => instance } }), { env }, { error: (...values) => logs.push(values) });
  for (const error of [{ response: { status: 400, data: { name: 'Private Person' } } }, { request: { body: 'Private Person' } }]) await assert.rejects(rejected(error));
  assert.deepEqual(logs, []);
});

test('global checkout awaits the actual mutation unwrap and propagates rejection', async () => {
  let reject;
  const pending = new Promise((resolve, fail) => { reject = fail; });
  const jsx = (type, props) => ({ type, props });
  const Wrapper = load('src/components/common/cart/global-cart-modal.tsx', env, {
    react: {}, 'react/jsx-runtime': { jsx }, './cart-modal': { CartModal: 'CartModal' },
    '@/context/app-context': { useAppState: () => ({ isCartOpen: true }), useAppActions: () => ({ setCartOpen() {} }) },
    '@/store/services/ordersApi': { useCreateOrderMutation: () => [() => ({ unwrap: () => pending })] },
  }).GlobalCartModal;
  const result = Wrapper().props.onSubmit({ name: 'Fictional Person' });
  const assertion = assert.rejects(result, /API refused/);
  reject(new Error('API refused')); await assertion;
});
