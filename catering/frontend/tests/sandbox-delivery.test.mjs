import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../src/context/app-context.tsx', import.meta.url), 'utf8');
const expression = source.match(/export const IS_DELIVERY_ENABLED\s*=\s*([^;]+);/)[1];
function enabled(value) {
  return runInNewContext(expression, {process:{env:{NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED:value}}});
}

test('sandbox checkout applies the minimum and delivery policy used by the API', () => {
  assert.equal(enabled('true'), true);
});
test('delivery behavior is unchanged outside the explicit portfolio opt-in', () => {
  for (const value of [undefined, 'false', 'TRUE', '1']) assert.equal(enabled(value), false);
});
