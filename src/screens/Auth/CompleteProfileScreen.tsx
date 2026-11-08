import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { ApiError } from '../../api/client';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { finishAuth } from '../../utils/authFlow';
import { typography, FONT_CAP } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

const CompleteProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  // Two quick taps would spend the one-time code twice; the second shows a bogus error.
  const inFlight = useRef(false);
  const submit = async () => {
    if (inFlight.current) {
      return;
    }
    if (name.trim().length < 2) {
      setError('Enter your name.');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const { phone, code, redirect } = route.params;
      await useUserStore.getState().verifyOtp(phone, code, name.trim());
      finishAuth(navigation, redirect);
    } catch (e) {
      // Code expired or used up: retrying here cannot work, so go back to the code screen.
      if (e instanceof ApiError && e.code === 'OTP_INVALID') {
        Alert.alert('Code expired', 'Request a new code to create your account.');
        navigation.goBack();
        return;
      }
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen scroll padded>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP} accessibilityRole="header">Welcome to TOJ</Text>
      <Input label="Your name" value={name} onChangeText={t => { setName(t); setError(undefined); }} error={error} autoFocus autoCapitalize="words" maxLength={60} />
      <Button title="Create account" onPress={submit} loading={busy} />
    </Screen>
  );
};

const styles = StyleSheet.create({ title: { ...typography.h1, marginVertical: 8, marginBottom: 24 } });

export default CompleteProfileScreen;
