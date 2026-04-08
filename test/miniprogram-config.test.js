const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveBaseUrl, DEFAULT_BASE_URL } = require('../miniprogram/utils/config');

test('resolveBaseUrl prefers the stored override', () => {
  assert.equal(
    resolveBaseUrl({ storageValue: 'https://api.example.com', appBaseUrl: 'https://app.example.com' }),
    'https://api.example.com'
  );
});

test('resolveBaseUrl falls back to the app base url', () => {
  assert.equal(
    resolveBaseUrl({ storageValue: '', appBaseUrl: 'https://app.example.com' }),
    'https://app.example.com'
  );
});

test('resolveBaseUrl falls back to the default url', () => {
  assert.equal(resolveBaseUrl({ storageValue: '', appBaseUrl: '' }), DEFAULT_BASE_URL);
});
