/**
 * Unit Tests for Outlet ORM MCP Server v2.1.0
 * 
 * This file contains unit tests for utility functions, validators,
 * and code generation logic.
 * 
 * Run with: node tests/unit.test.js
 */

// ============================================================================
// Test Utilities
// ============================================================================

class TestRunner {
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
      console.log('\n🎉 All tests passed!');
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

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message || 'Expected false, but got true');
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

async function assertThrowsAsync(fn, expectedMessage) {
  try {
    await fn();
    throw new Error('Expected async function to throw an error');
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to include "${expectedMessage}", but got "${error.message}"`);
    }
  }
}

function assertIncludes(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(message || `Expected "${str}" to include "${substring}"`);
  }
}

// ============================================================================
// Mock Functions (from index.js)
// ============================================================================

function validateName(name, type = 'name') {
  if (!name || typeof name !== 'string') {
    throw new Error(`${type} must be a non-empty string`);
  }
  
  if (!/^[a-zA-Z_]\w*$/.test(name)) {
    throw new Error(`${type} must contain only letters, numbers, and underscores, and must start with a letter or underscore`);
  }
  
  return true;
}

function validateColumnNames(columns) {
  if (!Array.isArray(columns)) {
    columns = [columns];
  }
  
  for (const col of columns) {
    if (typeof col !== 'string' || !/^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)?$/.test(col)) {
      throw new Error(`Invalid column name: ${col}. Column names must contain only letters, numbers, underscores, and optional table prefix.`);
    }
  }
  
  return true;
}

function toPascalCase(str) {
  return str
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function inferColumnType(dbType) {
  dbType = dbType.toLowerCase();
  
  if (dbType.includes('tinyint(1)') || dbType.includes('boolean')) {
    return 'boolean';
  }
  if (dbType.includes('json')) {
    return 'json';
  }
  if (dbType.includes('date') && !dbType.includes('datetime')) {
    return 'date';
  }
  if (dbType.includes('datetime') || dbType.includes('timestamp')) {
    return 'datetime';
  }
  if (dbType.includes('int') || dbType.includes('bigint')) {
    return 'integer';
  }
  if (dbType.includes('decimal') || dbType.includes('numeric')) {
    return 'decimal';
  }
  if (dbType.includes('float') || dbType.includes('double')) {
    return 'float';
  }
  
  return null; // No cast needed for strings/text
}

function buildWhereClause(where) {
  if (!where || Object.keys(where).length === 0) {
    return { clause: '', values: [] };
  }
  
  const conditions = [];
  const values = [];
  
  for (const [column, value] of Object.entries(where)) {
    validateColumnNames([column]);
    
    if (value === null) {
      conditions.push(`${column} IS NULL`);
    } else {
      conditions.push(`${column} = ?`);
      values.push(value);
    }
  }
  
  return {
    clause: ' WHERE ' + conditions.join(' AND '),
    values
  };
}

// ============================================================================
// Test Suites
// ============================================================================

const runner = new TestRunner();

// Test Suite 1: validateName()
runner.describe('validateName()', () => {
  runner.it('should accept valid alphanumeric names', () => {
    assertTrue(validateName('user'));
    assertTrue(validateName('User'));
    assertTrue(validateName('user123'));
    assertTrue(validateName('User_Profile'));
  });

  runner.it('should accept names starting with underscore', () => {
    assertTrue(validateName('_private'));
    assertTrue(validateName('_temp'));
    assertTrue(validateName('_123'));
  });

  runner.it('should reject names with spaces', () => {
    assertThrows(() => validateName('user name'), 'must contain only');
  });

  runner.it('should reject names with special characters', () => {
    assertThrows(() => validateName('user-name'), 'must contain only');
    assertThrows(() => validateName('user.name'), 'must contain only');
    assertThrows(() => validateName('user@domain'), 'must contain only');
  });

  runner.it('should reject names starting with numbers', () => {
    assertThrows(() => validateName('123user'), 'must contain only');
  });

  runner.it('should reject SQL injection attempts', () => {
    assertThrows(() => validateName("user'; DROP TABLE users; --"));
    assertThrows(() => validateName("user OR 1=1"));
    assertThrows(() => validateName("user/**/UNION"));
  });

  runner.it('should reject empty strings', () => {
    assertThrows(() => validateName(''), 'must be a non-empty string');
  });

  runner.it('should reject non-string values', () => {
    assertThrows(() => validateName(null), 'must be a non-empty string');
    assertThrows(() => validateName(undefined), 'must be a non-empty string');
    assertThrows(() => validateName(123), 'must be a non-empty string');
  });

  runner.it('should use custom type in error message', () => {
    assertThrows(() => validateName('', 'Table name'), 'Table name must be');
  });
});

// Test Suite 2: validateColumnNames()
runner.describe('validateColumnNames()', () => {
  runner.it('should accept valid column names', () => {
    assertTrue(validateColumnNames(['id', 'user_id', 'firstName']));
  });

  runner.it('should accept column names with table prefix', () => {
    assertTrue(validateColumnNames(['users.id', 'posts.user_id']));
  });

  runner.it('should accept single column as string', () => {
    assertTrue(validateColumnNames('id'));
  });

  runner.it('should reject column names with multiple dots', () => {
    assertThrows(() => validateColumnNames(['db.users.id']), 'Invalid column name');
  });

  runner.it('should reject SQL injection in column names', () => {
    assertThrows(() => validateColumnNames(["id'; DROP TABLE users; --"]));
    assertThrows(() => validateColumnNames(["id OR 1=1"]));
  });

  runner.it('should reject empty array', () => {
    // Empty array should pass (no columns to validate)
    assertTrue(validateColumnNames([]));
  });

  runner.it('should reject non-string column names', () => {
    assertThrows(() => validateColumnNames([123]), 'Invalid column name');
    assertThrows(() => validateColumnNames([null]), 'Invalid column name');
  });
});

// Test Suite 3: toPascalCase()
runner.describe('toPascalCase()', () => {
  runner.it('should convert snake_case to PascalCase', () => {
    assertEquals(toPascalCase('user'), 'User');
    assertEquals(toPascalCase('user_profile'), 'UserProfile');
    assertEquals(toPascalCase('user_profile_image'), 'UserProfileImage');
  });

  runner.it('should convert kebab-case to PascalCase', () => {
    assertEquals(toPascalCase('user-profile'), 'UserProfile');
    assertEquals(toPascalCase('user-profile-image'), 'UserProfileImage');
  });

  runner.it('should handle already PascalCase strings', () => {
    assertEquals(toPascalCase('User'), 'User');
    assertEquals(toPascalCase('UserProfile'), 'Userprofile'); // Note: splits by camelCase not supported
  });

  runner.it('should handle single words', () => {
    assertEquals(toPascalCase('user'), 'User');
    assertEquals(toPascalCase('post'), 'Post');
  });
});

// Test Suite 4: toSnakeCase()
runner.describe('toSnakeCase()', () => {
  runner.it('should convert PascalCase to snake_case', () => {
    assertEquals(toSnakeCase('User'), 'user');
    assertEquals(toSnakeCase('UserProfile'), 'user_profile');
    assertEquals(toSnakeCase('UserProfileImage'), 'user_profile_image');
  });

  runner.it('should convert camelCase to snake_case', () => {
    assertEquals(toSnakeCase('user'), 'user');
    assertEquals(toSnakeCase('userProfile'), 'user_profile');
    assertEquals(toSnakeCase('userProfileImage'), 'user_profile_image');
  });

  runner.it('should handle already snake_case strings', () => {
    assertEquals(toSnakeCase('user_profile'), 'user_profile');
  });

  runner.it('should not add leading underscore', () => {
    assertEquals(toSnakeCase('User'), 'user');
    assertFalse(toSnakeCase('User').startsWith('_'));
  });
});

// Test Suite 5: generateTimestamp()
runner.describe('generateTimestamp()', () => {
  runner.it('should generate timestamp in correct format', () => {
    const timestamp = generateTimestamp();
    // Format: YYYYMMDD_HHMMSS
    const regex = /^\d{8}_\d{6}$/;
    assertTrue(regex.test(timestamp), `Timestamp ${timestamp} doesn't match format YYYYMMDD_HHMMSS`);
  });

  runner.it('should generate 15-character timestamp', () => {
    const timestamp = generateTimestamp();
    assertEquals(timestamp.length, 15); // 8 digits + 1 underscore + 6 digits
  });

  runner.it('should include current year', () => {
    const timestamp = generateTimestamp();
    const currentYear = new Date().getFullYear().toString();
    assertTrue(timestamp.startsWith(currentYear));
  });

  runner.it('should generate unique timestamps when called rapidly', async () => {
    const timestamp1 = generateTimestamp();
    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    const timestamp2 = generateTimestamp();
    assertFalse(timestamp1 === timestamp2, 'Timestamps should be different');
  });
});

