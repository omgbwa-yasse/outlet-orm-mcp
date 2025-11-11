# 📦 Outlet ORM MCP Server

Un serveur MCP (Model Context Protocol) complet pour Outlet ORM, permettant à Claude Desktop et autres clients MCP d'interagir avec vos bases de données MySQL, PostgreSQL et SQLite via une interface intuitive.

---

## 🎯 Qu'est-ce que c'est ?

**Outlet ORM** est un ORM JavaScript inspiré de Laravel Eloquent pour Node.js. Ce serveur MCP expose toutes ses fonctionnalités via le Model Context Protocol, permettant à des agents IA comme Claude d'interagir directement avec votre base de données.

### Cas d'usage

- 💬 **Interface conversationnelle** pour gérer votre base de données
- 🔍 **Exploration de données** sans écrire de SQL
- 📊 **Requêtes complexes** en langage naturel
- 🚀 **Prototypage rapide** d'applications
- 🧪 **Tests et développement** facilités
- 📈 **Analyse de données** interactive

---

## ✨ Fonctionnalités

### 🔌 Gestion de connexion
- Connexion/déconnexion automatique
- Configuration via `.env` ou variables d'environnement
- Support MySQL, PostgreSQL, SQLite

### 📊 Opérations CRUD complètes
- Création, lecture, mise à jour, suppression
- Recherche par ID
- Récupération de tous les enregistrements
- Support du chargement des relations (eager loading)

### 🔍 Query Builder puissant
- Clauses WHERE complexes
- WHERE IN, WHERE NULL, WHERE NOT NULL
- Sélection de colonnes spécifiques
- Tri (ORDER BY)
- Pagination (LIMIT/OFFSET)
- Comptage et vérification d'existence
- Eager loading avec WITH

### 🗄️ Utilitaires de base de données
- Liste des tables disponibles
- Description de la structure des tables
- Exécution de requêtes SQL brutes
- Support des paramètres sécurisés

### 📦 Opérations bulk performantes
- Insertion multiple en une seule requête
- Mise à jour conditionnelle multiple

### 📈 Agrégations atomiques
- Incrément de colonnes
- Décrément de colonnes
- Opérations thread-safe

### 🔄 Support des migrations
- Liste des migrations disponibles
- Intégration avec le CLI outlet-migrate

---

## 🚀 Installation rapide

### 1. Prérequis

- Node.js >= 18.0.0
- Une base de données (MySQL, PostgreSQL ou SQLite)

### 2. Installation

```bash
cd outletORMMCP
npm install

# Installer le driver de votre base de données
npm install mysql2      # Pour MySQL/MariaDB
# ou
npm install pg          # Pour PostgreSQL  
# ou
npm install sqlite3     # Pour SQLite
```

### 3. Configuration

```bash
# Copier et éditer le fichier de configuration
cp .env.example .env
# Éditer .env avec vos paramètres de connexion
```

### 4. Test

```bash
# Tester la configuration
npm test

# Démarrer le serveur
npm start
```

