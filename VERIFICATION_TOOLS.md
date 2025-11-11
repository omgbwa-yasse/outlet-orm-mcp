# Outils de Vérification et d'Analyse - Outlet ORM MCP

## 🔍 Vue d'ensemble

Le serveur MCP Outlet ORM inclut maintenant des outils puissants pour **vérifier la cohérence** entre vos Models, Controllers, Migrations et votre base de données. Ces outils vous aident à :

- ✅ Détecter les incohérences entre le code et la base de données
- ✅ Vérifier l'intégrité des relations
- ✅ Analyser la qualité du code des Controllers
- ✅ Suivre l'état des migrations
- ✅ Garantir la sécurité et les bonnes pratiques

---

## 📋 Outils Disponibles

### 1. `verify_model_schema`

Vérifie si la configuration d'un Model correspond au schéma réel de la table en base de données.

**Ce qui est vérifié :**
- ✅ Les colonnes `fillable` existent dans la base de données
- ✅ Les colonnes avec `casts` existent dans la base de données
- ⚠️ Détecte les colonnes en base non déclarées dans `fillable` (risque de sécurité)
- ℹ️ Compare les types de données

**Paramètres :**
```json
{
  "modelPath": "models/User.js",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "myapp",
    "user": "root",
    "password": "secret"
  }
}
```

**Exemple de résultat :**
```json
{
  "tableName": "users",
  "modelPath": "/path/to/models/User.js",
  "schema": [
    {
      "name": "id",
      "type": "int(11)",
      "nullable": false,
      "key": "PRI",
      "default": null
    },
    {
      "name": "name",
      "type": "varchar(255)",
      "nullable": false,
      "key": "",
      "default": null
    },
    {
      "name": "email",
      "type": "varchar(255)",
      "nullable": false,
      "key": "UNI",
      "default": null
    }
  ],
  "fillable": ["name", "email"],
  "casts": {"is_active": "boolean"},
  "issues": [
    {
      "type": "unguarded_columns",
      "severity": "warning",
      "fields": ["password"],
      "message": "Columns exist in database but not in fillable: password"
    }
  ],
  "isValid": true
}
```

**Types d'erreurs détectées :**

| Type | Sévérité | Description |
|------|----------|-------------|
| `missing_column` | ❌ **error** | Une colonne fillable/cast n'existe pas en base |
| `unguarded_columns` | ⚠️ **warning** | Des colonnes DB ne sont pas dans fillable (risque de mass assignment) |

---

### 2. `verify_relations`

Vérifie si les relations du Model sont correctement définies et correspondent aux clés étrangères de la base de données.

**Ce qui est vérifié :**
- ✅ Les relations `belongsTo` ont des clés étrangères correspondantes
- ⚠️ Détecte les clés étrangères orphelines (sans relation définie)
- ℹ️ Liste toutes les relations trouvées dans le Model

**Paramètres :**
```json
{
  "modelPath": "models/Post.js",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "database": "myapp",
    "user": "root",
    "password": "secret"
  }
}
```

**Exemple de résultat :**
```json
{
  "tableName": "posts",
  "modelPath": "/path/to/models/Post.js",
  "relations": [
    {
      "type": "belongsTo",
      "relatedModel": "User"
    },
    {
      "type": "hasMany",
      "relatedModel": "Comment"
    }
  ],
  "foreignKeys": [
    {
      "column": "user_id",
      "referencedTable": "users",
      "referencedColumn": "id"
    }
  ],
  "issues": [],
  "isValid": true
}
```

**Types d'erreurs détectées :**

| Type | Sévérité | Description |
|------|----------|-------------|
| `missing_foreign_key` | ⚠️ **warning** | Une relation belongsTo n'a pas de clé étrangère en base |
| `orphaned_foreign_key` | ℹ️ **info** | Une clé étrangère existe mais aucune relation définie |

---

### 3. `verify_migration_status`

Vérifie quelles migrations ont été appliquées et détecte les migrations en attente ou supprimées.

**Ce qui est vérifié :**
- ✅ Migrations appliquées avec succès
- 📋 Migrations en attente (fichiers non appliqués)
- ⚠️ Migrations supprimées (appliquées mais fichiers manquants)

**Paramètres :**
```json
{
  "migrationsPath": "database/migrations",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "database": "myapp",
    "user": "root",
    "password": "secret"
  }
}
```

