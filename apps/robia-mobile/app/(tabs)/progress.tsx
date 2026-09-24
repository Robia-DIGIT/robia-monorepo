import { AsyncButton, LoadState } from '@/components/api-ui';
import {
    FilterChips,
    FilterTransition,
    PrimaryButton,
    RobiaCard,
    RobiaFixedHeader,
    RobiaHeader,
    RobiaScreen,
    SectionTitle,
    StatusPill,
    robiaStyles,
} from "@/components/robia-ui";
import { SiteSelector } from '@/components/site-selector';
import { Brand, Fonts } from "@/constants/theme";
import { useFilterMotion } from '@/hooks/use-filter-motion';
import { useFilterSwipe } from '@/hooks/use-filter-swipe';
import { useRobiaData } from "@/src/api/data";
import { shareActionPdf } from '@/src/api/export';
import type { ActionStatus } from "@/src/api/types";
import { useSession } from '@/src/auth/session';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from 'expo-router';
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const LABEL: Record<ActionStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Fait",
  blocked: "Bloqué",
  ignored: "Ignoré",
};
const ICON: Record<
  ActionStatus,
  React.ComponentProps<typeof MaterialIcons>["name"]
> = {
  todo: "radio-button-unchecked",
  in_progress: "pending",
  done: "check-circle",
  blocked: "block",
  ignored: "visibility-off",
};
export default function ProgressScreen() {
  const { actions, isLoading, error, refresh, selectedWebsiteId, generatePlan } =
    useRobiaData();
  const { request } = useSession();
  const [planError, setPlanError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [filter, setFilter] = useState("Toutes");
  const filters = ["Toutes", "À faire", "En cours", "Terminées"] as const;
  const { motion, reduceMotion } = useFilterMotion();
  const swipeGesture = useFilterSwipe({
    motion,
    filters,
    selected: filter,
    onChange: setFilter,
    previousTab: '/(tabs)/execution-pack',
    nextTab: '/(tabs)/profile',
  });

  const { done, percent } = useMemo(() => {
    const count = actions.filter((item) => item.status === "done").length;
    return {
      done: count,
      percent: actions.length ? Math.round((count / actions.length) * 100) : 0,
    };
  }, [actions]);
  async function plan() {
    if (planning) return;
    setPlanError(null); setPlanning(true);
    try {
      await generatePlan();
    } catch (error) { setPlanError(error instanceof Error ? error.message : "Planification impossible."); } finally {
      setPlanning(false);
    }
  }
  return (
    <RobiaScreen fixedHeader scroll={false} swipeGesture={swipeGesture}
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 }}>
      <RobiaFixedHeader>
        <RobiaHeader compact
          eyebrow="PLAN D’ACTION"
          title="Suivi"
          subtitle="Pilotez les actions générées par RobIA et leurs échéances."
        />
        <SiteSelector />
        <FilterChips options={filters} selected={filter} onChange={setFilter} swipeToSelect motion={motion} />
      </RobiaFixedHeader>
      <FilterTransition filterKey={filter} options={filters} motion={motion}
        reduceMotion={reduceMotion} swipeGesture={swipeGesture} refreshing={isLoading} onRefresh={refresh}>
        {(filter) => {
          const visibleActions = actions.filter((item) => {
            if (filter === "À faire") return item.status === "todo";
            if (filter === "En cours") return item.status === "in_progress";
            if (filter === "Terminées") return item.status === "done";
            return true;
          });
          return (<>
            <LoadState loading={isLoading} error={error ?? planError} retry={refresh} />
            <AsyncButton label="Partager le plan PDF" disabled={!actions.length} action={() => shareActionPdf(request, selectedWebsiteId)} />
            <RobiaCard style={styles.hero} accent={Brand.teal}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.percent}>{percent}%</Text>
                  <Text style={robiaStyles.body}>
                    {done} action{done > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}{" "}
                    sur {actions.length}
                  </Text>
                </View>
                <MaterialIcons
                  name="calendar-month"
                  size={30}
                  color={Brand.tealDark}
                />
              </View>
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Progression du plan d’action"
                accessibilityValue={{ min: 0, max: 100, now: percent, text: `${done} actions terminées sur ${actions.length}` }}
                style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%` }]} />
              </View>
            </RobiaCard>
            {actions.length ? (
              <PrimaryButton
                label={planning ? "Planification…" : "Planifier les actions de l’entreprise"}
                icon="event"
                disabled={planning}
                onPress={() => void plan()}
              />
            ) : null}
            <SectionTitle title="Actions prioritaires" />
            {isLoading && !actions.length ? (
              <ActivityIndicator color={Brand.teal} />
            ) : null}
            {!isLoading && !actions.length ? (
              <RobiaCard>
                <Text style={robiaStyles.cardTitle}>Votre plan est vide</Text>
                <Text style={robiaStyles.body}>
                  Ajoutez une opportunité au plan pour générer les actions
                  correspondantes.
                </Text>
              </RobiaCard>
            ) : null}
            {visibleActions.map((task) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                accessibilityLabel={`${task.title}. Statut : ${LABEL[task.status]}. ${task.dueDate ? `Échéance le ${new Date(task.dueDate).toLocaleDateString('fr-FR')}` : 'Échéance à planifier'}`}
                accessibilityHint="Ouvre le détail de cette action"
                onPress={() => router.push({ pathname: "/action", params: { id: task.id } })}
              >
                <RobiaCard style={styles.task}>
                  <MaterialIcons
                    name={ICON[task.status]}
                    size={24}
                    color={
                      task.status === "done"
                        ? Brand.teal
                        : task.status === "in_progress"
                          ? Brand.orange
                          : Brand.slate400
                    }
                  />
                  <View style={styles.taskCopy}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.status === "done" && styles.taskDone,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={robiaStyles.caption}>
                      {task.dueDate
                        ? `Échéance · ${new Date(task.dueDate).toLocaleDateString("fr-FR")}`
                        : "Échéance à planifier"}
                    </Text>
                  </View>
                  <StatusPill
                    label={LABEL[task.status]}
                    tone={
                      task.status === "done"
                        ? "teal"
                        : task.status === "in_progress"
                          ? "orange"
                          : "neutral"
                    }
                  />
                </RobiaCard>
              </Pressable>
            ))}
            {!isLoading && actions.length > 0 && !visibleActions.length ? (
              <RobiaCard>
                <Text style={robiaStyles.cardTitle}>Aucune action dans ce filtre</Text>
                <Text style={robiaStyles.body}>Choisissez un autre statut pour afficher votre plan.</Text>
              </RobiaCard>
            ) : null}
          </>);
        }}
      </FilterTransition>
    </RobiaScreen>
  );
}
const styles = StyleSheet.create({
  hero: { gap: 16 },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  percent: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 38,
    fontWeight: "900",
  },
  track: {
    height: 9,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: Brand.slate100,
  },
  fill: { height: "100%", borderRadius: 99, backgroundColor: Brand.teal },
  task: { flexDirection: "row", alignItems: "center", gap: 12 },
  taskCopy: { flex: 1, gap: 3 },
  taskTitle: {
    color: Brand.slate800,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  taskDone: { color: Brand.slate400, textDecorationLine: "line-through" },
});
