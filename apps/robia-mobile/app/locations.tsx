import { useState } from 'react';
import { Text } from 'react-native';
import { AsyncButton, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
type Location = { id: string; name: string; address: string | null; city: string | null; country: string | null; openingHours?: { weekdayText?: string[] } | null; latitude?: number | null; longitude?: number | null };
type Candidate = { placeId: string; name: string; formattedAddress: string };
type Weather = { temperatureC: number; description: string; observedAt: string };
function LocationDetail({ id }: { id: string }) {
  const r = useResource<Location>('/locations/' + encodeURIComponent(id));
  const hasCoordinates = r.data?.latitude != null && r.data?.longitude != null;
  const weather = useResource<Weather>(hasCoordinates ? '/locations/' + encodeURIComponent(id) + '/weather' : null);
  const w = weather.data;
  return <RobiaCard style={s.stack}><LoadState {...r} retry={r.reload} />
    <Text style={s.title}>{r.data?.name}</Text><Text style={s.body}>{[r.data?.address, r.data?.city, r.data?.country].filter(Boolean).join(', ')}</Text>
    {r.data?.openingHours?.weekdayText?.map(t => <Text key={t} style={s.body}>{t}</Text>)}
    {r.data && !hasCoordinates ? <Text style={s.body}>La météo sera disponible pour un établissement enregistré avec ses coordonnées Google Places.</Text> : null}
    <LoadState {...weather} retry={weather.reload} />
    {w?.temperatureC != null ? <Text style={s.body}>{w.description} · {w.temperatureC} °C · {w.observedAt}</Text> : null}
  </RobiaCard>;
}
export default function LocationsScreen() {
  const { request } = useSession(); const list = useResource<Location[]>('/locations');
  const [query, setQuery] = useState(''); const [results, setResults] = useState<Candidate[] | null>(null);
  const [name, setName] = useState(''); const [address, setAddress] = useState(''); const [city, setCity] = useState(''); const [country, setCountry] = useState('');
  const [placeId, setPlaceId] = useState<string | undefined>(); const [selected, setSelected] = useState<string | null>(null);
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Mes établissements" />
    <RobiaCard style={s.stack}><Field label="Rechercher un établissement" value={query} onChangeText={setQuery} placeholder="Nom, ville…" />
      <AsyncButton label="Rechercher" disabled={query.trim().length < 2} action={async () => setResults(await request<Candidate[]>('/locations/search-places?query=' + encodeURIComponent(query.trim())))} />
      {results?.length === 0 ? <Text style={s.body}>Aucun résultat. Vous pouvez saisir les informations ci-dessous.</Text> : null}
      {results?.map(c => <AsyncButton key={c.placeId} label={c.name + ' · ' + c.formattedAddress} action={async () => { setPlaceId(c.placeId); setName(c.name); setAddress(c.formattedAddress); setResults(null); }} />)}
      <Field label="Nom" value={name} onChangeText={setName} /><Field label="Adresse" value={address} onChangeText={setAddress} />
      <Field label="Ville" value={city} onChangeText={setCity} /><Field label="Pays" value={country} onChangeText={setCountry} />
      <AsyncButton label="Ajouter cet établissement" disabled={!name.trim()} action={async () => {
        const location = await request<Location>('/locations', { method: 'POST', body: { name: name.trim(), placeId, address: address || undefined, city: city || undefined, country: country || undefined } });
        setSelected(location.id); setName(''); setAddress(''); setCity(''); setCountry(''); setPlaceId(undefined); await list.reload();
      }} />
    </RobiaCard>
    <LoadState {...list} retry={list.reload} empty={!list.data?.length} />
    {list.data?.map(l => <AsyncButton key={l.id} label={l.name} action={async () => setSelected(l.id)} />)}
    {selected ? <LocationDetail key={selected} id={selected} /> : null}
  </RobiaScreen>;
}
