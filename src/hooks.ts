import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { RootStackParamList } from './navigation/types';

export const useRootNavigation = () =>
  useNavigation<NavigationProp<RootStackParamList>>();

/** Grid columns: 2 on phones, more on tablets / landscape (~220dp per card). */
export const useGridColumns = () =>
  Math.max(2, Math.floor(useWindowDimensions().width / 220));

/** Pads a grid row with nulls so the last row's cards keep their width. */
export const padGrid = <T,>(data: T[], cols: number): (T | null)[] => [
  ...data,
  ...Array((cols - (data.length % cols)) % cols).fill(null),
];

/** Pull-to-refresh props for a list; a failed pull says so (the old data stays). Spinner only for a user pull: a programmatic `refreshing` on iOS scrolls the list to the top. */
export const usePull = (load: () => Promise<unknown>) => {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch(() => Alert.alert('Could not refresh', 'Check your connection and try again.'))
      .finally(() => setRefreshing(false));
  }, [load]);
  return { refreshing, onRefresh };
};
