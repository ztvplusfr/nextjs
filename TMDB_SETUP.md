# Configuration TMDB pour ZTV+

## 1. Obtenir une clé API TMDB

1. Rendez-vous sur [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Créez un compte ou connectez-vous
3. Allez dans **Settings** > **API**
4. Demandez une clé API (gratuite)
5. Copiez votre clé API

## 2. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/ztvplusfrance"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# TMDB API Configuration
TMDB_API_KEY="votre-clé-api-tmdb-ici"
TMDB_BASE_URL="https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p"
TMDB_LANGUAGE="fr-FR"
```

## 3. Initialisation automatique

Une fois les variables d'environnement configurées, vous pouvez :

1. **Via l'interface admin** : Aller dans l'onglet TMDB et cliquer sur "Initialiser depuis .env"
2. **Via l'API** : Appeler `POST /api/admin/tmdb/init`

## 4. Configuration manuelle

Vous pouvez aussi configurer TMDB manuellement via l'interface d'administration :

1. Allez dans **Administration** > **TMDB**
2. Remplissez les champs :
   - **Clé API** : Votre clé TMDB
   - **URL de base** : `https://api.themoviedb.org/3`
   - **URL des images** : `https://image.tmdb.org/t/p`
   - **Langue** : `fr-FR`
3. Cliquez sur **Sauvegarder**

## 5. Fonctionnalités TMDB

Une fois configuré, vous pourrez :

- **Synchroniser les films** depuis TMDB
- **Synchroniser les séries** depuis TMDB
- **Récupérer les genres** TMDB
- **Obtenir les métadonnées** complètes (posters, backdrops, descriptions, etc.)
- **Gérer les traductions** en français

## 6. Limites de l'API TMDB

- **Gratuite** : 1000 requêtes par jour
- **Payante** : Plus de requêtes disponibles
- **Rate limiting** : Respecter les limites de requêtes

## 7. Exemple d'utilisation

```javascript
// Récupérer un film par ID TMDB
const movie = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}&language=fr-FR`);

// Récupérer les genres
const genres = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=fr-FR`);

// Rechercher des films
const search = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=avatar&language=fr-FR`);
```

## 8. Sécurité

⚠️ **Important** : Ne jamais commiter votre clé API dans le code source !

- Utilisez toujours `.env.local` (ignoré par Git)
- En production, utilisez les variables d'environnement du serveur
- Ne partagez jamais votre clé API
