# Adaptation mobile en portrait

L’application reste verrouillée en portrait dans app.json. Les dimensions utilisées sont celles de la fenêtre en pixels logiques, sans liste de marques ou de modèles et sans désactiver l’agrandissement du texte.

## Comportement

- Marges de 12, 20 ou 28 points selon la largeur disponible ; contenu centré, limité à 720 points sur les écrans larges.
- Zones sûres pour les encoches et les barres système. La barre du bas gère son propre espace système.
- Cartes de l’accueil en une ou plusieurs colonnes selon la place et la taille du texte. Les intitulés restent lisibles sans troncature systématique.
- Navigation défilante quand les onglets ne tiennent plus. Le bouton de l’assistant suit la hauteur mesurée de cette navigation.
- Formulaires défilants ; la navigation et l’assistant s’effacent pendant la saisie. Android redimensionne la fenêtre pour le clavier, iOS utilise un conteneur d’évitement du clavier.
- En-têtes ordinaires intégrés au défilement si la fenêtre est courte ou le texte très agrandi. Les en-têtes des pages à filtres restent défilants dans une zone limitée, laissant de la place aux résultats.
- Boutons, choix et statuts autorisent le retour à la ligne. Les gestes entre pages et filtres gardent leur animation partagée.

## Vérification

Les tests de géométrie et de composants couvrent des largeurs de 280 à 1024 points, des tailles de texte de 100 à 300 %, des zones sûres et une fenêtre réduite par le clavier. Ils vérifient aussi le mode portrait et les gestes de navigation.

Commandes :

- node --test tests/*.test.cjs
- node node_modules/typescript/bin/tsc --noEmit
- node node_modules/eslint/bin/eslint.js app components src hooks tests --max-warnings 0
- node node_modules/expo/bin/cli export --platform android --output-dir .expo/responsive-check --no-minify

Ces tests ne remplacent pas une vérification tactile et visuelle sur appareil. Contrôler notamment la connexion, les longs formulaires, les filtres, le clavier, TalkBack et la navigation système avec gestes ou trois boutons. Une nouvelle compilation native est nécessaire pour embarquer un changement de configuration Android ; un export JavaScript ne produit pas un APK.

Résultats de cette passe : 61 tests réussis, TypeScript et ESLint sans erreur, export Android réussi (1619 modules). La configuration native inspectée contient screenOrientation=portrait et windowSoftInputMode=adjustResize. Le contrôle visuel n’a pas abouti : le client Expo n’a pas terminé son installation sur l’émulateur temporaire. Aucun contrôle sur téléphone physique n’est revendiqué.
