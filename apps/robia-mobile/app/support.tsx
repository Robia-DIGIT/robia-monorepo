import { useState } from 'react';
import { Text } from 'react-native';
import { apiRequest } from '@/src/api/client';
import { useSession } from '@/src/auth/session';
import { AsyncButton, Field, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
export default function SupportScreen() {
  const { user } = useSession(); const [name, setName] = useState(user?.name ?? ''); const [email, setEmail] = useState(user?.email ?? '');
  const [company, setCompany] = useState(user?.company ?? ''); const [message, setMessage] = useState('');
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Contacter RobIA" /><RobiaCard style={s.stack}>
    <Text style={s.body}>Décrivez votre demande. L’équipe pourra vous répondre à l’adresse indiquée.</Text>
    <Field label="Nom" value={name} onChangeText={setName} maxLength={120} /><Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <Field label="Entreprise" value={company} onChangeText={setCompany} maxLength={120} /><Field label="Message" value={message} onChangeText={setMessage} multiline maxLength={2000} />
    <AsyncButton label="Envoyer ma demande" disabled={name.trim().length < 2 || message.trim().length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onSuccess="Votre demande a été transmise." action={async () => {
      await apiRequest('/prospects', { method: 'POST', body: { name: name.trim(), email: email.trim(), company: company.trim() || undefined, message: message.trim() } }); setMessage('');
    }} />
  </RobiaCard></RobiaScreen>;
}
