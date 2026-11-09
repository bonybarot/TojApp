import React from 'react';
import { FlatList, FlatListProps, StyleSheet, View } from 'react-native';
import { padGrid, useGridColumns, useRootNavigation } from '../hooks';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface Props extends Pick<FlatListProps<Product | null>, 'refreshing' | 'onRefresh'> {
  data: Product[];
  header?: React.ReactElement | null;
  empty?: React.ReactElement | null;
}

export const ProductGrid: React.FC<Props> = ({ data, header, empty, refreshing, onRefresh }) => {
  const nav = useRootNavigation();
  const cols = useGridColumns();
  return (
    <FlatList
      key={cols}
      data={padGrid(data, cols)}
      numColumns={cols}
      keyExtractor={(p, i) => p?.id ?? `pad-${i}`}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) =>
        item ? (
          <ProductCard product={item} onPress={() => nav.navigate('ProductDetails', { productId: item.id })} />
        ) : (
          <View style={styles.pad} />
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 10, paddingBottom: 24, flexGrow: 1 },
  pad: { flex: 1, margin: 6 },
});