### 5. Configuration Claude Desktop

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": ["C:\\chemin\\vers\\outletORMMCP\\index.js"]
    }
  }
}
```

Redémarrez Claude Desktop !

---

## 📖 Documentation

| Fichier | Description |
|---------|-------------|
| **README.md** | Documentation complète avec tous les outils |
| **QUICKSTART.md** | Guide de démarrage rapide pas à pas |
| **EXAMPLES.js** | Exemples d'utilisation détaillés |
| **INSTALLATION.md** | Guide d'installation et dépannage |
| **CONTRIBUTING.md** | Guide pour contribuer au projet |
| **CHANGELOG.md** | Historique des versions |

---

## 🛠️ Outils MCP disponibles (19)

### Connexion
- `connect_database` - Initialiser la connexion
- `disconnect_database` - Fermer la connexion

### CRUD de base
- `find_by_id` - Trouver un enregistrement par ID
- `get_all` - Récupérer tous les enregistrements
- `create_record` - Créer un nouvel enregistrement
- `update_record` - Mettre à jour un enregistrement
- `delete_record` - Supprimer un enregistrement

### Query Builder
- `query_builder` - Constructeur de requêtes avancées

### Requêtes brutes
- `execute_raw_query` - Exécuter du SQL personnalisé

### Utilitaires
- `list_tables` - Lister toutes les tables
- `describe_table` - Obtenir la structure d'une table

### Opérations bulk
- `bulk_insert` - Insérer plusieurs enregistrements
- `bulk_update` - Mettre à jour plusieurs enregistrements

### Agrégations
- `aggregate` - Incrément/décrément atomique

### Migrations
- `list_migrations` - Lister les fichiers de migration

---

## 💡 Exemples d'utilisation

### Dans Claude Desktop

```text
Connecte-toi à la base de données
```

```text
Liste toutes les tables disponibles
```

```text
Crée un utilisateur avec le nom "John Doe" et l'email "john@example.com"
```

```text
Récupère tous les utilisateurs actifs triés par date de création, limite à 10
```

```text
Mets à jour l'utilisateur ID 5 avec le statut "active"
```

```text
Compte combien d'utilisateurs ont le statut "pending"
```

```text
Récupère la page 2 des utilisateurs, 15 par page
```

```text
Insère 3 nouveaux utilisateurs : Alice, Bob et Charlie
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Claude Desktop │
│   (ou autre)    │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│  Outlet ORM MCP │
│     Server      │
└────────┬────────┘
         │
┌────────▼────────┐
│   Outlet ORM    │
│   (Package)     │
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │
│  MySQL/PG/SQLite│
└─────────────────┘
```

---

## 🔧 Configuration avancée

### Variables d'environnement

```env
# Driver de base de données
DB_DRIVER=mysql|postgres|sqlite

# MySQL/PostgreSQL
DB_HOST=localhost
DB_PORT=3306|5432
DB_DATABASE=myapp
DB_USER=root
DB_PASSWORD=secret

# SQLite
DB_FILE=./database.sqlite
```

### Options du Query Builder

```javascript
{
  table: "users",
  where: [
    { column: "status", operator: "=", value: "active" },
    { column: "age", operator: ">", value: 18 }
  ],
  select: ["id", "name", "email"],
  orderBy: [
    { column: "created_at", direction: "desc" }
  ],
  limit: 10,
  offset: 0,
  with: ["posts", "profile"],
  action: "get|first|count|paginate|exists"
}
```

---

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez Node.js : `node --version` (>= 18.0.0)
2. Réinstallez les dépendances : `npm install`
3. Vérifiez les permissions d'exécution

### Erreur de connexion à la base

1. Vérifiez le fichier `.env`
2. Testez la connexion : `npm test`
3. Assurez-vous que le driver est installé
4. Vérifiez que la base est démarrée

### Claude Desktop ne voit pas le serveur

1. Vérifiez le chemin absolu dans la config
2. Redémarrez complètement Claude Desktop
3. Consultez les logs de Claude Desktop
4. Testez avec l'inspecteur : `npx @modelcontextprotocol/inspector node index.js`

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les détails.

### Développement

```bash
# Mode développement (auto-reload)
npm run dev

# Tests
npm test

# Démarrer normalement
npm start
```

---

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE)

---

## 🔗 Liens utiles

- **Outlet ORM** : https://github.com/omgbwa-yasse/outlet-orm
- **Model Context Protocol** : https://modelcontextprotocol.io
- **Claude Desktop** : https://claude.ai/download
- **MCP Inspector** : https://github.com/modelcontextprotocol/inspector

---

## 🙏 Remerciements

Ce serveur MCP est construit sur [Outlet ORM](https://github.com/omgbwa-yasse/outlet-orm), un excellent ORM JavaScript inspiré de Laravel Eloquent.

---

## 📊 Statistiques

- **19 outils MCP** exposés
- **3 bases de données** supportées (MySQL, PostgreSQL, SQLite)
- **Support complet** des opérations CRUD
- **Query Builder** avancé
- **Migrations** intégrées
- **100% JavaScript** moderne (ES6+)

---

**Développé avec ❤️ pour la communauté Outlet ORM et Model Context Protocol**

🚀 **Bon développement !**
