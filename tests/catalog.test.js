import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '../api/catalog.js';

test('normaliza un anuncio público y conserva sus fotos y descripción', () => {
  const result = normalize({ micro_name: '3DPrintNova ..', location: { city: 'Badajoz' } }, [{ data: [{ id: 'abc', title: 'Cubos', description: 'Nueve cubos', price: { amount: 35, currency: 'EUR' }, slug: 'cubos-123', images: [{ urls: { small: 'https://cdn.wallapop.com/one.jpg', big: 'https://cdn.wallapop.com/two.jpg' } }], shipping: { item_is_shippable: true, user_allows_shipping: true } }] }]);
  assert.equal(result.items[0].description, 'Nueve cubos');
  assert.equal(result.items[0].images.length, 1);
  assert.equal(result.items[0].price, 35);
  assert.equal(result.items[0].shipping, true);
  assert.match(result.items[0].url, /cubos-123/);
});

test('filtra imágenes de otros dominios', () => {
  const result = normalize({}, [{ data: [{ id: '1', images: [{ urls: { small: 'https://example.org/image' } }] }] }]);
  assert.deepEqual(result.items[0].images, []);
});
