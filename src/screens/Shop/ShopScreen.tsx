import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryCard } from '../../components/CategoryCard';
import { Icon } from '../../components/Icon';
import { padGrid, useGridColumns, useRootNavigation } from '../../hooks';
import { useProductStore } from '../../store/productStore';
import { Category } from '../../types';
import { colors, typography } from '../../utils/theme';

const ShopScreen: React.FC = () => {
  const nav = useRootNavigation();
  const categories = useProductStore(s => s.categories);
  const cols = useGridColumns();
  const tiles: Category[] = [
    { id: 'all', title: 'All products', image: categories[0]?.image ?? '' },
    { id: 'sale', title: 'Sale', image: categories[2]?.image ?? '' },
    ...categories,
  ];
  const open = (id: string) => {
    if (id === 'all') {
      nav.navigate('ProductList', { title: 'All products' });
    } else if (id === 'sale') {
      nav.navigate('ProductList', { title: 'Sale', onSale: true });
    } else {
      nav.navigate('ProductList', { categoryId: id, title: tiles.find(t => t.id === id)?.title });
    }
  };
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">Shop</Text>
      <Pressable style={styles.search} onPress={() => nav.navigate('Search')} accessibilityRole="button" accessibilityLabel="Search products">
        <Icon name="search" size={18} color={colors.textSecondary} />
        <Text style={styles.searchText}>Search TOJ</Text>
      </Pressable>
      <FlatList
        key={cols}
        data={padGrid(tiles, cols)}
        numColumns={cols}
        keyExtractor={(c, i) => c?.id ?? `pad-${i}`}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) =>
          item ? (
            <CategoryCard category={item} onPress={() => open(item.id)} />
          ) : (
            <View style={styles.pad} />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  grid: { paddingHorizontal: 10, paddingBottom: 24 },
  pad: { flex: 1, margin: 6 },
  root: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h1, paddingHorizontal: 16, paddingTop: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, minHeight: 46, paddingHorizontal: 14, backgroundColor: colors.surface, borderRadius: 8 },
  searchText: { ...typography.body, color: colors.textSecondary },
});

export default ShopScreen;
