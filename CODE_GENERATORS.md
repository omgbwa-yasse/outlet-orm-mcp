# Code Generators Guide - Outlet ORM MCP Server

This guide provides comprehensive documentation for the 3 code generation tools. These tools automatically create Models, Controllers, and Migration files based on database schema or specifications.

---

## 🎯 Overview

The code generator tools enable you to:
- Generate Model files from existing database tables
- Generate Controller files with complete CRUD operations
- Generate Migration files for database schema changes
- Scaffold complete MVC structures automatically
- Follow Outlet ORM best practices

**Benefits:**
- ⚡ Save hours of boilerplate coding
- ✅ Ensure consistency across codebase
- 🔒 Follow security best practices automatically
- 📊 Generate proper relations and foreign keys
- 🧪 Production-ready code from the start

---

## 📚 Tools Reference

### 1. `generate_model_file` - Generate Model from Database

Generate a complete Model file by inspecting an existing database table. Automatically detects columns, types, nullable fields, primary keys, and foreign key relations.

#### Input Schema

```json
{
  "tableName": "string (required)",
  "outputPath": "string (optional)",
  "dbConfig": "object (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `tableName` | string | Yes | Database table name to generate from | - | `"users"` |
| `outputPath` | string | No | Output path for Model file | `"models/{ModelName}.js"` | `"src/models/User.js"` |
| `dbConfig` | object | No | Database configuration override | - | See DB Config |

#### What It Generates

1. **Class Definition** - Properly named Model class
2. **Table Name** - Static table property
3. **Primary Key** - Detected from database
4. **Fillable Array** - All non-PK, non-timestamp columns
5. **Guarded Array** - Typically empty (use fillable)
6. **Casts** - Type casting for special column types
7. **Relations** - Detected from foreign keys
8. **Timestamps** - Auto-detected if created_at/updated_at exist

#### Examples

**Basic Model generation:**

```plaintext
Generate a User model from the users table
```

Translates to:

```json
{
  "tableName": "users"
}
```

Output file: `models/User.js`

**Custom output path:**

```json
{
  "tableName": "posts",
  "outputPath": "src/models/Post.js"
}
```

**With custom DB config:**

```json
{
  "tableName": "products",
  "dbConfig": {
    "driver": "mysql",
    "host": "localhost",
    "database": "shop_db"
  }
}
```

#### Generated Code Example

**Input:** `tableName: "users"`

**Database Schema:**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Generated Model:**

```javascript
// models/User.js
import { Model } from 'outlet-orm';

class User extends Model {
  static table = 'users';
  static primaryKey = 'id';
  static timestamps = true;

  static fillable = [
    'name',
    'email',
    'password',
    'is_active',
    'metadata'
  ];

  static guarded = [];

  static casts = {
    is_active: 'boolean',
    metadata: 'json'
  };
}

export default User;
```

#### Column Type Detection

The generator automatically casts columns based on database types:

| Database Type | Cast Type | Example Column |
|--------------|-----------|----------------|
| `TINYINT(1)`, `BOOLEAN` | `boolean` | `is_active` |
| `JSON`, `JSONB` | `json` | `metadata`, `settings` |
| `DATE` | `date` | `birth_date` |
| `DATETIME`, `TIMESTAMP` | `datetime` | `published_at` |
| `INT`, `BIGINT` | `integer` | `count`, `user_id` |

#### Relation Detection

The generator detects `belongsTo` relations from foreign keys:

**Database Schema:**
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Generated Code:**
```javascript
class Post extends Model {
  // ... other properties

