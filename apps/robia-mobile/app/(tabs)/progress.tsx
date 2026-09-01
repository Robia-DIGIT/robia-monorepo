import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  MOCK_PLAN_WEEKS,
  TASK_STATUS_LABEL,
  type TaskStatus,
} from '@/src/data/mock';

const STATUS_CYCLE: TaskStatus[] = ['todo', 'in_progress', 'done'];

function nextStatus(status: TaskStatus): TaskStatus {
  const index = STATUS_CYCLE.indexOf(status);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const [weeks, setWeeks] = useState(MOCK_PLAN_WEEKS);

  const { done, total, percent } = useMemo(() => {
    const tasks = weeks.flatMap((week) => week.tasks);
    const doneCount = tasks.filter((task) => task.status === 'done').length;
    return {
      done: doneCount,
      total: tasks.length,
      percent: tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100),
    };
  }, [weeks]);

  function toggleTask(weekIndex: number, taskId: string) {
    setWeeks((current) =>
      current.map((week, index) =>
        index !== weekIndex
          ? week
          : {
              ...week,
              tasks: week.tasks.map((task) =>
                task.id === taskId ? { ...task, status: nextStatus(task.status) } : task
              ),
            }
      )
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Suivi</ThemedText>
          <ThemedText>Plan SEO local sur 30 jours.</ThemedText>

          <ThemedView style={styles.progressBlock}>
            <ThemedText type="defaultSemiBold">
              Avancement global · {done}/{total} ({percent} %)
            </ThemedText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%`, backgroundColor: tint }]} />
            </View>
          </ThemedView>

          {weeks.map((week, weekIndex) => (
            <ThemedView key={week.week} style={styles.week}>
              <ThemedText type="subtitle">{week.week}</ThemedText>
              {week.tasks.map((task) => (
                <Pressable
                  key={task.id}
                  accessibilityRole="button"
                  onPress={() => toggleTask(weekIndex, task.id)}
                  style={styles.taskRow}>
                  <ThemedText type="defaultSemiBold">{task.title}</ThemedText>
                  <ThemedText>{TASK_STATUS_LABEL[task.status]}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  progressBlock: {
    gap: 10,
    padding: 16,
    borderRadius: Radius.lg,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#68707633',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  week: {
    gap: 10,
    padding: 16,
    borderRadius: Radius.lg,
  },
  taskRow: {
    gap: 4,
    paddingVertical: 8,
  },
});
