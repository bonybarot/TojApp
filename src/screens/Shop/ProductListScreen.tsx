import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState } from '../../components/States';
import { activeFilterCount, defaultFilters, FilterSheet, Filters } from '../../components/FilterSheet';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductGridSkeleton } from '../../components/Skeleton';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore } from '../../store/productStore';
import { applyFilters } from '../../utils/filter';
import { colors, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

const ProductListScreen: React.FC<Props> = ({ route }) => {
  const { categoryId, onSale } = route.params;
  const { products, status, loadProducts } = useProductStore();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [open, setOpen] = useState(false);

  const base = useMemo(
    () =>
      products.filter(
        p => (!categoryId || p.categoryId === categoryId) && (!onSale || !!p.compareAtPrice),
      ),
    [products, categoryId, onSale],
  );
  const sizeOptions = useMemo(() => Array.from(new Set(base.flatMap(p => p.sizes))), [base]);
  const data = useMemo(() => applyFilters(base, filters), [base, filters]);
  const n = activeFilterCount(filters);

  if (status === 'error') {
    return <Screen><ErrorState onRetry={loadProducts} /></Screen>;
  }
  return (
    <Screen>
      {status !== 'ready' ? (
        <ProductGridSkeleton />
      ) : (
        <>
          <View style={styles.bar}>
            <Text style={styles.count}>{data.length} {data.length === 1 ? 'item' : 'items'}</Text>
            <Pressable onPress={() => setOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Sort and filter">
              <Text style={styles.filter}>SORT & FILTER{n ? ` (${n})` : ''}</Text>
            </Pressable>
          </View>
          <ProductGrid
            data={data}
            empty={
              <EmptyState
                title="No products found"
                message="Try removing some filters."
                actionLabel={n ? 'Clear filters' : undefined}
                onAction={() => setFilters(defaultFilters)}
              />
            }
          />
          <FilterSheet visible={open} value={filters} sizeOptions={sizeOptions} onChange={setFilters} onClose={() => setOpen(false)} />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  count: { ...typography.caption, color: colors.textSecondary },
  filter: { ...typography.label, color: colors.text, textDecorationLine: 'underline' },
});

export default ProductListScreen;
