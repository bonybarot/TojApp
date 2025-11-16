import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import { colors } from '../../utils/theme';

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const items = useCartStore(state => state.items);
  const totalPrice = useCartStore(state =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0),
  );
  const clearCart = useCartStore(state => state.clearCart);
  const user = useUserStore(state => state.user);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  const handleConfirmOrder = () => {
    if (
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zipCode
    ) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    // In a real app, this would create an order via API
    Alert.alert('Success', 'Your order has been placed!', [
      {
        text: 'OK',
        onPress: () => {
          clearCart();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street Address"
          value={address.street}
          onChangeText={text => setAddress({ ...address, street: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={address.city}
          onChangeText={text => setAddress({ ...address, city: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="State"
          value={address.state}
          onChangeText={text => setAddress({ ...address, state: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Zip Code"
          value={address.zipCode}
          onChangeText={text => setAddress({ ...address, zipCode: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Country"
          value={address.country}
          onChangeText={text => setAddress({ ...address, country: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map(item => (
          <View key={item.id} style={styles.summaryItem}>
            <Text style={styles.summaryItemText}>
              {item.title} x {item.quantity}
            </Text>
            <Text style={styles.summaryItemPrice}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.paymentMethod}>Credit Card ending in 1234</Text>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmOrder}
      >
        <Text style={styles.confirmButtonText}>Confirm Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  summaryItemPrice: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 16,
    margin: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.background,
  },
});

export default CheckoutScreen;
