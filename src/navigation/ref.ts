import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/** For code outside components (session loss) that must move the user off account-only screens. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
