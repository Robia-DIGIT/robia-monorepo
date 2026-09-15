import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from 'react-native';
import { useSession } from '@/src/auth/session';
import { apiRequest } from '@/src/api/client';
import { AsyncButton, Field, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
export default function PasswordScreen() {
  const { logout } = useSession();
  const params = useLocalSearchParams<{ token?: string }>();
  const [email, setEmail] = useState(''); const [token, setToken] = useState(params.token ?? ''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Mot de passe" />
    <RobiaCard style={s.stack}><Text style={s.title}>Recevoir un lien</Text>
      <Field label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <AsyncButton label="Envoyer le lien" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onSuccess="Si un compte correspond à cette adresse, un lien a été envoyé." action={() => apiRequest('/auth/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } })} />
    </RobiaCard>
    <RobiaCard style={s.stack}><Text style={s.title}>Choisir un nouveau mot de passe</Text>
      <Field label="Lien reçu par e-mail ou code de réinitialisation" value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} />
      <Field label="Nouveau mot de passe (8 caractères minimum)" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} autoComplete="new-password" />
      <Field label="Confirmer le mot de passe" value={confirmation} onChangeText={setConfirmation} secureTextEntry />
      <AsyncButton label="Modifier le mot de passe" disabled={!token || password.length < 8 || password !== confirmation} action={async () => {
        let value = token.trim(); if (value.startsWith('https://')) value = new URL(value).searchParams.get('token') ?? '';
        if (value.length < 40 || value.length > 256) throw new Error('Le lien ou code est incomplet.');
        await apiRequest('/auth/reset-password', { method: 'POST', body: { token: value, password } }); await logout(); router.replace('/auth');
      }} />
    </RobiaCard>
  </RobiaScreen>;
}
