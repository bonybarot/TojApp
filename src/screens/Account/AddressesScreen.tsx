import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Screen, StickyFooter } from '../../components/Screen';
import { EmptyState } from '../../components/States';
import { RootStackParamList } from '../../navigation/types';
import { useAddressStore } from '../../store/addressStore';
import { borderRadius, colors, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Addresses'>;

const AddressesScreen: React.FC<Props> = ({ navigation, route }) => {
  const selecting = route.params?.selecting;
  const { addresses, selectedId, select, remove } = useAddressStore();
  const confirmRemove = (id: string) =>
    Alert.alert('Delete address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
    ]);
  return (
    <Screen footer={<StickyFooter><Button title="Add new address" onPress={() => navigation.navigate('AddressForm', {})} /></StickyFooter>}>
      <FlatList
        data={addresses}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No saved addresses" message="Add one to use at checkout." />}
        renderItem={({ item: a }) => (
          <Pressable
            style={[styles.card, selecting && a.id === selectedId && styles.on]}
            onPress={() => { if (selecting) { select(a.id); navigation.goBack(); } }}
            accessibilityRole={selecting ? 'radio' : 'summary'}
            accessibilityState={selecting ? { selected: a.id === selectedId } : undefined}
          >
            <Text style={typography.h3}>{a.label} · {a.fullName}</Text>
            <Text style={styles.sub}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
            <Text style={styles.sub}>{a.city} {a.postalCode} · {a.phone}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => navigation.navigate('AddressForm', { addressId: a.id })} hitSlop={8} accessibilityRole="button"><Text style={styles.link}>Edit</Text></Pressable>
              <Pressable onPress={() => confirmRemove(a.id)} hitSlop={8} accessibilityRole="button"><Text style={[styles.link, { color: colors.error }]}>Delete</Text></Pressable>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  card: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: 12 },
  on: { borderColor: colors.primary },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 24, marginTop: 10 },
  link: { ...typography.caption, textDecorationLine: 'underline', minHeight: 24 },
});

export default AddressesScreen;
