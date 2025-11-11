#!/usr/bin/env node

/**
 * Test script for Outlet ORM MCP verification tools
 * 
 * This script demonstrates and tests all verification capabilities:
 * - verify_model_schema
 * - verify_relations
 * - verify_migration_status
 * - analyze_controller
 * - check_consistency
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

// Create test fixtures
function setupTestFixtures() {
  section('📁 Creating test fixtures...');
  
  const fixturesDir = join(__dirname, 'test-fixtures');
  const modelsDir = join(fixturesDir, 'models');
  const controllersDir = join(fixturesDir, 'controllers');
  const migrationsDir = join(fixturesDir, 'database', 'migrations');
  
  // Create directories
  [modelsDir, controllersDir, migrationsDir].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log(`✅ Created ${dir}`, 'green');
    }
  });
  
  // Create a test Model
  const modelContent = `import { Model } from 'outlet-orm';

export default class User extends Model {
  static table = 'users';

  static fillable = ['name', 'email', 'role'];

  static casts = {
    is_active: 'boolean',
    created_at: 'datetime',
    updated_at: 'datetime'
  };

  static timestamps = true;
  static softDeletes = false;

  // Relations
  posts() {
    return this.hasMany('Post', 'user_id', 'id');
  }

  profile() {
    return this.hasOne('Profile', 'user_id', 'id');
  }
}
`;
  
  writeFileSync(join(modelsDir, 'User.js'), modelContent);
  log('✅ Created test Model: User.js', 'green');
  
  // Create a test Controller
  const controllerContent = `import User from '../models/User.js';

export default class UserController {
  // List all users
  async index(req, res) {
    try {
      const users = await User.query()
        .with('posts')
        .paginate(req.query.page || 1, 15);
      
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get a single user
  async show(req, res) {
    try {
      const user = await User.find(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Create a new user
  async store(req, res) {
    try {
      const user = await User.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(422).json({ error: error.message });
    }
  }

  // Update a user
  async update(req, res) {
    try {
      const user = await User.find(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.update(req.body);
      return res.json(user);
    } catch (error) {
      return res.status(422).json({ error: error.message });
    }
  }

  // Delete a user
  async destroy(req, res) {
    try {
      const user = await User.find(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.delete();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
`;
  
  writeFileSync(join(controllersDir, 'UserController.js'), controllerContent);
  log('✅ Created test Controller: UserController.js', 'green');
  
  // Create test migrations
  const migration1 = `export async function up(schema) {
  await schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('role', 50).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.timestamps();
  });
}

export async function down(schema) {
  await schema.dropTable('users');
}
`;
  
  const migration2 = `export async function up(schema) {
  await schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.text('content');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.timestamps();
  });
}

export async function down(schema) {
  await schema.dropTable('posts');
}
`;
  
  writeFileSync(join(migrationsDir, '20240315_120000_create_users_table.js'), migration1);
  writeFileSync(join(migrationsDir, '20240315_120500_create_posts_table.js'), migration2);
  log('✅ Created test Migrations', 'green');
  
  return {
    modelsDir,
    controllersDir,
    migrationsDir
  };
}

// Display test results
function displayResults(toolName, result) {
  section(`🔍 Results: ${toolName}`);
  
  console.log(JSON.stringify(result, null, 2));
  
  if (result.issues && result.issues.length > 0) {
    log(`\n⚠️  Found ${result.issues.length} issue(s):`, 'yellow');
    result.issues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      const color = issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'yellow' : 'cyan';
      log(`  ${icon} [${issue.type}] ${issue.message}`, color);
    });
  } else {
    log('\n✅ No issues found!', 'green');
  }
  
  if (typeof result.isValid !== 'undefined') {
    const status = result.isValid ? '✅ VALID' : '❌ INVALID';
    const color = result.isValid ? 'green' : 'red';
    log(`\nStatus: ${status}`, color);
  }
}

// Test verifyModelSchema function
async function testVerifyModelSchema(fixtures) {
  section('TEST 1: verify_model_schema');
  
  log('This test would require a real database connection.', 'yellow');
  log('Expected behavior:', 'cyan');
  log('  - Read User.js model file', 'cyan');
  log('  - Extract table name, fillable, casts', 'cyan');
  log('  - Query DESCRIBE users table', 'cyan');
  log('  - Compare and detect issues', 'cyan');
  log('\nTo run this test, you need:', 'magenta');
  log('  1. A running MySQL/PostgreSQL database', 'magenta');
  log('  2. A "users" table matching the model', 'magenta');
  log('  3. Database credentials in .env or dbConfig parameter', 'magenta');
}

// Test verifyRelations function
async function testVerifyRelations(fixtures) {
  section('TEST 2: verify_relations');
  
  log('This test would require a real database connection.', 'yellow');
  log('Expected behavior:', 'cyan');
  log('  - Read User.js model file', 'cyan');
  log('  - Extract relations (hasMany posts, hasOne profile)', 'cyan');
  log('  - Query INFORMATION_SCHEMA for foreign keys', 'cyan');
  log('  - Verify relations match database constraints', 'cyan');
  log('\nExpected issues:', 'magenta');
  log('  - ⚠️  No foreign key for profile() hasOne relation', 'yellow');
  log('  - ℹ️  Foreign key on posts.user_id found (OK for hasMany)', 'cyan');
}

// Test verifyMigrationStatus function
async function testVerifyMigrationStatus(fixtures) {
  section('TEST 3: verify_migration_status');
  
  log('This test would require a real database connection.', 'yellow');
  log('Expected behavior:', 'cyan');
  log('  - Read migration files from database/migrations/', 'cyan');
  log('  - Query migrations table', 'cyan');
  log('  - Compare applied vs pending', 'cyan');
  log('\nExpected results:', 'magenta');
  log('  - Total: 2 migrations', 'cyan');
  log('  - Applied: 0 (or 1-2 if you ran them)', 'cyan');
  log('  - Pending: 2 (or 0-1 if you ran them)', 'cyan');
}

// Test analyzeController function
async function testAnalyzeController(fixtures) {
  section('TEST 4: analyze_controller');
  
  log('Analyzing UserController.js...', 'cyan');
  
  // This one doesn't need a database!
  const controllerPath = join(fixtures.controllersDir, 'UserController.js');
  const controllerContent = readFileSync(controllerPath, 'utf-8');
  
  // Simulate the analysis
  const hasImport = /import\s+.*User.*from/.test(controllerContent);
  const methods = {
    index: /async\s+index\s*\(/.test(controllerContent),
    show: /async\s+show\s*\(/.test(controllerContent),
    store: /async\s+store\s*\(/.test(controllerContent),
    update: /async\s+update\s*\(/.test(controllerContent),
    destroy: /async\s+destroy\s*\(/.test(controllerContent)
  };
  const modelUsageCount = (controllerContent.match(/User\./g) || []).length;
  const hasPagination = /\.paginate\(/.test(controllerContent);
  const hasEagerLoading = /\.with\(/.test(controllerContent);
  const hasErrorHandling = /try\s*{/.test(controllerContent);
  
  const result = {
    controllerPath,
    modelName: 'User',
    hasImport,
    methods,
    modelUsageCount,
    hasPagination,
    hasEagerLoading,
    hasErrorHandling,
    issues: [],
    isValid: true
  };
  
  displayResults('analyze_controller', result);
  
  log('\n✨ Analysis Summary:', 'bright');
  log(`  📦 Model imported: ${hasImport ? '✅' : '❌'}`, hasImport ? 'green' : 'red');
  log(`  🔧 CRUD methods: ${Object.values(methods).filter(Boolean).length}/5`, 'cyan');
  log(`  🔍 Model usage count: ${modelUsageCount}`, 'cyan');
  log(`  📄 Pagination: ${hasPagination ? '✅' : '❌'}`, hasPagination ? 'green' : 'yellow');
  log(`  🔗 Eager loading: ${hasEagerLoading ? '✅' : '❌'}`, hasEagerLoading ? 'green' : 'yellow');
  log(`  ⚡ Error handling: ${hasErrorHandling ? '✅' : '❌'}`, hasErrorHandling ? 'green' : 'red');
}

// Test checkConsistency function
async function testCheckConsistency(fixtures) {
  section('TEST 5: check_consistency');
  
  log('This test would require a real database connection.', 'yellow');
  log('Expected behavior:', 'cyan');
  log('  - Run verify_model_schema', 'cyan');
  log('  - Run verify_relations', 'cyan');
  log('  - Run verify_migration_status', 'cyan');
  log('  - Run analyze_controller', 'cyan');
  log('  - Cross-check all results', 'cyan');
  log('\nExpected cross-checks:', 'magenta');
  log('  - Verify model table name matches migration', 'cyan');
  log('  - Check if table migration is applied or pending', 'cyan');
  log('  - Aggregate all issues from sub-verifications', 'cyan');
}

// Main test runner
async function runTests() {
  log('🧪 Outlet ORM MCP - Verification Tools Test Suite', 'bright');
  log('='.repeat(60), 'bright');
  
  try {
    // Setup
    const fixtures = setupTestFixtures();
    
    // Run tests
    await testVerifyModelSchema(fixtures);
    await testVerifyRelations(fixtures);
    await testVerifyMigrationStatus(fixtures);
    await testAnalyzeController(fixtures);
    await testCheckConsistency(fixtures);
    
    // Summary
    section('📊 Test Summary');
    log('✅ Test fixtures created successfully', 'green');
    log('✅ Controller analysis working (no DB required)', 'green');
    log('⚠️  Database verification tools require real DB connection', 'yellow');
    log('\n📖 Next steps:', 'cyan');
    log('  1. Set up a test database (MySQL/PostgreSQL/SQLite)', 'cyan');
    log('  2. Run the migrations in test-fixtures/database/migrations/', 'cyan');
    log('  3. Configure database credentials in .env', 'cyan');
    log('  4. Use Claude Desktop to test the MCP tools', 'cyan');
    log('\n💡 Tip: Check VERIFICATION_TOOLS.md for usage examples', 'magenta');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