  // Detected relation
  user() {
    return this.belongsTo(User, 'user_id');
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "Model file generated successfully at models/User.js",
  "filePath": "C:\\path\\to\\models\\User.js",
  "modelName": "User",
  "tableName": "users",
  "properties": {
    "primaryKey": "id",
    "timestamps": true,
    "fillableCount": 5,
    "castsCount": 2,
    "relationsCount": 0
  }
}
```

#### Use Cases

- 🆕 **Rapid Development** - Generate Models from existing database
- 🔄 **Database First Approach** - Start with schema, generate code
- ✅ **Consistency** - Ensure all Models follow same structure
- 🔧 **Refactoring** - Regenerate Models after schema changes
- 📚 **Learning** - See proper Outlet ORM Model structure

#### Best Practices

1. **Review Generated Code** - Always review before committing
2. **Add Custom Methods** - Extend generated Models with business logic
3. **Configure Relations** - Add `hasMany`, `belongsToMany` manually
4. **Update Fillable** - Restrict mass assignment as needed
5. **Add Validation** - Implement validation rules

---

### 2. `generate_controller_file` - Generate Controller with CRUD

Generate a complete Controller file with all standard CRUD operations (index, show, store, update, destroy). Includes error handling, pagination, and proper HTTP responses.

#### Input Schema

```json
{
  "modelName": "string (required)",
  "outputPath": "string (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `modelName` | string | Yes | Name of Model class (PascalCase) | - | `"User"` |
| `outputPath` | string | No | Output path for Controller file | `"controllers/{ModelName}Controller.js"` | `"src/controllers/UserController.js"` |

#### What It Generates

1. **CRUD Methods** - Complete implementations
   - `index()` - List all records with pagination
   - `show()` - Get single record by ID
   - `store()` - Create new record
   - `update()` - Update existing record
   - `destroy()` - Delete record

2. **Features**
   - Error handling with try/catch
   - Input validation
   - HTTP status codes (200, 201, 404, 500)
   - Pagination support in index
   - Proper JSON responses

3. **Best Practices**
   - Model import
   - Async/await pattern
   - RESTful naming conventions
   - Error messages

#### Examples

**Basic Controller generation:**

```plaintext
Generate a UserController for the User model
```

Translates to:

```json
{
  "modelName": "User"
}
```

Output file: `controllers/UserController.js`

**Custom output path:**

```json
{
  "modelName": "Post",
  "outputPath": "src/api/controllers/PostController.js"
}
```

#### Generated Code Example

**Input:** `modelName: "User"`

**Generated Controller:**

```javascript
// controllers/UserController.js
import User from '../models/User.js';

class UserController {
  /**
   * List all users with pagination
   * GET /users
   */
  async index(req) {
    try {
      const page = parseInt(req.query?.page || 1);
      const perPage = parseInt(req.query?.perPage || 15);

      const users = await User.paginate(page, perPage);

      return {
        status: 200,
        data: users
      };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to fetch users',
        message: error.message
      };
    }
  }

  /**
   * Get a single user by ID
   * GET /users/:id
   */
  async show(req) {
    try {
      const { id } = req.params;

      const user = await User.find(id);

      if (!user) {
        return {
          status: 404,
          error: 'User not found'
        };
      }

      return {
        status: 200,
        data: user
      };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to fetch user',
        message: error.message
      };
    }
  }

  /**
   * Create a new user
   * POST /users
   */
  async store(req) {
    try {
      const data = req.body;

      const user = await User.create(data);

      return {
        status: 201,
        data: user,
        message: 'User created successfully'
      };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to create user',
        message: error.message
      };
    }
  }

  /**
   * Update an existing user
   * PUT /users/:id
   */
  async update(req) {
    try {
      const { id } = req.params;
      const data = req.body;

      const user = await User.find(id);

      if (!user) {
        return {
          status: 404,
          error: 'User not found'
        };
      }

      await user.update(data);

      return {
        status: 200,
        data: user,
        message: 'User updated successfully'
      };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to update user',
        message: error.message
      };
    }
  }

  /**
   * Delete a user
   * DELETE /users/:id
   */
  async destroy(req) {
    try {
      const { id } = req.params;

      const user = await User.find(id);

      if (!user) {
        return {
          status: 404,
          error: 'User not found'
        };
      }

      await user.delete();

      return {
        status: 200,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to delete user',
        message: error.message
      };
    }
  }
}

export default UserController;
```

#### HTTP Status Codes

| Status | Method | Meaning |
|--------|--------|---------|
| 200 | index, show, update, destroy | Success |
| 201 | store | Created successfully |
| 404 | show, update, destroy | Record not found |
| 500 | all | Server error |

#### Response Structure

**Success Response:**
```json
{
  "status": 200,
  "data": { /* record or array */ },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "status": 500,
  "error": "Brief error description",
  "message": "Detailed error message"
}
```

#### Response

```json
{
  "success": true,
  "message": "Controller file generated successfully at controllers/UserController.js",
  "filePath": "C:\\path\\to\\controllers\\UserController.js",
  "controllerName": "UserController",
  "modelName": "User",
  "methods": [
    "index",
    "show",
    "store",
    "update",
    "destroy"
  ]
}
```

#### Use Cases

- 🚀 **Quick Scaffolding** - Generate complete CRUD in seconds
- ✅ **Standardization** - Consistent Controller structure
- 📚 **Learning** - See proper Controller patterns
- 🔧 **Prototyping** - Fast API development
- 🔄 **Refactoring** - Baseline for improvements

#### Customization Tips

1. **Add Validation**
```javascript
async store(req) {
  const data = req.body;
  
  // Add validation
  if (!data.email || !data.name) {
    return {
      status: 400,
      error: 'Missing required fields'
    };
  }
  
  // ... rest of method
}
```

2. **Add Relations**
```javascript
async show(req) {
  const user = await User.with('posts').find(id);
  // ...
}
```

3. **Add Filtering**
```javascript
async index(req) {
  const { status } = req.query;
  
  let query = User.query();
  
  if (status) {
    query = query.where('status', status);
  }
  
  const users = await query.paginate(page, perPage);
  // ...
}
```

---

### 3. `generate_migration_file` - Generate Migration File

Generate a Migration file for creating or modifying database tables. Supports table creation, column additions, and modifications with proper up/down methods.

#### Input Schema

```json
{
  "migrationName": "string (required)",
  "tableName": "string (required)",
  "columns": "array (optional)",
  "action": "string (optional)",
  "outputPath": "string (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `migrationName` | string | Yes | Descriptive migration name | - | `"create_users_table"` |
| `tableName` | string | Yes | Target table name | - | `"users"` |
| `columns` | array | No | Column definitions (see below) | `[]` | See examples |
| `action` | string | No | Migration action type | `"create"` | `"create"` or `"modify"` |
| `outputPath` | string | No | Output directory for migration | `"database/migrations"` | `"db/migrations"` |

#### Column Definition Object

```json
{
  "name": "string (required)",
  "type": "string (required)",
  "nullable": "boolean (optional)",
  "default": "any (optional)",
  "unique": "boolean (optional)",
  "primaryKey": "boolean (optional)",
  "autoIncrement": "boolean (optional)",
  "references": "object (optional)"
}
```

#### Column Types Supported

| Type | Description | Example |
|------|-------------|---------|
| `string` | VARCHAR(255) | `name`, `email` |
| `text` | TEXT | `description` |
| `integer` | INT | `count`, `user_id` |
| `bigInteger` | BIGINT | `id` (large tables) |
| `boolean` | TINYINT(1) | `is_active` |
| `date` | DATE | `birth_date` |
| `datetime` | DATETIME | `published_at` |
| `timestamp` | TIMESTAMP | `created_at` |
| `json` | JSON | `metadata` |
| `decimal` | DECIMAL | `price`, `amount` |

#### Foreign Key Reference

```json
{
  "references": {
    "table": "users",
    "column": "id",
    "onDelete": "CASCADE",
    "onUpdate": "CASCADE"
  }
}
```

#### Examples

**Create table migration:**

```plaintext
Create a migration for a users table with id, name, email, and timestamps
```

Translates to:

```json
{
  "migrationName": "create_users_table",
  "tableName": "users",
  "action": "create",
  "columns": [
    {
      "name": "id",
      "type": "bigInteger",
      "primaryKey": true,
      "autoIncrement": true
    },
    {
      "name": "name",
      "type": "string",
      "nullable": false
    },
    {
      "name": "email",
      "type": "string",
      "nullable": false,
      "unique": true
    },
    {
      "name": "password",
      "type": "string",
      "nullable": false
    },
    {
      "name": "created_at",
      "type": "timestamp",
      "default": "CURRENT_TIMESTAMP"
    },
    {
      "name": "updated_at",
      "type": "timestamp",
      "default": "CURRENT_TIMESTAMP"
    }
  ]
}
```

**With foreign key:**

```json
{
  "migrationName": "create_posts_table",
  "tableName": "posts",
  "columns": [
    {
      "name": "id",
      "type": "bigInteger",
      "primaryKey": true,
      "autoIncrement": true
    },
    {
      "name": "user_id",
      "type": "bigInteger",
      "nullable": false,
      "references": {
        "table": "users",
        "column": "id",
        "onDelete": "CASCADE"
      }
    },
    {
      "name": "title",
      "type": "string"
    },
    {
      "name": "content",
      "type": "text"
    }
  ]
}
```

**Modify table migration:**

```json
{
  "migrationName": "add_phone_to_users",
  "tableName": "users",
  "action": "modify",
  "columns": [
    {
      "name": "phone",
      "type": "string",
      "nullable": true
    }
  ]
}
```

#### Generated Code Example

**Input:**
```json
{
  "migrationName": "create_users_table",
  "tableName": "users",
  "columns": [
    {
      "name": "id",
      "type": "bigInteger",
      "primaryKey": true,
      "autoIncrement": true
    },
    {
      "name": "name",
      "type": "string"
    },
    {
      "name": "email",
      "type": "string",
      "unique": true
    }
  ]
}
```

**Generated Migration:**

```javascript
// database/migrations/20250112_153045_create_users_table.js
export async function up(queryInterface, DataTypes) {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('users');
}
```

#### Migration Naming Convention

Generated migrations use timestamp-based naming:

```
YYYYMMDD_HHMMSS_migration_name.js
```

Example: `20250112_153045_create_users_table.js`

This ensures:
- ✅ Chronological ordering
- ✅ Unique filenames
- ✅ Clear migration history

#### Response

```json
{
  "success": true,
  "message": "Migration file generated successfully",
  "filePath": "C:\\path\\to\\database\\migrations\\20250112_153045_create_users_table.js",
  "migrationName": "create_users_table",
  "tableName": "users",
  "action": "create",
  "timestamp": "20250112_153045"
}
```

#### Use Cases

- 🆕 **New Tables** - Create table migrations
- 🔧 **Schema Changes** - Add/modify columns
- 🔄 **Database Versioning** - Track schema evolution
- 🚀 **Deployment** - Automated schema updates
- 📚 **Collaboration** - Share schema changes with team

#### Best Practices

1. **Descriptive Names**
```
✅ create_users_table
✅ add_phone_to_users
✅ create_posts_users_pivot_table
❌ migration1
❌ update_table
```

2. **Always Include Down Method**
```javascript
export async function down(queryInterface) {
  // Always implement rollback
  await queryInterface.dropTable('users');
}
```

3. **Foreign Keys**
```javascript
// Include onDelete and onUpdate
user_id: {
  type: DataTypes.BIGINT,
  references: {
    model: 'users',
    key: 'id'
  },
  onDelete: 'CASCADE',  // Important!
  onUpdate: 'CASCADE'
}
```

4. **Nullable Defaults**
```javascript
// Be explicit about nullable
name: {
  type: DataTypes.STRING,
  allowNull: false  // Explicit is better
}
```

5. **Test Migrations**
```bash
# Run migration
npm run migrate

# Test rollback
npm run migrate:rollback

# Re-run migration
npm run migrate
```

---

## 🔧 Database Configuration

All generator tools (except `generate_controller_file`) accept an optional `dbConfig` parameter.

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

If `dbConfig` is not provided:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_DRIVER` | Database driver | `mysql` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_DATABASE` | Database name | `myapp` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `secret` |

---

## 🎯 Complete Scaffolding Workflows

### Workflow 1: Database-First Development

Start with existing database, generate everything:

```plaintext
1. Generate Model from table
   → generate_model_file
   Input: { tableName: "users" }
   Output: models/User.js

2. Generate Controller for Model
   → generate_controller_file
   Input: { modelName: "User" }
   Output: controllers/UserController.js

3. Verify consistency
   → check_consistency
   Input: { 
     modelPath: "models/User.js",
     controllerPath: "controllers/UserController.js"
   }
```

### Workflow 2: Code-First Development

Start with requirements, generate everything:

```plaintext
1. Generate Migration
   → generate_migration_file
   Input: {
     migrationName: "create_products_table",
     tableName: "products",
     columns: [
       { name: "id", type: "bigInteger", primaryKey: true },
       { name: "name", type: "string" },
       { name: "price", type: "decimal" }
     ]
   }
   Output: database/migrations/20250112_153045_create_products_table.js

2. Run migration
   → (external migration tool)

3. Generate Model from new table
   → generate_model_file
   Input: { tableName: "products" }
   Output: models/Product.js

4. Generate Controller
   → generate_controller_file
   Input: { modelName: "Product" }
   Output: controllers/ProductController.js
```

### Workflow 3: Complete CRUD Module

Generate full MVC for new feature:

```plaintext
1. Create migration for table
   → generate_migration_file

2. Run migration
   → npm run migrate

3. Generate Model
   → generate_model_file

4. Generate Controller
   → generate_controller_file

5. Add routes (manual)
   → router.resource('/products', ProductController)

6. Test endpoints
   → GET /products, POST /products, etc.
```

### Workflow 4: Add Relations

Generate related models with foreign keys:

```plaintext
1. Generate User migration + model + controller
   → (users table with id, name, email)

2. Generate Post migration with FK
   → generate_migration_file
   Input: {
     tableName: "posts",
     columns: [
       { name: "user_id", type: "bigInteger",
         references: { table: "users", column: "id" } }
     ]
   }

3. Run migration
   → npm run migrate

4. Generate Post model
   → generate_model_file
   Input: { tableName: "posts" }
   Output includes: user() { return this.belongsTo(User); }

5. Add inverse relation to User (manual)
   → posts() { return this.hasMany(Post); }
```

---

## 📊 Code Quality Features

### Security Best Practices

All generated code follows security standards:

1. **Mass Assignment Protection**
```javascript
// Controllers validate input
const data = req.body;
// Model restricts with fillable
static fillable = ['name', 'email'];
```

2. **SQL Injection Prevention**
```javascript
// Generated code uses ORM methods
await User.find(id);  // Safe
// Not: await db.query(`SELECT * FROM users WHERE id = ${id}`)  // Unsafe
```

3. **Error Handling**
```javascript
try {
  // Operation
} catch (error) {
  return {
    status: 500,
    error: 'Safe error message',
    message: error.message  // Detailed for debugging
  };
}
```

### Code Standards

Generated code follows modern JavaScript standards:

- ✅ ESM modules (`import`/`export`)
- ✅ Async/await (no callbacks)
- ✅ PascalCase for classes
- ✅ camelCase for methods
- ✅ Descriptive variable names
- ✅ JSDoc comments in Controllers

### Consistency

All generated files follow same patterns:

- Model structure matches across all models
- Controller methods identical structure
- Migration format standardized
- Naming conventions enforced

---

## 🚨 Common Issues and Solutions

### Issue: Model Not Found After Generation

**Problem:**
```javascript
Error: Cannot find module '../models/User.js'
```

**Solution:**

Check the import path in Controller:

```javascript
// If Model is in different location
import User from '../src/models/User.js';
```

Or specify correct `outputPath` when generating:

```json
{
  "tableName": "users",
  "outputPath": "src/models/User.js"
}
```

### Issue: Migration Syntax Error

**Problem:**
```
SyntaxError: Unexpected token 'export'
```

**Solution:**

Ensure package.json has:

```json
{
  "type": "module"
}
```

Or use `.mjs` extension for migrations.

### Issue: Table Already Exists

**Problem:**
```
Error: Table 'users' already exists
```

**Solution:**

1. Use `action: "modify"` instead of `"create"`
2. Or drop table first (in development only!)
3. Or create new migration for alterations

```json
{
  "migrationName": "add_columns_to_users",
  "tableName": "users",
  "action": "modify",
  "columns": [...]
}
```

### Issue: Foreign Key Constraint Fails

**Problem:**
```
Error: Cannot add foreign key constraint
```

**Solution:**

Ensure referenced table exists first:

```plaintext
1. Create users table migration
2. Run migration
3. Then create posts table with user_id FK
```

Migration order matters!

### Issue: Column Type Mismatch

**Problem:**

Generated Model has wrong cast type.

**Solution:**

Manually edit Model:

```javascript
static casts = {
  is_active: 'boolean',  // Manually fix if wrong
  price: 'float'         // Add if missing
};
```

---

## 📈 Best Practices

### 1. Review Generated Code

Always review before committing:

- ✅ Check column types and casts
- ✅ Verify relations are correct
- ✅ Add custom validation
- ✅ Add business logic methods

### 2. Customize Generated Files

Generated code is a starting point:

```javascript
// Add custom methods to generated Model
class User extends Model {
  // ... generated code

  // Add custom methods
  async posts() {
    return this.hasMany(Post);
  }

  async isAdmin() {
    return this.role === 'admin';
  }

  static async findByEmail(email) {
    return this.where('email', email).first();
  }
}
```

### 3. Version Control Migrations

- ✅ Commit migrations with code
- ✅ Never edit applied migrations
- ✅ Create new migration for changes
- ✅ Test rollback before deploying

### 4. Naming Conventions

Follow conventions for consistency:

| Item | Convention | Example |
|------|-----------|---------|
| Model | PascalCase singular | `User`, `Post`, `OrderItem` |
| Controller | PascalCase + Controller | `UserController`, `PostController` |
| Table | snake_case plural | `users`, `posts`, `order_items` |
| Migration | snake_case descriptive | `create_users_table`, `add_phone_to_users` |
| Column | snake_case | `user_id`, `created_at`, `is_active` |

### 5. Testing Generated Code

Test generated Controllers:

```javascript
// tests/UserController.test.js
import UserController from './controllers/UserController.js';

describe('UserController', () => {
  it('should list users', async () => {
    const controller = new UserController();
    const result = await controller.index({ query: {} });
    
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
  });
});
```

---

## 🔍 Advanced Usage

### Batch Generation

Generate multiple Models at once:

```javascript
const tables = ['users', 'posts', 'comments', 'tags'];

for (const table of tables) {
  await generate_model_file({ tableName: table });
  
  // Capitalize first letter for model name
  const modelName = table.charAt(0).toUpperCase() + table.slice(0, -1);
  await generate_controller_file({ modelName });
}
```

### Custom Templates

Extend generated code with templates:

```javascript
// After generation, add to Model:
const modelContent = fs.readFileSync('models/User.js', 'utf8');

const customMethods = `
  // Custom methods
  async sendEmail(subject, body) {
    // Implementation
  }
`;

const updatedContent = modelContent.replace(
  /^}$/m,
  `${customMethods}\n}`
);

fs.writeFileSync('models/User.js', updatedContent);
```

### Migration Scripts

Automate migration workflow:

```javascript
// scripts/generate-and-migrate.js
async function scaffoldTable(tableName, columns) {
  // Generate migration
  await generate_migration_file({
    migrationName: `create_${tableName}_table`,
    tableName,
    columns
  });

  // Run migration
  await runMigrations();

  // Generate model
  await generate_model_file({ tableName });

  // Generate controller
  const modelName = capitalize(singular(tableName));
  await generate_controller_file({ modelName });
}
```

---

## 📖 Related Documentation

- [CRUD Operations Guide](./CRUD_OPERATIONS.md) - Using generated Models
- [Verification Tools Guide](./VERIFICATION_TOOLS.md) - Verify generated code
- [README](./README.md) - Complete feature overview
- [Outlet ORM Docs](https://outlet-orm.com) - ORM documentation

---

**Version:** 2.1.0  
**Last Updated:** January 12, 2025  
**Status:** ✅ Production Ready
