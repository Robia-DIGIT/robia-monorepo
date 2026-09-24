import { AsyncButton, LoadState } from '@/components/api-ui';
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
import { useFilterMotion } from '@/hooks/use-filter-motion';
import { useFilterSwipe } from '@/hooks/use-filter-swipe';
import { useRobiaData } from "@/src/api/data";
import { DOCUMENT_STATUS_LABELS } from '@/src/api/presentation';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from 'expo-router';
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const TYPE_LABELS: Record<string, string> = {
  local_page: "Page locale",
  faq: "FAQ",
  meta: "Métadonnées SEO",
  gbp_post: "Publication Google",
  review_reply: "Réponse à un avis",
  dev_brief: "Brief développeur",
  checklist: "Checklist d’exécution",
};
export default function ExecutionPackScreen() {
  const { documents, opportunities, isLoading, error, refresh } = useRobiaData();
  const [filter, setFilter] = useState("Tous");
  const ready = documents.filter((item) => ["edited", "approved", "validated"].includes(item.status)).length;
  const filters = ["Tous", "À valider", "Validés"] as const;
  const { motion, reduceMotion } = useFilterMotion();
  const swipeGesture = useFilterSwipe({
    motion,
    filters,
    selected: filter,
    onChange: setFilter,
    previousTab: '/(tabs)/opportunities',
    nextTab: '/(tabs)/progress',
  });

  return (
    <RobiaScreen fixedHeader scroll={false} swipeGesture={swipeGesture}
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 }}>
      <RobiaFixedHeader>
        <RobiaHeader compact
          eyebrow="CENTRE DE PRODUCTION"
          title="Documents"
          subtitle="Les livrables générés par RobIA restent sous votre contrôle avant publication."
        />
        <SiteSelector />
        <FilterChips options={filters} selected={filter} onChange={setFilter} swipeToSelect />
      </RobiaFixedHeader>
      <FilterTransition filterKey={filter} options={filters} motion={motion}
        reduceMotion={reduceMotion} swipeGesture={swipeGesture} refreshing={isLoading} onRefresh={refresh}>
        {(filter) => {
          const visibleDocuments = documents.filter((item) => {
            if (filter === "À valider") return ["draft", "needs_review"].includes(item.status);
            if (filter === "Validés") return ["approved", "validated"].includes(item.status);
            return true;
          });
          return (<>
            <LoadState loading={isLoading} error={error} retry={refresh} />
            <AsyncButton label="Historique des validations" action={async () => router.push("/validations")} />
            <View style={styles.progressCard}>
              <IconBadge name="description" />
              <View style={styles.progressCopy}>
                <Text style={robiaStyles.cardTitle}>
                  {visibleDocuments.length} document{visibleDocuments.length > 1 ? "s" : ""}
                </Text>
                <Text style={robiaStyles.body}>
                  {ready} modifié{ready > 1 ? "s" : ""} ou validé
                  {ready > 1 ? "s" : ""}.
                </Text>
              </View>
            </View>
            {isLoading && !documents.length ? (
              <ActivityIndicator color={Brand.teal} />
            ) : null}
            {!isLoading && !visibleDocuments.length ? (
              <RobiaCard>
                <Text style={robiaStyles.cardTitle}>Aucun document</Text>
                <Text style={robiaStyles.body}>
                  {opportunities.length
                    ? "Ouvrez une opportunité et touchez « Créer » pour générer son premier livrable."
                    : "Les documents seront disponibles après votre premier audit."}
                </Text>
              </RobiaCard>
            ) : null}
            {visibleDocuments.map((doc) => (
              <RobiaCard key={doc.id} style={styles.card}>
                <View style={styles.documentIcon}>
                  <MaterialIcons
                    name="description"
                    size={23}
                    color={Brand.tealDark}
                  />
                </View>
                <View style={styles.documentCopy}>
                  <Text style={robiaStyles.caption}>
                    {TYPE_LABELS[doc.type] ?? doc.type}
                  </Text>
                  <Text style={robiaStyles.cardTitle}>{doc.title}</Text>
                  <AsyncButton label="Ouvrir et modifier" action={async () => router.push({ pathname: "/document", params: { id: doc.id } })} />
                  <Text numberOfLines={2} style={robiaStyles.body}>
                    {doc.content}
                  </Text>
                </View>
                <StatusPill
                  label={DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                  tone={["validated", "approved"].includes(doc.status) ? "teal" : ["needs_review", "rejected"].includes(doc.status) ? "orange" : "neutral"}
                />
              </RobiaCard>
            ))}
          </>);
        }}
      </FilterTransition>
    </RobiaScreen>
  );
}
const styles = StyleSheet.create({
  progressCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Brand.tealLight,
  },
  progressCopy: { flex: 1, gap: 2 },
  card: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  documentIcon: {
    width: 46,
    height: 54,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.slate100,
  },
  documentCopy: { flex: 1, gap: 4 },
});
