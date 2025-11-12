# Verification Tools Guide - Outlet ORM MCP Server

This guide provides comprehensive documentation for the 5 verification and analysis tools. These tools help ensure consistency between your Models, Controllers, Migrations, and the actual database schema.

---

## 🎯 Overview

The verification tools enable you to:
- Verify Model configuration matches database schema
- Validate model relations and foreign keys
- Check migration status and detect issues
- Analyze Controller code quality
- Perform comprehensive consistency checks

**Benefits:**
- ✅ Catch schema drift early
- ✅ Ensure database consistency
- ✅ Validate relations and foreign keys
- ✅ Detect missing or orphaned migrations
- ✅ Improve code quality

---

## 📚 Tools Reference

### 1. `verify_model_schema` - Verify Model Against Database

Verify if a Model file configuration matches the actual database table schema. Checks fillable attributes, casts, and database columns.

#### Input Schema

```json
{
  "modelPath": "string (required)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `modelPath` | string | Yes | Absolute or relative path to Model file | `"models/User.js"` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### What It Checks

1. **Fillable Attributes** - Ensures all fillable fields exist in database
2. **Cast Fields** - Validates cast columns exist in database
3. **Unguarded Columns** - Identifies columns not in fillable (security)
4. **Table Existence** - Confirms table exists
5. **Schema Alignment** - Compares Model with actual schema

#### Examples

**Basic verification:**

```plaintext
Verify the User model matches the database
```

Translates to:

```json
{
  "modelPath": "models/User.js"
}
```

**With custom DB config:**

```json
{
  "modelPath": "models/Post.js",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "database": "test_db"
  }
}
```

#### Response

```json
{
  "tableName": "users",
  "modelPath": "models/User.js",
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
    }
  ],
  "fillable": ["name", "email", "password"],
  "casts": {
    "is_active": "boolean",
    "metadata": "json"
  },
  "issues": [
    {
      "type": "unguarded_columns",
      "severity": "warning",
      "fields": ["phone", "address"],
      "message": "Columns exist in database but not in fillable: phone, address"
    }
  ],
  "isValid": true
}
```

#### Issue Types

| Type | Severity | Description |
|------|----------|-------------|
| `missing_column` | error | Fillable/cast field doesn't exist in DB |
| `unguarded_columns` | warning | DB columns not in fillable array |

#### Use Cases

- 🔍 Verify Model after database changes
- ✅ Ensure fillable array is up-to-date
- 🔒 Identify unprotected columns (security)
- 📊 Check schema consistency
- 🧪 Validate before deployment

#### Security Notes

Unguarded columns can lead to **mass assignment vulnerabilities**. Always review warnings and add columns to fillable or guarded arrays.

---

### 2. `verify_relations` - Validate Model Relations

Verify if model relations are correctly defined and match foreign keys in the database. Detects missing foreign keys and orphaned relations.

#### Input Schema

```json
{
  "modelPath": "string (required)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `modelPath` | string | Yes | Absolute or relative path to Model file | `"models/Post.js"` |
| `dbConfig` | object | No | Database configuration override | See DB Config |

#### What It Checks

1. **Relation Definitions** - Extracts all defined relations
2. **Foreign Keys** - Validates FK existence in database
3. **belongsTo Relations** - Ensures FK exists for each belongsTo
4. **Orphaned FKs** - Detects FKs without corresponding relations
5. **Naming Conventions** - Checks FK naming follows standards

#### Examples

**Verify Post relations:**

```plaintext
Verify the Post model relations are correct
```

Translates to:

```json
{
  "modelPath": "models/Post.js"
}
```

#### Response

```json
{
  "tableName": "posts",
  "modelPath": "models/Post.js",
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
  "issues": [
    {
      "type": "missing_foreign_key",
      "severity": "warning",
      "relation": "belongsTo",
      "relatedModel": "User",
      "expectedColumn": "user_id",
      "message": "belongsTo relation to User expects foreign key 'user_id' but it was not found"
    }
  ],
  "isValid": true
}
```

#### Issue Types

| Type | Severity | Description |
|------|----------|-------------|
| `missing_foreign_key` | warning | belongsTo relation missing FK in DB |
| `orphaned_foreign_key` | info | FK exists but no relation defined |

#### Relation Types Detected

- `hasOne` - One-to-one relationship
- `hasMany` - One-to-many relationship
- `belongsTo` - Inverse relationship (requires FK)
- `belongsToMany` - Many-to-many (pivot table)
- `hasManyThrough` - Through intermediate table
- `morphOne` / `morphMany` - Polymorphic relations

#### Use Cases

- ✅ Verify foreign keys are properly defined
- 🔍 Detect orphaned foreign keys
- 📊 Validate relation integrity
- 🔧 Fix relation configuration issues
- 🧪 Ensure referential integrity

---

### 3. `verify_migration_status` - Check Migration Status

Check which migrations have been applied to the database and detect pending or deleted migrations.

#### Input Schema

```json
{
  "migrationsPath": "string (optional)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `migrationsPath` | string | No | Path to migrations directory | `"database/migrations"` | `"db/migrations"` |
| `dbConfig` | object | No | Database configuration override | - | See DB Config |

#### What It Checks

1. **Applied Migrations** - List of migrations run on database
2. **Pending Migrations** - Migration files not yet applied
3. **Deleted Migrations** - Migrations in DB but files deleted
4. **Migration Count** - Total, applied, pending counts
5. **Migration Table** - Checks if migrations table exists

#### Examples

**Check default migrations:**

```plaintext
Check the migration status
```

Translates to:

```json
{
  "migrationsPath": "database/migrations"
}
```

**Custom migrations path:**

```json
{
  "migrationsPath": "db/custom/migrations"
}
```

#### Response

```json
{
  "migrationsPath": "C:\\path\\to\\database\\migrations",
  "total": 5,
  "applied": 3,
  "pending": 2,
  "deleted": 0,
  "appliedMigrations": [
    "20240315_120000_create_users_table.js",
    "20240315_120500_create_posts_table.js",
    "20240316_100000_add_email_to_users.js"
  ],
  "pendingMigrations": [
    "20240317_140000_create_comments_table.js",
    "20240318_090000_add_indexes.js"
  ],
  "deletedMigrations": [],
  "issues": [],
  "isValid": true
}
```

#### Issue Types

| Type | Severity | Description |
|------|----------|-------------|
| `deleted_migrations` | error | Migration was applied but file is missing |

#### Migration States

- **Applied** - Migration has been run on database
- **Pending** - Migration file exists but not run
- **Deleted** - Migration record exists but file deleted

#### Use Cases

- 📊 Check which migrations are pending
- ✅ Verify all migrations are applied
- 🔍 Detect deleted migration files
- 🚨 Identify migration issues before deployment
- 📝 Track migration history

#### Warning

⚠️ **Deleted migrations** indicate a serious issue:
- Migration was applied to database
- Migration file no longer exists
- May cause problems when resetting database
- Restore file or investigate why it was deleted

---

### 4. `analyze_controller` - Analyze Controller Quality

Analyze a Controller file to verify proper Model usage, CRUD methods implementation, error handling, and best practices.

#### Input Schema

```json
{
  "controllerPath": "string (required)",
  "modelName": "string (required)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `controllerPath` | string | Yes | Absolute or relative path to Controller | `"controllers/UserController.js"` |
| `modelName` | string | Yes | Name of associated Model class | `"User"` |

#### What It Checks

1. **Model Import** - Verifies Model is imported
2. **CRUD Methods** - Checks for index, show, store, update, destroy
3. **Model Usage** - Counts Model method calls
4. **Error Handling** - Detects try/catch or throw statements
5. **Pagination** - Checks for paginate() usage
6. **Eager Loading** - Detects with() for relation loading

#### Examples

**Analyze UserController:**

```plaintext
Analyze the UserController for the User model
```

Translates to:

```json
{
  "controllerPath": "controllers/UserController.js",
  "modelName": "User"
}
```

#### Response

```json
{
  "controllerPath": "controllers/UserController.js",
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

#### Issue Types

| Type | Severity | Description |
|------|----------|-------------|
| `missing_import` | error | Model not imported in controller |
| `missing_methods` | warning | Standard CRUD methods missing |
| `unused_model` | warning | Model imported but never used |
| `no_error_handling` | warning | No try/catch or throw detected |

#### CRUD Methods

Standard REST controller should have:
- `index()` - List all records (with pagination)
- `show()` - Show single record by ID
- `store()` - Create new record
- `update()` - Update existing record
- `destroy()` - Delete record

#### Best Practices Checked

- ✅ Model import exists
- ✅ All CRUD methods implemented
- ✅ Model is actually used (not just imported)
- ✅ Error handling present (try/catch or throw)
- ✅ Pagination support (optional but recommended)
- ✅ Eager loading support (optional but recommended)

#### Use Cases

- 🔍 Verify controller completeness
- ✅ Ensure proper Model usage
- 📊 Check code quality
- 🔧 Identify missing methods
- 🧪 Validate before deployment

---

### 5. `check_consistency` - Comprehensive Consistency Check

Comprehensive consistency check between Model, Controller, Migrations, and Database. Verifies schema alignment, relation integrity, and migration status.

#### Input Schema

```json
{
  "modelPath": "string (optional)",
  "controllerPath": "string (optional)",
  "migrationsPath": "string (optional)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `modelPath` | string | No | Path to Model file | - | `"models/User.js"` |
| `controllerPath` | string | No | Path to Controller file | - | `"controllers/UserController.js"` |
| `migrationsPath` | string | No | Path to migrations directory | `"database/migrations"` | `"db/migrations"` |
| `dbConfig` | object | No | Database configuration override | - | See DB Config |

#### What It Checks

1. **Model Schema** - If modelPath provided
2. **Model Relations** - If modelPath provided
3. **Controller Quality** - If controllerPath provided
4. **Migration Status** - Always checked
5. **Cross-checks** - Consistency between components

#### Examples

**Full consistency check:**

```plaintext
Check consistency for User model, controller, and migrations
```

Translates to:

```json
{
  "modelPath": "models/User.js",
  "controllerPath": "controllers/UserController.js",
  "migrationsPath": "database/migrations"
}
```

**Model and migrations only:**

```json
{
  "modelPath": "models/Post.js"
}
```

#### Response

```json
{
  "model": {
    "tableName": "users",
    "isValid": true,
    "issues": []
  },
  "relations": {
    "tableName": "users",
    "isValid": true,
    "issues": []
  },
  "controller": {
    "controllerPath": "controllers/UserController.js",
    "hasImport": true,
    "isValid": true,
    "issues": []
  },
  "migrations": {
    "total": 5,
    "applied": 5,
    "pending": 0,
    "isValid": true,
    "issues": []
  },
  "overallIssues": [],
  "isValid": true
}
```

#### Cross-Check Rules

1. **Model ↔ Migration**
   - If Model exists, there should be a create migration
   - Pending create migrations generate warnings

2. **Model ↔ Controller**
   - Controller should import the Model
   - Model should be actually used in Controller

3. **Schema ↔ Migrations**
   - Applied migrations should match schema
   - Pending migrations indicate incomplete state

#### Issue Types

| Type | Severity | Description |
|------|----------|-------------|
| `pending_table_migration` | warning | Table migration exists but not applied |
| (other types from individual tools) | varies | See individual tool docs |

#### Use Cases

- 🎯 **Pre-deployment Validation** - Ensure everything is consistent
- 🔍 **Debugging** - Find discrepancies between components
- ✅ **Quality Assurance** - Comprehensive health check
- 📊 **Documentation** - Generate consistency report
- 🚀 **CI/CD Integration** - Automated consistency checks

#### Workflow Example

```plaintext
1. Run check_consistency for User
   → Returns report with all issues

2. Fix identified issues:
   - Add missing foreign keys
   - Run pending migrations
   - Update fillable array

3. Re-run check_consistency
   → Verify isValid: true

4. Deploy with confidence ✅
```

---

## 🔧 Database Configuration

All verification tools accept an optional `dbConfig` parameter to override environment variables.

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

---

## 🎯 Common Verification Workflows

### Workflow 1: New Model Verification

```plaintext
1. Generate Model from schema
   → generate_model

2. Verify Model matches database
   → verify_model_schema

3. Check relations and foreign keys
   → verify_relations

4. Full consistency check
   → check_consistency
```

### Workflow 2: After Database Changes

```plaintext
1. Run migrations
   → (external migration tool)

2. Check migration status
   → verify_migration_status

3. Verify all Models still match
   → verify_model_schema for each model

4. Comprehensive check
   → check_consistency
```

### Workflow 3: Pre-Deployment Checklist

```plaintext
1. Verify migration status
   → verify_migration_status (should have 0 pending)

2. Check all Models
   → check_consistency for each feature

3. Analyze Controllers
   → analyze_controller for each controller

4. Review all issues
   → Fix any errors or warnings
```

### Workflow 4: Debugging Schema Issues

```plaintext
1. Check Model schema
   → verify_model_schema

2. Identify unguarded columns
   → Review warnings, update fillable

3. Verify relations
   → verify_relations

4. Check for missing FKs
   → Add migrations for missing constraints
```

---

## 📊 Issue Severity Levels

### Error (🔴)

**Must be fixed** - Indicates a real problem

- Missing columns referenced in Model
- Model import missing in Controller
- Deleted migrations

**Action:** Fix immediately before deployment

### Warning (⚠️)

**Should be reviewed** - May indicate issues

- Unguarded columns (potential security risk)
- Missing foreign keys for relations
- Missing CRUD methods
- Unused Model imports

**Action:** Review and fix if necessary

### Info (ℹ️)

**For awareness** - Not necessarily problems

- Orphaned foreign keys
- Optional features missing

**Action:** Review and decide if action needed

---

## 🚨 Common Issues and Solutions

### Issue: Unguarded Columns

**Problem:**
```json
{
  "type": "unguarded_columns",
  "fields": ["phone", "address"],
  "message": "Columns exist in database but not in fillable"
}
```

**Solution:**

```javascript
// In Model file
static fillable = [
  'name',
  'email',
  'phone',    // Add missing column
  'address'   // Add missing column
];
```

### Issue: Missing Foreign Key

**Problem:**
```json
{
  "type": "missing_foreign_key",
  "expectedColumn": "user_id",
  "message": "belongsTo relation expects FK 'user_id'"
}
```

**Solution:**

```javascript
// Create migration to add FK
table.foreignId('user_id')
  .references('id')
  .on('users')
  .onDelete('CASCADE');
```

### Issue: Pending Migrations

**Problem:**
```json
{
  "pending": 3,
  "pendingMigrations": ["20240317_create_tags.js"]
}
```

**Solution:**

```bash
# Run migrations
npm run migrate
# or use your migration tool
```

### Issue: Missing CRUD Methods

**Problem:**
```json
{
  "type": "missing_methods",
  "methods": ["update", "destroy"]
}
```

**Solution:**

```javascript
// Add missing methods to Controller
async update(req) {
  const { id } = req.params;
  const data = req.body;
  // ... implementation
}

async destroy(req) {
  const { id } = req.params;
  // ... implementation
}
```

---

## 📈 Best Practices

### 1. Regular Verification

Run verification tools regularly:

- ✅ After database schema changes
- ✅ After modifying Models
- ✅ Before deploying to production
- ✅ In CI/CD pipelines

### 2. Fix Issues Promptly

Address issues by severity:

1. **Errors first** - Block deployment
2. **Warnings next** - Security and quality
3. **Info last** - Improvements

### 3. Automate Checks

Integrate into workflow:

```json
{
  "scripts": {
    "verify": "node verify-all-models.js",
    "precommit": "npm run verify"
  }
}
```

### 4. Document Decisions

If you intentionally don't fix a warning:

```javascript
// Note: phone not in fillable - only admin can set
static fillable = ['name', 'email'];
```

### 5. Version Control

Track verification in CI:

```yaml
# .github/workflows/verify.yml
- name: Verify Models
  run: |
    # Run verifications
    # Fail if errors found
```

---

## 🔍 Advanced Usage

### Batch Verification

Verify all Models at once:

```javascript
const models = ['User', 'Post', 'Comment'];

for (const model of models) {
  const result = await verify_model_schema({
    modelPath: `models/${model}.js`
  });
  
  if (!result.isValid) {
    console.error(`${model} has issues:`, result.issues);
  }
}
```

### Custom Validation Rules

Extend checks with custom logic:

```javascript
const result = await verify_model_schema({
  modelPath: 'models/User.js'
});

// Custom check: email must be fillable
if (!result.fillable.includes('email')) {
  result.issues.push({
    type: 'custom_validation',
    severity: 'error',
    message: 'email must be in fillable array'
  });
  result.isValid = false;
}
```

### Integration Testing

Use in tests:

```javascript
describe('Model Verification', () => {
  it('User model should match database', async () => {
    const result = await verify_model_schema({
      modelPath: 'models/User.js'
    });
    
    expect(result.isValid).toBe(true);
    expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });
});
```

---

## 📖 Related Documentation

- [CRUD Operations Guide](./CRUD_OPERATIONS.md) - Database operations
- [Security Fixes](./SECURITY_FIXES.md) - Security improvements
- [README](./README.md) - Complete feature overview
- [Changelog](./CHANGELOG.md) - Version history

---

**Version:** 2.1.0  
**Last Updated:** November 12, 2025  
**Status:** ✅ Production Ready
