import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { colors, typography } from '../../utils/theme';

const PersonalInfoScreen: React.FC = () => {
  const user = useUserStore(s => s.user);
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = () => {
    if (name.trim().length < 2) { setError('Enter your name.'); return; }
    setBusy(true);
    useUserStore.getState().updateName(name.trim())
      .then(() => setSaved(true), (e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  };
  return (
    <Screen scroll padded>
      <Input label="Name" value={name} onChangeText={t => { setName(t); setError(undefined); setSaved(false); }} error={error} autoCapitalize="words" maxLength={60} />
      <Input label="Mobile number" value={user ? `+91 ${user.phone}` : ''} editable={false} />
      <Text style={styles.note}>Your mobile number is your sign-in and cannot be changed here.</Text>
      <Button title="Save changes" onPress={save} loading={busy} disabled={name.trim() === user?.name} />
      {saved && <Text style={styles.ok} accessibilityRole="alert">Saved</Text>}
    </Screen>
  );
};

const styles = StyleSheet.create({
  note: { ...typography.caption, color: colors.textSecondary, marginBottom: 20, marginTop: -8 },
  ok: { ...typography.caption, color: colors.success, textAlign: 'center', marginTop: 12 },
});

export default PersonalInfoScreen;
