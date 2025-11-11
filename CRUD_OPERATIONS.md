# Opérations CRUD - Enrichissement du contexte

Le serveur MCP Outlet ORM peut maintenant effectuer des opérations CRUD directement sur la base de données pour enrichir son contexte lorsque nécessaire.

## 🎯 Objectif

Ces outils permettent au MCP de :
- **Lire** les données actuelles pour mieux comprendre le contexte
- **Inspecter** le schéma des tables avant de générer du code
- **Vérifier** l'état des données lors des validations
- **Effectuer** des opérations de maintenance si demandé

## 🛠️ Outils disponibles (6 nouveaux)

### 1. `query_data` - Interroger les données

Récupère des données d'une table avec filtres, tri et pagination.

**Paramètres :**
- `table` (requis) : Nom de la table
- `select` (optionnel) : Colonnes à sélectionner (défaut: "*")
- `where` (optionnel) : Conditions WHERE sous forme d'objet
- `orderBy` (optionnel) : Clause ORDER BY
- `limit` (optionnel) : Nombre maximum de lignes
- `offset` (optionnel) : Nombre de lignes à sauter
- `dbConfig` (optionnel) : Configuration de base de données

**Exemple d'utilisation avec Claude :**
```text
Récupère tous les utilisateurs actifs, triés par date de création, limité à 10
```

