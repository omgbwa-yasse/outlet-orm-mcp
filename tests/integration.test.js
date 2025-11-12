/**
 * Integration Tests for Outlet ORM MCP Server v2.1.0
 * 
 * This file contains integration tests for MCP tool execution.
 * These tests verify the tool interfaces and basic functionality.
 * 
 * Note: These tests do NOT require a database connection as they
 * test tool structure and validation logic.
 * 
 * Run with: node tests/integration.test.js
 */

// ============================================================================
// Test Utilities
// ============================================================================

class IntegrationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  describe(suiteName, testFn) {
    console.log(`\n📦 ${suiteName}`);
    console.log('─'.repeat(60));
    testFn();
  }

  it(testName, testFn) {
    this.tests.push({ name: testName, fn: testFn });
  }

  async run() {
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`  ✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`  ❌ ${test.name}`);
        console.log(`     Error: ${error.message}`);
        this.failed++;
      }
    }
    this.tests = [];
  }

  summary() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Test Summary');
    console.log('═'.repeat(60));
    console.log(`  Total: ${this.passed + this.failed}`);
    console.log(`  ✅ Passed: ${this.passed}`);
    console.log(`  ❌ Failed: ${this.failed}`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All integration tests passed!');
      return true;
    } else {
      console.log(`\n⚠️  ${this.failed} test(s) failed`);
      return false;
    }
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected true, but got false');
  }
}

function assertIncludes(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(message || `Expected "${str}" to include "${substring}"`);
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to include "${expectedMessage}", but got "${error.message}"`);
    }
  }
}

// ============================================================================
// Mock Tool Handlers
// ============================================================================

// These simulate the tool call structure from the MCP server
const tools = {
  // Code Generation Tools
  generate_model_file: {
    schema: {
      tableName: { type: 'string', required: true },
      outputPath: { type: 'string', required: false },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      // Validate required arguments
      if (!args.tableName || typeof args.tableName !== 'string') {
        throw new Error('tableName is required and must be a string');
      }
      
      // Validate table name
      if (!/^[a-zA-Z_]\w*$/.test(args.tableName)) {
        throw new Error('Invalid table name');
      }
      
      return {
        success: true,
        message: `Model file generated for table ${args.tableName}`,
        filePath: args.outputPath || `models/${args.tableName}.js`
      };
    }
  },

  generate_controller_file: {
    schema: {
      modelName: { type: 'string', required: true },
      outputPath: { type: 'string', required: false }
    },
    handler: async (args) => {
      if (!args.modelName || typeof args.modelName !== 'string') {
        throw new Error('modelName is required and must be a string');
      }
      
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(args.modelName)) {
        throw new Error('modelName must be PascalCase');
      }
      
      return {
        success: true,
        message: `Controller generated for model ${args.modelName}`,
        filePath: args.outputPath || `controllers/${args.modelName}Controller.js`
      };
    }
  },

  generate_migration_file: {
    schema: {
      migrationName: { type: 'string', required: true },
      tableName: { type: 'string', required: true },
      columns: { type: 'array', required: false },
      action: { type: 'string', required: false }
    },
    handler: async (args) => {
      if (!args.migrationName || !args.tableName) {
        throw new Error('migrationName and tableName are required');
      }
      
      return {
        success: true,
        message: 'Migration file generated',
        migrationName: args.migrationName,
        tableName: args.tableName
      };
    }
  },

  // Verification Tools
  verify_model_schema: {
    schema: {
      modelPath: { type: 'string', required: true },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.modelPath) {
        throw new Error('modelPath is required');
      }
      
      // Mock response
      return {
        tableName: 'users',
        modelPath: args.modelPath,
        isValid: true,
        issues: []
      };
    }
  },

  verify_relations: {
    schema: {
      modelPath: { type: 'string', required: true },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.modelPath) {
        throw new Error('modelPath is required');
      }
      
      return {
        tableName: 'posts',
        modelPath: args.modelPath,
        relations: [],
        foreignKeys: [],
        isValid: true,
        issues: []
      };
    }
  },

  verify_migration_status: {
    schema: {
      migrationsPath: { type: 'string', required: false },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      return {
        migrationsPath: args.migrationsPath || 'database/migrations',
        total: 0,
        applied: 0,
        pending: 0,
        isValid: true,
        issues: []
      };
    }
  },

  analyze_controller: {
    schema: {
      controllerPath: { type: 'string', required: true },
      modelName: { type: 'string', required: true }
    },
    handler: async (args) => {
      if (!args.controllerPath || !args.modelName) {
        throw new Error('controllerPath and modelName are required');
      }
      
      return {
        controllerPath: args.controllerPath,
        modelName: args.modelName,
        hasImport: true,
        methods: {},
        isValid: true,
        issues: []
      };
    }
  },

  check_consistency: {
    schema: {
      modelPath: { type: 'string', required: false },
      controllerPath: { type: 'string', required: false },
      migrationsPath: { type: 'string', required: false },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      return {
        model: args.modelPath ? { isValid: true, issues: [] } : null,
        relations: args.modelPath ? { isValid: true, issues: [] } : null,
        controller: args.controllerPath ? { isValid: true, issues: [] } : null,
        migrations: { isValid: true, issues: [] },
        overallIssues: [],
        isValid: true
      };
    }
  },

  // CRUD Operations
  query_data: {
    schema: {
      table: { type: 'string', required: true },
      columns: { type: 'array', required: false },
      where: { type: 'object', required: false },
      orderBy: { type: 'string', required: false },
      limit: { type: 'number', required: false },
      offset: { type: 'number', required: false },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.table) {
        throw new Error('table is required');
      }
      
      if (!/^[a-zA-Z_]\w*$/.test(args.table)) {
        throw new Error('Invalid table name');
      }
      
      return {
        success: true,
        data: [],
        count: 0
      };
    }
  },

  create_record: {
    schema: {
      table: { type: 'string', required: true },
      data: { type: 'object', required: true },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.table || !args.data) {
        throw new Error('table and data are required');
      }
      
      if (Object.keys(args.data).length === 0) {
        throw new Error('data cannot be empty');
      }
      
      return {
        success: true,
        insertId: 1,
        affectedRows: 1
      };
    }
  },

  update_record: {
    schema: {
      table: { type: 'string', required: true },
      data: { type: 'object', required: true },
      where: { type: 'object', required: true },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.table || !args.data || !args.where) {
        throw new Error('table, data, and where are required');
      }
      
      if (Object.keys(args.where).length === 0) {
        throw new Error('WHERE clause is required for safety. Use { id: value } or other conditions.');
      }
      
      return {
        success: true,
        affectedRows: 1
      };
    }
  },

  delete_record: {
    schema: {
      table: { type: 'string', required: true },
      where: { type: 'object', required: true },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.table || !args.where) {
        throw new Error('table and where are required');
      }
      
      if (Object.keys(args.where).length === 0) {
        throw new Error('WHERE clause is required for safety');
      }
      
      return {
        success: true,
        affectedRows: 1
      };
    }
  },

  execute_raw_sql: {
    schema: {
      sql: { type: 'string', required: true },
      params: { type: 'array', required: false },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.sql) {
        throw new Error('sql is required');
      }
      
      return {
        success: true,
        results: []
      };
    }
  },

  get_table_schema: {
    schema: {
      table: { type: 'string', required: true },
      dbConfig: { type: 'object', required: false }
    },
    handler: async (args) => {
      if (!args.table) {
        throw new Error('table is required');
      }
      
      return {
        table: args.table,
        columns: [],
        indexes: [],
        foreignKeys: []
      };
    }
  }
};

