import { AsyncButton, LoadState, apiStyles as s } from "@/components/api-ui";
import { RobiaCard, RobiaFixedHeader, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import { NavCard } from "@/components/workspace-ui";
import { SiteSelector } from "@/components/site-selector";
import { useRobiaData } from "@/src/api/data";
import { shareActionPdf } from "@/src/api/export";
import type { Connection, Performance } from "@/src/api/integrations";
import { auditScore } from "@/src/api/presentation";
import { useResource } from "@/src/api/use-resource";
import { useSession } from "@/src/auth/session";
import { router } from "expo-router";
import { Text } from "react-native";

const labels: Record<string, string> = {
  clicks: "Clics",
  impressions: "Impressions",
  ctr: "Taux de clic",
  position: "Position moyenne",
  activeUsers: "Utilisateurs actifs",
  totalUsers: "Utilisateurs",
  sessions: "Sessions",
  views: "Pages vues",
  engagementRate: "Taux d’engagement",
};
function PerformanceCard({ title, path }: { title: string; path: string }) {
  const r = useResource<Performance>(path);
  return (
    <RobiaCard style={s.stack}>
      <Text style={s.title}>{title}</Text>
      <LoadState {...r} retry={r.reload} />
      {r.data ? (
        <>
          <Text style={s.body}>{r.data.siteUrl ?? r.data.propertyName}</Text>
          <Text style={s.body}>
            Du {r.data.startDate} au {r.data.endDate}
          </Text>
          {Object.entries(r.data.summary).map(([key, value]) => (
            <Text key={key} style={s.body}>
              {labels[key] ?? key} :{" "}
              {["ctr", "engagementRate"].includes(key)
                ? (value * 100).toFixed(1) + " %"
                : value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
            </Text>
          ))}
          {r.data.topQueries?.length ? (
            <Text style={s.title}>Recherches les plus fréquentes</Text>
          ) : null}
          {r.data.topQueries?.slice(0, 5).map((q) => (
            <Text key={q.key} style={s.body}>
              {q.key} · {q.clicks} clics
            </Text>
          ))}
          {r.data.topPages?.length ? (
            <Text style={s.title}>Pages les plus consultées</Text>
          ) : null}
          {r.data.topPages?.slice(0, 5).map((page, i) => (
            <Text key={page.key ?? page.path ?? i} style={s.body}>
              {page.key ?? page.path} ·{" "}
              {page.clicks != null
                ? page.clicks + " clics"
                : (page.views ?? "—") + " vues"}
            </Text>
          ))}
        </>
      ) : null}
      <AsyncButton label="Actualiser ces performances" action={r.reload} />
    </RobiaCard>
  );
}
export default function ReportsScreen() {
  const { request, organization } = useSession();
  const { actions, selectedWebsiteId, latestAudit, refresh, isLoading, error } =
    useRobiaData();
  const connection = useResource<Connection>(
    organization ? "/integrations/google/search-console/status" : null,
  );
  const score = auditScore(latestAudit);
  const reload = async () => {
    await Promise.all([refresh(), connection.reload()]);
  };
  return (
    <RobiaScreen
      fixedHeader
      refreshing={isLoading || connection.loading}
      onRefresh={reload}
    >
      <RobiaFixedHeader>
        <RobiaHeader compact back title="Mes performances" />
        <SiteSelector />
      </RobiaFixedHeader>
      <LoadState loading={isLoading} error={error} retry={refresh} />
      <RobiaCard style={s.stack}>
        <Text style={s.title}>Diagnostic du site sélectionné</Text>
        <Text style={s.body}>
          {score.label} : {score.value ?? "—"} / 100
        </Text>
        <Text style={s.body}>
          {actions.filter((a) => a.status === "done").length} / {actions.length}{" "}
          actions réalisées
        </Text>
        <AsyncButton
          label="Partager le plan d’action PDF"
          disabled={!actions.length}
          action={() => shareActionPdf(request, selectedWebsiteId)}
        />
      </RobiaCard>
      <Text style={s.body}>
        Les performances ci-dessous concernent les propriétés Google choisies
        pour votre entreprise. Elles sont distinctes du score de diagnostic.
      </Text>
      <AsyncButton
        label="Gérer mes connexions"
        action={async () => router.push("/integrations")}
      />
      <NavCard title="Facebook et Instagram" description="Audience et publications récentes" href="/social" />
      <NavCard title="Performances locales Google" description="Vues, appels et itinéraires de vos établissements" href="/business-profile" />
      <LoadState {...connection} retry={connection.reload} />
      {connection.data?.connected && connection.data.selectedSiteUrl ? (
        <PerformanceCard
          key={connection.data.selectedSiteUrl}
          title="Recherche Google"
          path="/integrations/google/search-console/performance"
        />
      ) : connection.data ? (
        <Text style={s.body}>
          Connectez Google et sélectionnez un site pour consulter ses résultats
          de recherche.
        </Text>
      ) : null}
      {connection.data?.connected &&
      connection.data.analyticsAuthorized &&
      connection.data.selectedAnalyticsPropertyId ? (
        <PerformanceCard
          key={connection.data.selectedAnalyticsPropertyId}
          title="Google Analytics"
          path="/integrations/google/search-console/analytics/performance"
        />
      ) : connection.data ? (
        <Text style={s.body}>
          Sélectionnez une propriété Analytics pour suivre les visites.
        </Text>
      ) : null}
    </RobiaScreen>
  );
}
