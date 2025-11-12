# Outlet ORM MCP Server

A Model Context Protocol (MCP) server for **generating**, **verifying**, and **managing data** for Models, Controllers, and Migrations in Outlet ORM.

🔒 **Version 2.1.0** - Enhanced security and performance optimizations

## 🚀 Features

### 🎨 Code Generation

- **Models**: Automatic generation with relation support (hasOne, hasMany, belongsTo, belongsToMany, etc.)
- **Controllers**: REST controller creation with all CRUD methods
- **Migrations**: Migration generation with complete column and relation management

### 🔍 Verification and Analysis

- **Schema Verification**: Compares Models with actual database
- **Relations Validation**: Verifies consistency with foreign keys
- **Migration Status**: Tracks applied and pending migrations
- **Controller Analysis**: Checks code quality and best practices
- **Global Consistency Check**: Complete project consistency analysis

[📖 **Complete Verification Tools Documentation**](./VERIFICATION_TOOLS.md)

### 💾 CRUD Data Operations

- **Data Query**: Query with filters, sorting, and pagination
- **Record Creation**: Insert with generated ID return
- **Update**: Secure update with mandatory WHERE clause
- **Deletion**: Secure delete with mandatory WHERE clause
- **Raw SQL Queries**: Execute complex queries (JOINs, aggregations)
- **Schema Inspection**: Analyze table structure (columns, indexes)

[📖 **Complete CRUD Operations Documentation**](./CRUD_OPERATIONS.md)

### 🔒 Security and Performance (v2.1.0)

- **SQL Injection Protection**: Parameterized queries + strict identifier validation
- **Complete Validation**: All table and column names validated
- **Schema Caching**: 60s TTL for up to 90% performance improvement
- **Query Timeout**: Protection against blocking (30s default)
- **Connection Management**: Clean closure and leak prevention

[📖 **Complete Security Report**](./SECURITY_FIXES.md)

## 📦 Installation

```bash
cd outlet-orm-mcp
npm install
```

## ⚙️ Configuration

### Claude Desktop Configuration

You can now use the MCP server with multiple databases! Two configuration approaches:

#### Option 1: Dynamic Connections (Recommended)

No need to set database credentials in config. Connect dynamically during your conversation:

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": ["C:\\wamp64_New\\www\\packages\\outlet-orm-mcp\\index.js"]
    }
  }
}
```

Then in Claude, connect to any database:

```plaintext
Connect to my_app database (MySQL at localhost, user: root, password: secret)
```

#### Option 2: Default Connection (Legacy)

Set a default database connection in environment variables:

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": ["C:\\wamp64_New\\www\\packages\\outlet-orm-mcp\\index.js"],
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

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_DRIVER` | Database driver (`mysql`, `postgres`, `sqlite`) | No* | - |
| `DB_HOST` | Database host | No* | - |
| `DB_PORT` | Database port | No* | - |
| `DB_DATABASE` | Database name | No* | - |
| `DB_USER` | Database user | No* | - |
| `DB_PASSWORD` | Database password | No* | - |

> *Optional when using dynamic connections via `connect_database` tool

## 🛠️ Available Tools

### Database Connection Management

| Tool | Description |
|------|-------------|
| `connect_database` | Connect to a database with a custom name |
| `switch_connection` | Switch between active connections |
| `list_connections` | List all active connections |
| `disconnect_database` | Disconnect from a specific database |
| `disconnect_all` | Disconnect all connections |

### Code Generation

| Tool | Description |
|------|-------------|
| `generate_model_file` | Generates a Model file with relations |
| `generate_controller_file` | Generates a complete REST Controller |
| `generate_migration_file` | Generates a table migration |

[📖 **Complete Code Generators Documentation**](./CODE_GENERATORS.md)

### Verification and Analysis

| Tool | Description |
|------|-------------|
| `verify_model_schema` | Verifies Model ↔ Database consistency |
| `verify_relations` | Validates relations and foreign keys |
| `verify_migration_status` | Checks migration status |
| `analyze_controller` | Analyzes Controller quality |
| `check_consistency` | Complete global verification |

[📖 **Complete Verification Tools Documentation**](./VERIFICATION_TOOLS.md)

### CRUD Operations

| Tool | Description |
|------|-------------|
| `query_data` | Queries database with filters, sorting, and pagination |
| `create_record` | Creates a record (returns ID) |
| `update_record` | Updates records (WHERE required) |
| `delete_record` | Deletes records (WHERE required) |
| `execute_raw_sql` | Executes raw SQL queries |
| `get_table_schema` | Retrieves table structure |