**Exemple de résultat :**
```json
{
  "migrationsPath": "/path/to/database/migrations",
  "total": 5,
  "applied": 3,
  "pending": 2,
  "deleted": 0,
  "appliedMigrations": [
    "20240101_create_users_table.js",
    "20240102_create_posts_table.js",
    "20240103_add_status_to_users.js"
  ],
  "pendingMigrations": [
    "20240104_create_comments_table.js",
    "20240105_add_category_to_posts.js"
  ],
  "deletedMigrations": [],
  "issues": [],
  "isValid": true
}
```

**Types d'erreurs détectées :**

| Type | Sévérité | Description |
|------|----------|-------------|
| `deleted_migrations` | ❌ **error** | Migrations appliquées mais fichiers supprimés |

---

### 4. `analyze_controller`

Analyse un Controller pour vérifier l'utilisation correcte du Model, l'implémentation des méthodes CRUD et les bonnes pratiques.

**Ce qui est vérifié :**
- ✅ Import du Model
- ✅ Présence des méthodes CRUD (index, show, store, update, destroy)
- ✅ Utilisation effective du Model
- ✅ Gestion d'erreurs (try/catch ou throw)
- ℹ️ Support de la pagination
- ℹ️ Eager loading des relations

**Paramètres :**
```json
{
  "controllerPath": "controllers/UserController.js",
  "modelName": "User"
}
```

**Exemple de résultat :**
```json
{
  "controllerPath": "/path/to/controllers/UserController.js",
  "modelName": "User",
  "hasImport": true,
  "methods": {
    "index": true,
    "show": true,
    "store": true,
    "update": true,
    "destroy": true
  },
  "modelUsageCount": 12,
  "hasPagination": true,
  "hasEagerLoading": true,
  "hasErrorHandling": true,
  "issues": [],
  "isValid": true
}
```

**Types d'erreurs détectées :**

| Type | Sévérité | Description |
|------|----------|-------------|
| `missing_import` | ❌ **error** | Le Model n'est pas importé |
| `missing_methods` | ⚠️ **warning** | Méthodes CRUD manquantes |
| `unused_model` | ⚠️ **warning** | Model importé mais jamais utilisé |
| `no_error_handling` | ⚠️ **warning** | Pas de gestion d'erreurs |

---

### 5. `check_consistency`

Vérification **complète et globale** de la cohérence entre Model, Controller, Migrations et Base de données.

**Ce qui est vérifié :**
- ✅ Tout ce que fait `verify_model_schema`
- ✅ Tout ce que fait `verify_relations`
- ✅ Tout ce que fait `verify_migration_status`
- ✅ Tout ce que fait `analyze_controller`
- ✅ Cross-vérifications (ex: migration de table en attente)

**Paramètres :**
```json
{
  "modelPath": "models/User.js",
  "controllerPath": "controllers/UserController.js",
  "migrationsPath": "database/migrations",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "database": "myapp",
    "user": "root",
    "password": "secret"
  }
}
```

**Exemple de résultat :**
```json
{
  "model": {
    "tableName": "users",
    "schema": [...],
    "fillable": [...],
    "issues": [],
    "isValid": true
  },
  "relations": {
    "relations": [...],
    "foreignKeys": [...],
    "issues": [],
    "isValid": true
  },
  "controller": {
    "hasImport": true,
    "methods": {...},
    "issues": [],
    "isValid": true
  },
  "migrations": {
    "total": 5,
    "applied": 3,
    "pending": 2,
    "issues": [],
    "isValid": true
  },
  "overallIssues": [
    {
      "type": "pending_table_migration",
      "severity": "warning",
      "message": "Table 'users' migration exists but is not applied"
    }
  ],
  "isValid": true
}
```

---

## 💡 Exemples d'utilisation avec Claude

### Vérifier un Model

```
Vérifie si le Model User (models/User.js) correspond à la base de données MySQL sur localhost
```

### Vérifier les relations

```
Analyse les relations du Model Post et vérifie qu'elles correspondent aux clés étrangères en base
```

### Vérifier l'état des migrations

```
Liste toutes les migrations et indique lesquelles sont appliquées, en attente, ou supprimées
```

### Analyser un Controller

```
Analyse le UserController pour vérifier s'il utilise correctement le Model User et implémente toutes les méthodes CRUD
```

### Vérification complète

```
Fais une vérification complète de cohérence pour le Model User, son Controller et ses migrations avec la base de données
```

