# Outlet ORM MCP Server

Un serveur MCP (Model Context Protocol) pour **générer**, **vérifier** et **gérer les données** des Models, Controllers et Migrations pour Outlet ORM.

## 🚀 Fonctionnalités

### 🎨 Génération de code

- **Models** : Génération automatique avec support des relations (hasOne, hasMany, belongsTo, belongsToMany, etc.)
- **Controllers** : Création de controllers REST avec toutes les méthodes CRUD
- **Migrations** : Génération de migrations avec gestion complète des colonnes et relations

### 🔍 Vérification et analyse

- **Vérification de schéma** : Compare les Models avec la base de données réelle
- **Validation des relations** : Vérifie la cohérence avec les clés étrangères
- **État des migrations** : Suivi des migrations appliquées et en attente
- **Analyse de Controllers** : Vérifie la qualité du code et les bonnes pratiques
- **Vérification globale** : Analyse complète de la cohérence du projet

[📖 **Documentation complète des outils de vérification**](./VERIFICATION_TOOLS.md)

### 💾 Opérations CRUD sur les données

- **Consultation de données** : Query avec filtres, tri et pagination
- **Création d'enregistrements** : Insert avec retour de l'ID généré
- **Mise à jour** : Update sécurisé avec clause WHERE obligatoire
- **Suppression** : Delete sécurisé avec clause WHERE obligatoire
- **Requêtes SQL brutes** : Exécution de requêtes complexes (JOINs, agrégations)
- **Inspection de schéma** : Analyse de structure de tables (colonnes, index)

[📖 **Documentation complète des opérations CRUD**](./CRUD_OPERATIONS.md)

## 📦 Installation

```bash
cd outletORMMCP
npm install
```

## ⚙️ Configuration

### Configuration Claude Desktop

Ajoutez dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": ["C:\\wamp64_New\\www\\packages\\outletORMMCP\\index.js"],
      "env": {
        "OUTLET_ORM_ROOT": "C:\\wamp64_New\\www\\packages\\outlet-orm",
        "DB_DRIVER": "mysql",
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_DATABASE": "myapp",
        "DB_USER": "root",
        "DB_PASSWORD": "secret"
      }
    }
  }
}
```

### Variables d'environnement

| Variable | Description | Requis | Par défaut |
|----------|-------------|--------|------------|
| `OUTLET_ORM_ROOT` | Chemin vers le projet Outlet ORM | **Oui** | - |
| `DB_DRIVER` | Driver de base de données (`mysql`, `postgres`, `sqlite`) | Non* | - |
| `DB_HOST` | Hôte de la base de données | Non* | - |
| `DB_PORT` | Port de la base de données | Non* | - |
| `DB_DATABASE` | Nom de la base de données | Non* | - |
| `DB_USER` | Utilisateur de la base de données | Non* | - |
| `DB_PASSWORD` | Mot de passe de la base de données | Non* | - |

> *Requis uniquement pour les outils de vérification (verify_model_schema, verify_relations, etc.)

## 🛠️ Outils disponibles

### Génération de code

| Outil | Description |
|-------|-------------|
| `generate_model` | Génère un fichier Model avec relations |
| `generate_controller` | Génère un Controller REST complet |
| `generate_migration` | Génère une migration de table |

### Vérification et analyse

| Outil | Description |
|-------|-------------|
| `verify_model_schema` | Vérifie la cohérence Model ↔ Base de données |
| `verify_relations` | Valide les relations et clés étrangères |
| `verify_migration_status` | Vérifie l'état des migrations |
| `analyze_controller` | Analyse la qualité du Controller |
| `check_consistency` | Vérification globale complète |

### Opérations CRUD

| Outil | Description |
|-------|-------------|
| `query_data` | Interroge la base avec filtres, tri et pagination |
| `create_record` | Crée un enregistrement (retourne l'ID) |
| `update_record` | Met à jour des enregistrements (WHERE obligatoire) |
| `delete_record` | Supprime des enregistrements (WHERE obligatoire) |
| `execute_raw_sql` | Exécute des requêtes SQL brutes |
| `get_table_schema` | Récupère la structure d'une table |

## 📖 Exemples d'utilisation

### Génération d'un Model avec relations

```text
Crée un Model Post avec :
- table posts
- champs : title (string), content (text), user_id (integer), published_at (datetime)
- relation belongsTo vers User
- relation hasMany vers Comment
- timestamps et softDeletes
```

### Génération d'un Controller

```text
Crée un Controller UserController pour le Model User avec toutes les méthodes CRUD
```

### Génération d'une Migration

```text
Crée une migration create_users_table avec :
- id (primary key)
- name (string 255)
- email (string 255, unique)
- password (string 255)
- is_active (boolean, default true)
- timestamps
```

### Vérification de cohérence

```text
Vérifie la cohérence du Model User avec la base de données
```

```text
Analyse les relations du Model Post et vérifie les clés étrangères
```

```text
Fais une vérification complète du Model User, son Controller et ses migrations
```

### Opérations CRUD sur les données

```text
Récupère les 10 premiers utilisateurs actifs triés par date de création
```

```text
Inspecte la structure de la table users avant de générer le Model
```

```text
Analyse la répartition des données pour planifier une migration
```

[Voir plus d'exemples dans VERIFICATION_TOOLS.md](./VERIFICATION_TOOLS.md)

[Voir plus d'exemples CRUD dans CRUD_OPERATIONS.md](./CRUD_OPERATIONS.md)

## 📂 Structure des fichiers générés

```
outlet-orm/
├── models/
│   ├── User.js
│   └── Post.js
├── controllers/
│   ├── UserController.js
│   └── PostController.js
└── database/
    └── migrations/
        ├── 20240315_120000_create_users_table.js
        └── 20240315_120500_create_posts_table.js
