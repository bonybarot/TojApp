import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { colors } from '../../utils/theme';

type ProductDetailsRouteProp = RouteProp<
  { params: { productId: string } },
  'params'
>;

const ProductDetailsScreen: React.FC = () => {
  const route = useRoute<ProductDetailsRouteProp>();
  const { productId } = route.params;
  const getProductById = useProductStore(state => state.getProductById);
  const addToCart = useCartStore(state => state.addToCart);
  const product = getProductById(productId);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
    });
    Alert.alert('Success', 'Product added to cart!');
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        <Text style={styles.description}>{product.description}</Text>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 32,
    lineHeight: 24,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.background,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.error,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default ProductDetailsScreen;
