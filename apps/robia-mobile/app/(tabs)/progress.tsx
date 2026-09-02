import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RobiaCard, RobiaHeader, RobiaScreen, SectionTitle, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { MOCK_PLAN_WEEKS, TASK_STATUS_LABEL, type TaskStatus } from '@/src/data/mock';

const STATUS_CYCLE: TaskStatus[] = ['todo', 'in_progress', 'done'];
const STATUS_ICON: Record<TaskStatus, React.ComponentProps<typeof MaterialIcons>['name']> = { todo: 'radio-button-unchecked', in_progress: 'pending', done: 'check-circle' };

export default function ProgressScreen() {
  const [weeks, setWeeks] = useState(MOCK_PLAN_WEEKS);
  const { done, total, percent } = useMemo(() => {
    const tasks = weeks.flatMap((week) => week.tasks);
    const doneCount = tasks.filter((task) => task.status === 'done').length;
    return { done: doneCount, total: tasks.length, percent: tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0 };
  }, [weeks]);

  const toggleTask = (weekIndex: number, taskId: string) => setWeeks((current) => current.map((week, index) => index !== weekIndex ? week : { ...week, tasks: week.tasks.map((task) => task.id === taskId ? { ...task, status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length] } : task) }));

  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="PLAN D’ACTION" title="Suivi 30 jours" subtitle="Avancez étape par étape. Touchez une tâche pour modifier son statut." />
      <RobiaCard style={styles.hero} accent={Brand.teal}>
        <View style={styles.progressHeader}><View><Text style={styles.percent}>{percent}%</Text><Text style={robiaStyles.body}>{done} tâches terminées sur {total}</Text></View><MaterialIcons name="calendar-month" size={30} color={Brand.tealDark} /></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
      </RobiaCard>
      <SectionTitle title="Votre feuille de route" />
      {weeks.map((week, weekIndex) => (
        <RobiaCard key={week.week} style={styles.week}>
          <View style={styles.weekHeader}><Text style={styles.weekTitle}>{week.week}</Text><StatusPill label={`${week.tasks.filter((task) => task.status === 'done').length}/${week.tasks.length}`} tone="navy" /></View>
          {week.tasks.map((task) => (
            <Pressable key={task.id} accessibilityRole="button" onPress={() => toggleTask(weekIndex, task.id)} style={({ pressed }) => [styles.task, pressed && styles.pressed]}>
              <MaterialIcons name={STATUS_ICON[task.status]} size={23} color={task.status === 'done' ? Brand.teal : task.status === 'in_progress' ? Brand.orange : Brand.slate400} />
              <View style={styles.taskCopy}><Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]}>{task.title}</Text><Text style={robiaStyles.caption}>{TASK_STATUS_LABEL[task.status]}</Text></View>
            </Pressable>
          ))}
        </RobiaCard>
      ))}
    </RobiaScreen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 16 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  percent: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 38, fontWeight: '900' },
  track: { height: 9, borderRadius: 99, overflow: 'hidden', backgroundColor: Brand.slate100 },
  fill: { height: '100%', borderRadius: 99, backgroundColor: Brand.teal },
  week: { gap: 4 },
  weekHeader: { marginBottom: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  weekTitle: { flex: 1, color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 16, fontWeight: '800' },
  task: { minHeight: 62, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: Brand.slate100 },
  taskCopy: { flex: 1, gap: 2 },
  taskTitle: { color: Brand.slate800, fontFamily: Fonts?.sans, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  taskDone: { color: Brand.slate400, textDecorationLine: 'line-through' },
  pressed: { opacity: 0.65 },
});
