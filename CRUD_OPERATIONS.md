# CRUD Operations Guide - Outlet ORM MCP Server

This guide provides comprehensive documentation for the 6 CRUD (Create, Read, Update, Delete) operations exposed as MCP tools. These tools enable direct database interaction for context enrichment and data management.

---

## 🎯 Overview

The CRUD tools allow you to:
- Query data with filters, sorting, and pagination
- Create new records with automatic ID return
- Update existing records with mandatory WHERE clauses
- Delete records with mandatory WHERE clauses
- Execute raw SQL queries for complex operations
- Inspect table schemas and structures

**Security Features:**
- ✅ Parameterized queries (SQL injection protection)
- ✅ Table name validation
- ✅ Column name validation
- ✅ Mandatory WHERE clauses for UPDATE/DELETE
- ✅ Query timeout protection (30s)

---

## 📚 Tools Reference

### 1. `query_data` - Query Database Table

Query data from a database table with optional filters, sorting, and pagination.

#### Input Schema

```json
{
  "table": "string (required)",
  "select": "string (optional, default: '*')",
  "where": "object (optional)",
  "orderBy": "string (optional)",
  "limit": "number (optional)",
  "offset": "number (optional)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `table` | string | Yes | Table name to query | `"users"` |
| `select` | string | No | Columns to select (comma-separated) | `"id, name, email"` |
| `where` | object | No | WHERE conditions as key-value pairs | `{"status": "active"}` |
| `orderBy` | string | No | ORDER BY clause | `"created_at DESC"` |
| `limit` | number | No | Maximum rows to return | `10` |
| `offset` | number | No | Number of rows to skip | `20` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### Examples

**Basic query:**
```
Retrieve all active users
```

Translates to:
```json
{
  "table": "users",
  "where": {"status": "active"}
}
```

**With pagination:**
```
Get the first 10 users ordered by creation date
```

Translates to:
```json
{
  "table": "users",
  "orderBy": "created_at DESC",
  "limit": 10
}
```

**With specific columns:**
```
Get user IDs and emails for users in France
```

Translates to:
```json
{
  "table": "users",
  "select": "id, email",
  "where": {"country": "France"}
}
```

**Complex query:**
```
Get the second page of active users (10 per page) sorted by name
```

Translates to:
```json
{
  "table": "users",
  "where": {"status": "active"},
  "orderBy": "name ASC",
  "limit": 10,
  "offset": 10
}
```

#### Response

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
      "status": "active"
    }
  ]
}
```

#### Use Cases

- 📊 Analyze data distribution before creating migrations
- 🔍 Inspect actual database content for context
- 📈 Gather statistics for planning
- 🧪 Verify data before generating models
- 📋 List records for documentation examples

---

### 2. `create_record` - Insert New Record

Insert a new record into a database table and return the generated ID.

#### Input Schema

