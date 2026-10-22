import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const paths = {
  cart: 'src/components/common/cart/cart-modal.tsx',
  menu: 'src/components/common/menu-popup/menu-popup.tsx',
};
const keys = ['cart_form_step', 'cart_form_name', 'cart_form_phone', 'cart_form_contact_method', 'cart_form_consent', 'cart_form_guests', 'cart_form_event_date', 'menu-popup-form-data'];
function mount(kind, mode, sandbox, options = {}) {
  const storage = new Map(keys.map(key => [key, key === 'menu-popup-form-data' ? JSON.stringify({ name: 'Private Person', phone: '+7 (123) 456-78-90' }) : key === 'cart_form_step' ? '2' : 'Private Person']));
  storage.set('catering_cart_items', 'products-still-here');
  const writes = [], reads = [], calls = [], logs = [], states = [], deps = [];
  let cursor, effects, tree;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(value) { return { current: value }; },
    useEffect(fn, values) { const i = cursor++; if (!deps[i] || values.some((value, j) => value !== deps[i][j])) { deps[i] = values; effects.push(fn); } },
    useMemo(fn) { return fn(); },
  };
  const jsx = (type, props) => ({ type, props: props || {} });
  const localStorage = { getItem: key => { reads.push(key); return storage.get(key) ?? null; }, setItem: (key, value) => { writes.push(key); storage.set(key, value); }, removeItem: key => storage.delete(key) };
  const component = name => ({ [name]: name });
  const dependencies = {
    react: { ...react, default: react }, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'framer-motion': { motion: { div: 'div' }, useMotionValue: () => ({ get: () => 0 }) },
    classnames: { default: () => '' }, vaul: { Drawer: {} },
    'next/navigation': { useRouter: () => ({}) }, 'next/link': { default: 'a' },
    'react-hot-toast': { toast: { error: message => calls.push(['toast', message]) } },
    'react-imask': component('IMaskInput'),
    '@/context/app-context': { useAppState: () => ({ cartItems: [{ id: '1', productId: '10', selectedOption: { id: '20', name: 'Large' }, name: 'Product', quantity: 1, priceInfo: { price: 6000 } }], cartTotalPrice: 6000, cartFinalPrice: 6000, isMenuPopupOpen: true }), useAppActions: () => ({ clearCart: () => calls.push(['clearCart']) }), IS_DELIVERY_ENABLED: false },
    '@/hooks/useMobile': { useMobile: () => false },
    '@/store/services/companyApi': { useGetCompanyInfoQuery: () => ({}) },
    '@/store/services/menuRequestsApi': Object.fromEntries(['useGetCalculateSettingsQuery', 'useGetEventFormatsQuery', 'useGetAdditionalServicesQuery'].map(name => [name, () => ({})]).concat([['useCreateMenuRequestMutation', () => [data => { calls.push(['mutation', data]); return { unwrap: async () => options.submit ? options.submit() : ({ id: 42 }) }; }, { isLoading: false }]]])),
    '@/utils/date': { isDateInPast: () => false },
    '@/utils/seo': { getProductAltText: () => 'Product' },
    '@/utils/formatPrice': { formatPrice: value => String(value) },
    '@/utils/cart-sharing': { getShareableCartUrl: () => '/?cart=products' },
  };
  const source = readFileSync(fileURLToPath(new URL(`../${paths[kind]}`, import.meta.url)), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  const record = { exports: {} };
  new Function('module', 'exports', 'require', 'process', 'window', 'localStorage', 'console', 'document', compiled)(record, record.exports, id => dependencies[id] || (id.endsWith('.scss') ? { default: {} } : id.includes('/hooks/') ? new Proxy({}, { get: () => () => {} }) : new Proxy({}, { get: (_, name) => name })), { env: { NEXT_PUBLIC_DEMO_MODE: mode, NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED: sandbox } }, { location: { search: options.search || '' }, history: { replaceState() {} } }, localStorage, { log: (...args) => logs.push(args), error: (...args) => logs.push(args) }, { getElementById: () => null });
  function render() { cursor = 0; effects = []; tree = record.exports[kind === 'cart' ? 'CartModal' : 'MenuPopup']({ isOpen: true, isEmbedded: true, onClose() {}, onSubmit: data => { calls.push(['submit', data]); return kind === 'cart' ? options.submit?.() : undefined; } }); effects.forEach(fn => fn()); return tree; }
  function walk(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)]; }
  function nodes() { return walk(tree); }
  render(); render();
  return { storage, writes, reads, calls, logs, render, nodes, source, states };
}
for (const kind of Object.keys(paths)) {
  test(`${kind}: default demo clears saved personal data without writing form data or losing products`, () => {
    const app = mount(kind);
    const ownKeys = kind === 'cart' ? keys.filter(key => key.startsWith('cart_form_')) : ['menu-popup-form-data'];
    for (const key of ownKeys) assert.equal(app.storage.has(key), false, `${key} must be removed on mount`);
    assert.deepEqual(app.writes, []);
    assert.equal(app.storage.get('catering_cart_items'), 'products-still-here');
    assert.deepEqual(app.reads, []);
  });
  test(`${kind}: demo checkout hides contact entry, shows warning, and blocks submit callbacks`, async () => {
    const app = mount(kind);
    const next = app.nodes().find(node => node.type === 'button' && node.props.onClick && ['Proceed to checkout', 'Next'].includes(node.props.children));
    if (kind === 'menu') {
      assert.ok(next);
      // Supply only event-selection state, never contact information.
      app.nodes().find(node => node.props.placeholder === 'Select an event type').props.onChange('Demo event'); app.render();
      app.nodes().find(node => node.props.placeholder === 'For example, 20').props.onChange({ target: { value: '20' } }); app.render();
    }
    app.nodes().find(node => node.type === 'button' && ['Proceed to checkout', 'Next'].includes(node.props.children))?.props.onClick(); app.render();
    assert.equal(app.nodes().some(node => node.props.placeholder === 'Alex' || node.props.type === 'tel'), false);
    assert.ok(app.nodes().some(node => node.props.role === 'status' && /demo/i.test(JSON.stringify(node.props.children))));
    const form = app.nodes().find(node => node.type === 'form');
    if (form) await form.props.onSubmit({ preventDefault() {} });
    assert.equal(app.calls.some(([type]) => type === 'mutation' || type === 'submit'), false);
    assert.deepEqual(app.writes, []);
  });
  test(`${kind}: explicit real mode keeps contact restoration and persistence`, () => {
    const app = mount(kind, 'false');
    assert.ok(app.writes.length > 0);
    if (kind === 'cart') assert.equal(app.nodes().find(node => node.props.placeholder === 'Alex').props.value, 'Private Person');
    else assert.ok(app.storage.get('menu-popup-form-data').includes('Private Person'));
  });
  test(`${kind}: explicit real mode still submits contacts through the original callback`, async () => {
    const app = mount(kind, 'false');
    if (kind === 'menu') {
      app.nodes().find(node => node.props.placeholder === 'Select an event type').props.onChange('Demo event'); app.render();
      app.nodes().find(node => node.props.placeholder === 'For example, 20').props.onChange({ target: { value: '20' } }); app.render();
      app.nodes().find(node => node.type === 'button' && node.props.children === 'Next').props.onClick(); app.render();
    } else {
      app.nodes().find(node => node.type === 'IMaskInput').props.onAccept('+7 (123) 456-78-90'); app.render();
    }
    await app.nodes().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    const submission = app.calls.find(([type]) => type === 'submit');
    assert.equal(submission?.[1].name, 'Private Person');
    assert.equal(submission?.[1].phone, '+7 (123) 456-78-90');
    assert.equal(app.calls.some(([type]) => type === 'mutation'), kind === 'menu');
    assert.deepEqual(app.logs, []);
  });
}
test('menu submission does not log complete form payloads', () => {
  const app = mount('menu');
  assert.equal(/console\.log\([^;]*formData/s.test(app.source), false, 'complete form payload must not be logged');
});

function fillSandbox(app, kind) {
  if (kind === 'menu') {
    app.nodes().find(node => node.props.placeholder === 'Select an event type').props.onChange('Demo event'); app.render();
    app.nodes().find(node => node.props.placeholder === 'For example, 20').props.onChange({ target: { value: '20' } }); app.render();
  }
  app.nodes().find(node => node.type === 'button' && ['Proceed to checkout', 'Next'].includes(node.props.children)).props.onClick(); app.render();
  const name = app.nodes().find(node => node.props.placeholder === 'Alex');
  assert.ok(name, 'sandbox must allow transient contact input');
  assert.equal(name.props.value, '');
  name.props.onChange({ target: { value: 'Fictional Person' } }); app.render();
  app.nodes().find(node => node.type === 'IMaskInput').props.onAccept('+7 (123) 456-78-90'); app.render();
}
for (const kind of Object.keys(paths)) {
  test(`${kind}: sandbox submits transient details and only shows success after API resolution`, async () => {
    let resolve;
    const pending = new Promise(done => { resolve = done; });
    const app = mount(kind, 'true', 'true', { submit: () => pending });
    fillSandbox(app, kind);
    assert.ok(app.nodes().some(node => node.props.role === 'note' && /test/i.test(JSON.stringify(node.props.children))));
    const result = app.nodes().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    app.render();
    assert.equal(app.nodes().some(node => node.type === 'h3' && /saved|Thank you/i.test(node.props.children)), false);
    resolve({ id: 42 }); await result; app.render();
    assert.ok(app.nodes().some(node => node.type === 'h3' && /saved/i.test(node.props.children)));
    const data = app.calls.find(([type]) => type === (kind === 'cart' ? 'submit' : 'mutation'))[1];
    assert.equal(data.name, 'Fictional Person');
    if (kind === 'cart') assert.equal(data.items[0].selectedOption.id, '20');
    assert.deepEqual(app.writes, []); assert.deepEqual(app.reads, []); assert.deepEqual(app.logs, []);
    assert.equal(app.storage.get('catering_cart_items'), 'products-still-here');
    assert.doesNotMatch(JSON.stringify(app.states), /Fictional Person|123.*456/);
  });
  test(`${kind}: sandbox API rejection keeps the form and does not log contacts or show success`, async () => {
    const app = mount(kind, 'true', 'true', { submit: async () => { throw { data: { name: ['Invalid contact'] } }; } });
    fillSandbox(app, kind);
    await app.nodes().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); app.render();
    assert.equal(app.nodes().find(node => node.props.placeholder === 'Alex').props.value, 'Fictional Person');
    assert.equal(app.calls.some(([type]) => type === 'clearCart'), false);
    assert.ok(app.calls.some(([type]) => type === 'toast'));
    assert.deepEqual(app.logs, []); assert.deepEqual(app.writes, []);
  });
}
test('sandbox cannot manufacture success using a query parameter', () => {
  const app = mount('cart', 'true', 'true', { search: '?success=order' });
  assert.equal(app.nodes().some(node => node.type === 'h3'), false);
});

