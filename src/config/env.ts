import { Platform } from 'react-native';

/**
 * Local toj-backend (ADR-0031). The Android emulator reaches the host via 10.0.2.2.
 * ponytail: dev-only constant; add per-build config when a hosted API exists.
 */
export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';

export const API_TIMEOUT_MS = 10000;
