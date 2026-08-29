# Déploiement des frontends ROBIA

Ce déploiement construit les deux applications Vite avec npm, les sert avec Nginx et les relie au réseau Docker privé de Supabase. Aucun port applicatif n'est publié sur le VPS.

## Services

- `dashboard` : `app.robiacopilot.site`, alias Docker `robia-dashboard`
- `vitrine` : `robiacopilot.site`, alias Docker `robia-vitrine`
- API compilée dans le Dashboard : `https://api.robiacopilot.site`

## Déploiement

Depuis la racine du dépôt :

`docker compose -f docker-compose.frontend.production.yml config --quiet`

`docker compose -f docker-compose.frontend.production.yml build`

`docker compose -f docker-compose.frontend.production.yml up -d`

`docker compose -f docker-compose.frontend.production.yml ps`

## Caddy

Ajouter les deux sites au Caddyfile partagé :

```caddy
app.robiacopilot.site {
    encode zstd gzip
    reverse_proxy robia-dashboard:80
    header -server
}

robiacopilot.site {
    encode zstd gzip
    reverse_proxy robia-vitrine:80
    header -server
}
```

Valider puis recharger Caddy avant de tester les deux domaines en HTTPS.
