import { AlertTriangle, Eye } from 'lucide-react'

import type { DocumentType } from '../lib/api'

interface Props {
  type: DocumentType
  title: string
  content: string
}

// Renders content as plain paragraphs only — never dangerouslySetInnerHTML,
// never an interpreted link from generated text. That is not a stopgap: it
// is the whole RC39 security answer for previewing untrusted-origin content
// (an LLM's output), and it is sufficient because nothing here is ever
// treated as markup.
function paragraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function GooglePostPreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4285F4] text-xs font-bold text-white">G</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy">{title || 'Votre établissement'}</p>
          <p className="text-[11px] text-muted">Publication</p>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-dark">
        {paragraphs(content).length === 0 ? (
          <p className="text-muted">Le contenu généré apparaîtra ici.</p>
        ) : (
          paragraphs(content).map((block, index) => <p key={index}>{block}</p>)
        )}
      </div>
    </div>
  )
}

function ArticlePreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h3 className="text-lg font-bold text-navy">{title || 'Titre de la page'}</h3>
      <div className="mt-3 space-y-3 text-sm leading-6 text-dark">
        {paragraphs(content).length === 0 ? (
          <p className="text-muted">Le contenu généré apparaîtra ici.</p>
        ) : (
          paragraphs(content).map((block, index) => <p key={index}>{block}</p>)
        )}
      </div>
    </div>
  )
}

export default function ContentPreview({ type, title, content }: Props) {
  const isGoogle = type === 'gbp_post' || type === 'review_reply'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-dark">
        <Eye size={13} /> Aperçu indicatif
      </div>
      {isGoogle ? <GooglePostPreview title={title} content={content} /> : <ArticlePreview title={title} content={content} />}
      <p className="flex items-start gap-1.5 text-[11px] leading-4 text-muted">
        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
        {isGoogle
          ? "Rendu ROBIA indicatif — ne reproduit pas l'interface Google et ne garantit pas l'apparence réelle une fois publié."
          : "Rendu ROBIA indicatif — ne garantit pas le rendu exact de votre thème ou de vos blocs."}
      </p>
    </div>
  )
}
