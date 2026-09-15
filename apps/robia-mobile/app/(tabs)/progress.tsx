import { router } from 'expo-router';
import { AsyncButton, LoadState } from '@/components/api-ui';
import { SiteSelector } from '@/components/site-selector';
import { useSession } from '@/src/auth/session';
import { shareActionPdf } from '@/src/api/export';
import {
  PrimaryButton,
  RobiaCard,
  RobiaHeader,
  RobiaScreen,
  SectionTitle,
  StatusPill,
  robiaStyles,
} from "@/components/robia-ui";
import { Brand, Fonts } from "@/constants/theme";
import { useRobiaData } from "@/src/api/data";
import type { ActionStatus } from "@/src/api/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
    <RobiaScreen fixedHeader refreshing={isLoading} onRefresh={refresh}>
      <RobiaHeader compact
        eyebrow="PLAN D’ACTION"
        title="Suivi"
        subtitle="Pilotez les actions générées par RobIA et leurs échéances."
      />
      <SiteSelector /><LoadState loading={isLoading} error={error ?? planError} retry={refresh} />
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
        <View style={styles.track}>
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
      {actions.map((task) => (
        <Pressable
          key={task.id}
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
