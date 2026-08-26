import { User, PmeProfile, Audit, Opportunity, GeneratedDocument, ValidationAction, ActionPlanItem } from "@/types";

export interface MockDatabase {
  users: User[];
  currentUser: User | null;
  pmeProfile: PmeProfile & { address?: string; contact?: string; description?: string; websiteConnected?: boolean };
  audits: Audit[];
  opportunities: (Opportunity & {
    difficulty?: string;
    estimatedTime?: string;
    whyImportant?: string;
    currentValue?: string;
    recommendedValue?: string;
  })[];
  documents: GeneratedDocument[];
  validationHistory: ValidationAction[];
  trackerTasks: {
    id: string;
    title: string;
    category: string;
    status: "todo" | "in_progress" | "done";
    date: string;
  }[];
}

const DEFAULT_DB: MockDatabase = {
  users: [
    { id: "u-1", name: "John Doe", email: "john.doe@pme.com", role: "user" },
    { id: "u-2", name: "Admin Robia", email: "admin@robia.com", role: "admin" }
  ],
  currentUser: null,
  pmeProfile: {
    id: "pme-1",
    companyName: "Maison Martin Boulangerie",
    website: "https://maisonmartin.fr",
    siret: "",
    address: "12 Rue de la Roquette, 75011 Paris",
    industry: "Artisanat",
    size: 5,
    contact: "John Doe, +33 1 45 67 89 10",
    description: "Boulangerie artisanale de quartier proposant des pains bio au levain et viennoiseries faites maison.",
    googleBusinessProfileId: "",
    isConnectedGbp: false,
    websiteConnected: false
  },
  audits: [
    {
      id: "aud-1",
      pmeId: "pme-1",
      createdAt: "12 Juillet 2026",
      globalScore: 68,
      status: "completed",
      categories: [
        { id: "cat-1", name: "Structure Sémantique", score: 75, weight: 30, description: "Qualité des balises heading, mots-clés principaux.", status: "good" },
        { id: "cat-2", name: "Visibilité Locale (GBP)", score: 45, weight: 30, description: "Connexion et complétude du profil Google Business Profile.", status: "critical" },
        { id: "cat-3", name: "Indexation Google", score: 85, weight: 20, description: "Couverture de votre plan de site sitemap sur Google.", status: "good" },
        { id: "cat-4", name: "Qualité Technique", score: 62, weight: 20, description: "Vitesse de chargement et réactivité mobile.", status: "warning" },
      ],
      missingDataFields: [
        "Profil Google Business Profile non lié",
        "Sitemap XML introuvable sur le site",
        "Numéro Siret manquant dans les mentions légales"
      ]
    },
    {
      id: "aud-2",
      pmeId: "pme-1",
      createdAt: "28 Juin 2026",
      globalScore: 62,
      status: "completed",
      categories: [
        { id: "cat-1", name: "Structure Sémantique", score: 70, weight: 30, description: "Qualité des balises heading, mots-clés principaux.", status: "good" },
        { id: "cat-2", name: "Visibilité Locale (GBP)", score: 45, weight: 30, description: "Connexion et complétude du profil Google Business Profile.", status: "critical" },
        { id: "cat-3", name: "Indexation Google", score: 80, weight: 20, description: "Couverture de votre plan de site sitemap sur Google.", status: "good" },
        { id: "cat-4", name: "Qualité Technique", score: 55, weight: 20, description: "Vitesse de chargement et réactivité mobile.", status: "warning" },
      ],
      missingDataFields: [
        "Profil Google Business Profile non lié",
        "Sitemap XML introuvable sur le site",
        "Numéro Siret manquant dans les mentions légales"
      ]
    },
    {
      id: "aud-3",
      pmeId: "pme-1",
      createdAt: "14 Juin 2026",
      globalScore: 55,
      status: "completed",
      categories: [
        { id: "cat-1", name: "Structure Sémantique", score: 60, weight: 30, description: "Qualité des balises heading, mots-clés principaux.", status: "warning" },
        { id: "cat-2", name: "Visibilité Locale (GBP)", score: 40, weight: 30, description: "Connexion et complétude du profil Google Business Profile.", status: "critical" },
        { id: "cat-3", name: "Indexation Google", score: 70, weight: 20, description: "Couverture de votre plan de site sitemap sur Google.", status: "good" },
        { id: "cat-4", name: "Qualité Technique", score: 50, weight: 20, description: "Vitesse de chargement et réactivité mobile.", status: "warning" },
      ],
      missingDataFields: [
        "Profil Google Business Profile non lié",
        "Sitemap XML introuvable sur le site",
        "Numéro Siret manquant dans les mentions légales"
      ]
    }
  ],
  opportunities: [
    {
      id: "opp-1",
      title: "Optimiser le titre SEO de la page d'accueil",
      description: "Votre page d'accueil manque de mots-clés à fort volume comme 'Boulangerie Artisanale Paris 11'. Les moteurs de recherche ont du mal à catégoriser votre activité localement.",
      priority: "high",
      impactScore: 9,
      category: "Structure Sémantique",
      status: "todo",
      recommendedAction: "Générer les balises Meta personnalisées par IA.",
      difficulty: "Facile",
      estimatedTime: "15 min",
      whyImportant: "Le titre de la page d'accueil (tag <title>) est le facteur SEO on-page le plus important. C'est ce qui apparaît dans les résultats de recherche Google et détermine si l'utilisateur clique ou non.",
      currentValue: "Accueil - Boulangerie Martin",
      recommendedValue: "Boulangerie Artisanale Paris 11 - Maison Martin | Pains Bio & Viennoiseries"
    },
    {
      id: "opp-2",
      title: "Renseigner les horaires d'ouverture sur Google Business Profile",
      description: "Les horaires d'ouverture ne sont pas configurés sur votre profil Google Business Profile.",
      priority: "high",
      impactScore: 8,
      category: "Visibilité Locale (GBP)",
      status: "todo",
      recommendedAction: "Mettre à jour les informations GBP.",
      difficulty: "Facile",
      estimatedTime: "10 min",
      whyImportant: "Les horaires d'ouverture sont essentiels pour la recherche locale de Google Maps. Les fiches incomplètes perdent en visibilité locale.",
      currentValue: "Non renseigné",
      recommendedValue: "Lun-Dim: 07h00 - 20h00"
    },
    {
      id: "opp-3",
      title: "Créer une page sémantique 'Prestations'",
      description: "Créer un cocon sémantique dédié à vos prestations locales pour ranker sur de nouveaux mots clés.",
      priority: "medium",
      impactScore: 7,
      category: "Structure Sémantique",
      status: "in_progress",
      recommendedAction: "Rédiger le contenu IA pour la page Prestations.",
      difficulty: "Moyenne",
      estimatedTime: "45 min",
      whyImportant: "Une page dédiée aux prestations de votre entreprise permet d'assurer un meilleur cocon sémantique et d'acquérir du trafic sur des requêtes précises.",
      currentValue: "Aucune page dédiée",
      recommendedValue: "Création de la page maisonmartin.fr/prestations-bio"
    },
    {
      id: "opp-4",
      title: "Corriger l'attribut ALT des images",
      description: "8 images importantes sur votre site n'ont pas d'attribut ALT textuel descriptif.",
      priority: "low",
      impactScore: 4,
      category: "Qualité Technique",
      status: "done",
      recommendedAction: "Ajouter des descriptions alternatives.",
      difficulty: "Facile",
      estimatedTime: "30 min",
      whyImportant: "L'attribut ALT permet aux moteurs de recherche de comprendre l'image et améliore l'accessibilité globale.",
      currentValue: "8 images sans ALT",
      recommendedValue: "Ajout des balises <img alt='...' />"
    }
  ],
  documents: [
    {
      id: "doc-123",
      title: "Instruction SEO - Titre Page Accueil",
      content: `Bonjour,

Dans le cadre de l'optimisation SEO locale de notre site internet, pourriez-vous s'il vous plaît mettre à jour la balise meta Title de la page d'accueil de notre CMS ?

Voici les informations à intégrer :

- Balise Title Actuelle : "Accueil - Boulangerie Martin"
- Nouvelle Balise Title à insérer : "Boulangerie Artisanale Paris 11 - Maison Martin | Pains Bio & Viennoiseries"

Ces modifications sont très importantes pour améliorer notre positionnement sur les recherches locales liées aux boulangeries dans le 11e arrondissement de Paris.

Merci d'avance pour votre aide.

Cordialement,
L'équipe Maison Martin`,
      type: "email",
      opportunityId: "opp-1",
      status: "draft",
      updatedAt: "2026-07-12"
    }
  ],
  validationHistory: [
    { id: "v-1", documentId: "doc-0", validatorName: "John Doe", action: "approved", timestamp: "12 Juillet 2026", comment: "Balise titre mise à jour." },
    { id: "v-2", documentId: "doc-1", validatorName: "John Doe", action: "approved", timestamp: "08 Juillet 2026", comment: "Schémas locaux ajoutés." },
    { id: "v-3", documentId: "doc-2", validatorName: "John Doe", action: "rejected", timestamp: "28 Juin 2026", comment: "Manque le numéro SIRET." }
  ],
  trackerTasks: [
    { id: "t-1", title: "Mettre à jour la balise meta title page d'accueil", category: "SEO Technique", status: "in_progress", date: "2026-07-12" },
    { id: "t-2", title: "Renseigner l'adresse physique SIRET", category: "Profil PME", status: "todo", date: "2026-07-12" },
    { id: "t-3", title: "Lier le compte Google Business Profile", category: "Local SEO", status: "todo", date: "2026-07-12" },
    { id: "t-4", title: "Rédiger l'article 'Notre pain bio au levain'", category: "Cocon Sémantique", status: "done", date: "2026-07-11" },
    { id: "t-5", title: "Ajouter la sitemap XML dans la Google Search Console", category: "Indexation", status: "todo", date: "2026-07-10" }
  ]
};

