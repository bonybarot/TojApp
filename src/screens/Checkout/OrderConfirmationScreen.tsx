import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { RootStackParamList } from '../../navigation/types';
import { useOrderStore } from '../../store/orderStore';
import { formatPrice } from '../../utils/format';
import { colors, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;

const OrderConfirmationScreen: React.FC<Props> = ({ route, navigation }) => {
  const order = useOrderStore(s => s.orders.find(o => o.id === route.params.orderId));
  return (
    <Screen edges={['top', 'bottom']} padded>
      <View style={styles.center}>
        <View style={styles.tick}><Text style={styles.tickText}>✓</Text></View>
        <Text style={styles.title} accessibilityRole="header">Demo order placed</Text>
        <Text style={styles.sub}>
          Order {route.params.orderId}
          {order ? ` · ${formatPrice(order.total)} · ${order.fulfilment === 'pickup' ? 'Store pickup' : 'Delivery'}` : ''}
        </Text>
        <View style={styles.banner}>
          <DemoBanner text="Demo order: nothing was charged. Track pickup status in My Orders." />
        </View>
      </View>
      <Button title="View order" onPress={() => navigation.replace('OrderDetails', { orderId: route.params.orderId })} />
      <Button title="Continue shopping" variant="ghost" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  banner: { marginTop: 20 },
  center: { flex: 1, justifyContent: 'center' },
  tick: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  tickText: { color: colors.onPrimary, fontSize: 32 },
  title: { ...typography.h1, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});

export default OrderConfirmationScreen;
