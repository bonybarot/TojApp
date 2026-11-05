import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryCard } from '../../components/CategoryCard';
import { Icon } from '../../components/Icon';
import { ProductCard } from '../../components/ProductCard';
import { SectionHeader } from '../../components/SectionHeader';
import { SmartImage } from '../../components/SmartImage';
import { ProductGridSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/States';
import { useRootNavigation } from '../../hooks';
import { useProductStore } from '../../store/productStore';
import { colors, typography } from '../../utils/theme';

const HomeScreen: React.FC = () => {
  const nav = useRootNavigation();
  const { products, categories, status, loadProducts } = useProductStore();
  const hero = products.find(p => p.tag === 'New') ?? products[0];
  const newIn = products.filter(p => p.tag === 'New' || p.tag === 'Bestseller').slice(0, 8);
  const sale = products.filter(p => p.compareAtPrice).slice(0, 8);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.bar}>
        <Text style={styles.brand}>TOJ</Text>
        <Pressable
          onPress={() => nav.navigate('Search')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Icon name="search" size={22} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {status === 'error' ? (
          <ErrorState onRetry={loadProducts} />
        ) : status !== 'ready' || !hero ? (
          <ProductGridSkeleton />
        ) : (
          <>
            <Pressable
              style={styles.hero}
              onPress={() => nav.navigate('ProductDetails', { productId: hero.id })}
              accessibilityRole="button"
              accessibilityLabel={`Featured: ${hero.title}`}
            >
              <SmartImage uri={hero.image} label={hero.title} style={styles.heroImg} />
              <View style={styles.heroScrim} />
              <View style={styles.heroText}>
                <Text style={styles.heroKicker}>NEW SEASON</Text>
                <Text style={styles.heroTitle}>{hero.title}</Text>
                <Text style={styles.heroCta}>SHOP NOW</Text>
              </View>
            </Pressable>

            <SectionHeader title="Shop by category" action="See all" onAction={() => nav.navigate('Tabs', { screen: 'Shop' })} />
            <FlatList
              horizontal
              data={categories}
              keyExtractor={c => c.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              renderItem={({ item }) => (
                <View style={styles.catCell}>
                  <CategoryCard
                    tall
                    category={item}
                    onPress={() => nav.navigate('ProductList', { categoryId: item.id, title: item.title })}
                  />
                </View>
              )}
            />

            <SectionHeader title="New & popular" action="View all" onAction={() => nav.navigate('ProductList', { title: 'All products' })} />
            <FlatList
              horizontal
              data={newIn}
              keyExtractor={p => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              renderItem={({ item }) => (
                <View style={styles.productCell}>
                  <ProductCard product={item} onPress={() => nav.navigate('ProductDetails', { productId: item.id })} />
                </View>
              )}
            />

            {sale.length > 0 && (
              <>
                <SectionHeader title="On sale" action="View all" onAction={() => nav.navigate('ProductList', { title: 'Sale', onSale: true })} />
                <FlatList
                  horizontal
                  data={sale}
                  keyExtractor={p => p.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rail}
                  renderItem={({ item }) => (
                    <View style={styles.productCell}>
                      <ProductCard product={item} onPress={() => nav.navigate('ProductDetails', { productId: item.id })} />
                    </View>
                  )}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  rail: { paddingHorizontal: 10 },
  catCell: { width: 150 },
  productCell: { width: 160 },
  root: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 52 },
  brand: { ...typography.display, color: colors.text },
  hero: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  heroImg: { width: '100%', aspectRatio: 1 },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  heroKicker: { ...typography.label, color: colors.onPrimary },
  heroTitle: { ...typography.h1, color: colors.onPrimary, marginVertical: 6 },
  heroCta: { ...typography.label, color: colors.onPrimary, textDecorationLine: 'underline' },
});

export default HomeScreen;
