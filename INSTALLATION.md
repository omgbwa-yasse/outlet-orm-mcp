# 🎉 Outlet ORM MCP Server - Installation terminée !

Le serveur MCP pour Outlet ORM a été créé avec succès dans `outletORMMCP/`.

## 📁 Structure du projet

```
outletORMMCP/
├── index.js                              # Serveur MCP principal
├── package.json                          # Configuration npm
├── .env.example                          # Exemple de configuration
├── .gitignore                           # Fichiers à ignorer
├── LICENSE                              # Licence MIT
├── README.md                            # Documentation complète
├── QUICKSTART.md                        # Guide de démarrage rapide
├── CONTRIBUTING.md                      # Guide de contribution
├── CHANGELOG.md                         # Historique des versions
├── EXAMPLES.js                          # Exemples d'utilisation
└── claude_desktop_config.example.json   # Config exemple Claude Desktop
```

## ✅ Installation terminée

Les dépendances ont été installées :
- ✅ @modelcontextprotocol/sdk
- ✅ outlet-orm
- ✅ dotenv

## 🚀 Prochaines étapes

### 1. Installer le driver de base de données

Selon votre SGBD, installez le driver approprié :

```bash
cd c:\wamp64_New\www\packages\outletORMMCP

# MySQL/MariaDB
npm install mysql2

# OU PostgreSQL
npm install pg

# OU SQLite
npm install sqlite3
```

### 2. Configurer la base de données

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
```

### 3. Tester le serveur

```bash
# Test manuel (le serveur doit rester en attente)
node index.js

# Ou avec l'inspecteur MCP
npx @modelcontextprotocol/inspector node index.js
```

### 4. Configurer Claude Desktop

Éditez votre configuration Claude Desktop :

**Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
**macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`

Ajoutez :

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "C:\\wamp64_New\\www\\packages\\outletORMMCP\\index.js"
      ]
    }
  }
}
```

### 5. Redémarrer Claude Desktop

Fermez complètement et relancez Claude Desktop.

## 🔧 Outils MCP disponibles

Le serveur expose **19 outils** pour interagir avec votre base de données :

### Connexion
- `connect_database` - Se connecter à la BDD
- `disconnect_database` - Se déconnecter

### CRUD
- `find_by_id` - Trouver par ID
- `get_all` - Récupérer tous les enregistrements
- `create_record` - Créer un enregistrement
- `update_record` - Mettre à jour
- `delete_record` - Supprimer

### Query Builder
- `query_builder` - Requêtes avancées (WHERE, JOIN, ORDER, LIMIT, etc.)

### Utilitaires
- `list_tables` - Lister les tables
- `describe_table` - Structure d'une table
- `execute_raw_query` - SQL brut

### Bulk
- `bulk_insert` - Insertion multiple
- `bulk_update` - Mise à jour multiple

### Agrégations
- `aggregate` - Incrément/décrément atomique

### Migrations
- `list_migrations` - Lister les migrations

## 📖 Documentation

- **README.md** - Documentation complète
- **QUICKSTART.md** - Guide de démarrage rapide
- **EXAMPLES.js** - Exemples d'utilisation détaillés
- **CONTRIBUTING.md** - Guide de contribution

## 💡 Exemples de requêtes pour Claude

Une fois configuré dans Claude Desktop, essayez :

```
Connecte-toi à la base de données
```

```
Liste toutes les tables
```

```
Récupère tous les utilisateurs
```

```
Crée un utilisateur avec le nom "Test" et l'email "test@example.com"
```

```
Trouve tous les utilisateurs actifs triés par date de création
```

## 🐛 Dépannage

Si le serveur ne fonctionne pas :

1. Vérifiez que Node.js >= 18 est installé : `node --version`
2. Vérifiez que le driver de BDD est installé
3. Vérifiez le fichier `.env`
4. Consultez les logs de Claude Desktop
5. Testez avec l'inspecteur : `npx @modelcontextprotocol/inspector node index.js`

## 🔗 Liens utiles

- [Outlet ORM](https://github.com/omgbwa-yasse/outlet-orm)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)

## 📝 Licence

MIT License - Voir le fichier LICENSE

---

**Bon développement avec Outlet ORM MCP ! 🚀**