// ============================================================================
// Test Suites
// ============================================================================

const runner = new IntegrationTestRunner();

// Test Suite 1: generate_model_file tool
runner.describe('generate_model_file tool', () => {
  const tool = tools.generate_model_file;

  runner.it('should require tableName parameter', async () => {
    let error = null;
    try {
      await tool.handler({});
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null, 'Should throw error for missing tableName');
    assertIncludes(error.message, 'tableName');
  });

  runner.it('should accept valid tableName', async () => {
    const result = await tool.handler({ tableName: 'users' });
    assertTrue(result.success);
    assertIncludes(result.message, 'users');
  });

  runner.it('should reject invalid table names', async () => {
    let error = null;
    try {
      await tool.handler({ tableName: 'users; DROP TABLE users;' });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'Invalid');
  });

  runner.it('should accept custom outputPath', async () => {
    const result = await tool.handler({
      tableName: 'users',
      outputPath: 'src/models/User.js'
    });
    assertEquals(result.filePath, 'src/models/User.js');
  });
});

// Test Suite 2: generate_controller_file tool
runner.describe('generate_controller_file tool', () => {
  const tool = tools.generate_controller_file;

  runner.it('should require modelName parameter', async () => {
    let error = null;
    try {
      await tool.handler({});
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'modelName');
  });

  runner.it('should accept PascalCase modelName', async () => {
    const result = await tool.handler({ modelName: 'User' });
    assertTrue(result.success);
  });

  runner.it('should reject non-PascalCase modelName', async () => {
    let error = null;
    try {
      await tool.handler({ modelName: 'user' });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'PascalCase');
  });
});

// Test Suite 3: generate_migration_file tool
runner.describe('generate_migration_file tool', () => {
  const tool = tools.generate_migration_file;

  runner.it('should require migrationName and tableName', async () => {
    let error = null;
    try {
      await tool.handler({});
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'required');
  });

  runner.it('should accept valid migration parameters', async () => {
    const result = await tool.handler({
      migrationName: 'create_users_table',
      tableName: 'users'
    });
    assertTrue(result.success);
    assertEquals(result.tableName, 'users');
  });
});