```

## 🔍 Fonctionnalités avancées

### Support complet des relations

- ✅ `hasOne` - Relation un-à-un
- ✅ `hasMany` - Relation un-à-plusieurs
- ✅ `belongsTo` - Relation inverse
- ✅ `belongsToMany` - Relation plusieurs-à-plusieurs
- ✅ `hasOneThrough` - Relation via table intermédiaire
- ✅ `hasManyThrough` - Relation via table intermédiaire
- ✅ `morphOne` / `morphMany` - Relations polymorphes

### Support des types de colonnes

Tous les types MySQL/PostgreSQL :

- Texte : `string`, `text`, `mediumText`, `longText`
- Nombres : `integer`, `bigInteger`, `decimal`, `float`, `double`
- Dates : `date`, `datetime`, `timestamp`, `time`, `year`
- Booléens : `boolean`
- JSON : `json`, `jsonb`
- Et plus...

### Validation et sécurité

- ✅ Détection de mass assignment vulnerabilities
- ✅ Validation des noms de fichiers
- ✅ Vérification des colonnes non protégées
- ✅ Analyse de la gestion d'erreurs dans les Controllers
- ✅ Détection de clés étrangères orphelines

## 🐛 Dépannage

### "OUTLET_ORM_ROOT is required"

Assurez-vous d'avoir défini la variable d'environnement dans la configuration de Claude Desktop.

### "Failed to connect to database"

Vérifiez vos identifiants de connexion dans les variables d'environnement DB_*.

### Problèmes de génération

- Vérifiez que les dossiers `models/`, `controllers/`, et `database/migrations/` existent
- Vérifiez les permissions d'écriture
- Consultez les logs pour plus de détails

## 📚 Documentation

- [Guide complet des outils de vérification](./VERIFICATION_TOOLS.md)
- [Guide complet des opérations CRUD](./CRUD_OPERATIONS.md)
- [Correctifs appliqués](./FIXES_APPLIED.md)
- [Documentation Outlet ORM](https://github.com/votre-repo/outlet-orm)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus de détails.

## 📄 Licence

MIT

## 🔗 Liens utiles

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Outlet ORM](https://github.com/votre-repo/outlet-orm)
- [Claude Desktop](https://claude.ai/desktop)

---

Développé avec ❤️ pour Outlet ORM
