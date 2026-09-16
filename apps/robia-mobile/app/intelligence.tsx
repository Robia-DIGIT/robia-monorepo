import { AsyncButton, LoadState, apiStyles as s } from "@/components/api-ui";
import { RobiaCard, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import { SiteSelector } from "@/components/site-selector";
import { useRobiaData } from "@/src/api/data";
import type {
  IntelligenceFinding,
  IntelligenceSignal,
} from "@/src/api/intelligence";
import {
  PROVIDER_LABELS,
  PROVIDER_STATUS_LABELS,
} from "@/src/api/presentation";
import { useResource } from "@/src/api/use-resource";
import { useSession } from "@/src/auth/session";
import { router } from "expo-router";
import { Text } from "react-native";

export default function IntelligenceScreen() {
  const { organization } = useSession();
  const { latestAudit } = useRobiaData();
  const status = useResource<IntelligenceSignal[]>(
    organization ? "/intelligence/status" : null,
  );
  const findings = useResource<IntelligenceFinding[]>(
    latestAudit?.status === "completed"
      ? "/intelligence/findings?auditId=" + encodeURIComponent(latestAudit.id)
      : null,
  );
  const refresh = async () => {
    await Promise.all([status.reload(), findings.reload()]);
  };
  return (
    <RobiaScreen
      fixedHeader
      refreshing={status.loading || findings.loading}
      onRefresh={refresh}
    >
      <RobiaHeader compact back title="Vue d’ensemble" />
      <SiteSelector />
      {!organization ? (
        <AsyncButton
          label="Compléter mon organisation"
          action={async () => router.push("/settings")}
        />
      ) : (
        <>
          <Text style={s.body}>
            État des sources de votre entreprise. Les données manquantes ne sont
            pas remplacées par des zéros.
          </Text>
          <LoadState
            {...status}
            retry={status.reload}
            empty={!status.data?.length}
          />
          {status.data?.map((signal) => (
            <RobiaCard key={signal.provider} style={s.stack}>
              <Text style={s.title}>
                {PROVIDER_LABELS[signal.provider] ?? signal.provider}
              </Text>
              <Text style={s.body}>
                {PROVIDER_STATUS_LABELS[signal.status]}
              </Text>
              {signal.observedAt ? (
                <Text style={s.body}>
                  Dernière observation :{" "}
                  {new Date(signal.observedAt).toLocaleString("fr-FR")}
                </Text>
              ) : null}
              {["search_console", "ga4", "meta"].includes(signal.provider) &&
              ["not_connected", "not_configured"].includes(signal.status) ? (
                <AsyncButton
                  label="Configurer la connexion"
                  action={async () => router.push("/integrations")}
                />
              ) : null}
              {signal.status === "ok" &&
              ["search_console", "ga4", "meta"].includes(signal.provider) ? (
                <AsyncButton
                  label="Voir les performances"
                  action={async () => router.push("/reports")}
                />
              ) : null}
            </RobiaCard>
          ))}
          <Text style={s.title}>Constats pour le dernier audit du site</Text>
          {!latestAudit ? (
            <AsyncButton
              label="Lancer un diagnostic"
              action={async () => router.push("/audit")}
            />
          ) : (
            <>
              <LoadState
                {...findings}
                retry={findings.reload}
                empty={
                  latestAudit.status === "completed" && !findings.data?.length
                }
              />
              {latestAudit.status !== "completed" ? (
                <Text style={s.body}>
                  Les constats seront disponibles lorsque l’audit sera terminé.
                </Text>
              ) : null}
              {findings.data?.map((f) => (
                <RobiaCard key={f.provider + ":" + f.ruleCode} style={s.stack}>
                  <Text style={s.body}>
                    {PROVIDER_LABELS[f.provider] ?? f.provider} ·{" "}
                    {f.confidence === "heuristic"
                      ? "Estimation à vérifier"
                      : "Constat"}
                  </Text>
                  <Text style={s.title}>{f.title}</Text>
                  <Text style={s.body}>{f.description}</Text>
                  {(Array.isArray(f.recommendation)
                    ? f.recommendation
                    : [f.recommendation]
                  ).map((text, i) => (
                    <Text key={i} style={s.body}>
                      • {text}
                    </Text>
                  ))}
                  <Text style={s.body}>
                    Impact : {f.impactScore}/10 · Effort : {f.effortScore}/10
                  </Text>
                </RobiaCard>
              ))}
            </>
          )}
        </>
      )}
    </RobiaScreen>
  );
}