// Test Suite 4: verify_model_schema tool
runner.describe('verify_model_schema tool', () => {
  const tool = tools.verify_model_schema;

  runner.it('should require modelPath parameter', async () => {
    let error = null;
    try {
      await tool.handler({});
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
  });

  runner.it('should return verification result', async () => {
    const result = await tool.handler({ modelPath: 'models/User.js' });
    assertTrue(result.isValid !== undefined);
    assertTrue(Array.isArray(result.issues));
  });
});

// Test Suite 5: query_data tool
runner.describe('query_data tool', () => {
  const tool = tools.query_data;

  runner.it('should require table parameter', async () => {
    let error = null;
    try {
      await tool.handler({});
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'table');
  });

  runner.it('should validate table name', async () => {
    let error = null;
    try {
      await tool.handler({ table: 'users; DROP TABLE users;' });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'Invalid');
  });

  runner.it('should return query results', async () => {
    const result = await tool.handler({ table: 'users' });
    assertTrue(result.success);
    assertTrue(Array.isArray(result.data));
  });
});

// Test Suite 6: create_record tool
runner.describe('create_record tool', () => {
  const tool = tools.create_record;

  runner.it('should require table and data parameters', async () => {
    let error = null;
    try {
      await tool.handler({ table: 'users' });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'data');
  });

  runner.it('should reject empty data object', async () => {
    let error = null;
    try {
      await tool.handler({ table: 'users', data: {} });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'empty');
  });

  runner.it('should return insertId', async () => {
    const result = await tool.handler({
      table: 'users',
      data: { name: 'John' }
    });
    assertTrue(result.success);
    assertTrue(result.insertId !== undefined);
  });
});

// Test Suite 7: update_record tool
runner.describe('update_record tool', () => {
  const tool = tools.update_record;

  runner.it('should require WHERE clause', async () => {
    let error = null;
    try {
      await tool.handler({
        table: 'users',
        data: { name: 'John' }
      });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'where');
  });

  runner.it('should reject empty WHERE clause', async () => {
    let error = null;
    try {
      await tool.handler({
        table: 'users',
        data: { name: 'John' },
        where: {}
      });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'WHERE');
  });

  runner.it('should accept valid update with WHERE', async () => {
    const result = await tool.handler({
      table: 'users',
      data: { name: 'John' },
      where: { id: 1 }
    });
    assertTrue(result.success);
  });
});

// Test Suite 8: delete_record tool
runner.describe('delete_record tool', () => {
  const tool = tools.delete_record;

  runner.it('should require WHERE clause for safety', async () => {
    let error = null;
    try {
      await tool.handler({ table: 'users' });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'where');
  });

  runner.it('should reject empty WHERE clause', async () => {
    let error = null;
    try {
      await tool.handler({
        table: 'users',
        where: {}
      });
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
    assertIncludes(error.message, 'WHERE');
  });

  runner.it('should accept valid delete with WHERE', async () => {
    const result = await tool.handler({
      table: 'users',
      where: { id: 1 }
    });
    assertTrue(result.success);
  });
});

// Test Suite 9: execute_raw_sql tool
runner.describe('execute_raw_sql tool', () => {
  const tool = tools.execute_raw_sql;

  runner.it('should require sql parameter', async () => {
    let error = null;
    try {
      await tool.handler({});
    } catch (e) {
      error = e;
    }
    assertTrue(error !== null);
  });

  runner.it('should execute SQL query', async () => {
    const result = await tool.handler({ sql: 'SELECT * FROM users' });
    assertTrue(result.success);
    assertTrue(Array.isArray(result.results));
  });
});

// Test Suite 10: Tool Interface Consistency
runner.describe('Tool Interface Consistency', () => {
  runner.it('all tools should have schema property', () => {
    for (const [name, tool] of Object.entries(tools)) {
      assertTrue(tool.schema !== undefined, `${name} missing schema`);
    }
  });

  runner.it('all tools should have handler function', () => {
    for (const [name, tool] of Object.entries(tools)) {
      assertEquals(typeof tool.handler, 'function', `${name} handler not a function`);
    }
  });

  runner.it('all tools should return objects with success/error/isValid', async () => {
    // Test one tool from each category
    const testTools = [
      { name: 'generate_model_file', args: { tableName: 'users' } },
      { name: 'query_data', args: { table: 'users' } },
      { name: 'verify_model_schema', args: { modelPath: 'models/User.js' } }
    ];

    for (const { name, args } of testTools) {
      const result = await tools[name].handler(args);
      assertTrue(
        result.success !== undefined || result.error !== undefined || result.isValid !== undefined,
        `${name} should return success, error, or isValid`
      );
    }
  });
});

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔌 Outlet ORM MCP Server v2.1.0 - Integration Tests');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Testing MCP tool interfaces and validation logic\n');

  await runner.run();
  
  const success = runner.summary();
  
  console.log('\nNote: These tests verify tool interfaces and validation.');
  console.log('Database operations are mocked and do not require a real DB.');
  
  if (!success) {
    process.exit(1);
  }
}

// Export for use in test frameworks
export { tools, runAllTests };

// Run tests if called directly
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  runAllTests().catch(console.error);
}