**Résultat :**
```json
{
  "success": true,
  "table": "users",
  "query": "SELECT * FROM users WHERE status = ? ORDER BY created_at DESC LIMIT 10",
  "count": 10,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "created_at": "2024-03-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. `create_record` - Créer un enregistrement

Insère un nouvel enregistrement dans une table.

**Paramètres :**
- `table` (requis) : Nom de la table
- `data` (requis) : Objet avec les données à insérer
- `dbConfig` (optionnel) : Configuration de base de données

**Exemple d'utilisation avec Claude :**
```text
Crée un nouvel utilisateur avec le nom "Alice" et l'email "alice@example.com"
```

**Résultat :**
```json
{
  "success": true,
  "table": "users",
  "insertId": 15,
  "data": {
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

---

### 3. `update_record` - Mettre à jour des enregistrements

Met à jour des enregistrements existants avec des conditions WHERE.

**Paramètres :**
- `table` (requis) : Nom de la table
- `data` (requis) : Objet avec les données à mettre à jour
- `where` (requis) : Conditions WHERE (requis pour la sécurité)
- `dbConfig` (optionnel) : Configuration de base de données

**Exemple d'utilisation avec Claude :**
```text
Met à jour le statut de l'utilisateur avec l'ID 5 à "inactive"
```

**Résultat :**
```json
{
  "success": true,
  "table": "users",
  "affectedRows": 1,
  "data": {
    "status": "inactive"
  },
  "where": {
    "id": 5
  }
}
```

---

### 4. `delete_record` - Supprimer des enregistrements

Supprime des enregistrements d'une table avec des conditions WHERE.

**Paramètres :**
- `table` (requis) : Nom de la table
- `where` (requis) : Conditions WHERE (requis pour la sécurité)
- `dbConfig` (optionnel) : Configuration de base de données

**Exemple d'utilisation avec Claude :**
```text
Supprime l'utilisateur avec l'ID 10
```

**Résultat :**
```json
{
  "success": true,
  "table": "users",
  "deletedRows": 1,
  "where": {
    "id": 10
  }
}
```

---

### 5. `execute_raw_sql` - Exécuter du SQL brut

Exécute une requête SQL brute pour des opérations complexes.

**Paramètres :**
- `sql` (requis) : Requête SQL à exécuter
- `params` (optionnel) : Paramètres pour les requêtes préparées
- `dbConfig` (optionnel) : Configuration de base de données

**Exemple d'utilisation avec Claude :**
```text
Compte combien d'utilisateurs ont été créés en mars 2024
```

**SQL généré :**
```sql
SELECT COUNT(*) as total FROM users WHERE created_at >= '2024-03-01' AND created_at < '2024-04-01'
```

**Résultat :**
```json
{
  "success": true,
  "sql": "SELECT COUNT(*) as total FROM users WHERE created_at >= ? AND created_at < ?",
  "count": 1,
  "data": [
    {
      "total": 42
    }
  ]
}
```

---

### 6. `get_table_schema` - Obtenir le schéma d'une table

Récupère les informations détaillées sur le schéma d'une table (colonnes, types, index).

**Paramètres :**
- `table` (requis) : Nom de la table
- `dbConfig` (optionnel) : Configuration de base de données

**Exemple d'utilisation avec Claude :**
```text
Montre-moi le schéma de la table users
```

**Résultat :**
```json
{
  "success": true,
  "table": "users",
  "columns": [
    {
      "name": "id",
      "type": "int(11)",
      "nullable": false,
      "key": "PRI",
      "default": null,
      "extra": "auto_increment"
    },
    {
      "name": "name",
      "type": "varchar(255)",
      "nullable": false,
      "key": "",
      "default": null,
      "extra": ""
    },
    {
      "name": "email",
      "type": "varchar(255)",
      "nullable": false,
      "key": "UNI",
      "default": null,
      "extra": ""
    }
  ],
  "indexes": [
    {
      "name": "PRIMARY",
      "column": "id",
      "unique": true,
      "type": "BTREE"
    },
    {
      "name": "users_email_unique",
      "column": "email",
      "unique": true,
      "type": "BTREE"
    }
  ]
}
```

---

## 🎯 Cas d'usage

### Cas 1 : Enrichir le contexte avant génération

**Prompt :**
```text
Avant de générer le Model User, montre-moi le schéma actuel de la table users
```

Le MCP va :
1. Utiliser `get_table_schema` pour inspecter la table
2. Analyser les colonnes et index
3. Générer un Model qui correspond exactement au schéma

---

### Cas 2 : Vérifier les données avant validation

**Prompt :**
```text
Vérifie le Model User puis montre-moi un exemple de données
```

Le MCP va :
1. Utiliser `verify_model_schema` pour valider le Model
2. Utiliser `query_data` pour récupérer quelques enregistrements
3. Comparer la structure des données avec le Model

---

### Cas 3 : Debug d'une relation

**Prompt :**
```text
Vérifie la relation entre User et Post, puis montre-moi un utilisateur avec ses posts
```

Le MCP va :
1. Utiliser `verify_relations` pour valider les relations
2. Utiliser `query_data` avec JOIN pour récupérer les données
3. Vérifier que les relations fonctionnent correctement

---

### Cas 4 : Analyse de données avant migration

**Prompt :**
```text
Avant de créer la migration pour ajouter la colonne "role", montre-moi combien d'utilisateurs existent
```

Le MCP va :
1. Utiliser `query_data` avec COUNT
2. Informer sur l'impact de la migration
3. Suggérer une valeur par défaut appropriée

---

### Cas 5 : Nettoyage de données

**Prompt :**
```text
Supprime tous les utilisateurs avec le statut "pending" créés il y a plus de 30 jours
```

Le MCP va :
1. Utiliser `query_data` pour compter les enregistrements concernés
2. Demander confirmation
3. Utiliser `delete_record` ou `execute_raw_sql` pour supprimer

---

## 🔒 Sécurité

### Protection contre les suppressions/modifications accidentelles

Toutes les opérations destructives (`update_record`, `delete_record`) **requièrent** une clause WHERE :

```javascript
// ❌ ERREUR - Pas de WHERE
await updateRecord({
  table: 'users',
  data: { status: 'active' }
  // Manque 'where' !
});
// Retourne: "WHERE clause is required for safety"

// ✅ OK - Avec WHERE
await updateRecord({
  table: 'users',
  data: { status: 'active' },
  where: { id: 5 }
});
```

### Utilisation de requêtes préparées

Toutes les requêtes utilisent des **paramètres préparés** pour éviter les injections SQL :

```javascript
// ✅ Sécurisé
const result = await queryData({
  table: 'users',
  where: { email: userInput }  // Automatiquement échappé
});

// ✅ Sécurisé avec SQL brut
const result = await executeRawSql({
  sql: 'SELECT * FROM users WHERE email = ?',
  params: [userInput]  // Paramètres préparés
});
```

---

## 💡 Bonnes pratiques

### 1. Toujours limiter les résultats

```text
❌ Récupère tous les utilisateurs
✅ Récupère les 100 premiers utilisateurs
✅ Récupère les utilisateurs actifs, page 1, 20 par page
```

### 2. Utiliser des filtres spécifiques

```text
❌ Montre-moi les posts
✅ Montre-moi les 10 derniers posts publiés
✅ Montre-moi les posts de l'utilisateur 5 créés en mars
```

### 3. Demander confirmation pour les opérations destructives

```text
✅ Combien d'utilisateurs inactifs existe-t-il ?
   (Claude compte d'abord)
✅ Supprime les utilisateurs inactifs
   (Après confirmation)
```

### 4. Préférer les outils spécifiques au SQL brut

```text
✅ Utiliser query_data pour SELECT
✅ Utiliser create_record pour INSERT
✅ Utiliser update_record pour UPDATE
❌ Utiliser execute_raw_sql sauf si nécessaire
```

---

## 🔄 Workflow recommandé

### Génération de code informée

```
1. get_table_schema (inspecter la table)
   ↓
2. query_data (voir des exemples de données)
   ↓
3. generate_model (générer le Model)
   ↓
4. verify_model_schema (vérifier la cohérence)
   ↓
5. generate_controller (générer le Controller)
```

### Vérification approfondie

```
1. verify_model_schema (vérifier le Model)
   ↓
2. query_data (récupérer des données de test)
   ↓
3. verify_relations (vérifier les relations)
   ↓
4. query_data avec JOIN (tester les relations)
   ↓
5. check_consistency (vérification finale)
```

---

## 📊 Exemples avancés

### Exemple 1 : Analyse de distribution

**Prompt :**
```text
Analyse la distribution des statuts dans la table users
```

**SQL généré :**
```sql
SELECT status, COUNT(*) as count FROM users GROUP BY status
```

---

### Exemple 2 : Recherche avec LIKE

**Prompt :**
```text
Trouve tous les utilisateurs dont l'email contient "@gmail.com"
```

**SQL généré :**
```sql
SELECT * FROM users WHERE email LIKE '%@gmail.com%'
```

---

### Exemple 3 : Jointure complexe

**Prompt :**
```text
Récupère les utilisateurs avec le nombre de posts qu'ils ont créés
```

**SQL généré :**
```sql
SELECT u.*, COUNT(p.id) as posts_count 
FROM users u 
LEFT JOIN posts p ON p.user_id = u.id 
GROUP BY u.id
```

---

### Exemple 4 : Mise à jour conditionnelle

**Prompt :**
```text
Active tous les utilisateurs qui ont au moins 1 post publié
```

**SQL généré :**
```sql
UPDATE users 
SET status = 'active' 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM posts 
  WHERE status = 'published'
)
```

---

## 🚨 Limitations

### Opérations non supportées directement

- **Transactions** : Utilisez `execute_raw_sql` avec BEGIN/COMMIT
- **Locks** : Utilisez `execute_raw_sql` avec FOR UPDATE
- **Triggers** : Gérez dans la base de données directement
- **Stored procedures** : Appelez via `execute_raw_sql`

### Taille des résultats

- **Limite recommandée** : 1000 lignes maximum
- **Au-delà** : Utilisez la pagination (limit + offset)
- **Export massif** : Utilisez des outils dédiés

---

## 📚 Résumé des 14 outils disponibles

### Génération de code (3)
1. `generate_model` - Générer un Model
2. `generate_controller` - Générer un Controller
3. `generate_migration` - Générer une Migration

### Vérification (5)
4. `verify_model_schema` - Vérifier Model ↔ DB
5. `verify_relations` - Vérifier les relations
6. `verify_migration_status` - Vérifier les migrations
7. `analyze_controller` - Analyser un Controller
8. `check_consistency` - Vérification globale

### CRUD et contexte (6)
9. `query_data` - Interroger les données
10. `create_record` - Créer un enregistrement
11. `update_record` - Mettre à jour
12. `delete_record` - Supprimer
13. `execute_raw_sql` - SQL brut
14. `get_table_schema` - Schéma de table

---

## 🎓 Formation rapide

### Pour les développeurs

```text
# 1. Découverte
"Montre-moi le schéma de la table users"

# 2. Exploration
"Récupère les 5 derniers utilisateurs créés"

# 3. Analyse
"Combien d'utilisateurs ont le statut 'active' ?"

# 4. Génération
"Génère un Model User basé sur la table users"

# 5. Vérification
"Vérifie que le Model User correspond à la base de données"
```

### Pour les analystes

```text
# Statistiques
"Compte les utilisateurs par statut"

# Tendances
"Montre l'évolution des inscriptions par mois en 2024"

# Anomalies
"Trouve les utilisateurs sans email"

# Relations
"Liste les utilisateurs qui n'ont jamais créé de post"
```

---

**Bon développement avec les opérations CRUD enrichies ! 🚀**
