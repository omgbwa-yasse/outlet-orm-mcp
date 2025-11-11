# Outlet ORM MCP Server

Un serveur MCP (Model Context Protocol) pour [Outlet ORM](https://github.com/omgbwa-yasse/outlet-orm), exposant toutes les fonctionnalités de l'ORM via des outils utilisables par des agents IA comme Claude Desktop.

## 🎯 Fonctionnalités

Ce serveur MCP expose les capacités complètes d'Outlet ORM :

### 🔌 Gestion de la connexion
- Connexion/déconnexion à la base de données
- Support MySQL, PostgreSQL et SQLite

### 📊 Opérations CRUD
- `find_by_id` - Trouver un enregistrement par ID
- `get_all` - Récupérer tous les enregistrements
- `create_record` - Créer un nouvel enregistrement
- `update_record` - Mettre à jour un enregistrement
- `delete_record` - Supprimer un enregistrement

### 🔍 Query Builder avancé
- `query_builder` - Constructeur de requêtes avec support de :
  - Clauses WHERE complexes
  - WHERE IN
  - SELECT (colonnes spécifiques)
  - ORDER BY
  - LIMIT/OFFSET
  - Eager loading (WITH)
  - Actions : get, first, count, paginate, exists

### 🗄️ Utilitaires de base de données
- `list_tables` - Lister toutes les tables
- `describe_table` - Obtenir la structure d'une table
- `execute_raw_query` - Exécuter du SQL brut

### 📦 Opérations bulk
- `bulk_insert` - Insertion multiple
- `bulk_update` - Mise à jour multiple

### 📈 Agrégations
- `aggregate` - Incrément/décrément atomique

### 🔄 Migrations
- `list_migrations` - Lister les fichiers de migration
- Recommandation d'utiliser le CLI pour les opérations de migration

## 📥 Installation

```bash
cd outletORMMCP
npm install
```

### Installer le driver de base de données

Selon votre SGBD, installez le driver approprié :

```bash
# MySQL/MariaDB
npm install mysql2

# PostgreSQL
npm install pg

# SQLite
npm install sqlite3
```

## ⚙️ Configuration

1. Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

2. Configurez vos paramètres de base de données dans `.env` :

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=myapp
DB_USER=root
DB_PASSWORD=secret
```

### Variables d'environnement supportées

- `DB_DRIVER` : `mysql` | `postgres` | `sqlite`
- `DB_HOST` : Hôte de la base de données
- `DB_PORT` : Port (3306 pour MySQL, 5432 pour PostgreSQL)
- `DB_DATABASE` ou `DB_NAME` : Nom de la base de données
- `DB_USER` ou `DB_USERNAME` : Nom d'utilisateur
- `DB_PASSWORD` : Mot de passe
- Pour SQLite : `DB_FILE` ou `SQLITE_DB` ou `SQLITE_FILENAME`

## 🚀 Utilisation avec Claude Desktop

### 1. Configuration de Claude Desktop

Ajoutez le serveur MCP à votre configuration Claude Desktop (`claude_desktop_config.json`) :

**macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "C:\\wamp64_New\\www\\packages\\outletORMMCP\\index.js"
      ],
      "env": {
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

**Note** : Vous pouvez soit définir les variables d'environnement dans la config, soit utiliser un fichier `.env` dans le dossier du serveur.

### 2. Redémarrez Claude Desktop

Après avoir ajouté la configuration, redémarrez complètement Claude Desktop.

### 3. Vérifiez la connexion

Dans Claude Desktop, vous devriez voir une icône 🔌 indiquant que le serveur MCP est connecté.

## 💡 Exemples d'utilisation

Voici quelques exemples de requêtes que vous pouvez faire à Claude :

### Connexion à la base de données

```
Connecte-toi à la base de données
```

### Lister les tables

```
Liste toutes les tables de la base de données
```

### Opérations CRUD

```
Crée un utilisateur avec le nom "John Doe" et l'email "john@example.com" dans la table users
```

```
Récupère l'utilisateur avec l'ID 1 de la table users
```

```
Mets à jour l'utilisateur ID 5 dans la table users avec le statut "active"
```

```
Supprime l'utilisateur ID 10 de la table users
```

### Requêtes avancées

```
Trouve tous les utilisateurs actifs triés par date de création, limite à 10 résultats
```

```
Compte le nombre d'utilisateurs avec le statut "pending"
```

```
Récupère les utilisateurs avec pagination (page 2, 15 par page)
```

### Eager Loading

```
Récupère tous les utilisateurs avec leurs posts et profils
```

### Opérations bulk

```
Insère plusieurs utilisateurs en une seule fois : 
- { name: "Alice", email: "alice@example.com" }
- { name: "Bob", email: "bob@example.com" }
```

```
Mets à jour tous les utilisateurs avec le statut "pending" vers "active"
```

### SQL brut

```
Exécute cette requête SQL : SELECT * FROM users WHERE created_at > '2024-01-01'
```

## 🛠️ Outils disponibles

### Gestion de la connexion

#### `connect_database`
Initialise la connexion à la base de données.

#### `disconnect_database`
Ferme la connexion à la base de données.

### CRUD de base

#### `find_by_id`
- `table` (string, requis) : Nom de la table
- `id` (string|number, requis) : Valeur de la clé primaire
- `with` (array, optionnel) : Relations à charger

#### `get_all`
- `table` (string, requis) : Nom de la table
- `with` (array, optionnel) : Relations à charger

#### `create_record`
- `table` (string, requis) : Nom de la table
- `data` (object, requis) : Données à insérer

#### `update_record`
- `table` (string, requis) : Nom de la table
- `id` (string|number, requis) : ID de l'enregistrement
- `data` (object, requis) : Données à mettre à jour

#### `delete_record`
- `table` (string, requis) : Nom de la table
- `id` (string|number, requis) : ID de l'enregistrement

### Query Builder

#### `query_builder`
Constructeur de requêtes avancé.

Paramètres :
- `table` (string, requis) : Nom de la table
- `where` (array, optionnel) : Clauses WHERE
  - Chaque élément : `{ column, operator, value }`
- `whereIn` (array, optionnel) : Clauses WHERE IN
  - Chaque élément : `{ column, values: [] }`
- `select` (array, optionnel) : Colonnes à sélectionner
- `orderBy` (array, optionnel) : Tris
  - Chaque élément : `{ column, direction: 'asc'|'desc' }`
- `limit` (number, optionnel) : Limite de résultats
- `offset` (number, optionnel) : Décalage
- `with` (array, optionnel) : Relations à charger
- `action` (string, optionnel) : Action à exécuter
  - Options : `get`, `first`, `count`, `paginate`, `exists`
- `page` (number, optionnel) : Numéro de page (pour paginate)
- `perPage` (number, optionnel) : Résultats par page (pour paginate)

### Requêtes brutes

#### `execute_raw_query`
- `sql` (string, requis) : Requête SQL
- `params` (array, optionnel) : Paramètres de la requête

### Utilitaires

#### `list_tables`
Liste toutes les tables de la base de données.

#### `describe_table`
- `table` (string, requis) : Nom de la table

### Opérations bulk

#### `bulk_insert`
- `table` (string, requis) : Nom de la table
- `records` (array, requis) : Tableau d'enregistrements

#### `bulk_update`
- `table` (string, requis) : Nom de la table
- `where` (array, requis) : Conditions
- `data` (object, requis) : Données à mettre à jour

### Agrégations

#### `aggregate`
- `table` (string, requis) : Nom de la table
- `operation` (string, requis) : `increment` ou `decrement`
- `column` (string, requis) : Colonne à modifier
- `where` (array, optionnel) : Conditions
- `amount` (number, optionnel) : Montant (défaut : 1)

### Migrations

#### `list_migrations`
- `migrationsPath` (string, optionnel) : Chemin du dossier migrations

## 🔧 Développement

### Démarrer en mode développement

```bash
npm run dev
```

### Démarrer normalement

```bash
npm start
```

### Tester le serveur

Vous pouvez tester le serveur en utilisant l'inspecteur MCP :

```bash
npx @modelcontextprotocol/inspector node index.js
```

## 📚 Ressources

- [Outlet ORM Documentation](https://github.com/omgbwa-yasse/outlet-orm)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 Licence

MIT

## 🙏 Remerciements

Ce serveur MCP est basé sur [Outlet ORM](https://github.com/omgbwa-yasse/outlet-orm), un ORM JavaScript inspiré de Laravel Eloquent.
