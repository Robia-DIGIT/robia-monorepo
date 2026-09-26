import { AppIcon } from '@/components/ui/app-icon';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LoadState } from '@/components/api-ui';
import { CollectionRail, EmptyCollection, FilterButton, SearchBox, c } from '@/components/collection-ui';
import { SiteSelector } from '@/components/site-selector';
import { StatusPill } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useRobiaData } from '@/src/api/data';
import { DOCUMENT_STATUS_LABELS } from '@/src/api/presentation';
import { DOCUMENT_TYPES, documentExcerpt, isApproved, needsReview, selectDocuments, type DocumentFilter } from '@/src/api/workspace-presentation';
import type { RobiaDocument } from '@/src/api/types';

export function DocumentsLibrary() {
  const { documents, isLoading, error, refresh, selectedWebsiteId } = useRobiaData();
  const { contentWidth, fontScale } = useResponsiveLayout();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState<DocumentFilter>('all');
  const [sort, setSort] = useState<'recent' | 'title'>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const canGrid = contentWidth / fontScale >= 340;
  const grid = canGrid && view === 'grid';
  const visible = useMemo(() => selectDocuments(documents, query, type, status, sort), [documents, query, type, status, sort]);
  const review = documents.filter(needsReview).length;
  const approved = documents.filter(isApproved).length;
  const unknownCount = !documents.length && (isLoading || !!error);
  const reset = () => { setQuery(''); setType('all'); setStatus('all'); };
  return <View style={c.stack}>
    <SiteSelector />
    <View style={s.hero}>
      <View style={s.heroRow}><Text style={s.heroTitle}>Bibliothèque</Text><AppIcon name="library" size={30} color="#8ADBC5" /></View>
      <View style={s.stats}>
        {[{ label: 'Documents', count: documents.length, filter: 'all' }, { label: 'À revoir', count: review, filter: 'review' }, { label: 'Validés', count: approved, filter: 'approved' }].map(item =>
          <Pressable key={item.filter} accessibilityRole="button" accessibilityLabel={item.label + ' : ' + (unknownCount ? 'chargement' : item.count)}
            onPress={() => { setQuery(''); setType('all'); setStatus(item.filter as DocumentFilter); }} style={s.stat}>
            <Text style={s.statNumber}>{unknownCount ? '—' : item.count}</Text><Text style={s.statLabel}>{item.label}</Text>
          </Pressable>)}
      </View>
    </View>
    {isLoading || error ? <LoadState loading={isLoading} error={error} retry={refresh} /> : null}
    <View style={s.shortcuts}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/opportunities')} style={s.create}>
        <AppIcon name="add" size={20} color={Brand.white} /><Text style={s.createText}>Créer un contenu</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Historique des validations" onPress={() => router.push('/validations')} style={c.textButton}>
        <Text style={c.link}>Validations</Text>
      </Pressable>
    </View>
    <SearchBox value={query} onChange={setQuery} placeholder="Rechercher dans mes documents" />
    <CollectionRail>
      <CollectionType label="Tout" icon="folder" count={documents.length} selected={type === 'all'} onPress={() => setType('all')} />
      {DOCUMENT_TYPES.filter(item => documents.some(doc => doc.type === item.id)).map(item => <CollectionType key={item.id} label={item.label} icon={item.icon}
        count={documents.filter(doc => doc.type === item.id).length} selected={type === item.id} onPress={() => setType(item.id)} />)}
    </CollectionRail>
    <CollectionRail>
      {([{ value: 'all', label: 'Tous' }, { value: 'review', label: 'À revoir' }, { value: 'approved', label: 'Validés' }, { value: 'rejected', label: 'Rejetés' }] as const)
        .map(item => <FilterButton key={item.value} label={item.label} selected={status === item.value} onPress={() => setStatus(item.value)} />)}
    </CollectionRail>
    <View style={s.toolbar}>
      <Text accessibilityLiveRegion="polite" style={[c.caption, { flex: 1 }]}>{visible.length} résultat{visible.length === 1 ? '' : 's'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={sort === 'recent' ? 'Tri : récents. Trier par titre' : 'Tri : titre. Trier par date'}
        onPress={() => setSort(sort === 'recent' ? 'title' : 'recent')} style={s.sort}>
        <AppIcon name="sort" size={18} color={Brand.slate500} /><Text style={c.caption}>{sort === 'recent' ? 'Récents' : 'A–Z'}</Text>
      </Pressable>
      {canGrid ? <Pressable accessibilityRole="button" accessibilityLabel={grid ? 'Afficher en liste' : 'Afficher en grille'} onPress={() => setView(grid ? 'list' : 'grid')} style={c.iconButton}>
        <AppIcon name={grid ? 'list' : 'grid'} size={22} color={Brand.tealDark} />
      </Pressable> : null}
    </View>
    {!isLoading && !error && !visible.length ? <EmptyCollection icon="folder" title={documents.length ? 'Aucun document correspondant' : 'Votre bibliothèque commence ici'}
      message={documents.length ? 'Essayez un autre mot, une collection ou un statut.' : selectedWebsiteId ? 'Créez un livrable à partir d’une opportunité détectée pour ce site.' : 'Ajoutez ou sélectionnez un site pour retrouver ses contenus.'}
      action={documents.length ? 'Réinitialiser les filtres' : selectedWebsiteId ? 'Explorer les opportunités' : 'Gérer mes sites'}
      onPress={documents.length ? reset : () => router.push(selectedWebsiteId ? '/opportunities' : '/websites')} /> : null}
    <View style={s.documents}>{visible.map(doc => <DocumentTile key={doc.id} document={doc} compact={!grid} width={grid ? (contentWidth - 12) / 2 : contentWidth} />)}</View>
  </View>;
}
function CollectionType({ label, icon, count, selected, onPress }: { label: string; icon: React.ComponentProps<typeof AppIcon>['name']; count: number; selected: boolean; onPress(): void }) {
  const { fontScale } = useResponsiveLayout();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label + ', ' + count + ' documents'} onPress={onPress}
    style={[s.collection, { width: 126 * Math.min(fontScale, 1.6) }, selected && s.collectionActive]}>
    <View style={s.collectionTop}><AppIcon name={icon} size={24} color={Brand.tealDark} /><Text style={s.collectionCount}>{count}</Text></View>
    <Text style={s.collectionLabel}>{label}</Text>
  </Pressable>;
}
export function DocumentTile({ document: doc, compact, width }: { document: RobiaDocument; compact: boolean; width: number }) {
  const type = DOCUMENT_TYPES.find(item => item.id === doc.type);
  const excerpt = documentExcerpt(doc.content);
  const updated = new Date(doc.updatedAt);
  const date = Number.isFinite(updated.getTime()) ? updated.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date inconnue';
  return <Pressable accessibilityRole="button" accessibilityLabel={doc.title + '. ' + DOCUMENT_STATUS_LABELS[doc.status]}
    accessibilityHint="Ouvrir le document pour le lire, le modifier ou le partager"
    onPress={() => router.push({ pathname: '/document', params: { id: doc.id } })}
    style={({ pressed }) => [s.document, { width }, pressed && c.pressed]}>
    <View style={[s.preview, compact && s.previewCompact]}>
      <View style={s.previewHeading}><View style={s.fileIcon}><AppIcon name={type?.icon ?? 'document'} size={22} color={Brand.tealDark} /></View>
        <Text style={[c.caption, { flex: 1 }]}>{type?.label ?? doc.type}</Text>
      </View>
      {!compact ? <Text numberOfLines={3} style={s.excerpt}>{excerpt || 'Ouvrir pour consulter le contenu.'}</Text> : null}
    </View>
    <View style={s.documentBody}>
      <Text style={s.documentTitle}>{doc.title}</Text>
      {compact ? <Text numberOfLines={2} style={c.caption}>{excerpt || 'Ouvrir pour consulter le contenu.'}</Text> : null}
      <StatusPill label={DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status} tone={isApproved(doc) ? 'teal' : doc.status === 'rejected' ? 'orange' : 'neutral'} />
      <View style={s.documentFooter}><Text style={c.caption}>{date}</Text><AppIcon name="forward" size={18} color={Brand.tealDark} /></View>
    </View>
  </Pressable>;
}
const s = StyleSheet.create({
  hero: { backgroundColor: Brand.navyDark, borderRadius: 24, padding: 18, gap: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, heroTitle: { flex: 1, color: Brand.white, fontSize: 24, fontWeight: '800' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderTopColor: '#365067', marginTop: 4, paddingTop: 10 },
  stat: { flexGrow: 1, flexBasis: 72, minHeight: 48, gap: 3 }, statNumber: { fontSize: 23, fontWeight: '800', color: Brand.white }, statLabel: { fontSize: 12, color: '#D0DCE6' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  create: { flexDirection: 'row', gap: 7, alignItems: 'center', minHeight: 48, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 16, backgroundColor: Brand.tealDark, flexShrink: 1 },
  createText: { color: Brand.white, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  collection: { padding: 12, minHeight: 84, gap: 10, borderRadius: 18, backgroundColor: '#F0F4F3', borderWidth: 1, borderColor: 'transparent' },
  collectionActive: { borderColor: Brand.tealDark, backgroundColor: '#E3F3EC' },
  collectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, collectionCount: { fontSize: 13, color: Brand.tealDark, fontWeight: '800' },
  collectionLabel: { color: Brand.navyDark, fontSize: 13, fontWeight: '700' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sort: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  documents: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  document: { borderWidth: 1, borderColor: '#E2E9E7', borderRadius: 20, backgroundColor: Brand.white, overflow: 'hidden' },
  preview: { padding: 14, gap: 12, backgroundColor: '#EAF3EF', minHeight: 134 }, previewCompact: { minHeight: 0, paddingVertical: 10 },
  previewHeading: { flexDirection: 'row', gap: 8, alignItems: 'center' }, fileIcon: { width: 34, height: 40, borderRadius: 9, backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center' },
  excerpt: { color: '#60736B', fontSize: 12, lineHeight: 18 }, documentBody: { padding: 14, gap: 10, flex: 1 },
  documentTitle: { color: Brand.navyDark, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  documentFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 4 },
});
