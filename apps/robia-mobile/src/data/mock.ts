export type ImpactLevel = 'Faible' | 'Moyen' | 'Élevé';
export type DocumentStatus = 'Brouillon' | 'Prêt';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Fait',
};

export const MOCK_ESTABLISHMENT = {
  name: 'Salon Lova Coiffure',
  city: 'Antananarivo',
  impactScore: 62,
  opportunitiesCount: 5,
  documentsReadyCount: 3,
  planProgressPercent: 33,
};

export const MOCK_OPPORTUNITIES: {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: ImpactLevel;
  confidence: number;
}[] = [
  {
    id: 'opp-gbp',
    title: 'Compléter la fiche Google Business Profile',
    description:
      'Horaires, photos et catégories manquent encore. Une fiche complète améliore fortement la visibilité Maps.',
    impact: 'Élevé',
    effort: 'Faible',
    confidence: 92,
  },
  {
    id: 'opp-page',
    title: 'Créer une page coiffure mariage à Antananarivo',
    description:
      'Aucune page dédiée aux prestations mariage. Cible une requête locale à fort intent commercial.',
    impact: 'Élevé',
    effort: 'Moyen',
    confidence: 84,
  },
  {
    id: 'opp-reviews',
    title: 'Répondre aux avis clients en attente',
    description:
      '4 avis Google sans réponse. Les réponses signalent un établissement actif et de confiance.',
    impact: 'Moyen',
    effort: 'Faible',
    confidence: 88,
  },
  {
    id: 'opp-title',
    title: "Optimiser le titre SEO de la page d’accueil",
    description:
      "Le titre actuel ne contient pas « coiffure Antananarivo ». Google a du mal à classer l’activité localement.",
    impact: 'Élevé',
    effort: 'Faible',
    confidence: 79,
  },
  {
    id: 'opp-nap',
    title: 'Harmoniser nom, adresse et téléphone (NAP)',
    description:
      "L’adresse du site diffère de celle de Google Business Profile. Cela dilue le signal local.",
    impact: 'Moyen',
    effort: 'Moyen',
    confidence: 73,
  },
];

export const MOCK_DOCUMENTS: {
  id: string;
  title: string;
  status: DocumentStatus;
}[] = [
  { id: 'doc-local', title: 'Page locale', status: 'Prêt' },
  { id: 'doc-gbp', title: 'Post Google Business Profile', status: 'Prêt' },
  { id: 'doc-meta', title: 'Meta title & description', status: 'Prêt' },
  { id: 'doc-brief', title: 'Brief développeur', status: 'Brouillon' },
  { id: 'doc-checklist', title: 'Checklist de publication', status: 'Brouillon' },
];

export const MOCK_PLAN_WEEKS: {
  week: string;
  tasks: { id: string; title: string; status: TaskStatus }[];
}[] = [
  {
    week: 'Semaine 1 — Fondations locales',
    tasks: [
      { id: 'w1-1', title: 'Compléter la fiche Google Business Profile', status: 'done' },
      { id: 'w1-2', title: 'Vérifier NAP sur le site et les annuaires', status: 'in_progress' },
      { id: 'w1-3', title: "Mettre à jour le titre SEO de l’accueil", status: 'todo' },
    ],
  },
  {
    week: 'Semaine 2 — Contenu local',
    tasks: [
      { id: 'w2-1', title: 'Publier la page coiffure mariage Antananarivo', status: 'todo' },
      { id: 'w2-2', title: 'Rédiger 2 posts GBP (avant/après + offre)', status: 'todo' },
    ],
  },
  {
    week: 'Semaine 3 — Preuve sociale',
    tasks: [
      { id: 'w3-1', title: 'Répondre aux avis clients en attente', status: 'todo' },
      { id: 'w3-2', title: 'Demander 3 avis à des clientes récentes', status: 'todo' },
    ],
  },
  {
    week: 'Semaine 4 — Publication & suivi',
    tasks: [
      { id: 'w4-1', title: 'Envoyer le brief développeur (publication manuelle)', status: 'todo' },
      { id: 'w4-2', title: 'Relancer un mini-audit de contrôle', status: 'todo' },
    ],
  },
];
