/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// No server in tests: every request fails like an offline device.
globalThis.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as jest.Mock;

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
