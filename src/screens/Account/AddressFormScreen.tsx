import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { useAddressStore } from '../../store/addressStore';
import { useUserStore } from '../../store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AddressForm'>;

const AddressFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const existing = useAddressStore.getState().addresses.find(a => a.id === route.params?.addressId);
  const user = useUserStore.getState().user;
  const [f, setF] = useState({
    label: existing?.label ?? 'Home',
    fullName: existing?.fullName ?? user?.name ?? '',
    phone: existing?.phone ?? user?.phone ?? '',
    line1: existing?.line1 ?? '',
    line2: existing?.line2 ?? '',
    city: existing?.city ?? '',
    postalCode: existing?.postalCode ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f, string>>>({});
  const set = (k: keyof typeof f) => (v: string) => { setF(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  const submit = () => {
    const e: typeof errors = {};
    if (f.fullName.trim().length < 2) e.fullName = 'Enter the recipient name.';
    if (!/^\d{10}$/.test(f.phone)) e.phone = 'Enter a 10-digit number.';
    if (f.line1.trim().length < 3) e.line1 = 'Enter the street address.';
    if (!f.city.trim()) e.city = 'Enter the city.';
    if (!/^\d{6}$/.test(f.postalCode)) e.postalCode = 'Enter a valid postal code.';
    if (!f.label.trim()) e.label = 'Enter a label.';
    setErrors(e);
    if (Object.keys(e).length) return;
    useAddressStore
      .getState()
      .save({ ...f, line2: f.line2.trim() || undefined, id: existing?.id })
      .then(id => {
        useAddressStore.getState().select(id);
        navigation.goBack();
      }, (err: Error) => setErrors({ label: err.message }));
  };

  return (
    <Screen scroll padded>
      <Input label="Label" value={f.label} onChangeText={set('label')} error={errors.label} />
      <Input label="Full name" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} autoCapitalize="words" />
      <Input label="Mobile number" value={f.phone} onChangeText={t => set('phone')(t.replace(/\D/g, '').slice(0, 10))} error={errors.phone} keyboardType="number-pad" />
      <Input label="Address line 1" value={f.line1} onChangeText={set('line1')} error={errors.line1} />
      <Input label="Address line 2 (optional)" value={f.line2} onChangeText={set('line2')} />
      <Input label="City" value={f.city} onChangeText={set('city')} error={errors.city} />
      <Input label="Postal code" value={f.postalCode} onChangeText={t => set('postalCode')(t.replace(/\D/g, '').slice(0, 6))} error={errors.postalCode} keyboardType="number-pad" />
      <Button title="Save address" onPress={submit} />
    </Screen>
  );
};

export default AddressFormScreen;
