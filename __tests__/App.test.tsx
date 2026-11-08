/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App, { CrashBoundary } from '../App';

// No server in tests: every request fails like an offline device.
globalThis.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as jest.Mock;

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('a render crash shows Try again, which renders the app again', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  let boom = true;
  const Child = () => {
    if (boom) {
      throw new Error('boom');
    }
    return null;
  };
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    r = ReactTestRenderer.create(<CrashBoundary><Child /></CrashBoundary>);
  });
  const retry = r.root.findByProps({ accessibilityRole: 'button' });
  boom = false;
  await ReactTestRenderer.act(() => retry.props.onPress());
  expect(r.toJSON()).toBeNull();
});
