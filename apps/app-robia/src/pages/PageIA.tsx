import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Radar } from 'lucide-react'

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
} from '../lib/api'

export default function PageIA() {
  const { activeWebsite, activeWebsiteId } = useWebsiteContext()
  const [searchParams] = useSearchParams()

  const opportunityIdParam = searchParams.get('opportunityId') ?? undefined
  const actionItemIdParam = searchParams.get('actionItemId') ?? undefined
  const businessLocationIdParam = searchParams.get('businessLocationId') ?? undefined
  const typeParam = (searchParams.get('type') as DocumentType | null) ?? undefined

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [actionItem, setActionItem] = useState<ActionItem | null>(null)
  const [businessLocation, setBusinessLocation] = useState<GoogleBusinessProfileLocation | null>(null)
  const [contextNotice, setContextNotice] = useState('')
  const [libraryRefreshToken, setLibraryRefreshToken] = useState(0)
  const [librarySelection, setLibrarySelection] = useState<DocumentItem | null>(null)

  const requestSeq = useRef(0)

  // Every id in the URL is only a hint — it is re-resolved against the
  // server on every load, and a lookup failure (wrong org, deleted
  // resource, wrong site) silently drops that piece of context rather than
  // presenting a context the server never confirmed.
  useEffect(() => {
    const requestId = ++requestSeq.current
    const requestWebsiteId = activeWebsiteId
    setContextNotice('')

    if (!requestWebsiteId) {
      setOpportunity(null)
      setActionItem(null)
      setBusinessLocation(null)
      return
    }

    void (async () => {
      const notices: string[] = []

      const [opportunityResult, actionsResult, locationsResult] = await Promise.all([
        opportunityIdParam ? getOpportunity(opportunityIdParam).catch(() => null) : Promise.resolve(null),
        actionItemIdParam ? listActions(requestWebsiteId).catch(() => []) : Promise.resolve([]),
        businessLocationIdParam ? listGoogleBusinessProfileLocations().catch(() => []) : Promise.resolve([]),
      ])

      if (requestSeq.current !== requestId) return // active site changed mid-flight

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
  }, [activeWebsiteId, opportunityIdParam, actionItemIdParam, businessLocationIdParam])

  const handlePersisted = () => setLibraryRefreshToken((token) => token + 1)

  return (
    <div className="mx-auto max-w-[1600px] animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Studio de contenu ROBIA</p>
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Transformer une opportunité en contenu publié</h1>
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

      {contextNotice && (
        <div className="mb-6 border-l-2 border-orange bg-orange-light/30 px-4 py-3 text-sm text-orange-dark">{contextNotice}</div>
      )}

      {!activeWebsiteId ? (
        <p className="border-l-2 border-border bg-slate-bg/60 px-4 py-6 text-center text-sm text-muted">
          Sélectionnez un site pour utiliser le Studio.
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <ContentSources
              website={activeWebsite}
              opportunity={opportunity}
              actionItem={actionItem}
              businessLocation={businessLocation}
            />
            <ContentLibrary
              websiteId={activeWebsiteId}
              refreshToken={libraryRefreshToken}
              onSelect={setLibrarySelection}
            />
          </div>

          <ContentComposer
            key={librarySelection?.id ?? 'new'}
            websiteId={activeWebsiteId}
            opportunityId={librarySelection ? librarySelection.opportunityId : opportunity?.id}
            actionItem={librarySelection ? null : actionItem}
            businessLocation={businessLocation}
            initialType={typeParam}
            initialDocument={librarySelection}
            onDocumentPersisted={handlePersisted}
          />
        </div>
      )}
    </div>
  )
}
