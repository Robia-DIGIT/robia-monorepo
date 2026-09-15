import { AsyncButton, LoadState, apiStyles as s } from "@/components/api-ui";
import { RobiaCard, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import {
  assetLabel,
  assetValue,
  type Asset,
  type Connection,
  type MetaPerformance,
} from "@/src/api/integrations";
import { useResource } from "@/src/api/use-resource";
import { useSession } from "@/src/auth/session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Text } from "react-native";

function AssetList({
  path,
  selectPath,
  field,
  onSelected,
}: {
  path: string;
  selectPath: string;
  field: "siteUrl" | "pageId" | "propertyId";
  onSelected(): Promise<unknown>;
}) {
  const r = useResource<Asset[]>(path);
  const { request } = useSession();
  return (
    <>
      <LoadState {...r} retry={r.reload} empty={!r.data?.length} />
      {r.data?.map((asset) => {
        const value = assetValue(asset, field);
        return (
          <AsyncButton
            key={value}
            label={(asset.selected ? "✓ " : "") + assetLabel(asset)}
            disabled={asset.selected || !value}
            action={async () => {
              await request(selectPath, {
                method: "POST",
                body: { [field]: value },
              });
              await r.reload();
              await onSelected();
            }}
          />
        );
      })}
    </>
  );
}
function ConnectionCard({
  title,
  path,
  meta = false,
}: {
  title: string;
  path: string;
  meta?: boolean;
}) {
  const r = useResource<Connection>(path + "/status");
  const { request } = useSession();
  return (
    <RobiaCard style={s.stack}>
      <Text style={s.title}>{title}</Text>
      <LoadState {...r} retry={r.reload} />
      {r.data ? (
        <>
          <Text style={s.body}>
            {r.data.connected ? "Connecté" : "Non connecté"}
          </Text>
          {r.data.googleAccountEmail || r.data.metaUserName ? (
            <Text style={s.body}>
              {r.data.googleAccountEmail ?? r.data.metaUserName}
            </Text>
          ) : null}
          {r.data.connected ? (
            <>
              <Text style={s.body}>
                {meta
                  ? "Choisissez votre page Facebook."
                  : "Choisissez le site à suivre dans Search Console."}
              </Text>
              <AssetList
                path={path + (meta ? "/assets" : "/sites")}
                selectPath={path + (meta ? "/assets/select" : "/site")}
                field={meta ? "pageId" : "siteUrl"}
                onSelected={r.reload}
              />
              {!meta && r.data.analyticsAuthorized ? (
                <>
                  <Text style={s.title}>Propriété Analytics</Text>
                  <AssetList
                    path={path + "/analytics/properties"}
                    selectPath={path + "/analytics/property"}
                    field="propertyId"
                    onSelected={r.reload}
                  />
                </>
              ) : null}
              <AsyncButton
                label="Déconnecter ce service"
                confirm="Les nouvelles données de ce service ne seront plus synchronisées."
                action={async () => {
                  await request(path, { method: "DELETE" });
                  await r.reload();
                }}
              />
              {meta && r.data.selectedPageId ? (
                <MetaMetrics key={r.data.selectedPageId} />
              ) : null}
            </>
          ) : null}
          {!r.data.connected || (!meta && !r.data.analyticsAuthorized) ? (
            <>
              <Text style={s.body}>
                Terminez la connexion dans votre espace web avec le même compte
                RobIA. Fermez ensuite le navigateur pour revenir ici.
              </Text>
              <AsyncButton
                label={
                  r.data.connected
                    ? "Compléter les autorisations Google"
                    : "Connecter depuis mon espace web"
                }
                action={async () => {
                  // The backend binds OAuth to an HttpOnly browser cookie. A native fetch
                  // followed by a Custom Tab cannot safely share that state.
                  await WebBrowser.openBrowserAsync(
                    "https://app.robiacopilot.site/analyse",
                  );
                  await r.reload();
                }}
              />
            </>
          ) : null}
          <AsyncButton
            label="Voir mes performances"
            action={async () => router.push("/reports")}
          />
        </>
      ) : null}
      <AsyncButton label="Actualiser la connexion" action={r.reload} />
    </RobiaCard>
  );
}
function MetaMetrics() {
  const r = useResource<MetaPerformance>("/integrations/meta/performance");
  return (
    <>
      <Text style={s.title}>Audience sociale</Text>
      <LoadState {...r} retry={r.reload} />
      {r.data ? (
        <>
          <Text style={s.body}>
            {r.data.facebook.pageName} : {r.data.facebook.followersCount ?? "—"}{" "}
            abonnés
          </Text>
          {r.data.instagram ? (
            <Text style={s.body}>
              @{r.data.instagram.username} :{" "}
              {r.data.instagram.followersCount ?? "—"} abonnés ·{" "}
              {r.data.instagram.mediaCount ?? "—"} publications
            </Text>
          ) : null}
        </>
      ) : null}
    </>
  );
}
export default function IntegrationsScreen() {
  const { organization } = useSession();
  return (
    <RobiaScreen fixedHeader>
      <RobiaHeader compact back title="Mes connexions" />
      {organization ? (
        <>
          <ConnectionCard
            title="Google Search Console et Analytics"
            path="/integrations/google/search-console"
          />
          <ConnectionCard
            title="Facebook et Instagram"
            path="/integrations/meta"
            meta
          />
        </>
      ) : (
        <AsyncButton
          label="Compléter mon organisation"
          action={async () => router.push("/settings")}
        />
      )}
    </RobiaScreen>
  );
}