[📖 **Complete CRUD Operations Documentation**](./CRUD_OPERATIONS.md)

## 📖 Usage Examples

### Connection Management

#### Connect to Multiple Databases

```plaintext
Connect to my_blog database (MySQL at localhost:3306, user: blog_user, password: blog_pass)
```

```plaintext
Connect to my_shop database (PostgreSQL at 192.168.1.100:5432, user: shop_user, password: shop_pass)
```

```plaintext
Connect to analytics database (SQLite at /data/analytics.db)
```

#### Switch Between Connections

```plaintext
Switch to my_blog connection
```

```plaintext
List all active connections
```

#### Use Specific Connection in Operations

```plaintext
Query users table from my_blog connection with limit 10
```

```plaintext
Create a record in products table on my_shop connection with data: {name: "Widget", price: 29.99}
```

#### Disconnect Databases

```plaintext
Disconnect from my_blog database
```

```plaintext
Disconnect all databases
```

### Generating a Model with Relations

```plaintext
Create a Post model with:
- table posts
- fields: title (string), content (text), user_id (integer), published_at (datetime)
- belongsTo relation to User
- hasMany relation to Comment
- timestamps and softDeletes
```

### Generating a Controller

```plaintext
Create a UserController for the User Model with all CRUD methods
```

### Generating a Migration

```plaintext
Create a create_users_table migration with:
- id (primary key)
- name (string 255)
- email (string 255, unique)
- password (string 255)
- is_active (boolean, default true)
- timestamps
```

### Consistency Verification

```plaintext
Verify the User model consistency with the database
```

```plaintext
Analyze the Post model relations and verify foreign keys
```

```plaintext
Perform a complete verification of the User model, its Controller, and migrations
```

### CRUD Data Operations

```plaintext
Retrieve the first 10 active users sorted by creation date
```

```plaintext
Inspect the users table structure before generating the Model
```

```plaintext
Analyze data distribution to plan a migration
```

[See more examples in VERIFICATION_TOOLS.md](./VERIFICATION_TOOLS.md)

[See more CRUD examples in CRUD_OPERATIONS.md](./CRUD_OPERATIONS.md)

## 📂 Generated File Structure

```plaintext
your-project/
└── src/
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

> **Note**: All generated files are placed in the `src/` directory following modern JavaScript best practices. You can customize the output path using the `outputPath` parameter.

## 🔍 Advanced Features

### Complete Relation Support

- ✅ `hasOne` - One-to-one relation
- ✅ `hasMany` - One-to-many relation
- ✅ `belongsTo` - Inverse relation
- ✅ `belongsToMany` - Many-to-many relation
- ✅ `hasOneThrough` - Relation through intermediate table
- ✅ `hasManyThrough` - Relation through intermediate table
- ✅ `morphOne` / `morphMany` - Polymorphic relations

### Column Type Support

All MySQL/PostgreSQL types:

- Text: `string`, `text`, `mediumText`, `longText`
- Numbers: `integer`, `bigInteger`, `decimal`, `float`, `double`
- Dates: `date`, `datetime`, `timestamp`, `time`, `year`
- Booleans: `boolean`
- JSON: `json`, `jsonb`
- And more...

### Validation and Security

- ✅ Mass assignment vulnerability detection
- ✅ Filename validation
- ✅ Unguarded column verification
- ✅ Error handling analysis in Controllers
- ✅ Orphaned foreign key detection

## 🐛 Troubleshooting

### "OUTLET_ORM_ROOT is required"

Make sure you have defined the environment variable in Claude Desktop configuration.

### "Failed to connect to database"

Verify your connection credentials in the DB_* environment variables.

### Generation Issues

- Verify that the `src/models/`, `src/controllers/`, and `src/database/migrations/` directories will be created automatically
- Check write permissions in the project root directory
- Consult logs for more details

## 📚 Documentation

- [Complete Verification Tools Guide](./VERIFICATION_TOOLS.md)
- [Complete CRUD Operations Guide](./CRUD_OPERATIONS.md)
- [Complete Code Generators Guide](./CODE_GENERATORS.md)
- [Applied Security Fixes](./SECURITY_FIXES.md)
- [Outlet ORM Documentation](https://github.com/your-repo/outlet-orm)

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## 📄 License

MIT

## 🔗 Useful Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Outlet ORM](https://github.com/your-repo/outlet-orm)
- [Claude Desktop](https://claude.ai/desktop)

---

Developed with ❤️ for Outlet ORM
