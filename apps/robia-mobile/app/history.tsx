import { LoadState, apiStyles as s } from "@/components/api-ui";
import { RobiaCard, RobiaFixedHeader, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import { SiteSelector } from "@/components/site-selector";
import { useRobiaData } from "@/src/api/data";
import { auditScore } from "@/src/api/presentation";
import type { Audit } from "@/src/api/types";
import { useResource } from "@/src/api/use-resource";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";
export default function HistoryScreen() {
  const { selectedWebsiteId } = useRobiaData();
  const resource = useResource<Audit[]>(
    selectedWebsiteId
      ? "/audits?website_id=" + encodeURIComponent(selectedWebsiteId)
      : null,
  );
  return (
    <RobiaScreen
      fixedHeader
      refreshing={resource.loading}
      onRefresh={resource.reload}
    >
      <RobiaFixedHeader>
        <RobiaHeader compact back title="Historique des audits" />
        <SiteSelector />
      </RobiaFixedHeader>
      <LoadState
        {...resource}
        retry={resource.reload}
        empty={!resource.data?.length}
      />
      {resource.data?.map((a) => (
        <Pressable
          key={a.id}
          accessibilityRole="button"
          accessibilityLabel={`Audit du ${new Date(a.createdAt).toLocaleString("fr-FR")}. ${a.status === "completed" ? "Terminé" : a.status === "failed" ? "Échec" : "En cours"}. ${auditScore(a).label} : ${auditScore(a).value ?? "non mesuré"} sur 100`}
          accessibilityHint="Ouvre le détail de cet audit"
          onPress={() =>
            router.push({ pathname: "/audit-detail", params: { id: a.id } })
          }
        >
          <RobiaCard style={s.stack}>
            <Text style={s.title}>
              {new Date(a.createdAt).toLocaleString("fr-FR")}
            </Text>
            <Text style={s.body}>
              {a.status === "completed"
                ? "Terminé"
                : a.status === "failed"
                  ? "Échec"
                  : "En cours"}{" "}
              · {auditScore(a).label} : {auditScore(a).value ?? "—"}/100
            </Text>
          </RobiaCard>
        </Pressable>
      ))}
    </RobiaScreen>
  );
}
