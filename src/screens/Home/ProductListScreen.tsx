import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { useProductStore } from '../../store/productStore';
import { colors } from '../../utils/theme';

type ProductListRouteProp = RouteProp<
  { params: { category?: string } },
  'params'
>;

const ProductListScreen: React.FC = () => {
  const route = useRoute<ProductListRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { category } = route.params || {};
  const products = useProductStore(state => {
    if (category) {
      return state.products.filter(p => p.category === category);
    }
    return state.products;
  });

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard
      id={item.id}
      title={item.title}
      price={item.price}
      image={item.image}
      onPress={() => handleProductPress(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {category && (
        <View style={styles.header}>
          <Text style={styles.headerText}>{category}</Text>
        </View>
      )}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default ProductListScreen;
