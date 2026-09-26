import { AsyncButton, Field, apiStyles as s } from "@/components/api-ui";
import { RobiaCard, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import type { User } from "@/src/api/types";
import { useSession } from "@/src/auth/session";
import { useEffect, useState } from "react";
import { Text } from "react-native";
export default function SettingsScreen() {
  const { user, organization, request, refreshProfile, refreshOrganization } =
    useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  useEffect(() => {
    setName(user?.name ?? "");
    setCompany(user?.company ?? "");
    setPhone((user as User & { phone?: string })?.phone ?? "");
    setBio((user as User & { bio?: string })?.bio ?? "");
  }, [user]);
  useEffect(() => {
    setOrgName(organization?.name ?? user?.company ?? "");
    setCity(organization?.city ?? "");
    setCountry(organization?.country ?? "");
    setSector(organization?.sector ?? "");
  }, [organization, user?.company]);
  return (
    <RobiaScreen fixedHeader>
      <RobiaHeader compact back title="Mon compte" />
      <RobiaCard style={s.stack}>
        <Text style={s.title}>Profil</Text>
        <Text style={s.body}>{user?.email}</Text>
        <Field
          label="Nom"
          value={name}
          onChangeText={setName}
          maxLength={120}
        />
        <Field
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={20}
        />
        <Field
          label="Entreprise"
          value={company}
          onChangeText={setCompany}
          maxLength={120}
        />
        <Field
          label="Présentation"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={500}
        />
        <AsyncButton
          label="Enregistrer mon profil"
          onSuccess="Profil enregistré."
          action={async () => {
            await request("/users/me", {
              method: "PATCH",
              body: { name: name.trim(), phone, company, bio },
            });
            await refreshProfile();
          }}
        />
      </RobiaCard>
      <RobiaCard style={s.stack}>
        <Text style={s.title}>
          {organization ? "Mon organisation" : "Créer mon organisation"}
        </Text>
        <Field
          label="Nom de l’organisation"
          value={orgName}
          onChangeText={setOrgName}
        />
        <Field label="Secteur" value={sector} onChangeText={setSector} />
        <Field label="Ville" value={city} onChangeText={setCity} />
        <Field label="Pays" value={country} onChangeText={setCountry} />
        <AsyncButton
          label="Enregistrer l’organisation"
          disabled={orgName.trim().length < 2}
          onSuccess="Organisation enregistrée."
          action={async () => {
            await request(
              organization ? "/organizations/current" : "/organizations",
              {
                method: organization ? "PATCH" : "POST",
                body: { name: orgName.trim(), sector, city, country },
              },
            );
            await refreshOrganization();
          }}
        />
      </RobiaCard>
    </RobiaScreen>
  );
}
