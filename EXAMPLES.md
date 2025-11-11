# Exemples pratiques - Outlet ORM MCP

Ce fichier contient des exemples concrets d'utilisation des outils du serveur MCP.

## 📋 Table des matières

1. [Génération de code](#génération-de-code)
2. [Vérification de schéma](#vérification-de-schéma)
3. [Validation des relations](#validation-des-relations)
4. [Analyse de Controllers](#analyse-de-controllers)
5. [Vérification complète](#vérification-complète)

---

## Génération de code

### Exemple 1 : Créer un Model User avec relations

**Prompt pour Claude :**

```text
Crée un Model User avec :
- table users
- fillable : name, email, role, bio
- casts : is_active (boolean), last_login_at (datetime)
- relation hasMany vers Post (foreign key user_id)
- relation hasOne vers Profile (foreign key user_id)
- timestamps activés
- softDeletes activés
```

**Résultat attendu :**

Fichier `models/User.js` créé avec :
- ✅ Configuration de la table
- ✅ Propriétés fillable et casts
- ✅ Méthodes de relations posts() et profile()
- ✅ Support des timestamps et soft deletes

---

### Exemple 2 : Générer une migration de table

**Prompt pour Claude :**

```text
Crée une migration create_posts_table avec :
- id (primary key auto-increment)
- user_id (integer, foreign key vers users.id, cascade on delete)
- title (string 255, not null)
- slug (string 255, unique)
- content (text, nullable)
- status (enum : draft, published, archived, default draft)
- published_at (datetime, nullable)
- view_count (integer, default 0)
- timestamps
```

**Résultat attendu :**

Fichier `database/migrations/YYYYMMDD_HHMMSS_create_posts_table.js` avec :
- ✅ Toutes les colonnes spécifiées
- ✅ Clé étrangère avec contrainte CASCADE
- ✅ Index unique sur slug
- ✅ Méthodes up() et down()

---

### Exemple 3 : Créer un Controller REST complet

**Prompt pour Claude :**

```text
Crée un PostController pour le Model Post avec :
- toutes les méthodes CRUD
- pagination dans index (15 par page)
- eager loading de la relation user
- validation dans store et update
- gestion d'erreurs complète
```

**Résultat attendu :**

Fichier `controllers/PostController.js` avec :
- ✅ Méthodes : index, show, store, update, destroy
- ✅ Pagination avec .paginate()
- ✅ Eager loading avec .with('user')
- ✅ Blocs try/catch sur toutes les méthodes
- ✅ Codes HTTP appropriés (200, 201, 404, 422, 500)

---

## Vérification de schéma

### Exemple 4 : Détecter des colonnes non protégées

**Contexte :**

Vous avez un Model User avec :
```javascript
static fillable = ['name', 'email'];
```

Mais votre table contient : `id, name, email, password, is_admin, api_token`

**Prompt pour Claude :**

```text
Vérifie le schéma du Model User (models/User.js) avec ma base de données MySQL sur localhost
```

**Configuration DB requise :**

```json
{
  "driver": "mysql",
  "host": "localhost",
  "database": "myapp",
  "user": "root",
  "password": "secret"
}
```

**Résultat attendu :**

```json
{
  "isValid": true,
  "issues": [
    {
      "type": "unguarded_columns",
      "severity": "warning",
      "fields": ["password", "is_admin", "api_token"],
      "message": "Columns exist in database but not in fillable: password, is_admin, api_token"
    }
  ]
}
```

**Action recommandée :**

Ajoutez ces colonnes sensibles à `static hidden` dans le Model :

```javascript
static hidden = ['password', 'api_token'];
```

---

### Exemple 5 : Détecter des colonnes fillable inexistantes

**Contexte :**

Vous avez un Model avec :
```javascript
static fillable = ['name', 'email', 'phone', 'address'];
```

Mais vous avez supprimé la colonne `phone` de la base de données.

**Prompt pour Claude :**

```text
Vérifie si le Model User est synchronisé avec la base de données
```

**Résultat attendu :**

```json
{
  "isValid": false,
  "issues": [
    {
      "type": "missing_column",
      "severity": "error",
      "fields": ["phone"],
      "message": "Fillable columns not found in database: phone"
    }
  ]
}
```

**Action recommandée :**

Supprimez `phone` de la propriété `fillable` ou créez une migration pour ajouter la colonne.

---

## Validation des relations

### Exemple 6 : Détecter une clé étrangère manquante

**Contexte :**

Vous avez défini une relation :
```javascript
user() {
  return this.belongsTo('User', 'user_id', 'id');
}
```

Mais vous avez oublié de créer la clé étrangère dans la migration.

**Prompt pour Claude :**

```text
Vérifie les relations du Model Post et compare avec les clés étrangères en base
```

**Résultat attendu :**

```json
{
  "isValid": true,
  "issues": [
    {
      "type": "missing_foreign_key",
      "severity": "warning",
      "relation": "user (belongsTo)",
      "message": "belongsTo relation 'user' defined but no foreign key found for user_id"
    }
  ]
}
```

**Action recommandée :**

Créez une migration pour ajouter la contrainte :

```javascript
await schema.table('posts', (table) => {
  table.foreign('user_id').references('users.id').onDelete('CASCADE');
});
```

---

### Exemple 7 : Détecter des clés étrangères orphelines

**Contexte :**

Votre table `posts` a une clé étrangère `category_id` vers `categories.id`, mais vous n'avez pas défini la relation dans le Model.

**Prompt pour Claude :**

```text
Analyse les clés étrangères de la table posts et vérifie qu'elles ont des relations correspondantes
```

**Résultat attendu :**

```json
{
  "isValid": true,
  "issues": [
    {
      "type": "orphaned_foreign_key",
      "severity": "info",
      "column": "category_id",
      "message": "Foreign key category_id -> categories.id exists but no relation defined"
    }
  ]
}
```

**Action recommandée :**

Ajoutez la relation manquante dans le Model :

```javascript
category() {
  return this.belongsTo('Category', 'category_id', 'id');
}
```

---

## Analyse de Controllers

### Exemple 8 : Détecter des méthodes CRUD manquantes

**Contexte :**

Votre Controller n'a que les méthodes `index` et `show`.

**Prompt pour Claude :**

```text
Analyse le PostController et vérifie qu'il implémente toutes les méthodes CRUD standards
```

**Résultat attendu :**

```json
{
  "isValid": true,
  "methods": {
    "index": true,
    "show": true,
    "store": false,
    "update": false,
    "destroy": false
  },
  "issues": [
    {
      "type": "missing_methods",
      "severity": "warning",
      "methods": ["store", "update", "destroy"],
      "message": "Missing CRUD methods: store, update, destroy"
    }
  ]
}
```

**Action recommandée :**

Utilisez l'outil `generate_controller` pour générer un Controller complet, puis fusionnez avec votre code existant.

---

### Exemple 9 : Détecter l'absence de gestion d'erreurs

**Contexte :**

Votre Controller n'utilise pas de blocs try/catch.

**Prompt pour Claude :**

```text
Analyse la qualité du code du UserController
```

**Résultat attendu :**

```json
{
  "isValid": true,
  "hasErrorHandling": false,
  "issues": [
    {
      "type": "no_error_handling",
      "severity": "warning",
      "message": "No error handling (try/catch or throw) detected"
    }
  ]
}
```

**Action recommandée :**

Enveloppez vos méthodes dans des blocs try/catch :

```javascript
async index(req, res) {
  try {
    const users = await User.all();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

---

### Exemple 10 : Détecter un Model non importé

**Contexte :**

Vous avez créé un Controller mais oublié d'importer le Model.

**Prompt pour Claude :**

```text
Vérifie que le ProductController utilise correctement le Model Product
```

**Résultat attendu :**

```json
{
  "isValid": false,
  "hasImport": false,
  "modelUsageCount": 0,
  "issues": [
    {
      "type": "missing_import",
      "severity": "error",
      "message": "Model Product not imported"
    }
  ]
}
```

**Action recommandée :**

Ajoutez l'import en haut du fichier :

```javascript
import Product from '../models/Product.js';
```

---

## Vérification complète

### Exemple 11 : Audit complet avant déploiement

**Prompt pour Claude :**

```text
Fais une vérification complète de cohérence pour :
- Model : models/User.js
- Controller : controllers/UserController.js
- Migrations : database/migrations/
- Base de données : MySQL localhost myapp
```

**Résultat attendu :**

```json
{
  "isValid": true,
  "model": {
    "tableName": "users",
    "isValid": true,
    "issues": []
  },
  "relations": {
    "isValid": true,
    "issues": []
  },
  "controller": {
    "isValid": true,
    "hasImport": true,
    "methods": {
      "index": true,
      "show": true,
      "store": true,
      "update": true,
      "destroy": true
    },
    "issues": []
  },
  "migrations": {
    "total": 5,
    "applied": 5,
    "pending": 0,
    "deleted": 0,
    "isValid": true,
    "issues": []
  },
  "overallIssues": []
}
```

**Interprétation :**

✅ **Tout est OK !** Vous pouvez déployer en production en toute confiance.

---

### Exemple 12 : Détecter une migration en attente

**Contexte :**

Vous avez créé une migration mais oublié de l'appliquer.

**Prompt pour Claude :**

```text
Vérifie l'état des migrations du projet
```

**Résultat attendu :**

```json
{
  "total": 3,
  "applied": 2,
  "pending": 1,
  "isValid": true,
  "pendingMigrations": [
    "20240315_140000_add_category_to_posts.js"
  ],
  "issues": []
}
```

**Action recommandée :**

Appliquez la migration en attente :

```bash
npm run migrate
```

Puis re-vérifiez :

```text
Vérifie à nouveau l'état des migrations
```

---

## 🔥 Scénarios avancés

### Exemple 13 : Migration complexe avec relations

**Prompt pour Claude :**

```text
Crée une migration create_order_items_table pour une relation many-to-many entre Order et Product :
- id (primary key)
- order_id (foreign key vers orders.id, cascade)
- product_id (foreign key vers products.id, restrict)
- quantity (integer, not null, default 1)
- unit_price (decimal 10,2, not null)
- discount_percent (decimal 5,2, default 0.00)
- subtotal (decimal 10,2, not null)
- timestamps
- index composé unique sur (order_id, product_id)
```

---

### Exemple 14 : Model avec relations polymorphes

**Prompt pour Claude :**

```text
Crée un Model Comment avec relations polymorphes :
- table comments
- fillable : content, user_id
- relation belongsTo vers User
- relation morphTo vers Commentable (peut être Post ou Video)
- timestamps et softDeletes
```

---

### Exemple 15 : Vérification de plusieurs Models

**Prompt pour Claude :**

```text
Vérifie la cohérence de tous mes Models :
- models/User.js
- models/Post.js
- models/Comment.js
- models/Category.js

Avec la base de données MySQL localhost
```

---

## 💡 Tips et bonnes pratiques

### Tip 1 : Utiliser les prompts en français

Le MCP comprend parfaitement le français. Pas besoin de traduire vos demandes en anglais !

### Tip 2 : Être précis sur les types de colonnes

Au lieu de :
```text
Crée une migration avec une colonne price
```

Préférez :
```text
Crée une migration avec une colonne price (decimal 10,2, not null, default 0.00)
```

### Tip 3 : Vérifier après chaque génération

Workflow recommandé :
1. Générer le Model → Vérifier le schéma
2. Générer la migration → Vérifier l'état
3. Générer le Controller → Analyser le code
4. Vérification complète finale

### Tip 4 : Grouper les opérations

Au lieu de 3 prompts séparés :
```text
Crée un Model User
Crée un Controller UserController
Crée une migration create_users_table
```

Groupez :
```text
Crée un Model User, son Controller UserController et sa migration create_users_table avec les champs name, email, password
```

---

## 📚 Ressources

- [Documentation complète](./VERIFICATION_TOOLS.md)
- [Correctifs appliqués](./FIXES_APPLIED.md)
- [Documentation Outlet ORM](https://github.com/votre-repo/outlet-orm)

---

*Exemples mis à jour le 15/03/2024*