const DB_KEY = "robia_mock_db";

export function getDb(): MockDatabase {
  if (typeof window === "undefined") return DEFAULT_DB;
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return DEFAULT_DB;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DB;
  }
}

export function saveDb(db: MockDatabase) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Helper to recalculate audit score based on connection status and profiles
export function recalculateAuditScore(db: MockDatabase) {
  const audit = db.audits[0];
  if (!audit) return;

  const missing: string[] = [];
  
  // 1. Google Business Profile link
  if (db.pmeProfile.isConnectedGbp) {
    audit.categories[1].score = 90;
    audit.categories[1].status = "good";
  } else {
    audit.categories[1].score = 45;
    audit.categories[1].status = "critical";
    missing.push("Profil Google Business Profile non lié");
  }

  // 2. Site connected
  if (db.pmeProfile.websiteConnected) {
    audit.categories[2].score = 95;
    audit.categories[2].status = "good";
  } else {
    audit.categories[2].score = 60;
    audit.categories[2].status = "warning";
    missing.push("Sitemap XML introuvable sur le site");
  }

  // 3. Siret / address onboarding filled
  if (db.pmeProfile.siret && db.pmeProfile.siret.trim() !== "") {
    // Resolved
  } else {
    missing.push("Numéro Siret manquant dans les mentions légales");
  }

  audit.missingDataFields = missing;

  // Recalculate global score: weighted average
  let totalScore = 0;
  let totalWeight = 0;
  audit.categories.forEach(cat => {
    totalScore += cat.score * cat.weight;
    totalWeight += cat.weight;
  });
  audit.globalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}
