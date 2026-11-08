import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { DEMO_OTP } from '../../data/stores';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { finishAuth } from '../../utils/authFlow';
import { colors, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

const OtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone, redirect } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const verify = async () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      const r = await useUserStore.getState().verifyOtp(phone, code);
      if (r === 'ok') {
        finishAuth(navigation, redirect);
      } else {
        navigation.navigate('CompleteProfile', { phone, code, redirect });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const resend = () =>
    useUserStore.getState().requestOtp(phone).then(
      () => setResent(true),
      (e: Error) => setError(e.message),
    );

  return (
    <Screen scroll padded>
      <Text style={styles.title} accessibilityRole="header">Enter code</Text>
      <Text style={styles.sub}>Sent to +91 {phone} (simulated, no SMS)</Text>
      <Input
        label="6-digit code"
        value={code}
        onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(undefined); }}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        onSubmitEditing={verify}
        error={error}
        autoFocus
      />
      <Button title="Verify" onPress={verify} loading={busy} />
      <Pressable onPress={resend} hitSlop={8} accessibilityRole="button" style={styles.resend}>
        <Text style={styles.link}>{resent ? 'Code resent' : 'Resend code'}</Text>
      </Pressable>
      <View style={styles.banner}>
        <DemoBanner text={`Demo: use code ${DEMO_OTP}.`} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  banner: { marginTop: 16 },
  title: { ...typography.h1, marginTop: 8 },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: 6, marginBottom: 24 },
  resend: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  link: { ...typography.caption, textDecorationLine: 'underline' },
});

export default OtpScreen;
