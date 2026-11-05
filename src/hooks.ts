import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
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
