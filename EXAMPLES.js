// Exemple d'utilisation du serveur Outlet ORM MCP
// Ce fichier montre comment les outils MCP sont utilisés en pratique

/*
 * IMPORTANT : Ce fichier est à titre d'illustration uniquement.
 * Les outils MCP sont appelés par Claude Desktop, pas directement en JavaScript.
 * Les exemples ci-dessous montrent les requêtes que vous pouvez faire à Claude.
 */

// ============================================================================
// CONNEXION À LA BASE DE DONNÉES
// ============================================================================

/*
Requête Claude Desktop :
"Connecte-toi à la base de données"

Outil MCP appelé : connect_database
Paramètres : {}
*/

// ============================================================================
// OPÉRATIONS CRUD DE BASE
// ============================================================================

/*
1. CRÉER UN ENREGISTREMENT

Requête Claude :
"Crée un utilisateur avec le nom 'John Doe' et l'email 'john@example.com'"

Outil MCP : create_record
Paramètres :
{
  "table": "users",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
*/

/*
2. TROUVER PAR ID

Requête Claude :
"Récupère l'utilisateur avec l'ID 1"

Outil MCP : find_by_id
Paramètres :
{
  "table": "users",
  "id": 1
}
*/

/*
3. RÉCUPÉRER TOUS LES ENREGISTREMENTS

Requête Claude :
"Donne-moi tous les utilisateurs"

Outil MCP : get_all
Paramètres :
{
  "table": "users"
}
*/

/*
4. METTRE À JOUR UN ENREGISTREMENT

Requête Claude :
"Mets à jour l'utilisateur ID 5 avec le statut 'active'"

Outil MCP : update_record
Paramètres :
{
  "table": "users",
  "id": 5,
  "data": {
    "status": "active"
  }
}
*/

/*
5. SUPPRIMER UN ENREGISTREMENT

Requête Claude :
"Supprime l'utilisateur avec l'ID 10"

Outil MCP : delete_record
Paramètres :
{
  "table": "users",
  "id": 10
}
*/

// ============================================================================
// QUERY BUILDER AVANCÉ
// ============================================================================

/*
1. REQUÊTE AVEC CONDITIONS WHERE

Requête Claude :
"Trouve tous les utilisateurs actifs de plus de 18 ans"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "where": [
    { "column": "status", "operator": "=", "value": "active" },
    { "column": "age", "operator": ">", "value": 18 }
  ],
  "action": "get"
}
*/

/*
2. REQUÊTE AVEC WHERE IN

Requête Claude :
"Récupère les utilisateurs avec les IDs 1, 5, 10, 15"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "whereIn": [
    { "column": "id", "values": [1, 5, 10, 15] }
  ],
  "action": "get"
}
*/

/*
3. SÉLECTION DE COLONNES SPÉCIFIQUES

Requête Claude :
"Récupère seulement le nom et l'email de tous les utilisateurs"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "select": ["name", "email"],
  "action": "get"
}
*/

/*
4. TRI ET LIMITE

Requête Claude :
"Donne-moi les 10 derniers utilisateurs créés"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "orderBy": [
    { "column": "created_at", "direction": "desc" }
  ],
  "limit": 10,
  "action": "get"
}
*/

/*
5. PAGINATION

Requête Claude :
"Récupère la page 2 des utilisateurs, 15 par page"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "action": "paginate",
  "page": 2,
  "perPage": 15
}
*/

/*
6. COMPTER LES RÉSULTATS

Requête Claude :
"Combien d'utilisateurs ont le statut 'pending' ?"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "where": [
    { "column": "status", "operator": "=", "value": "pending" }
  ],
  "action": "count"
}
*/

/*
7. VÉRIFIER L'EXISTENCE

Requête Claude :
"Est-ce qu'il existe des utilisateurs avec l'email 'test@example.com' ?"

Outil MCP : query_builder
Paramètres :
{
  "table": "users",
  "where": [
    { "column": "email", "operator": "=", "value": "test@example.com" }
  ],
  "action": "exists"
}
*/

/*
8. EAGER LOADING (CHARGER DES RELATIONS)

Requête Claude :
"Récupère tous les utilisateurs avec leurs posts et profils"

Outil MCP : find_by_id ou get_all
Paramètres :
{
  "table": "users",
  "with": ["posts", "profile"]
}
*/

// ============================================================================
// OPÉRATIONS BULK
// ============================================================================

/*
1. INSERTION MULTIPLE

Requête Claude :
"Insère 3 utilisateurs : Alice (alice@example.com), Bob (bob@example.com), Charlie (charlie@example.com)"

Outil MCP : bulk_insert
Paramètres :
{
  "table": "users",
  "records": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com" },
    { "name": "Charlie", "email": "charlie@example.com" }
  ]
}
*/

