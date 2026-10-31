import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EmptyState } from '../../components/States';
import { ProductGrid } from '../../components/ProductGrid';
import { Screen } from '../../components/Screen';
import { categories } from '../../data/categories';
import { useRootNavigation } from '../../hooks';
import { useProductStore } from '../../store/productStore';
import { searchProducts } from '../../utils/filter';
import { borderRadius, colors, typography } from '../../utils/theme';

const SearchScreen: React.FC = () => {
  const nav = useRootNavigation();
  const products = useProductStore(s => s.products);
  const [q, setQ] = useState('');
  const results = useMemo(() => searchProducts(products, q), [products, q]);
  const searching = q.trim().length > 0;

  return (
    <Screen>
      <TextInput
        autoFocus
        value={q}
        onChangeText={setQ}
        placeholder="Search for shirts, jeans, shoes…"
        placeholderTextColor={colors.disabled}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search products"
        style={styles.input}
      />
      {searching ? (
        <ProductGrid
          data={results}
          empty={<EmptyState title="No results" message={`Nothing matched “${q.trim()}”. Try a different word.`} />}
        />
      ) : (
        <View style={styles.sugg}>
          <Text style={styles.label}>POPULAR CATEGORIES</Text>
          <View style={styles.wrap}>
            {categories.map(c => (
              <Pressable
                key={c.id}
                style={styles.pill}
                onPress={() => nav.navigate('ProductList', { categoryId: c.id, title: c.title })}
                accessibilityRole="button"
              >
                <Text style={typography.body}>{c.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  input: { margin: 16, minHeight: 48, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md },
  sugg: { paddingHorizontal: 16 },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 22 },
});

export default SearchScreen;
