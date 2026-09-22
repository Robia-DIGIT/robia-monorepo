import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilePlus2, Radar } from 'lucide-react'

import { Button } from '../components/ui'
import WebsiteSelector from '../components/WebsiteSelector'
import { useWebsiteContext } from '../components/WebsiteContext'
import ContentSources from '../components/ContentSources'
import ContentComposer from '../components/ContentComposer'
import ContentLibrary from '../components/ContentLibrary'
import {
  getOpportunity,
  listActions,
  listGoogleBusinessProfileLocations,
  type ActionItem,
  type DocumentItem,
  type DocumentType,
  type GoogleBusinessProfileLocation,
  type Opportunity,
  type Website,
} from '../lib/api'

interface StudioWorkspaceProps {
  websiteId: string
  website: Website | null
  opportunityIdParam?: string
  actionItemIdParam?: string
  businessLocationIdParam?: string
  typeParam?: DocumentType
}

// Keyed by a composite of site + every context param in the parent (see
// PageIA below): any change to the site, the linked opportunity/action/
// establishment, or the content type fully unmounts this component and
// mounts a brand new one — a document/brief/content built for one context
// can never survive into a different one, and a ContentComposer generation
// or save still in flight for the old context can never act on the new
// one's state (its mountedRef goes false on that unmount). No render-phase
// state surgery is needed, and no stale-response guard is needed for any of
// these dimensions either — the effect's `cancelled` flag below only
// matters in the (currently unreachable, since every param is now part of
// the key) case a future change reuses this instance across a param change.
function StudioWorkspace({
  websiteId,
  website,
  opportunityIdParam,
  actionItemIdParam,
  businessLocationIdParam,
  typeParam,
}: StudioWorkspaceProps) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [actionItem, setActionItem] = useState<ActionItem | null>(null)
  const [businessLocation, setBusinessLocation] = useState<GoogleBusinessProfileLocation | null>(null)
  const [contextNotice, setContextNotice] = useState('')
  const [libraryRefreshToken, setLibraryRefreshToken] = useState(0)
  const [librarySelection, setLibrarySelection] = useState<DocumentItem | null>(null)

  // Every id in the URL is only a hint — it is re-resolved against the
  // server on every load. getOpportunity() only confirms organization
  // scope, not that the opportunity belongs to this website (the backend
  // enforces that at generation time, rejecting a mismatch) — so a
  // successful lookup here is not proof of a site match; ContentSources
  // labels it accordingly. A lookup failure (wrong org, deleted resource,
  // wrong site for actions/locations) drops that piece of context rather
  // than presenting one the server never confirmed.
  useEffect(() => {
    let cancelled = false
    // Reset synchronously at the start of a normal effect — not during
    // render. A site change never reaches this point at all (it remounts
    // the whole component instead); this only ever resets for a query-param
    // change on the same, already-mounted site.
    setOpportunity(null)
    setActionItem(null)
    setBusinessLocation(null)
    setContextNotice('')
    setLibrarySelection(null)

    void (async () => {
      const notices: string[] = []

      const [opportunityResult, actionsResult, locationsResult] = await Promise.all([
        opportunityIdParam ? getOpportunity(opportunityIdParam).catch(() => null) : Promise.resolve(null),
        actionItemIdParam ? listActions(websiteId).catch(() => []) : Promise.resolve([]),
        businessLocationIdParam ? listGoogleBusinessProfileLocations().catch(() => []) : Promise.resolve([]),
      ])

      if (cancelled) return // params changed again before this resolved — a newer effect run owns the state now

      if (opportunityIdParam && !opportunityResult) notices.push("l'opportunité indiquée n'a pas pu être retrouvée")
      setOpportunity(opportunityResult)

      const resolvedAction = actionItemIdParam
        ? actionsResult.find((item) => String(item.id) === actionItemIdParam) ?? null
        : null
      if (actionItemIdParam && !resolvedAction) notices.push("l'action indiquée n'a pas pu être retrouvée pour ce site")
      setActionItem(resolvedAction)

      const resolvedLocation = businessLocationIdParam
        ? locationsResult.find((item) => String(item.id) === businessLocationIdParam) ?? null
        : null
      if (businessLocationIdParam && !resolvedLocation) notices.push("l'établissement indiqué n'a pas pu être retrouvé")
      setBusinessLocation(resolvedLocation)

      setContextNotice(notices.length > 0 ? `Contexte partiel : ${notices.join(', ')}.` : '')
    })()

    return () => { cancelled = true }
  }, [websiteId, opportunityIdParam, actionItemIdParam, businessLocationIdParam])

  const handlePersisted = () => setLibraryRefreshToken((token) => token + 1)

  // The backend is the only source of truth for an opportunity/website
  // mismatch (it rejects generation rather than the frontend pre-checking
  // it) — when ContentComposer reports that rejection, drop the invalid
  // opportunity context instead of leaving a context on screen the server
  // has just refused to honor.
  const handleInvalidOpportunityContext = () => {
    setOpportunity(null)
    setContextNotice("L'opportunité liée ne correspond pas à ce site — contexte retiré.")
  }

  const handleNewContent = () => {
    // Deselecting a library item never deletes or mutates it server-side —
    // it only stops the composer from editing it, falling back to whatever
    // context the URL itself actually carries (still valid: it was already
    // resolved above, independently of any library selection).
    setLibrarySelection(null)
  }

  return (
    <>
      {contextNotice && (
        <div className="mb-6 border-l-2 border-orange bg-orange-light/30 px-4 py-3 text-sm text-orange-dark">{contextNotice}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <ContentSources
            website={website}
            opportunity={opportunity}
            actionItem={actionItem}
            businessLocation={businessLocation}
          />
          <ContentLibrary
            websiteId={websiteId}
            refreshToken={libraryRefreshToken}
            onSelect={setLibrarySelection}
          />
        </div>

        <div className="space-y-3">
          {librarySelection && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-border bg-slate-bg/60 px-4 py-3">
              <p className="min-w-0 truncate text-sm text-dark">
                Vous modifiez : <span className="font-semibold text-navy">{librarySelection.title ?? 'Document sans titre'}</span>
              </p>
              <Button variant="outline" size="sm" icon={<FilePlus2 size={13} />} onClick={handleNewContent}>
                Nouveau contenu
              </Button>
            </div>
          )}

          <ContentComposer
            key={librarySelection?.id ?? 'new'}
            websiteId={websiteId}
            opportunityId={librarySelection ? librarySelection.opportunityId : opportunity?.id}
            actionItem={librarySelection ? null : actionItem}
            businessLocation={businessLocation}
            initialType={typeParam}
            initialDocument={librarySelection}
            onDocumentPersisted={handlePersisted}
            onInvalidOpportunityContext={handleInvalidOpportunityContext}
          />
        </div>
      </div>
    </>
  )
}