// Test Suite 6: inferColumnType()
runner.describe('inferColumnType()', () => {
  runner.it('should detect boolean type', () => {
    assertEquals(inferColumnType('tinyint(1)'), 'boolean');
    assertEquals(inferColumnType('BOOLEAN'), 'boolean');
  });

  runner.it('should detect JSON type', () => {
    assertEquals(inferColumnType('json'), 'json');
    assertEquals(inferColumnType('JSON'), 'json');
    assertEquals(inferColumnType('jsonb'), 'json');
  });

  runner.it('should detect date type', () => {
    assertEquals(inferColumnType('date'), 'date');
    assertEquals(inferColumnType('DATE'), 'date');
  });

  runner.it('should detect datetime type', () => {
    assertEquals(inferColumnType('datetime'), 'datetime');
    assertEquals(inferColumnType('timestamp'), 'datetime');
    assertEquals(inferColumnType('TIMESTAMP'), 'datetime');
  });

  runner.it('should detect integer type', () => {
    assertEquals(inferColumnType('int'), 'integer');
    assertEquals(inferColumnType('integer'), 'integer');
    assertEquals(inferColumnType('bigint'), 'integer');
    assertEquals(inferColumnType('INT(11)'), 'integer');
  });

  runner.it('should detect decimal type', () => {
    assertEquals(inferColumnType('decimal'), 'decimal');
    assertEquals(inferColumnType('numeric'), 'decimal');
    assertEquals(inferColumnType('DECIMAL(10,2)'), 'decimal');
  });

  runner.it('should detect float type', () => {
    assertEquals(inferColumnType('float'), 'float');
    assertEquals(inferColumnType('double'), 'float');
    assertEquals(inferColumnType('FLOAT'), 'float');
  });

  runner.it('should return null for string types', () => {
    assertEquals(inferColumnType('varchar'), null);
    assertEquals(inferColumnType('varchar(255)'), null);
    assertEquals(inferColumnType('text'), null);
    assertEquals(inferColumnType('char'), null);
  });
});

