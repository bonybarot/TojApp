import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { DEMO_OTP } from '../../data/stores';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { colors, typography, FONT_CAP } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      await useUserStore.getState().requestOtp(phone);
      navigation.navigate('Otp', { phone, redirect: route.params?.redirect });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll padded edges={['bottom']}>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP} accessibilityRole="header">Sign in or create account</Text>
      <Text style={styles.sub}>We will send a one-time code to your mobile number.</Text>
      <Input
        label="Mobile number"
        value={phone}
        onChangeText={t => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError(undefined); }}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="10-digit number"
        autoComplete="tel"
        onSubmitEditing={submit}
        error={error}
        autoFocus
      />
      <Button title="Send code" onPress={submit} loading={busy} />
      <View style={styles.banner}>
        <DemoBanner text={`Demo: no SMS is sent. Use code ${DEMO_OTP}.`} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  banner: { marginTop: 16 },
  title: { ...typography.h1, marginTop: 8 },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: 6, marginBottom: 24 },
});

export default LoginScreen;
