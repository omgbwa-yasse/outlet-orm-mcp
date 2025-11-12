# Quick Start Guide - Outlet ORM MCP

This guide will help you set up and use the Outlet ORM MCP Server with Claude Desktop.

## Step 1: Installation

```bash
cd outlet-orm-mcp
npm install

# Install your database driver
npm install mysql2      # For MySQL/MariaDB
# or
npm install pg          # For PostgreSQL
# or
npm install sqlite3     # For SQLite
```

## Step 2: Configuration

### Option A: Dynamic Connections (Recommended - New in v2.3.0)

No configuration needed! Connect to databases directly from Claude:

```plaintext
Connect to myapp database (MySQL at localhost:3306, user: root, password: secret)
```

This approach allows you to work with multiple databases simultaneously without any configuration file changes.

### Option B: Default Connection (Legacy)

Configure a default database connection that will be used automatically.

#### Using .env file

```bash
cp .env.example .env
```

Edit `.env` with your parameters:

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=myapp
DB_USER=root
DB_PASSWORD=secret
```

#### Or via Claude Desktop Config

Add `env` section in Claude's configuration (see Step 3).

## Step 3: Claude Desktop Configuration

### Configuration File Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Add the MCP Server

Open the file and add:

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "/absolute/path/to/outlet-orm-mcp/index.js"
      ]
    }
  }
}
```

**Windows Example:**

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "C:\\wamp64_New\\www\\packages\\outlet-orm-mcp\\index.js"
      ]
    }
  }
}
```

> **Note**: With dynamic connections (Option A), you don't need the `env` section. Just omit it and connect from Claude as needed.

**Windows Example with Default Connection (Legacy):**

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "C:\\wamp64_New\\www\\packages\\outlet-orm-mcp\\index.js"
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

**macOS/Linux Example:**

```json
{
  "mcpServers": {
    "outlet-orm": {
      "command": "node",
      "args": [
        "/Users/username/projects/outlet-orm-mcp/index.js"
      ]
    }
  }
}
```

## Step 4: Restart Claude Desktop

1. Completely close Claude Desktop
2. Restart the application
3. Check for the 🔌 icon indicating the MCP server is connected

## Step 5: Test

Try these commands in Claude Desktop:

### Connection Test

```text
Connect to myapp database (MySQL at localhost:3306, user: root, password: secret)
```

Or if using default connection:

```text
Connect to the database
```

### Multi-Database Usage (v2.3.0+)

```text
Connect to blog_db database (MySQL at localhost, user: blog_user, password: pass1)
Connect to shop_db database (PostgreSQL at 192.168.1.100:5432, user: shop_user, password: pass2)
List all active connections
Switch to blog_db connection
```

### List Tables

```text
What tables are available in the database?
```

### Create a Record

```text
Create a user with name "Test User" and email "test@example.com" in the users table
```

### Read Data

```text
Get all users from the users table
```

### Advanced Query

```text
Find all users with status "active", sorted by creation date, limit to 10 results
```

## Advanced Usage Examples

### Eager Loading (load relations)

```text
Get all users with their posts and profiles
```

### Pagination

```text
Get page 2 of users, 15 per page
```

### Count

```text
How many users have status "pending"?
```

### Bulk Update

```text
Update all users with status "pending" to "active"
```

### Multiple Insert

```text
Insert these 3 users into the users table:
- Alice (alice@example.com)
- Bob (bob@example.com)
- Charlie (charlie@example.com)
```

### Raw SQL

```text
Execute this query: SELECT COUNT(*) as total FROM users WHERE created_at > '2024-01-01'
```

### Atomic Increment

```text
Increment the "login_count" field by 1 for user with ID 5
```

## Troubleshooting

### Server Won't Connect

1. Check that Node.js is installed: `node --version`
2. Verify the path in config is correct (absolute)
3. Check Claude Desktop logs
4. Test the server manually: `node index.js` (should remain waiting)

### Database Connection Error

1. Check your parameters in `.env` or Claude config
2. Ensure the driver is installed (`mysql2`, `pg`, or `sqlite3`)
3. Test the connection with a standard database client
4. Verify the database is running

### Server Starts but Tools Don't Work

1. Try connecting first: "Connect to the database"
2. Check that tables exist: "List the tables"
3. Review errors returned by tools

### Testing Server Outside Claude

Use the MCP inspector:

```bash
npx @modelcontextprotocol/inspector node index.js
```

This will open a web interface to test tools manually.

## Support

For help:

- [GitHub Issues](https://github.com/omgbwa-yasse/outlet-orm-mcp/issues)
- [Outlet ORM Documentation](https://github.com/omgbwa-yasse/outlet-orm)
- [MCP Documentation](https://modelcontextprotocol.io)

## Next Steps

Once everything works, explore:

1. Migrations with `outlet-migrate` (CLI)
2. Defining custom models
3. Table relationships
4. Advanced operations (joins, aggregations, etc.)

Happy coding! 🚀
