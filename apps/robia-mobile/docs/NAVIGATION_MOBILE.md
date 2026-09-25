# Navigation mobile

La barre principale contient trois entrées : Accueil, Visibilité et Activité. Le profil et l’entreprise sont accessibles depuis l’icône de personne dans l’en-tête de chacune. L’aide et l’assistant y sont également accessibles ; le bouton flottant a été retiré.

| Entrée | Organisation |
| --- | --- |
| Accueil | Score, activité, priorités et quatre raccourcis contextuels |
| Visibilité | Audits / Performances / Local |
| Activité | Actions / Documents / Candidatures / Automatisations |
| Profil dans l’en-tête | Entreprise, sites, connexions, abonnement, support, mot de passe et paramètres |

Les sous-sections sont accessibles par appui et par glissement horizontal. La barre des sous-sections défile indépendamment pour rendre les intitulés longs accessibles. Les pages et le fond du bouton sélectionné utilisent la même animation ; aux limites d’une sous-section, le geste peut passer à la page principale voisine.

La sous-section sélectionnée est conservée dans le paramètre section de la route. Les raccourcis de l’accueil peuvent donc ouvrir directement le bon contenu. Exemples : /(tabs)/visibility?section=performance et /(tabs)/work?section=programs.

Les programmes sont intégrés à Activité > Candidatures. Le profil et la liste des programmes restent également accessibles comme pages secondaires /profile et /programs avec un retour. Les autres écrans métier restent accessibles depuis leur sous-section.

Le mode portrait et les adaptations aux tailles d’écran sont conservés. Les badges et aperçus utilisent les données existantes ; aucune notification fictive n’est ajoutée.
