import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { DEMO_OTP } from '../../data/stores';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { finishAuth } from '../../utils/authFlow';
import { colors, typography, FONT_CAP, LINK_SLOP } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

// ponytail: mirrors the server's OTP_COOLDOWN_S; read resendAfterSeconds if it ever varies.
const COOLDOWN_S = 30;

const OtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone, redirect } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  // Arrived via a resend refusal: the server cooldown is already partly spent.
  const [wait, setWait] = useState(route.params.wait ?? COOLDOWN_S);
  // Back from CompleteProfile after an expired code: drop the dead code so a new one can be typed.
  useEffect(() => navigation.addListener('focus', () => { setCode(''); setError(undefined); }), [navigation]);
  useEffect(() => {
    if (wait <= 0) {
      return;
    }
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const inFlight = useRef(false);
  const verify = async (c = code) => {
    if (inFlight.current) {
      return;
    }
    if (c.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await useUserStore.getState().verifyOtp(phone, c);
      if (r === 'ok') {
        finishAuth(navigation, redirect);
      } else {
        navigation.navigate('CompleteProfile', { phone, code: c, redirect });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const [sending, setSending] = useState(false);
  const resend = () => {
    setSending(true);
    useUserStore.getState().requestOtp(phone).then(
      () => { setResent(true); setWait(COOLDOWN_S); },
      (e: Error) => setError(e.message),
    ).finally(() => setSending(false));
  };

  return (
    <Screen scroll padded>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP} accessibilityRole="header">Enter code</Text>
      <Text style={styles.sub}>Sent to +91 {phone} (simulated, no SMS)</Text>
      <Input
        label="6-digit code"
        value={code}
        onChangeText={t => {
          const c = t.replace(/\D/g, '').slice(0, 6);
          setCode(c);
          setError(undefined);
          if (c.length === 6 && code.length < 6) { verify(c); } // autofill or last digit submits
        }}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        onSubmitEditing={() => verify()}
        error={error}
        autoFocus
      />
      <Button title="Verify" onPress={() => verify()} loading={busy} />
      <Pressable onPress={resend} disabled={wait > 0 || sending} hitSlop={LINK_SLOP} accessibilityRole="button" accessibilityState={{ disabled: wait > 0 || sending }} style={styles.resend}>
        <Text style={wait > 0 ? styles.waiting : styles.link}>
          {wait > 0 ? `${resent ? 'Code resent. ' : ''}Resend in ${wait}s` : 'Resend code'}
        </Text>
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
  waiting: { ...typography.caption, color: colors.textSecondary },
});

export default OtpScreen;
