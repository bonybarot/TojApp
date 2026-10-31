import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { DEMO_OTP } from '../../data/stores';
import { RootStackParamList } from '../../navigation/types';
import { isExistingPhone, useUserStore } from '../../store/userStore';
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
    await new Promise<void>(r => setTimeout(r, 600));
    setBusy(false);
    if (code !== DEMO_OTP) {
      setError('That code is incorrect. Try again.');
      return;
    }
    if (isExistingPhone(phone)) {
      useUserStore.getState().signIn(phone);
      finishAuth(navigation, redirect);
    } else {
      navigation.navigate('CompleteProfile', { phone, redirect });
    }
  };

  return (
    <Screen scroll padded>
      <Text style={styles.title} accessibilityRole="header">Enter code</Text>
      <Text style={styles.sub}>Sent to +{phone} (simulated)</Text>
      <Input
        label="6-digit code"
        value={code}
        onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(undefined); }}
        keyboardType="number-pad"
        maxLength={6}
        error={error}
        autoFocus
      />
      <Button title="Verify" onPress={verify} loading={busy} />
      <Pressable onPress={() => setResent(true)} hitSlop={8} accessibilityRole="button" style={styles.resend}>
        <Text style={styles.link}>{resent ? 'Code resent (demo)' : 'Resend code'}</Text>
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
