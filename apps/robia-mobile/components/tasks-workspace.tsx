import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AsyncButton, LoadState } from '@/components/api-ui';
import { CollectionHeading, CollectionRail, EmptyCollection, FilterButton, SearchBox, c } from '@/components/collection-ui';
import { SiteSelector } from '@/components/site-selector';
import { StatusPill } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useLocalDay } from '@/hooks/use-local-day';
import { useRobiaData } from '@/src/api/data';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { shareActionPdf } from '@/src/api/export';
import { ACTION_STATUS_LABELS } from '@/src/api/presentation';
import { AGENDA_GROUPS, agendaKey, dueDay, selectTasks, taskSummary, type TaskFilter } from '@/src/api/workspace-presentation';
import type { ActionItem, ActionStatus } from '@/src/api/types';

const STATES: readonly { id: ActionStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'À faire', color: '#60849A' },
  { id: 'in_progress', label: 'En cours', color: Brand.tealDark },
  { id: 'blocked', label: 'Bloquées', color: '#B55329' },
  { id: 'done', label: 'Terminées', color: '#41865A' },
  { id: 'ignored', label: 'Écartées', color: Brand.slate500 },
];
export function TasksWorkspace() {
  const { selectedWebsiteId, generatePlan } = useRobiaData();
  const { request } = useSession();
  const now = useLocalDay();
  const { contentWidth } = useResponsiveLayout();
  const [scope, setScope] = useState<'all' | 'site'>('all');
  const resource = useResource<ActionItem[]>(scope === 'all' ? '/actions' : selectedWebsiteId ? '/actions?website_id=' + encodeURIComponent(selectedWebsiteId) : null);
  const actions = useMemo(() => resource.data ?? [], [resource.data]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [mode, setMode] = useState<'agenda' | 'board'>('agenda');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const summary = useMemo(() => taskSummary(actions, now), [actions, now]);
  const visible = useMemo(() => selectTasks(actions, query, filter, now), [actions, query, filter, now]);
  const missingSite = scope === 'site' && !selectedWebsiteId;
  const unknown = !actions.length && (resource.loading || !!resource.error || missingSite);
  const columnWidth = Math.min(320, contentWidth - 8);
  const reset = () => { setQuery(''); setFilter('all'); };
  return <View style={c.stack}>
    <CollectionRail><FilterButton label="Toute l’entreprise" selected={scope === 'all'} onPress={() => setScope('all')} />
      <FilterButton label="Un site" selected={scope === 'site'} onPress={() => setScope('site')} /></CollectionRail>
    {scope === 'site' ? <SiteSelector /> : null}
    <View style={s.hero}>
      <Text style={s.eyebrow}>MON PLAN DE TRAVAIL</Text>
      <View style={s.heroRow}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.ring}>
          <Svg width={64} height={64} viewBox="0 0 76 76"><Circle cx={38} cy={38} r={32} stroke="#CCE4DC" strokeWidth={6} fill="none" />
            <Circle cx={38} cy={38} r={32} stroke={Brand.tealDark} strokeWidth={6} fill="none" strokeDasharray={2 * Math.PI * 32}
              strokeDashoffset={2 * Math.PI * 32 * (1 - summary.percent / 100)} strokeLinecap="round" rotation={-90} origin="38,38" />
          </Svg><View style={s.ringIcon}><MaterialIcons name="task-alt" size={28} color={Brand.tealDark} /></View>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text style={s.percent}>{unknown ? '—' : summary.percent + '%'}</Text>
          <Text style={s.heroTitle}>{unknown ? 'Votre progression' : summary.active + ' action' + (summary.active === 1 ? '' : 's') + ' à avancer'}</Text>
        </View>
      </View>
      <Text style={c.caption}>{unknown ? 'Les données de votre plan apparaîtront ici.' : summary.done + ' sur ' + summary.total + ' terminées · hors tâches écartées'}</Text>
      <View style={s.stats}>
        {([{ id: 'overdue', label: 'En retard', count: summary.overdue }, { id: 'today', label: 'Aujourd’hui', count: summary.today }, { id: 'pending', label: 'À valider', count: summary.pending }] as const).map(item =>
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label + ' : ' + (unknown ? 'indisponible' : item.count)}
            onPress={() => { setFilter(item.id); setQuery(''); }} style={s.stat}>
            <Text style={[s.statNumber, item.id === 'overdue' && item.count > 0 && { color: '#A24325' }]}>{unknown ? '—' : item.count}</Text>
            <Text style={c.caption}>{item.label}</Text>
          </Pressable>)}
      </View>
    </View>
    {resource.loading || resource.error ? <LoadState {...resource} retry={resource.reload} /> : null}
    <View style={s.tools}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/opportunities')} style={c.textButton}><Text style={c.link}>Explorer les opportunités →</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: toolsOpen }} onPress={() => setToolsOpen(!toolsOpen)} style={s.organize}>
        <MaterialIcons name="tune" size={19} color={Brand.tealDark} /><Text style={c.link}>Organiser</Text>
      </Pressable>
    </View>
    {toolsOpen ? <View style={s.toolsPanel}>
      <Text style={c.body}>La planification concerne toute l’entreprise. Le PDF respecte le périmètre sélectionné.</Text>
      <AsyncButton label="Planifier les actions de l’entreprise" disabled={!actions.length || missingSite}
        action={async () => { await generatePlan(); await resource.reload(); }} />
      <AsyncButton label="Partager le plan PDF" disabled={!actions.length || missingSite} action={() => shareActionPdf(request, scope === 'site' ? selectedWebsiteId : null)} />
      <AsyncButton label="Actualiser le suivi" disabled={missingSite} action={resource.reload} />
    </View> : null}
    <SearchBox value={query} onChange={setQuery} placeholder="Rechercher une action" />
    <CollectionRail>
      <FilterButton label="Toutes" selected={filter === 'all'} onPress={() => setFilter('all')} />
      {STATES.map(item => <FilterButton key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />)}
      <FilterButton label="En retard" selected={filter === 'overdue'} onPress={() => setFilter('overdue')} />
      <FilterButton label="Aujourd’hui" selected={filter === 'today'} onPress={() => setFilter('today')} />
      <FilterButton label="À valider" selected={filter === 'pending'} onPress={() => setFilter('pending')} />
    </CollectionRail>
    <View style={s.viewSwitch}>
      {[{ id: 'agenda', label: 'Agenda', icon: 'view-agenda' }, { id: 'board', label: 'Tableau', icon: 'view-column' }].map(item =>
        <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: mode === item.id }} onPress={() => setMode(item.id as 'agenda' | 'board')}
          style={[s.viewButton, mode === item.id && s.viewSelected]}>
          <MaterialIcons name={item.icon as 'view-agenda' | 'view-column'} size={18} color={mode === item.id ? Brand.tealDark : Brand.slate500} />
          <Text style={s.viewLabel}>{item.label}</Text>
        </Pressable>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={c.caption}>{visible.length} action{visible.length === 1 ? '' : 's'} · {scope === 'all' ? 'Toute l’entreprise' : 'Site sélectionné'}</Text>
    {missingSite ? <EmptyCollection title="Choisissez un site" message="Sélectionnez un site ou revenez au périmètre de toute l’entreprise." action="Toute l’entreprise" onPress={() => setScope('all')} /> : null}
    {!missingSite && !resource.loading && !resource.error && !visible.length ? <EmptyCollection icon="event-available" title={actions.length ? 'Aucune action dans cette vue' : 'Votre prochain pas commence ici'}
      message={actions.length ? 'Changez de filtre ou effacez la recherche pour retrouver vos tâches.' : 'Ajoutez une opportunité à votre plan pour organiser sa réalisation.'}
      action={actions.length ? 'Réinitialiser les filtres' : 'Explorer les opportunités'} onPress={actions.length ? reset : () => router.push('/opportunities')} /> : null}
    {mode === 'agenda' ? AGENDA_GROUPS.map(group => {
      const tasks = visible.filter(task => agendaKey(task, now) === group.id);
      return tasks.length ? <View key={group.id} style={{ gap: 12 }}>
        <CollectionHeading title={group.label} detail={group.hint + ' · ' + tasks.length} />
        <View>{tasks.map((task, index) => <View key={task.id} style={s.timelineRow}>
          <View style={s.timelineRail}><View style={[s.timelineDot, group.id === 'overdue' && { backgroundColor: '#B55329' }]} />
            {index < tasks.length - 1 ? <View style={s.timelineLine} /> : null}
          </View><View style={{ flex: 1, minWidth: 0, paddingBottom: 12 }}><TaskCard task={task} now={now} /></View>
        </View>)}</View>
      </View> : null;
    }) : visible.length ? <CollectionRail snap={columnWidth + 10}>
      {STATES.map(state => {
        const tasks = visible.filter(task => task.status === state.id);
        return tasks.length ? <View key={state.id} style={[s.column, { width: columnWidth }]}>
          <View style={s.columnHeading}><View style={[s.columnDot, { backgroundColor: state.color }]} /><Text style={s.columnTitle}>{state.label}</Text><Text style={c.caption}>{tasks.length}</Text></View>
          {(expanded[state.id] ? tasks : tasks.slice(0, 5)).map(task => <TaskCard key={task.id} task={task} now={now} />)}
          {tasks.length > 5 ? <Pressable accessibilityRole="button" onPress={() => setExpanded(current => ({ ...current, [state.id]: !current[state.id] }))} style={c.textButton}>
            <Text style={c.link}>{expanded[state.id] ? 'Réduire la colonne' : 'Afficher les ' + tasks.length + ' actions'}</Text>
          </Pressable> : null}
        </View> : null;
      })}
    </CollectionRail> : null}
  </View>;
}
export function TaskCard({ task, now }: { task: ActionItem; now: Date }) {
  const due = dueDay(task.dueDate);
  const late = agendaKey(task, now) === 'overdue';
  const state = STATES.find(item => item.id === task.status)!;
  const dueLabel = due ? due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'À planifier';
  return <Pressable accessibilityRole="button" accessibilityLabel={task.title + '. ' + ACTION_STATUS_LABELS[task.status] + '. ' + (late ? 'En retard. ' : '') + dueLabel}
    accessibilityHint="Ouvrir le détail, les validations et les preuves de réalisation"
    onPress={() => router.push({ pathname: '/action', params: { id: task.id } })} style={({ pressed }) => [s.task, pressed && c.pressed]}>
    <View style={s.taskTop}><Text style={[s.stateLabel, { color: state.color }]}>{state.label}</Text><MaterialIcons name="north-east" size={17} color={Brand.slate500} /></View>
    <Text style={[s.taskTitle, task.status === 'done' && { color: Brand.slate500 }]}>{task.title}</Text>
    <View style={s.taskMeta}><MaterialIcons name="schedule" size={15} color={late ? '#A24325' : Brand.slate500} /><Text style={[c.caption, late && { color: '#A24325', fontWeight: '700' }]}>{late ? 'En retard · ' : ''}{dueLabel}</Text></View>
    {task.approvalStatus === 'pending' ? <StatusPill label="Validation attendue" tone="orange" /> : null}
    {task.approvalStatus === 'rejected' ? <StatusPill label="Approbation refusée" tone="orange" /> : null}
  </Pressable>;
}
const s = StyleSheet.create({
  hero: { backgroundColor: '#E5F3EC', borderRadius: 24, padding: 18, gap: 8 },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, color: Brand.tealDark, fontWeight: '800' }, heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ring: { width: 64, height: 64 }, ringIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 28, color: Brand.navyDark, fontWeight: '800' }, heroTitle: { color: Brand.navyDark, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderTopColor: '#C8DED4', paddingTop: 12 },
  stat: { flexGrow: 1, flexBasis: 70, minHeight: 48, gap: 3 }, statNumber: { fontSize: 22, color: Brand.navyDark, fontWeight: '800' },
  tools: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  organize: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 }, toolsPanel: { gap: 12, padding: 16, backgroundColor: Brand.surfaceSoft, borderRadius: 18 },
  viewSwitch: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: '#EDF2F1', gap: 4 },
  viewButton: { flex: 1, minHeight: 48, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12 }, viewSelected: { backgroundColor: Brand.white },
  viewLabel: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: Brand.navyDark },
  timelineRow: { flexDirection: 'row', gap: 10 }, timelineRail: { width: 12, alignItems: 'center', paddingTop: 22 },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Brand.tealDark }, timelineLine: { flex: 1, width: 1, backgroundColor: '#CFDEDA', marginTop: 5 },
  task: { padding: 16, borderRadius: 18, backgroundColor: Brand.white, borderWidth: 1, borderColor: '#E3EAE7', gap: 10 },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }, stateLabel: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: .3 },
  taskTitle: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: Brand.navyDark }, taskMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  column: { padding: 12, borderRadius: 20, backgroundColor: '#EDF2F1', gap: 10 }, columnHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 5, minHeight: 40 },
  columnDot: { width: 8, height: 8, borderRadius: 4 }, columnTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: Brand.navyDark },
});