```json
{
  "table": "string (required)",
  "data": "object (required)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `table` | string | Yes | Table name | `"users"` |
| `data` | object | Yes | Data to insert (column: value pairs) | `{"name": "John", "email": "john@example.com"}` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### Examples

**Simple insert:**
```
Create a new user with name "Alice" and email "alice@example.com"
```

Translates to:
```json
{
  "table": "users",
  "data": {
    "name": "Alice",
    "email": "alice@example.com",
    "status": "active"
  }
}
```

**Insert with timestamps:**
```
Create a blog post with title, content, and author
```

Translates to:
```json
{
  "table": "posts",
  "data": {
    "title": "My First Post",
    "content": "This is the content...",
    "author_id": 1,
    "published_at": "2025-11-12T10:00:00Z"
  }
}
```

#### Response

```json
{
  "success": true,
  "table": "users",
  "insertId": 42,
  "data": {
    "name": "Alice",
    "email": "alice@example.com",
    "status": "active"
  }
}
```

#### Use Cases

- 🧪 Insert test data for development
- 📝 Create sample records for documentation
- 🔧 Seed initial data
- 🎯 Generate fixture data for testing

#### Security Notes

- All column names are validated
- SQL injection protection via parameterized queries
- Invalid column names are rejected

---

### 3. `update_record` - Update Existing Records

Update existing records in a table. **Requires WHERE clause for safety.**

#### Input Schema

```json
{
  "table": "string (required)",
  "data": "object (required)",
  "where": "object (required)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `table` | string | Yes | Table name | `"users"` |
| `data` | object | Yes | Data to update (column: value pairs) | `{"status": "inactive"}` |
| `where` | object | Yes | WHERE conditions (prevents accidental mass updates) | `{"id": 5}` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### Examples

**Update single record:**
```
Update user with ID 5 to set status as inactive
```

Translates to:
```json
{
  "table": "users",
  "data": {"status": "inactive"},
  "where": {"id": 5}
}
```

**Update multiple fields:**
```
Update user 10's name and email
```

Translates to:
```json
{
  "table": "users",
  "data": {
    "name": "John Updated",
    "email": "john.new@example.com"
  },
  "where": {"id": 10}
}
```

**Conditional update:**
```
Mark all users from France as verified
```

Translates to:
```json
{
  "table": "users",
  "data": {"verified": true},
  "where": {"country": "France"}
}
```

#### Response

```json
{
  "success": true,
  "table": "users",
  "affectedRows": 1,
  "data": {"status": "inactive"},
  "where": {"id": 5}
}
```

#### Use Cases

- 🔧 Fix data issues during development
- 🧪 Modify test data
- 📊 Update sample records
- ✅ Mark records for testing scenarios

#### Security Notes

- **WHERE clause is mandatory** - prevents accidental mass updates
- All table and column names are validated
- Parameterized queries prevent SQL injection
- Empty WHERE object is rejected

---

### 4. `delete_record` - Delete Records

Delete records from a table. **Requires WHERE clause for safety.**

#### Input Schema

```json
{
  "table": "string (required)",
  "where": "object (required)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `table` | string | Yes | Table name | `"users"` |
| `where` | object | Yes | WHERE conditions (prevents accidental mass deletion) | `{"id": 5}` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### Examples

**Delete single record:**
```
Delete user with ID 999
```

Translates to:
```json
{
  "table": "users",
  "where": {"id": 999}
}
```

**Conditional delete:**
```
Delete all inactive users created before 2020
```

Translates to:
```json
{
  "table": "users",
  "where": {
    "status": "inactive",
    "created_at": "< 2020-01-01"
  }
}
```

#### Response

```json
{
  "success": true,
  "table": "users",
  "deletedRows": 1,
  "where": {"id": 999}
}
```

#### Use Cases

- 🧹 Clean up test data
- 🗑️ Remove invalid records
- 🧪 Reset test environment
- 📝 Delete sample/demo data

#### Security Notes

- **WHERE clause is mandatory** - prevents accidental mass deletion
- All table and column names are validated
- Parameterized queries prevent SQL injection
- Empty WHERE object is rejected
- Consider using soft deletes instead for production data

---

### 5. `execute_raw_sql` - Execute Raw SQL Query

Execute a raw SQL query for complex operations. **Use with caution.**

#### Input Schema

```json
{
  "sql": "string (required)",
  "params": "array (optional)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `sql` | string | Yes | Raw SQL query to execute | `"SELECT * FROM users WHERE id = ?"` |
| `params` | array | No | Query parameters for prepared statements | `[5]` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### Examples

**Simple SELECT:**
```
Execute: SELECT COUNT(*) as total FROM users WHERE status = 'active'
```

Translates to:
```json
{
  "sql": "SELECT COUNT(*) as total FROM users WHERE status = ?",
  "params": ["active"]
}
```

**JOINs:**
```
Execute: Get users with their post counts
```

Translates to:
```json
{
  "sql": "SELECT u.id, u.name, COUNT(p.id) as post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id",
  "params": []
}
```

**Aggregations:**
```
Execute: Get average post count per user by country
```

Translates to:
```json
{
  "sql": "SELECT country, AVG(post_count) as avg_posts FROM (SELECT u.country, COUNT(p.id) as post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id, u.country) subquery GROUP BY country",
  "params": []
}
```

**Parameterized query:**
```
Execute: Find users by email pattern with parameter
```

Translates to:
```json
{
  "sql": "SELECT * FROM users WHERE email LIKE ?",
  "params": ["%@example.com"]
}
```

#### Response

```json
{
  "success": true,
  "sql": "SELECT COUNT(*) as total FROM users WHERE status = ?",
  "count": 1,
  "data": [
    {"total": 42}
  ]
}
```

#### Use Cases

- 🔍 Complex JOINs across multiple tables
- 📊 Aggregations and statistics
- 🧮 Window functions and CTEs
- 📈 Performance analysis queries
- 🔧 Database introspection queries

#### Security Notes

- **Use parameterized queries** - always use `params` for user input
- Never concatenate user input into SQL string
- Validate table/column names if they come from user input
- Consider using dedicated tools for simple operations
- Test queries carefully before execution

#### Warning

⚠️ **This tool provides direct SQL access.** Use responsibly:
- Prefer dedicated CRUD tools for simple operations
- Always use parameterized queries for user input
- Be cautious with UPDATE/DELETE operations
- Test queries on development database first

---

### 6. `get_table_schema` - Inspect Table Schema

Get detailed schema information about a table including columns, types, and indexes.

#### Input Schema

```json
{
  "table": "string (required)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `table` | string | Yes | Table name to inspect | `"users"` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### Examples

**Inspect table structure:**
```
Get the schema for the users table
```

Translates to:
```json
{
  "table": "users"
}
```

**Before generating model:**
```
Inspect posts table structure before creating Model
```

Translates to:
```json
{
  "table": "posts"
}
```

#### Response

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
      "name": "email_unique",
      "column": "email",
      "unique": true,
      "type": "BTREE"
    }
  ]
}
```

#### Use Cases

- 📋 Inspect table before generating Model
- 🔍 Understand database structure
- ✅ Verify column types for migrations
- 📊 Document existing database schema
- 🧪 Plan data model generation
- 🎯 Identify primary keys and indexes

#### Column Information

- **name**: Column name
- **type**: SQL data type with length
- **nullable**: Whether NULL values are allowed
- **key**: Index type (PRI=primary, UNI=unique, MUL=multiple)
- **default**: Default value
- **extra**: Extra information (auto_increment, etc.)

#### Index Information

- **name**: Index name
- **column**: Column included in index
- **unique**: Whether index is unique
- **type**: Index type (BTREE, HASH, etc.)

---

## 🔧 Database Configuration

All CRUD tools accept an optional `dbConfig` parameter to override environment variables.

### Configuration Object

```json
{
  "driver": "mysql|postgres|sqlite",
  "host": "localhost",
  "port": 3306,
  "database": "myapp",
  "user": "root",
  "password": "secret"
}
```

### Environment Variables

If `dbConfig` is not provided, these environment variables are used:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_DRIVER` | Database driver | `mysql` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_DATABASE` | Database name | `myapp` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `secret` |

### Example Configuration

```json
{
  "table": "users",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "test_db",
    "user": "root",
    "password": "password"
  }
}
```

---

## 🔒 Security Best Practices

### 1. Input Validation

All tools validate:
- ✅ Table names: `^[a-zA-Z_]\w*$`
- ✅ Column names: `^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)?$`
- ✅ Rejects special characters that could enable injection

### 2. Parameterized Queries

All SQL queries use parameterized statements:

```javascript
// ❌ NEVER DO THIS
const sql = `SELECT * FROM ${table} WHERE id = ${id}`;

// ✅ ALWAYS DO THIS
const sql = 'SELECT * FROM ?? WHERE id = ?';
const params = [table, id];
```

### 3. Mandatory WHERE Clauses

UPDATE and DELETE require WHERE clauses to prevent accidents:

```javascript
// ❌ REJECTED - No WHERE clause
{
  "table": "users",
  "data": {"status": "inactive"}
}

// ✅ ACCEPTED - WHERE clause present
{
  "table": "users",
  "data": {"status": "inactive"},
  "where": {"id": 5}
}
```

### 4. Query Timeout

All queries have a 30-second timeout to prevent:
- Blocking operations
- Deadlocks
- DoS attacks

### 5. Schema Caching

Schema queries are cached for 60 seconds to:
- Reduce database load (90% reduction)
- Improve performance
- Prevent excessive DESCRIBE queries

---

## 📊 Common Workflows

### Workflow 1: Generate Model from Existing Table

```plaintext
1. Inspect table structure
   → get_table_schema({ table: "users" })

2. Analyze data distribution
   → query_data({ table: "users", limit: 10 })

3. Generate Model based on schema
   → generate_model with columns from schema

4. Verify Model matches database
   → verify_model_schema({ modelPath: "models/User.js" })
```

### Workflow 2: Create Test Data

```plaintext
1. Get table schema
   → get_table_schema({ table: "users" })

2. Insert test records
   → create_record({ table: "users", data: {...} })

3. Verify data was created
   → query_data({ table: "users", where: {...} })

4. Clean up after tests
   → delete_record({ table: "users", where: {...} })
```

### Workflow 3: Data Migration Analysis

```plaintext
1. Query source data
   → query_data({ table: "old_users", orderBy: "id" })

2. Analyze data patterns
   → execute_raw_sql({ sql: "SELECT country, COUNT(*) ..." })

3. Inspect target schema
   → get_table_schema({ table: "new_users" })

4. Plan migration based on analysis
```

### Workflow 4: Database Introspection

```plaintext
1. List all records
   → query_data({ table: "users" })

2. Get detailed schema
   → get_table_schema({ table: "users" })

3. Analyze relationships
   → execute_raw_sql({ sql: "SHOW CREATE TABLE users" })

4. Generate documentation
```

---

## 🚨 Error Handling

### Common Errors

#### Invalid Table Name
```json
{
  "success": false,
  "error": "Table name must contain only letters, numbers, and underscores"
}
```

#### Invalid Column Name
```json
{
  "success": false,
  "error": "Invalid column name: id; DROP TABLE users;--"
}
```

#### Missing WHERE Clause
```json
{
  "success": false,
  "error": "WHERE clause is required for safety"
}
```

#### Connection Failed
```json
{
  "success": false,
  "error": "Failed to connect to database: Access denied"
}
```

#### Query Timeout
```json
{
  "success": false,
  "error": "Query timeout after 30000ms"
}
```

### Error Response Format

All errors return:
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

---

## 📚 Advanced Examples

### Example 1: Pagination Helper

```javascript
// Get page 3 with 25 items per page
const page = 3;
const perPage = 25;
const offset = (page - 1) * perPage;

{
  "table": "posts",
  "orderBy": "created_at DESC",
  "limit": 25,
  "offset": 50  // (3-1) * 25
}
```

### Example 2: Search with Filters

```javascript
// Find active users from France or Germany
{
  "table": "users",
  "where": {
    "status": "active",
    "country": "France"  // Note: OR requires raw SQL
  }
}

// For OR conditions, use execute_raw_sql:
{
  "sql": "SELECT * FROM users WHERE status = ? AND (country = ? OR country = ?)",
  "params": ["active", "France", "Germany"]
}
```

### Example 3: Bulk Operations

```javascript
// Insert multiple records (one at a time)
const users = [
  {name: "Alice", email: "alice@example.com"},
  {name: "Bob", email: "bob@example.com"}
];

for (const user of users) {
  await create_record({
    table: "users",
    data: user
  });
}
```

### Example 4: Data Transformation

```javascript
// Query data
const result = await query_data({
  table: "users",
  select: "id, name, email"
});

// Transform and use data
const userMap = result.data.reduce((map, user) => {
  map[user.id] = user;
  return map;
}, {});
```

---

## 🎯 Performance Tips

1. **Use SELECT specific columns** instead of `SELECT *`
   - Reduces data transfer
   - Improves query performance

2. **Add proper indexes** for WHERE and ORDER BY columns
   - Speeds up queries significantly
   - Check with `get_table_schema`

3. **Use LIMIT** for large result sets
   - Prevents memory issues
   - Improves response time

4. **Leverage schema cache**
   - Repeated `get_table_schema` calls are cached
   - 60-second TTL reduces DB load by 90%

5. **Use parameterized queries**
   - Enables query plan caching
   - Better performance than dynamic SQL

---

## 📖 Related Documentation

- [Verification Tools Guide](./VERIFICATION_TOOLS.md) - Model and database verification
- [Security Fixes](./SECURITY_FIXES.md) - Security improvements and best practices
- [README](./README.md) - Complete feature overview
- [Changelog](./CHANGELOG.md) - Version history and updates

---

**Version:** 2.1.0  
**Last Updated:** November 12, 2025  
**Status:** ✅ Production Ready
