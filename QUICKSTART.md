# Guide de démarrage rapide - Outlet ORM MCP

Ce guide vous aidera à configurer et utiliser le serveur MCP Outlet ORM avec Claude Desktop.

## Étape 1 : Installation

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

## Étape 2 : Configuration

### Option A : Utiliser un fichier .env (Recommandé)

```bash
cp .env.example .env
```

Éditez `.env` avec vos paramètres :

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=myapp
DB_USER=root
DB_PASSWORD=secret
```

### Option B : Configuration directe dans Claude Desktop

Pas besoin de `.env`, les variables d'environnement seront définies dans la config de Claude.

## Étape 3 : Configuration de Claude Desktop

### Localisation du fichier de configuration

- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

### Ajouter le serveur MCP

Ouvrez le fichier et ajoutez :

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "/chemin/absolu/vers/outletORMMCP/index.js"
      ]
    }
  }
}
```

**Exemple Windows** :
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

**Exemple macOS/Linux** :
```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "/Users/username/projects/outletORMMCP/index.js"
      ]
    }
  }
}
```

**Note** : Si vous utilisez un fichier `.env`, vous n'avez pas besoin de la section `env` dans la config.

## Étape 4 : Redémarrer Claude Desktop

1. Fermez complètement Claude Desktop
2. Relancez l'application
3. Vérifiez la présence de l'icône 🔌 qui indique que le serveur MCP est connecté

## Étape 5 : Tester

Essayez ces commandes dans Claude Desktop :

### Test de connexion
```
Connecte-toi à la base de données
```

### Lister les tables
```
Quelles tables sont disponibles dans la base de données ?
```

### Créer un enregistrement
```
Crée un utilisateur avec le nom "Test User" et l'email "test@example.com" dans la table users
```

### Lire des données
```
Récupère tous les utilisateurs de la table users
```

### Requête avancée
```
Trouve tous les utilisateurs avec le statut "active", triés par date de création, limite à 10 résultats
```

## Exemples d'utilisation avancée

### Eager Loading (charger des relations)
```
Récupère tous les utilisateurs avec leurs posts et profils
```

### Pagination
```
Récupère la page 2 des utilisateurs, 15 par page
```

### Compter
```
Combien d'utilisateurs ont le statut "pending" ?
```

### Mise à jour bulk
```
Mets à jour tous les utilisateurs avec le statut "pending" vers "active"
```

### Insertion multiple
```
Insère ces 3 utilisateurs dans la table users :
- Alice (alice@example.com)
- Bob (bob@example.com)
- Charlie (charlie@example.com)
```

### SQL brut
```
Exécute cette requête : SELECT COUNT(*) as total FROM users WHERE created_at > '2024-01-01'
```

### Incrément atomique
```
Incrémente le champ "login_count" de 1 pour l'utilisateur avec l'ID 5
```

## Dépannage

### Le serveur ne se connecte pas

1. Vérifiez que Node.js est installé : `node --version`
2. Vérifiez que le chemin dans la config est correct (absolu)
3. Consultez les logs de Claude Desktop
4. Testez le serveur manuellement : `node index.js` (il devrait rester en attente)

### Erreur de connexion à la base de données

1. Vérifiez vos paramètres dans `.env` ou dans la config Claude
2. Assurez-vous que le driver est installé (`mysql2`, `pg`, ou `sqlite3`)
3. Testez la connexion avec un client de base de données classique
4. Vérifiez que la base de données est démarrée

### Le serveur démarre mais les outils ne fonctionnent pas

1. Essayez de vous connecter d'abord : "Connecte-toi à la base de données"
2. Vérifiez que les tables existent : "Liste les tables"
3. Consultez les erreurs retournées par les outils

### Tester le serveur en dehors de Claude

Utilisez l'inspecteur MCP :

```bash
npx @modelcontextprotocol/inspector node index.js
```

Cela ouvrira une interface web pour tester les outils manuellement.

## Support

Pour obtenir de l'aide :

- Issues GitHub : https://github.com/omgbwa-yasse/outlet-orm/issues
- Documentation Outlet ORM : https://github.com/omgbwa-yasse/outlet-orm
- Documentation MCP : https://modelcontextprotocol.io

## Prochaines étapes

Une fois que tout fonctionne, explorez :

1. Les migrations avec `outlet-migrate` (CLI)
2. La définition de modèles personnalisés
3. Les relations entre tables
4. Les opérations avancées (joins, agrégations, etc.)

Bon développement ! 🚀