---

## 🔧 Configuration de la base de données

Les outils de vérification nécessitent une connexion à la base de données. Vous pouvez fournir la configuration de deux manières :

### 1. Via le paramètre `dbConfig`

```json
{
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "myapp",
    "user": "root",
    "password": "secret"
  }
}
```

### 2. Via variables d'environnement

Créez un fichier `.env` dans le dossier du serveur MCP :

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=myapp
DB_USER=root
DB_PASSWORD=secret
```

---

## 🎯 Cas d'usage recommandés

### 1. **Avant de déployer en production**

```
Fais une vérification complète de cohérence pour tous mes Models
```

### 2. **Après avoir modifié un Model**

```
Vérifie que le Model User correspond toujours au schéma de la base de données
```

### 3. **Avant d'appliquer des migrations**

```
Vérifie l'état des migrations et liste celles qui sont en attente
```

### 4. **Audit de code**

```
Analyse tous mes Controllers pour vérifier s'ils suivent les bonnes pratiques
```

### 5. **Débogage de relations**

```
Vérifie que les relations du Model Post correspondent aux clés étrangères en base
```

---

## ⚙️ Intégration avec le workflow de développement

### Workflow recommandé

1. **Générer le Model** avec `generate_model`
2. **Générer la Migration** avec `generate_migration`
3. **Vérifier la cohérence** avec `check_consistency`
4. Appliquer la migration (via CLI Outlet ORM)
5. **Re-vérifier** avec `verify_model_schema`
6. **Générer le Controller** avec `generate_controller`
7. **Analyser le Controller** avec `analyze_controller`
8. **Vérification finale** avec `check_consistency`

---

## 🚨 Niveaux de sévérité

| Symbole | Niveau | Description | Action recommandée |
|---------|--------|-------------|-------------------|
| ❌ | **error** | Problème critique qui empêche le bon fonctionnement | **Corriger immédiatement** |
| ⚠️ | **warning** | Problème potentiel ou mauvaise pratique | Corriger dès que possible |
| ℹ️ | **info** | Information utile, pas nécessairement un problème | Prendre connaissance |

---

## 📊 Métriques de qualité

Les outils fournissent un champ `isValid` :

- `isValid: true` ✅ : Aucune erreur critique détectée
- `isValid: false` ❌ : Au moins une erreur critique détectée

Un projet de qualité devrait avoir :
- ✅ Tous les Models avec `isValid: true`
- ✅ Toutes les relations avec `isValid: true`
- ✅ Tous les Controllers avec `isValid: true`
- ✅ Aucune migration supprimée
- ⚠️ Maximum de warnings tolérés : 0-2 par fichier

---

## 🔒 Sécurité

### Détection de mass assignment vulnerabilities

L'outil `verify_model_schema` détecte automatiquement les colonnes non protégées :

```json
{
  "type": "unguarded_columns",
  "severity": "warning",
  "fields": ["password", "admin", "api_token"],
  "message": "Columns exist in database but not in fillable: password, admin, api_token"
}
```

**Recommandation** : Ajoutez ces colonnes à `hidden` ou `fillable` selon le besoin.

---

## 🛠️ Dépannage

### "Failed to connect to database"

- Vérifiez vos identifiants de connexion
- Assurez-vous que le serveur MySQL/PostgreSQL est démarré
- Vérifiez les permissions réseau (firewall, port)

### "Model file not found"

- Utilisez des chemins absolus ou relatifs au répertoire courant
- Vérifiez les permissions de lecture du fichier

### "Could not find table name in model file"

- Assurez-vous que le Model contient `static table = 'table_name';`
- Vérifiez la syntaxe du fichier Model

---

## 📝 Notes techniques

- Les outils utilisent une connexion partagée à la base de données (singleton)
- La connexion est initialisée à la demande (lazy loading)
- Les analyses de fichiers sont effectuées via regex (pas d'exécution de code)
- Compatible avec MySQL, PostgreSQL et SQLite

---

## 🔄 Prochaines améliorations prévues

- [ ] Support de la vérification de seeders
- [ ] Détection automatique de N+1 queries dans les Controllers
- [ ] Suggestions de corrections automatiques
- [ ] Export des rapports en format JSON/HTML
- [ ] Intégration avec les tests unitaires

---

*Documentation générée pour Outlet ORM MCP Server - Outils de vérification v1.0*
