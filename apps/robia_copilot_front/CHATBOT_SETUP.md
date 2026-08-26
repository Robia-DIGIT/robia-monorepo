# Configuration des APIs ChatGPT 5

Pour utiliser le chatbot avec ChatGPT 5, veuillez suivre ces étapes :

## 1. Obtenez votre clé API OpenAI

1. Allez sur [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Créez une nouvelle clé API
3. Copiez la clé

## 2. Configurez la variable d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

⚠️ **Important**: Ne commitez jamais ce fichier sur Git. Le fichier `.env.local` est généralement exclu par `.gitignore`.

## 3. Redémarrez le serveur de développement

```bash
npm run dev
```

## 4. Utilisez le chatbot

- Cliquez sur l'icône ChatBot en haut à droite de la barre de navigation
- Commencez à poser des questions

## Modèles disponibles

### Actuellement supportés :
- `gpt-4-turbo` - Le modèle GPT-4 avec mise à jour (par défaut)
- `gpt-4` - GPT-4 standard
- `gpt-3.5-turbo` - Plus rapide et moins cher

### À venir :
- `gpt-5` - Une fois disponible sur OpenAI API

## Configuration avancée

Vous pouvez personnaliser le comportement du chatbot en modifiant les options dans le composant `ChatbotPage` :

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4-turbo',
    temperature: 0.7,        // 0-2, plus bas = plus déterministe
    max_tokens: 2000,        // Limite du nombre de tokens
    top_p: 1,                // 0-1, pour l'échantillonnage núcléaire
    frequency_penalty: 0,    // -2 à 2
    presence_penalty: 0,     // -2 à 2
    messages: [...]
  })
});
```

## Dépannage

### "OPENAI_API_KEY is not configured"

- Vérifiez que le fichier `.env.local` existe
- Vérifiez que la variable est correctement nommée : `OPENAI_API_KEY`
- Redémarrez le serveur de développement

### "Invalid API key"

- Vérifiez que votre clé API est correcte
- Vérifiez que votre clé n'a pas été révoquée sur OpenAI
- Testez votre clé via la CLI OpenAI

### Réponses lentes

- Vérifiez votre connexion Internet
- Réduisez `max_tokens` pour des réponses plus rapides
- Vérifiez l'état de l'API OpenAI sur [status.openai.com](https://status.openai.com)

## Ressources

- [Documentation OpenAI](https://platform.openai.com/docs)
- [Chat API Reference](https://platform.openai.com/docs/api-reference/chat/create)
- [Pricing](https://openai.com/pricing)
