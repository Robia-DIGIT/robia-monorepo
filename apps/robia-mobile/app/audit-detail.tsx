import {
  AsyncButton,
  Choices,
  LoadState,
  apiStyles as s,
} from "@/components/api-ui";
import { RobiaCard, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import {
  AUDIT_STATUS_LABELS,
  auditScore,
  isSiteAudit,
  numberOrNull,
  record,
  siteAudit,
  strings,
} from "@/src/api/presentation";
import type { Audit, Opportunity } from "@/src/api/types";
import { useResource } from "@/src/api/use-resource";
import { useSession } from "@/src/auth/session";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

const categories: Record<string, string> = {
  technical: "Technique",
  content: "Contenu",
  local: "Présence locale",
  performance: "Performance",
  ai_readiness: "Compréhension par les IA",
};
const statuses: Record<string, string> = {
  passed: "Conforme",
  warning: "À améliorer",
  failed: "À corriger",
  not_tested: "Non évalué",
  unavailable: "Indisponible",
};
function Detail({ id }: { id: string }) {
  const { request } = useSession();
  const r = useResource<Audit>(
    id ? "/audits/" + encodeURIComponent(id) : null,
    {
      pollIntervalMs: 5000,
      shouldPoll: (audit) =>
        !!audit && ["pending", "running"].includes(audit.status),
    },
  );
  const opportunities = useResource<Opportunity[]>(
    r.data?.status === "completed"
      ? "/opportunities?audit_id=" + encodeURIComponent(id)
      : null,
  );
  const [filter, setFilter] = useState("attention");
  const [limit, setLimit] = useState(12);
  const score = auditScore(r.data);
  const result = siteAudit(r.data?.resultJson ?? null);
  const v2 = record(result.seo_score_v2);
  const findings = Array.isArray(result.detailed_findings)
    ? result.detailed_findings.map(record)
    : [];
  const shown = findings.filter(
    (f) => filter === "all" || ["failed", "warning"].includes(String(f.status)),
  );
  return (
    <RobiaScreen fixedHeader refreshing={r.loading} onRefresh={r.reload}>
      <RobiaHeader compact back title="Résultat du diagnostic" />
      <LoadState {...r} retry={r.reload} />
      {r.data ? (
        <>
          <RobiaCard style={s.stack}>
            <Text style={s.title}>
              {score.label} : {score.value ?? "—"} / 100
            </Text>
            <Text style={s.body}>
              {new Date(r.data.createdAt).toLocaleString("fr-FR")} ·{" "}
              {AUDIT_STATUS_LABELS[r.data.status]}
            </Text>
            {numberOrNull(result.pages_analyzed) !== null ? (
              <Text style={s.body}>
                {String(result.pages_analyzed)} pages analysées
              </Text>
            ) : null}
            {r.data.errorMessage ? (
              <Text accessibilityRole="alert" style={s.body}>
                {r.data.errorMessage}
              </Text>
            ) : null}
            {r.data.status === "running" || r.data.status === "pending" ? (
              <Text style={s.body}>
                L’analyse continue. Cet écran se met à jour automatiquement.
              </Text>
            ) : null}
          </RobiaCard>
          {Object.keys(record(v2.categories)).length ? (
            <RobiaCard style={s.stack}>
              <Text style={s.title}>Détail du score SEO</Text>
              <Text style={s.body}>
                Les catégories non mesurées ne sont pas comptées comme des
                échecs.
              </Text>
              {Object.entries(record(v2.categories)).map(([key, value]) => {
                const item = record(value);
                const score = numberOrNull(item.score);
                return (
                  <Text key={key} style={s.body}>
                    {categories[key] ?? key} :{" "}
                    {score === null ? "Non mesuré" : score + " / 100"}
                  </Text>
                );
              })}
            </RobiaCard>
          ) : null}
          {findings.length ? (
            <>
              <Text style={s.title}>Points de contrôle</Text>
              <Choices
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "attention", label: "À traiter" },
                  { value: "all", label: "Tous les contrôles" },
                ]}
              />
              {!shown.length ? (
                <Text style={s.body}>
                  Aucun point à corriger parmi les contrôles reçus.
                </Text>
              ) : null}
              {shown.slice(0, limit).map((f, index) => (
                <RobiaCard key={String(f.rule_code ?? index)} style={s.stack}>
                  <Text style={s.body}>
                    {statuses[String(f.status)] ?? "À vérifier"} ·{" "}
                    {categories[String(f.category)] ?? "Diagnostic"}
                  </Text>
                  <Text style={s.title}>
                    {typeof f.title === "string"
                      ? f.title
                      : "Point de contrôle"}
                  </Text>
                  {typeof f.why_it_matters === "string" ? (
                    <Text style={s.body}>{f.why_it_matters}</Text>
                  ) : null}
                  {strings(f.recommended_steps).map((step, i) => (
                    <Text key={i} style={s.body}>
                      • {step}
                    </Text>
                  ))}
                  {strings(f.affected_urls)
                    .slice(0, 3)
                    .map((url) => (
                      <Text selectable key={url} style={s.body}>
                        {url}
                      </Text>
                    ))}
                </RobiaCard>
              ))}
              {shown.length > limit ? (
                <AsyncButton
                  label="Afficher plus de contrôles"
                  action={async () => setLimit((n) => n + 12)}
                />
              ) : null}
            </>
          ) : null}
          {r.data.status === "completed" ? (
            <>
              <Text style={s.title}>Opportunités de cet audit</Text>
              <LoadState
                {...opportunities}
                retry={opportunities.reload}
                empty={!opportunities.data?.length}
              />
              <AsyncButton
                label="Générer les recommandations"
                action={async () => {
                  await request(
                    isSiteAudit(r.data!.resultJson)
                      ? "/opportunities/generate-site"
                      : "/opportunities/generate",
                    {
                      method: "POST",
                      body: { auditId: id },
                      timeoutMs: 180000,
                    },
                  );
                  await opportunities.reload();
                }}
              />
              {opportunities.data?.map((o) => (
                <AsyncButton
                  key={o.id}
                  label={o.title}
                  action={async () =>
                    router.push({
                      pathname: "/opportunity",
                      params: { id: o.id },
                    })
                  }
                />
              ))}
            </>
          ) : null}
        </>
      ) : null}
    </RobiaScreen>
  );
}
export default function AuditDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Detail key={id} id={id} />;
}