export default function PageIA() {
  const { activeWebsite, activeWebsiteId } = useWebsiteContext()
  const [searchParams] = useSearchParams()

  const opportunityIdParam = searchParams.get('opportunityId') ?? undefined
  const actionItemIdParam = searchParams.get('actionItemId') ?? undefined
  const businessLocationIdParam = searchParams.get('businessLocationId') ?? undefined
  const typeParam = (searchParams.get('type') as DocumentType | null) ?? undefined

  // A workspace instance owns exactly one context: one site generating for
  // one opportunity/action/establishment/type combination. Keying only on
  // activeWebsiteId let a same-site context switch (e.g. opportunityId=A ->
  // opportunityId=B) reuse the same ContentComposer instance, keeping its
  // document/brief/content around under the new context. Folding every
  // context param into the key forces a full remount instead.
  const workspaceKey = activeWebsiteId
    ? [
        activeWebsiteId,
        opportunityIdParam ?? 'free',
        actionItemIdParam ?? 'no-action',
        businessLocationIdParam ?? 'no-location',
        typeParam ?? 'default',
      ].join(':')
    : undefined

  return (
    <div className="mx-auto max-w-[1600px] animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Studio de contenu ROBIA</p>
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Transformer une opportunité en contenu prêt à valider</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Générez un brouillon réel, éditez-le, puis soumettez-le à validation. ROBIA ne publie rien automatiquement.</p>
          </div>
        </div>
      </header>

      <div className="mb-7 flex flex-col gap-3 border-l-2 border-teal bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Site actif</p>
            <p className="truncate text-sm font-bold text-navy">{activeWebsite?.url ?? 'Aucun site sélectionné'}</p>
          </div>
        </div>
        <WebsiteSelector className="w-full sm:w-auto sm:min-w-72" />
      </div>

      {!activeWebsiteId ? (
        <p className="border-l-2 border-border bg-slate-bg/60 px-4 py-6 text-center text-sm text-muted">
          Sélectionnez un site pour utiliser le Studio.
        </p>
      ) : (
        <StudioWorkspace
          key={workspaceKey}
          websiteId={activeWebsiteId}
          website={activeWebsite}
          opportunityIdParam={opportunityIdParam}
          actionItemIdParam={actionItemIdParam}
          businessLocationIdParam={businessLocationIdParam}
          typeParam={typeParam}
        />
      )}
    </div>
  )
}
