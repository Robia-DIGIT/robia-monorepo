import { Building2, Globe2, ListChecks, Sparkles } from 'lucide-react'

import { Badge } from './ui'
import type { ActionItem, GoogleBusinessProfileLocation, Opportunity, Website } from '../lib/api'

interface Props {
  website: Website | null
  opportunity: Opportunity | null
  actionItem: ActionItem | null
  businessLocation: GoogleBusinessProfileLocation | null
}

// Every row here comes straight from a server response — never from a value
// the client typed in. Facts the user enters live in ContentComposer's brief
// form and are labelled there as "informations fournies par vous", kept
// visually and textually separate from this list on purpose.
export default function ContentSources({ website, opportunity, actionItem, businessLocation }: Props) {
  return (
    <div className="space-y-3 border-l-2 border-teal bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Contexte serveur</p>

      <div className="flex items-start gap-2.5">
        <Globe2 size={15} className="mt-0.5 shrink-0 text-teal-dark" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Site</p>
          <p className="truncate text-sm font-semibold text-navy">{website?.url ?? 'Aucun site sélectionné'}</p>
        </div>
      </div>

      {opportunity && (
        <div className="flex items-start gap-2.5">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-teal-dark" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Opportunité liée</p>
            <p className="truncate text-sm font-semibold text-navy">{opportunity.title}</p>
            {/* getOpportunity() only confirms this belongs to the current
                organization, never that it belongs to the active website —
                only the backend, at generation time, verifies and can
                reject that. Never claim a site match this component can't
                actually prove. */}
            <p className="mt-0.5 text-[11px] text-muted">Rattachement à ce site à confirmer par le serveur à la génération.</p>
          </div>
        </div>
      )}

      {actionItem && (
        <div className="flex items-start gap-2.5">
          <ListChecks size={15} className="mt-0.5 shrink-0 text-teal-dark" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Action liée</p>
            <p className="truncate text-sm font-semibold text-navy">{actionItem.title}</p>
          </div>
        </div>
      )}

      {businessLocation && (
        <div className="flex items-start gap-2.5">
          <Building2 size={15} className="mt-0.5 shrink-0 text-teal-dark" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Établissement Google</p>
            <p className="truncate text-sm font-semibold text-navy">{businessLocation.title}</p>
            <Badge variant="gray" className="mt-1">Lecture seule</Badge>
          </div>
        </div>
      )}

      {!opportunity && !actionItem && (
        <p className="text-xs leading-5 text-muted">
          Création libre — aucune Opportunité ni Action associée pour l'instant.
        </p>
      )}
    </div>
  )
}