/*
2. MISE À JOUR MULTIPLE

Requête Claude :
"Mets à jour tous les utilisateurs avec le statut 'pending' vers 'active'"

Outil MCP : bulk_update
Paramètres :
{
  "table": "users",
  "where": [
    { "column": "status", "operator": "=", "value": "pending" }
  ],
  "data": {
    "status": "active"
  }
}
*/

// ============================================================================
// AGRÉGATIONS
// ============================================================================

/*
1. INCRÉMENT ATOMIQUE

Requête Claude :
"Incrémente le champ login_count de 1 pour l'utilisateur ID 5"

Outil MCP : aggregate
Paramètres :
{
  "table": "users",
  "operation": "increment",
  "column": "login_count",
  "where": [
    { "column": "id", "operator": "=", "value": 5 }
  ],
  "amount": 1
}
*/

/*
2. DÉCRÉMENT ATOMIQUE

Requête Claude :
"Décrémente le stock de 5 pour le produit ID 10"

Outil MCP : aggregate
Paramètres :
{
  "table": "products",
  "operation": "decrement",
  "column": "stock",
  "where": [
    { "column": "id", "operator": "=", "value": 10 }
  ],
  "amount": 5
}
*/

// ============================================================================
// REQUÊTES BRUTES
// ============================================================================

/*
EXÉCUTER DU SQL PERSONNALISÉ

Requête Claude :
"Exécute cette requête : SELECT COUNT(*) as total FROM users WHERE created_at > '2024-01-01'"

Outil MCP : execute_raw_query
Paramètres :
{
  "sql": "SELECT COUNT(*) as total FROM users WHERE created_at > ?",
  "params": ["2024-01-01"]
}
*/

// ============================================================================
// UTILITAIRES DE BASE DE DONNÉES
// ============================================================================

/*
1. LISTER LES TABLES

Requête Claude :
"Quelles tables sont disponibles dans la base ?"

Outil MCP : list_tables
Paramètres : {}
*/

/*
2. DÉCRIRE UNE TABLE

Requête Claude :
"Quelle est la structure de la table users ?"

Outil MCP : describe_table
Paramètres :
{
  "table": "users"
}
*/

// ============================================================================
// MIGRATIONS
// ============================================================================

/*
LISTER LES MIGRATIONS

Requête Claude :
"Quelles migrations sont disponibles ?"

Outil MCP : list_migrations
Paramètres : {}

Note : Pour exécuter les migrations, utilisez le CLI :
outlet-migrate migrate
outlet-migrate rollback --steps 1
outlet-migrate status
*/

// ============================================================================
// EXEMPLES DE SCÉNARIOS COMPLEXES
// ============================================================================

/*
SCÉNARIO 1 : Recherche d'utilisateurs avec filtres multiples

Requête Claude :
"Trouve tous les utilisateurs actifs, âgés de 18 à 65 ans, triés par nom, avec leurs profils"

Outils MCP appelés en séquence :
1. query_builder avec where, orderBy, with
Paramètres :
{
  "table": "users",
  "where": [
    { "column": "status", "operator": "=", "value": "active" },
    { "column": "age", "operator": ">=", "value": 18 },
    { "column": "age", "operator": "<=", "value": 65 }
  ],
  "orderBy": [
    { "column": "name", "direction": "asc" }
  ],
  "with": ["profile"],
  "action": "get"
}
*/

/*
SCÉNARIO 2 : Créer un utilisateur et récupérer avec ses relations

Requête Claude :
"Crée un utilisateur 'Test User' (test@example.com) puis récupère-le avec son profil"

Outils MCP appelés en séquence :
1. create_record
2. find_by_id avec with
*/

/*
SCÉNARIO 3 : Statistiques sur les utilisateurs

Requête Claude :
"Combien d'utilisateurs actifs ai-je ? Et combien au total ?"

Outils MCP appelés en séquence :
1. query_builder avec action "count" et where status=active
2. query_builder avec action "count" sans where
*/

// ============================================================================
// BONNES PRATIQUES
// ============================================================================

/*
1. Toujours se connecter d'abord :
   "Connecte-toi à la base de données"

2. Vérifier les tables disponibles :
   "Liste les tables"

3. Examiner la structure avant d'insérer :
   "Décris la table users"

4. Utiliser les paramètres pour les requêtes brutes (prévention injection SQL) :
   execute_raw_query avec params au lieu de concaténer

5. Préférer les opérations bulk pour l'efficacité :
   bulk_insert au lieu de create_record multiple

6. Utiliser les agrégations atomiques pour les compteurs :
   aggregate au lieu de read + update

7. Exploiter l'eager loading pour éviter N+1 :
   Charger les relations avec "with" dès le départ
*/
