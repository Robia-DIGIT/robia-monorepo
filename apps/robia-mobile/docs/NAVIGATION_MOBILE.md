# Navigation mobile

La barre principale contient quatre entrées : Accueil, Visibilité, Activité et Profil. Le profil et l’entreprise sont accessibles depuis ce quatrième onglet, avec les mêmes transitions horizontales. Les en-têtes conservent leur structure avec le titre, l’aide et l’assistant ; le raccourci de profil a été retiré.

| Entrée | Organisation |
| --- | --- |
| Accueil | Score, activité, priorités et quatre raccourcis contextuels |
| Visibilité | Audits / Performances / Local |
| Activité | Suivi / Documents / Candidatures / Automatisations |
| Profil | Entreprise, sites, connexions, abonnement, support, mot de passe et paramètres |

Les sous-sections sont accessibles par appui et par glissement horizontal. La barre des sous-sections défile indépendamment pour rendre les intitulés longs accessibles. Les pages et le fond du bouton sélectionné utilisent la même animation ; aux limites d’une sous-section, le geste peut passer à la page principale voisine.

La sous-section sélectionnée est conservée dans le paramètre section de la route. Les raccourcis de l’accueil peuvent donc ouvrir directement le bon contenu. Exemples : /(tabs)/visibility?section=performance et /(tabs)/work?section=programs.

Les programmes sont intégrés à Activité > Candidatures. Le profil est intégré à /(tabs)/profile et conserve son URL /profile. La liste des programmes reste également accessible comme page secondaire /programs avec un retour. Les autres écrans métier restent accessibles depuis leur sous-section.

Le mode portrait et les adaptations aux tailles d’écran sont conservés. Les badges et aperçus utilisent les données existantes ; aucune notification fictive n’est ajoutée.

## Bibliothèque et plan de travail

Activité affiche directement les espaces Suivi et Documents. Documents propose des collections par type, une recherche dans le titre et le contenu, des filtres de validation, un tri par date ou titre et une présentation grille/liste. La grille passe automatiquement en liste sur les petites largeurs ou avec un texte agrandi. Les documents modifiés restent à revoir.

Suivi propose un agenda par échéance et un tableau horizontal par statut. Les compteurs distinguent les retards, les actions du jour et les validations attendues. Les actions terminées ou écartées ne deviennent pas des retards ; les dates sans heure suivent le calendrier local. Le périmètre entreprise/site est explicite. Les outils de planification, export et actualisation sont regroupés sous Organiser.

Les rails de collections et les colonnes défilent indépendamment du geste de changement de section. Le profil est accessible dans la barre principale ; les en-têtes secondaires conservent leur retour et leurs actions contextuelles.

## Validation de la refonte

69 tests réussis ; TypeScript et ESLint sans erreur ; export Android réussi (1628 modules) dans .expo/workspace-design-check. Les aperçus web locaux des composants Documents et Suivi ont été inspectés sur des largeurs de 320 et 390 points avec des données de démonstration isolées. Ils ne valident ni le rendu natif ni les gestes tactiles sur téléphone. Aucun APK n’a été généré lors de cette passe.
