import {
    FilterChips,
    FilterTransition,
    IconBadge,
    RobiaCard,
    RobiaFixedHeader,
    RobiaHeader,
    RobiaScreen,
    StatusPill,
    robiaStyles,
} from "@/components/robia-ui";
import { SiteSelector } from '@/components/site-selector';
import { Brand } from "@/constants/theme";
import { useFilterSwipe } from '@/hooks/use-filter-swipe';
import { useRobiaData } from "@/src/api/data";
import type { Opportunity } from "@/src/api/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from 'expo-router';
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function OpportunitiesScreen() {
  const {
    opportunities,
    latestAudit,
    isLoading,
    error,
    refresh,
    generateActions,
  } = useRobiaData();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("Toutes");
  const filters = ["Toutes", "Prioritaires", "Faible effort"] as const;
  const swipeGesture = useFilterSwipe({
    filters,
    selected: filter,
    onChange: setFilter,
    previousTab: '/(tabs)/dashboard',
    nextTab: '/(tabs)/execution-pack',
  });
  const visibleOpportunities = opportunities.filter((item) => {
    if (filter === "Prioritaires") return item.impactScore >= 7;
    if (filter === "Faible effort") return item.effortScore <= 4;
    return true;
  });
  async function act(id: string, kind: "document" | "actions") {
    if (busyId) return;
    setActionError(null);
    setBusyId(id);
    try {
      if (kind === "document") { router.push({ pathname: "/opportunity", params: { id } }); return; }
      else await generateActions(id);
    } catch (error) { setActionError(error instanceof Error ? error.message : "Action impossible."); } finally {
      setBusyId(null);
    }
  }
  return (
    <RobiaScreen fixedHeader refreshing={isLoading} onRefresh={refresh} swipeGesture={swipeGesture}>
      <RobiaFixedHeader>
        <RobiaHeader compact
          eyebrow="RECOMMANDATIONS IA"
          title="Opportunités"
          subtitle="Les actions les plus utiles détectées à partir de votre dernier audit."
        />
        <SiteSelector />
        <FilterChips options={filters} selected={filter} onChange={setFilter} swipeToSelect />
      </RobiaFixedHeader>
      <FilterTransition filterKey={filter} index={filters.indexOf(filter as typeof filters[number])}>
        {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
      {/* {latestAudit?.status === "completed" ? <><AsyncButton label="Actualiser les recommandations" action={async () => { await request(isSiteAudit(latestAudit.resultJson) ? "/opportunities/generate-site" : "/opportunities/generate", { method: "POST", body: { auditId: latestAudit.id }, timeoutMs: 180000 }); await refresh(); }} /></> : null} */}
      <View style={styles.summary}>
        <Text style={styles.summaryCount}>{visibleOpportunities.length}</Text>
        <Text style={robiaStyles.body}>opportunités classées par impact.</Text>
      </View>
      {isLoading && !opportunities.length ? (
        <ActivityIndicator color={Brand.teal} />
      ) : null}
      {error ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Réessayer le chargement des opportunités" onPress={() => void refresh()}>
          <RobiaCard>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.retry}>Toucher pour réessayer</Text>
          </RobiaCard>
        </Pressable>
      ) : null}
      {!isLoading && !latestAudit ? (
        <RobiaCard>
          <Text style={robiaStyles.cardTitle}>Aucun audit disponible</Text>
          <Text style={robiaStyles.body}>
            Lancez votre premier audit depuis l’accueil pour recevoir des
            recommandations.
          </Text>
        </RobiaCard>
      ) : null}
      {visibleOpportunities.map((item, index) => (
        <OpportunityCard
          key={item.id}
          item={item}
          index={index}
          busy={busyId === item.id}
          onAction={act}
        />
      ))}
      {!isLoading && latestAudit && !visibleOpportunities.length ? (
        <RobiaCard>
          <Text style={robiaStyles.cardTitle}>Aucune opportunité dans ce filtre</Text>
          <Text style={robiaStyles.body}>Essayez un autre filtre pour voir les recommandations disponibles.</Text>
        </RobiaCard>
      ) : null}
      </FilterTransition>
    </RobiaScreen>
  );
}

function OpportunityCard({
  item,
  index,
  busy,
  onAction,
}: {
  item: Opportunity;
  index: number;
  busy: boolean;
  onAction(id: string, kind: "document" | "actions"): Promise<void>;
}) {
  const impact =
    item.impactScore >= 7
      ? "Prioritaire"
      : item.impactScore >= 4
        ? "Moyen"
        : "Faible";
  return (
    <RobiaCard style={styles.card}>
      <View style={styles.cardHeader}>
        <IconBadge
          name={opportunityIcon(item.category)}
          backgroundColor={index === 0 ? Brand.orangeLight : Brand.tealLight}
          color={index === 0 ? Brand.orangeDark : Brand.tealDark}
        />
        <StatusPill
          label={impact}
          tone={impact === "Prioritaire" ? "orange" : "teal"}
        />
      </View>
      <View>
        <Text style={robiaStyles.caption}>
          {item.category ?? "Visibilité digitale"}
        </Text>
        <Text style={robiaStyles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={robiaStyles.body}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Meta label="Impact" value={`${item.impactScore}/10`} />
        <Meta label="Effort" value={`${item.effortScore}/10`} />
        <Meta
          label="Confiance"
          value={`${Math.round(item.confidenceScore <= 1 ? item.confidenceScore * 100 : item.confidenceScore)} %`}
        />
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ajouter ${item.title} au plan`}
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={() => void onAction(item.id, "actions")}
          style={styles.secondaryButton}
        >
          <MaterialIcons
            name="playlist-add-check"
            size={18}
            color={Brand.tealDark}
          />
          <Text style={styles.secondaryLabel}>Ajouter au plan</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Créer un document pour ${item.title}`}
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={() => void onAction(item.id, "document")}
          style={styles.primaryButton}
        >
          {busy ? (
            <ActivityIndicator size="small" color={Brand.white} />
          ) : (
            <>
              <MaterialIcons name="description" size={17} color={Brand.white} />
              <Text style={styles.primaryLabel}>Créer</Text>
            </>
          )}
        </Pressable>
      </View>
    </RobiaCard>
  );
}

function opportunityIcon(
  category: string | null,
): React.ComponentProps<typeof MaterialIcons>["name"] {
  const value = category?.toLowerCase() ?? "";
  if (value.includes("local") || value.includes("établissement")) return "location-on";
  if (value.includes("contenu") || value.includes("rédaction")) return "edit-note";
  if (value.includes("tech") || value.includes("performance")) return "speed";
  if (value.includes("seo") || value.includes("référencement")) return "search";
  if (value.includes("visibilité")) return "visibility";
  return "lightbulb";
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={robiaStyles.caption}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  summary: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Brand.tealLight,
  },
  summaryCount: { color: Brand.tealDark, fontSize: 28, fontWeight: "900" },
  card: { gap: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.slate100,
    flexDirection: "row",
    gap: 24,
  },
  meta: { gap: 2 },
  metaValue: { color: Brand.navyDark, fontSize: 13, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 9 },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.tealDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryLabel: { color: Brand.tealDark, fontSize: 13, fontWeight: "800" },
  primaryButton: {
    minWidth: 98,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: Brand.tealDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  primaryLabel: { color: Brand.white, fontSize: 13, fontWeight: "800" },
  error: { color: Brand.orangeDark, fontWeight: "700" },
  retry: { marginTop: 5, color: Brand.tealDark, fontSize: 12 },
});