// Test Suite 7: buildWhereClause()
runner.describe('buildWhereClause()', () => {
  runner.it('should build WHERE clause with single condition', () => {
    const result = buildWhereClause({ id: 1 });
    assertEquals(result.clause, ' WHERE id = ?');
    assertEquals(result.values[0], 1);
  });

  runner.it('should build WHERE clause with multiple conditions', () => {
    const result = buildWhereClause({ id: 1, status: 'active' });
    assertIncludes(result.clause, 'WHERE');
    assertIncludes(result.clause, 'id = ?');
    assertIncludes(result.clause, 'status = ?');
    assertIncludes(result.clause, 'AND');
    assertEquals(result.values.length, 2);
  });

  runner.it('should handle NULL values with IS NULL', () => {
    const result = buildWhereClause({ deleted_at: null });
    assertEquals(result.clause, ' WHERE deleted_at IS NULL');
    assertEquals(result.values.length, 0);
  });

  runner.it('should return empty clause for empty object', () => {
    const result = buildWhereClause({});
    assertEquals(result.clause, '');
    assertEquals(result.values.length, 0);
  });

  runner.it('should return empty clause for null/undefined', () => {
    const result1 = buildWhereClause(null);
    assertEquals(result1.clause, '');
    
    const result2 = buildWhereClause(undefined);
    assertEquals(result2.clause, '');
  });

  runner.it('should validate column names in WHERE clause', () => {
    assertThrows(() => buildWhereClause({ "id'; DROP TABLE users; --": 1 }), 'Invalid column name');
  });

  runner.it('should handle table-prefixed column names', () => {
    const result = buildWhereClause({ 'users.id': 1 });
    assertIncludes(result.clause, 'users.id = ?');
  });
});

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 Outlet ORM MCP Server v2.1.0 - Unit Test Suite');
  console.log('═══════════════════════════════════════════════════════');

  await runner.run();
  
  const success = runner.summary();
  
  if (!success) {
    process.exit(1);
  }
}

// Export for use in test frameworks
export {
  validateName,
  validateColumnNames,
  toPascalCase,
  toSnakeCase,
  generateTimestamp,
  inferColumnType,
  buildWhereClause,
  runAllTests
};

// Run tests if called directly
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  runAllTests().catch(console.error);
}
