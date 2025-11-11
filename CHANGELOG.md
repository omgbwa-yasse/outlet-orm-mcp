# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-11

### Added

- Initial release of Outlet ORM MCP Server
- Database connection management (connect/disconnect)
- Complete CRUD operations:
  - `find_by_id` - Find records by primary key
  - `get_all` - Retrieve all records
  - `create_record` - Create new records
  - `update_record` - Update existing records
  - `delete_record` - Delete records
- Advanced Query Builder with support for:
  - WHERE clauses (simple and complex)
  - WHERE IN operations
  - SELECT specific columns
  - ORDER BY sorting
  - LIMIT and OFFSET
  - Eager loading with WITH
  - Multiple actions: get, first, count, paginate, exists
- Database utilities:
  - `list_tables` - List all tables in database
  - `describe_table` - Get table structure/schema
  - `execute_raw_query` - Execute raw SQL queries
- Bulk operations:
  - `bulk_insert` - Insert multiple records
  - `bulk_update` - Update multiple records with conditions
- Aggregations:
  - `aggregate` - Atomic increment/decrement operations
- Migration support:
  - `list_migrations` - List available migration files
  - CLI integration recommendations
- Support for MySQL, PostgreSQL, and SQLite databases
- Environment-based configuration via .env
- Dynamic model creation and management
- Comprehensive documentation and examples
- Quick start guide for Claude Desktop integration

### Features

- 🔌 Full database connectivity through Model Context Protocol
- 📊 Complete ORM operations exposed as MCP tools
- 🔍 Advanced query building capabilities
- 🗄️ Multi-database support (MySQL, PostgreSQL, SQLite)
- 📦 Bulk operations for efficiency
- 📈 Atomic aggregation operations
- 🔄 Migration management integration
- 🚀 Ready-to-use with Claude Desktop
- 📚 Extensive documentation and examples

### Documentation

- README.md with complete feature overview
- QUICKSTART.md for rapid setup
- Example Claude Desktop configuration
- Comprehensive tool documentation
- Usage examples for all major operations

## [Unreleased]

### Planned

- Enhanced relation management tools
- Transaction support
- Query result caching
- Schema introspection improvements
- Advanced migration operations through MCP
- Performance optimization tools
- Query logging and debugging
- Custom model registration
- Validation support
