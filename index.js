#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multi-database connection manager
const connectionManager = {
  connections: new Map(),
  activeConnection: null,
  
  /**
   * Add or update a connection
   */
  async connect(connectionName, config) {
    if (!DatabaseConnection) {
      const outletOrm = await import('outlet-orm');
      DatabaseConnection = outletOrm.DatabaseConnection;
    }
    
    const connection = new DatabaseConnection(config);
    await connection.connect();
    
    this.connections.set(connectionName, {
      connection,
      config,
      createdAt: Date.now()
    });
    
    // Set as active if it's the first connection
    if (!this.activeConnection) {
      this.activeConnection = connectionName;
    }
    
    return connection;
  },
  
  /**
   * Get a connection by name
   */
  getConnection(connectionName = null) {
    const name = connectionName || this.activeConnection;
    if (!name) {
      throw new Error('No active database connection. Please connect first using connect_database tool.');
    }
    
    const conn = this.connections.get(name);
    if (!conn) {
      throw new Error(`Connection '${name}' not found. Available connections: ${Array.from(this.connections.keys()).join(', ')}`);
    }
    
    return conn.connection;
  },
  
  /**
   * Set active connection
   */
  setActive(connectionName) {
    if (!this.connections.has(connectionName)) {
      throw new Error(`Connection '${connectionName}' not found`);
    }
    this.activeConnection = connectionName;
  },
  
  /**
   * Disconnect a specific connection
   */
  async disconnect(connectionName) {
    const conn = this.connections.get(connectionName);
    if (conn) {
      await conn.connection.close();
      this.connections.delete(connectionName);
      
      // If this was the active connection, set another as active
      if (this.activeConnection === connectionName) {
        const remaining = Array.from(this.connections.keys());
        this.activeConnection = remaining.length > 0 ? remaining[0] : null;
      }
      
      clearSchemaCache();
    }
  },
  
  /**
   * Disconnect all connections
   */
  async disconnectAll() {
    for (const [name, conn] of this.connections) {
      await conn.connection.close();
    }
    this.connections.clear();
    this.activeConnection = null;
    clearSchemaCache();
  },
  
  /**
   * List all connections
   */
  listConnections() {
    return Array.from(this.connections.entries()).map(([name, conn]) => ({
      name,
      database: conn.config.database,
      driver: conn.config.driver,
      host: conn.config.host,
      isActive: name === this.activeConnection,
      createdAt: new Date(conn.createdAt).toISOString()
    }));
  }
};

// Database connection instance (initialized on demand) - DEPRECATED: use connectionManager
let dbConnection = null;
let DatabaseConnection = null;

// Schema cache to avoid repeated queries
const schemaCache = new Map();
const SCHEMA_CACHE_TTL = 60000; // 1 minute
const QUERY_TIMEOUT = 30000; // 30 seconds

/**
 * Execute a query with timeout
 */
async function executeWithTimeout(promise, timeoutMs = QUERY_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Clear schema cache for a specific table or all tables
 */
function clearSchemaCache(tableName = null) {
  if (tableName) {
    schemaCache.delete(tableName);
  } else {
    schemaCache.clear();
  }
}

/**
 * Get cached schema or fetch from database
 */
async function getCachedSchema(connection, table) {
  const cached = schemaCache.get(table);
  if (cached && Date.now() - cached.timestamp < SCHEMA_CACHE_TTL) {
    return cached.data;
  }
  
  const schema = await connection.raw('DESCRIBE ??', [table]);
  const data = schema[0] || schema;
  
  schemaCache.set(table, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}

/**
 * Validate column names to prevent SQL injection
 */
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

/**
 * Validate model/controller/table names
 */
function validateName(name, type = 'name') {
  if (!name || typeof name !== 'string') {
    throw new Error(`${type} must be a non-empty string`);
  }
  
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_]\w*$/.test(name)) {
    throw new Error(`${type} must contain only letters, numbers, and underscores, and must start with a letter or underscore`);
  }
  
  return true;
}

/**
 * Check if file already exists to prevent accidental overwrites
 */
function checkFileExists(filePath) {
  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}. Please use a different name or delete the existing file.`);
  }
  return false;
}

/**
 * Générer un fichier Model
 */
function generateModelFile(modelName, config = {}) {
  validateName(modelName, 'Model name');
  
  const {
    table = modelName.toLowerCase() + 's',
    fillable = [],
    hidden = [],
    casts = {},
    timestamps = true,
    primaryKey = 'id',
    relations = []
  } = config;
  
  validateName(table, 'Table name');
  validateName(primaryKey, 'Primary key');

  const className = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  let content = `const { Model } = require('outlet-orm');\n\n`;
  
  // Imports pour les relations
  const relatedModels = new Set();
  for (const rel of relations) {
    if (rel.model) {
      relatedModels.add(rel.model);
    }
  }
  
  for (const model of relatedModels) {
    content += `const ${model} = require('./${model}');\n`;
  }
  
  if (relatedModels.size > 0) content += '\n';
  
  content += `class ${className} extends Model {\n`;
  content += `  static table = '${table}';\n`;
  content += `  static primaryKey = '${primaryKey}';\n`;
  content += `  static timestamps = ${timestamps};\n\n`;
  
  if (fillable.length > 0) {
    content += `  static fillable = ${JSON.stringify(fillable, null, 4)};\n\n`;
  }
  
  if (hidden.length > 0) {
    content += `  static hidden = ${JSON.stringify(hidden, null, 4)};\n\n`;
  }
  
  if (Object.keys(casts).length > 0) {
    content += `  static casts = ${JSON.stringify(casts, null, 4)};\n\n`;
  }
  
  // Générer les méthodes de relations
  for (const rel of relations) {
    content += `  // ${rel.type} relation\n`;
    content += `  ${rel.name}() {\n`;
    
    switch (rel.type) {
      case 'hasOne': {
        content += `    return this.hasOne(${rel.model}, '${rel.foreignKey || table.slice(0, -1) + '_id'}');\n`;
        break;
      }
      case 'hasMany': {
        content += `    return this.hasMany(${rel.model}, '${rel.foreignKey || table.slice(0, -1) + '_id'}');\n`;
        break;
      }
      case 'belongsTo': {
        content += `    return this.belongsTo(${rel.model}, '${rel.foreignKey || rel.model.toLowerCase() + '_id'}');\n`;
        break;
      }
      case 'belongsToMany': {
        const relatedKey = rel.localKey || rel.model.toLowerCase() + '_id';
        content += `    return this.belongsToMany(\n`;
        content += `      ${rel.model},\n`;
        content += `      '${rel.pivotTable}',\n`;
        content += `      '${rel.foreignKey || table.slice(0, -1) + '_id'}',\n`;
        content += `      '${relatedKey}'\n`;
        content += `    );\n`;
        break;
      }
      case 'hasManyThrough': {
        content += `    return this.hasManyThrough(\n`;
        content += `      ${rel.model},\n`;
        content += `      ${rel.through},\n`;
        content += `      '${rel.foreignKey || table.slice(0, -1) + '_id'}',\n`;
        content += `      '${rel.localKey || rel.through.toLowerCase() + '_id'}'\n`;
        content += `    );\n`;
        break;
      }
      case 'morphOne':
      case 'morphMany': {
        const morphName = rel.morphType ? rel.morphType.replace('_type', '') : 'morphable';
        content += `    return this.${rel.type}(${rel.model}, '${morphName}');\n`;
        break;
      }
    }
    
    content += `  }\n\n`;
  }
  
  content += `}\n\nmodule.exports = ${className};\n`;
  
  return content;
}

/**
 * Générer un fichier Controller
 */
function generateControllerFile(controllerName, modelName) {
  validateName(controllerName, 'Controller name');
  validateName(modelName, 'Model name');
  
  const className = controllerName.charAt(0).toUpperCase() + controllerName.slice(1) + 'Controller';
  const ModelClass = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  let content = `const ${ModelClass} = require('../models/${ModelClass}');\n\n`;
  content += `class ${className} {\n\n`;
  
  // Index
  content += `  /**\n`;
  content += `   * Get all records with optional pagination\n`;
  content += `   * @param {Object} req - Request with query params (page, perPage, with)\n`;
  content += `   */\n`;
  content += `  async index(req) {\n`;
  content += `    const { page, perPage = 15, with: withRelations } = req.query || {};\n\n`;
  content += `    let query = ${ModelClass};\n\n`;
  content += `    if (withRelations) {\n`;
  content += `      const relations = Array.isArray(withRelations) ? withRelations : [withRelations];\n`;
  content += `      query = query.with(...relations);\n`;
  content += `    }\n\n`;
  content += `    if (page) {\n`;
  content += `      return await query.paginate(Number.parseInt(page, 10), Number.parseInt(perPage, 10));\n`;
  content += `    }\n\n`;
  content += `    return await query.all();\n`;
  content += `  }\n\n`;
  
  // Show
  content += `  /**\n`;
  content += `   * Get a single record by ID\n`;
  content += `   * @param {Object} req - Request with params.id and query.with\n`;
  content += `   */\n`;
  content += `  async show(req) {\n`;
  content += `    const { id } = req.params;\n`;
  content += `    const { with: withRelations } = req.query || {};\n\n`;
  content += `    let query = ${ModelClass};\n\n`;
  content += `    if (withRelations) {\n`;
  content += `      const relations = Array.isArray(withRelations) ? withRelations : [withRelations];\n`;
  content += `      query = query.with(...relations);\n`;
  content += `    }\n\n`;
  content += `    const record = await query.find(id);\n\n`;
  content += `    if (!record) {\n`;
  content += `      throw new Error('Record not found');\n`;
  content += `    }\n\n`;
  content += `    return record;\n`;
  content += `  }\n\n`;
  
  // Store
  content += `  /**\n`;
  content += `   * Create a new record\n`;
  content += `   * @param {Object} req - Request with body data\n`;
  content += `   */\n`;
  content += `  async store(req) {\n`;
  content += `    const data = req.body;\n`;
  content += `    return await ${ModelClass}.create(data);\n`;
  content += `  }\n\n`;
  
  // Update
  content += `  /**\n`;
  content += `   * Update an existing record\n`;
  content += `   * @param {Object} req - Request with params.id and body data\n`;
  content += `   */\n`;
  content += `  async update(req) {\n`;
  content += `    const { id } = req.params;\n`;
  content += `    const data = req.body;\n\n`;
  content += `    const record = await ${ModelClass}.find(id);\n\n`;
  content += `    if (!record) {\n`;
  content += `      throw new Error('Record not found');\n`;
  content += `    }\n\n`;
  content += `    for (const [key, value] of Object.entries(data)) {\n`;
  content += `      record.setAttribute(key, value);\n`;
  content += `    }\n\n`;
  content += `    await record.save();\n`;
  content += `    return record;\n`;
  content += `  }\n\n`;
  
  // Destroy
  content += `  /**\n`;
  content += `   * Delete a record\n`;
  content += `   * @param {Object} req - Request with params.id\n`;
  content += `   */\n`;
  content += `  async destroy(req) {\n`;
  content += `    const { id } = req.params;\n\n`;
  content += `    const record = await ${ModelClass}.find(id);\n\n`;
  content += `    if (!record) {\n`;
  content += `      throw new Error('Record not found');\n`;
  content += `    }\n\n`;
  content += `    await record.destroy();\n`;
  content += `    return { success: true, message: 'Record deleted successfully' };\n`;
  content += `  }\n`;
  
  content += `}\n\nmodule.exports = new ${className}();\n`;
  
  return content;
}

/**
 * Générer un fichier Migration
 */
function generateMigrationFile(migrationName, config = {}) {
  validateName(migrationName, 'Migration name');
  
  const {
    table,
    action = 'create', // create, alter, drop
    columns = [],
    indexes = [],
    foreignKeys = []
  } = config;
  
  if (!table) {
    throw new Error('Table name is required');
  }
  validateName(table, 'Table name');
  
  const timestamp = new Date().toISOString()
    .replaceAll(/[-:]/g, '')
    .replaceAll(/T/, '_')
    .replaceAll(/\..+/, '')
    .split('_')[0] + '_' + Date.now().toString().slice(-6);
  
  const fileName = `${timestamp}_${migrationName}.js`;
  
  let content = `const { Schema } = require('outlet-orm/lib/Schema/Schema');\n\n`;
  content += `class ${migrationName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} {\n`;
  content += `  constructor(connection) {\n`;
  content += `    this.schema = new Schema(connection);\n`;
  content += `  }\n\n`;
  
  // Method UP
  content += `  async up() {\n`;
  
  if (action === 'create') {
    content += `    await this.schema.create('${table}', (table) => {\n`;
    
    // Add columns
    for (const col of columns) {
      let line = `      table.${col.type}('${col.name}'`;
      if (col.length) line += `, ${col.length}`;
      line += ')';
      
      if (col.nullable) line += '.nullable()';
      if (col.unique) line += '.unique()';
      if (col.unsigned) line += '.unsigned()';
      if (col.default !== undefined) {
        const defaultValue = typeof col.default === 'string' ? `'${col.default}'` : col.default;
        line += `.default(${defaultValue})`;
      }
      if (col.comment) line += `.comment('${col.comment}')`;
      if (col.after) line += `.after('${col.after}')`;
      if (col.first) line += '.first()';
      
      line += ';';
      content += `${line}\n`;
    }
    
    // Add timestamps if requested
    if (config.timestamps) {
      content += `      table.timestamps();\n`;
    }
    
    // Add soft deletes if requested
    if (config.softDeletes) {
      content += `      table.timestamp('deleted_at').nullable();\n`;
    }
    
    // Add indexes
    for (const idx of indexes) {
      if (idx.type === 'index') {
        content += `      table.index(${JSON.stringify(idx.columns)});\n`;
      } else if (idx.type === 'unique') {
        content += `      table.unique(${JSON.stringify(idx.columns)});\n`;
      }
    }
    
    // Add foreign keys
    for (const fk of foreignKeys) {
      content += `      table.foreign('${fk.column}').references('${fk.references}').on('${fk.on}')`;
      if (fk.onDelete) content += `.onDelete('${fk.onDelete}')`;
      if (fk.onUpdate) content += `.onUpdate('${fk.onUpdate}')`;
      content += ';\n';
    }
    
    content += `    });\n`;
  } else if (action === 'alter') {
    content += `    await this.schema.table('${table}', (table) => {\n`;
    
    for (const col of columns) {
      if (col.action === 'add') {
        let line = `      table.${col.type}('${col.name}'`;
        if (col.length) line += `, ${col.length}`;
        line += ')';
        
        if (col.nullable) line += '.nullable()';
        if (col.unique) line += '.unique()';
        if (col.default !== undefined) {
          const defaultValue = typeof col.default === 'string' ? `'${col.default}'` : col.default;
          line += `.default(${defaultValue})`;
        }
        if (col.after) line += `.after('${col.after}')`;
        
        line += ';';
        content += `${line}\n`;
      } else if (col.action === 'drop') {
        content += `      table.dropColumn('${col.name}');\n`;
      } else if (col.action === 'rename') {
        content += `      table.renameColumn('${col.from}', '${col.to}');\n`;
      }
    }
    
    content += `    });\n`;
  } else if (action === 'drop') {
    content += `    await this.schema.dropIfExists('${table}');\n`;
  }
  
  content += `  }\n\n`;
  
  // Method DOWN
  content += `  async down() {\n`;
  
  if (action === 'create') {
    content += `    await this.schema.dropIfExists('${table}');\n`;
  } else if (action === 'alter') {
    content += `    await this.schema.table('${table}', (table) => {\n`;
    content += `      // Reverse the changes made in up()\n`;
    
    for (const col of columns) {
      if (col.action === 'add') {
        content += `      table.dropColumn('${col.name}');\n`;
      } else if (col.action === 'rename') {
        content += `      table.renameColumn('${col.to}', '${col.from}');\n`;
      }
    }
    
    content += `    });\n`;
  } else if (action === 'drop') {
    content += `    // Cannot easily reverse a drop operation\n`;
    content += `    // You would need to recreate the table with its original structure\n`;
  }
  
  content += `  }\n`;
  content += `}\n\nmodule.exports = ${migrationName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')};\n`;
  
  // Return both filename and content for the handler to use
  return { fileName, content };
}

/**
 * Get database connection - uses connectionManager or falls back to legacy method
 */
async function getConnection(connectionName = null, dbConfig = {}) {
  if (connectionName || connectionManager.activeConnection) {
    // Use named connection if specified or active connection exists
    return connectionManager.getConnection(connectionName);
  } else if (dbConfig && Object.keys(dbConfig).length > 0) {
    // Fall back to creating a connection with dbConfig (backward compatibility)
    return await initDatabaseConnection(getDatabaseConfig(dbConfig));
  } else {
    throw new Error('No database connection available. Please use connect_database tool or provide dbConfig.');
  }
}

/**
 * Get database configuration from environment or provided config
 */
function getDatabaseConfig(dbConfig = {}) {
  return {
    driver: dbConfig.driver || process.env.DB_DRIVER,
    host: dbConfig.host || process.env.DB_HOST,
    port: dbConfig.port || Number.parseInt(process.env.DB_PORT || '3306', 10),
    database: dbConfig.database || process.env.DB_DATABASE,
    user: dbConfig.user || process.env.DB_USER,
    password: dbConfig.password || process.env.DB_PASSWORD
  };
}

/**
 * Initialize database connection (uses connectionManager)
 */
async function initDatabaseConnection(config = {}, connectionName = 'default') {
  try {
    // Check if connection already exists
    if (connectionManager.connections.has(connectionName)) {
      return connectionManager.getConnection(connectionName);
    }
    
    // Create new connection
    return await connectionManager.connect(connectionName, config);
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error.message}`);
  }
}

/**
 * Close database connection (DEPRECATED: use disconnect_database tool or connectionManager.disconnect)
 */
async function closeDatabaseConnection() {
  console.warn('closeDatabaseConnection is deprecated. Use connectionManager.disconnect() instead.');
  await connectionManager.disconnectAll();
}

/**
 * Verify if a Model file matches the database schema
 */
async function verifyModelSchema(modelPath, dbConfig = {}) {
  try {
    const connection = await initDatabaseConnection(dbConfig);
    
    // Read the model file
    if (!existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }
    
    const modelContent = readFileSync(modelPath, 'utf-8');
    
    // Extract table name from model
    const tableMatch = modelContent.match(/static\s+table\s*=\s*['"]([^'"]+)['"]/);
    if (!tableMatch) {
      throw new Error('Could not find table name in model file');
    }
    
    const tableName = tableMatch[1];
    
    // Validate table name to prevent SQL injection
    validateName(tableName, 'Table name');
    
    // Get actual schema from database using cached query
    const schema = await getCachedSchema(connection, tableName);
    
    // Extract fillable attributes
    const fillableMatch = modelContent.match(/static\s+fillable\s*=\s*(\[[^\]]+\])/);
    const fillable = fillableMatch ? JSON.parse(fillableMatch[1].replaceAll("'", '"')) : [];
    
    // Extract casts
    const castsMatch = modelContent.match(/static\s+casts\s*=\s*({[^}]+})/);
    const casts = castsMatch ? JSON.parse(castsMatch[1].replaceAll("'", '"')) : {};
    
    // Verify columns
    const issues = [];
    const dbColumns = schema.map(col => col.Field);
    
    // Check if fillable columns exist in database
    for (const field of fillable) {
      if (!dbColumns.includes(field)) {
        issues.push({
          type: 'missing_column',
          severity: 'error',
          field,
          message: `Fillable field '${field}' does not exist in database table '${tableName}'`
        });
      }
    }
    
    // Check if cast columns exist
    for (const field of Object.keys(casts)) {
      if (!dbColumns.includes(field)) {
        issues.push({
          type: 'missing_column',
          severity: 'error',
          field,
          message: `Cast field '${field}' does not exist in database table '${tableName}'`
        });
      }
    }
    
    // Check for database columns not in fillable (potential security issue)
    const sensitiveColumns = dbColumns.filter(col => 
      !fillable.includes(col) && 
      !['id', 'created_at', 'updated_at', 'deleted_at'].includes(col)
    );
    
    if (sensitiveColumns.length > 0) {
      issues.push({
        type: 'unguarded_columns',
        severity: 'warning',
        fields: sensitiveColumns,
        message: `Columns exist in database but not in fillable: ${sensitiveColumns.join(', ')}`
      });
    }
    
    return {
      tableName,
      modelPath,
      schema: schema.map(col => ({
        name: col.Field,
        type: col.Type,
        nullable: col.Null === 'YES',
        key: col.Key,
        default: col.Default
      })),
      fillable,
      casts,
      issues,
      isValid: issues.filter(i => i.severity === 'error').length === 0
    };
  } catch (error) {
    return {
      error: error.message,
      isValid: false
    };
  }
}

/**
 * Verify model relations
 */
async function verifyRelations(modelPath, dbConfig = {}) {
  try {
    const connection = await initDatabaseConnection(dbConfig);
    
    if (!existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }
    
    const modelContent = readFileSync(modelPath, 'utf-8');
    
    // Extract table name
    const tableMatch = modelContent.match(/static\s+table\s*=\s*['"]([^'"]+)['"]/);
    if (!tableMatch) {
      throw new Error('Could not find table name in model file');
    }
    const tableName = tableMatch[1];
    
    // Extract relations
    const relationPattern = /(hasOne|hasMany|belongsTo|belongsToMany|hasManyThrough|morphOne|morphMany)\s*\(\s*([^,\)]+)/g;
    const relations = [];
    let match;
    
    while ((match = relationPattern.exec(modelContent)) !== null) {
      relations.push({
        type: match[1],
        relatedModel: match[2].trim()
      });
    }
    
    // Validate table name to prevent SQL injection
    validateName(tableName, 'Table name');
    
    // Get foreign keys from database using parameterized query
    const foreignKeys = await connection.raw(`
      SELECT 
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [tableName]);
    
    const issues = [];
    
    // Verify belongsTo relations have corresponding foreign keys
    const belongsToRelations = relations.filter(r => r.type === 'belongsTo');
    for (const rel of belongsToRelations) {
      const expectedFkColumn = rel.relatedModel.toLowerCase() + '_id';
      const fkExists = foreignKeys.some(fk => fk.COLUMN_NAME === expectedFkColumn);
      
      if (!fkExists) {
        issues.push({
          type: 'missing_foreign_key',
          severity: 'warning',
          relation: rel.type,
          relatedModel: rel.relatedModel,
          expectedColumn: expectedFkColumn,
          message: `belongsTo relation to ${rel.relatedModel} expects foreign key '${expectedFkColumn}' but it was not found`
        });
      }
    }
    
    // Check for orphaned foreign keys
    for (const fk of foreignKeys) {
      const expectedRelation = relations.some(r => 
        r.type === 'belongsTo' && 
        fk.COLUMN_NAME.includes(r.relatedModel.toLowerCase())
      );
      
      if (!expectedRelation) {
        issues.push({
          type: 'orphaned_foreign_key',
          severity: 'info',
          column: fk.COLUMN_NAME,
          referencedTable: fk.REFERENCED_TABLE_NAME,
          message: `Foreign key '${fk.COLUMN_NAME}' references '${fk.REFERENCED_TABLE_NAME}' but no belongsTo relation found`
        });
      }
    }
    
    return {
      tableName,
      modelPath,
      relations,
      foreignKeys: foreignKeys.map(fk => ({
        column: fk.COLUMN_NAME,
        referencedTable: fk.REFERENCED_TABLE_NAME,
        referencedColumn: fk.REFERENCED_COLUMN_NAME
      })),
      issues,
      isValid: issues.filter(i => i.severity === 'error').length === 0
    };
  } catch (error) {
    return {
      error: error.message,
      isValid: false
    };
  }
}

/**
 * Check migration status
 */
async function verifyMigrationStatus(migrationsPath = 'database/migrations', dbConfig = {}) {
  try {
    const connection = await initDatabaseConnection(dbConfig);
    
    const fullPath = join(process.cwd(), migrationsPath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Migrations directory not found: ${fullPath}`);
    }
    
    // Get migration files
    const files = readdirSync(fullPath)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    // Try to get applied migrations from database
    let appliedMigrations = [];
    try {
      const result = await connection.raw('SELECT * FROM migrations ORDER BY batch, migration');
      const data = result[0] || result;
      appliedMigrations = data.map(r => r.migration);
    } catch (error) {
      // Migrations table might not exist yet
      appliedMigrations = [];
    }
    
    const pending = files.filter(f => !appliedMigrations.includes(f));
    const applied = files.filter(f => appliedMigrations.includes(f));
    
    // Check for migrations in DB but not in files (deleted migrations)
    const deleted = appliedMigrations.filter(m => !files.includes(m));
    
    return {
      migrationsPath: fullPath,
      total: files.length,
      applied: applied.length,
      pending: pending.length,
      deleted: deleted.length,
      appliedMigrations: applied,
      pendingMigrations: pending,
      deletedMigrations: deleted,
      issues: deleted.length > 0 ? [{
        type: 'deleted_migrations',
        severity: 'error',
        migrations: deleted,
        message: `${deleted.length} migration(s) were applied but files are now missing`
      }] : [],
      isValid: deleted.length === 0
    };
  } catch (error) {
    return {
      error: error.message,
      isValid: false
    };
  }
}

/**
 * Analyze controller for proper Model usage
 */
function analyzeController(controllerPath, modelName) {
  try {
    if (!existsSync(controllerPath)) {
      throw new Error(`Controller file not found: ${controllerPath}`);
    }
    
    const controllerContent = readFileSync(controllerPath, 'utf-8');
    
    // Check if Model is imported
    const importPattern = new RegExp(`require\\(['"].*${modelName}['"]\\)`, 'i');
    const hasImport = importPattern.test(controllerContent);
    
    // Check for CRUD methods
    const methods = {
      index: /async\s+index\s*\(/.test(controllerContent),
      show: /async\s+show\s*\(/.test(controllerContent),
      store: /async\s+store\s*\(/.test(controllerContent),
      update: /async\s+update\s*\(/.test(controllerContent),
      destroy: /async\s+destroy\s*\(/.test(controllerContent)
    };
    
    // Check for Model usage
    const modelUsagePattern = new RegExp(`${modelName}\\.(find|create|all|where|with)`, 'g');
    const modelUsages = controllerContent.match(modelUsagePattern) || [];
    
    // Check for error handling
    const hasErrorHandling = /try\s*{|catch\s*\(/.test(controllerContent) || 
                            /throw\s+new\s+Error/.test(controllerContent);
    
    // Check for pagination
    const hasPagination = /paginate\(/.test(controllerContent);
    
    // Check for relation loading
    const hasEagerLoading = /\.with\(/.test(controllerContent);
    
    const issues = [];
    
    if (!hasImport) {
      issues.push({
        type: 'missing_import',
        severity: 'error',
        message: `Model '${modelName}' is not imported in controller`
      });
    }
    
    const missingMethods = Object.entries(methods)
      .filter(([_, exists]) => !exists)
      .map(([method]) => method);
    
    if (missingMethods.length > 0) {
      issues.push({
        type: 'missing_methods',
        severity: 'warning',
        methods: missingMethods,
        message: `Controller is missing standard CRUD methods: ${missingMethods.join(', ')}`
      });
    }
    
    if (modelUsages.length === 0 && hasImport) {
      issues.push({
        type: 'unused_model',
        severity: 'warning',
        message: `Model '${modelName}' is imported but never used`
      });
    }
    
    if (!hasErrorHandling) {
      issues.push({
        type: 'no_error_handling',
        severity: 'warning',
        message: 'Controller has no error handling (try/catch or throw)'
      });
    }
    
    return {
      controllerPath,
      modelName,
      hasImport,
      methods,
      modelUsageCount: modelUsages.length,
      hasPagination,
      hasEagerLoading,
      hasErrorHandling,
      issues,
      isValid: issues.filter(i => i.severity === 'error').length === 0
    };
  } catch (error) {
    return {
      error: error.message,
      isValid: false
    };
  }
}

/**
 * Check overall consistency between Model, Controller, Migration, and Database
 */
async function checkConsistency(config = {}) {
  const {
    modelPath,
    controllerPath,
    migrationsPath = 'database/migrations',
    dbConfig = {}
  } = config;
  
  const results = {
    model: null,
    relations: null,
    controller: null,
    migrations: null,
    overallIssues: [],
    isValid: true
  };
  
  try {
    // Verify model schema if modelPath provided
    if (modelPath) {
      results.model = await verifyModelSchema(modelPath, dbConfig);
      results.relations = await verifyRelations(modelPath, dbConfig);
      
      if (!results.model.isValid) results.isValid = false;
      if (!results.relations.isValid) results.isValid = false;
    }
    
    // Verify controller if provided
    if (controllerPath && modelPath) {
      // Extract model name from path
      const modelName = modelPath.split('/').pop().replace('.js', '');
      results.controller = analyzeController(controllerPath, modelName);
      
      if (!results.controller.isValid) results.isValid = false;
    }
    
    // Verify migrations
    results.migrations = await verifyMigrationStatus(migrationsPath, dbConfig);
    if (!results.migrations.isValid) results.isValid = false;
    
    // Cross-check: if model table exists, there should be a create migration
    if (results.model && results.migrations && results.model.tableName) {
      const createMigration = results.migrations.appliedMigrations.find(m => 
        m.includes('create') && m.includes(results.model.tableName)
      );
      
      if (!createMigration && results.migrations.pendingMigrations.find(m => 
        m.includes('create') && m.includes(results.model.tableName)
      )) {
        results.overallIssues.push({
          type: 'pending_table_migration',
          severity: 'warning',
          message: `Table '${results.model.tableName}' migration exists but is not applied`
        });
      }
    }
    
    return results;
  } catch (error) {
    return {
      error: error.message,
      isValid: false
    };
  }
}

/**
 * Query data from a table with filters, sorting, and pagination
 * @param {Object} config - Query configuration
 * @returns {Promise<Object>} Query results with data and metadata
 */
async function queryData(config = {}) {
  try {
    const { table, select, where, orderBy, limit, offset, connectionName, dbConfig } = config;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    // Validate table name to prevent SQL injection
    validateName(table, 'Table name');
    
    // Get database connection
    const connection = await getConnection(connectionName, dbConfig);
    
    // Build query
    let query = `SELECT ${select || '*'} FROM ${table}`;
    const params = [];
    
    // Add WHERE clause
    if (where && Object.keys(where).length > 0) {
      // Validate column names in WHERE clause
      validateColumnNames(Object.keys(where));
      
      const conditions = Object.entries(where).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ORDER BY
    if (orderBy) {
      // Validate ORDER BY columns
      const orderCols = orderBy.split(',').map(s => s.trim().split(' ')[0]);
      validateColumnNames(orderCols);
      query += ` ORDER BY ${orderBy}`;
    }
    
    // Add LIMIT and OFFSET
    if (limit) {
      query += ` LIMIT ${Number.parseInt(limit, 10)}`;
      if (offset) {
        query += ` OFFSET ${Number.parseInt(offset, 10)}`;
      }
    }
    
    const results = await connection.raw(query, params);
    const data = results[0] || results;
    
    return {
      success: true,
      table,
      query,
      count: data.length,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a new record in a table
 * @param {Object} config - Creation configuration
 * @returns {Promise<Object>} Created record with ID
 */
async function createRecord(config = {}) {
  try {
    const { table, data, connectionName, dbConfig } = config;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    // Validate table name to prevent SQL injection
    validateName(table, 'Table name');
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required');
    }
    
    // Get database connection
    const connection = await getConnection(connectionName, dbConfig);
    
    // Validate column names
    validateColumnNames(Object.keys(data));
    
    // Build INSERT query
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = await connection.raw(query, values);
    
    // Get inserted ID
    const insertId = result[0]?.insertId || result[0]?.id || null;
    
    return {
      success: true,
      table,
      insertId,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update records in a table
 * @param {Object} config - Update configuration
 * @returns {Promise<Object>} Number of affected rows
 */
async function updateRecord(config = {}) {
  try {
    const { table, data, where, connectionName, dbConfig } = config;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    // Validate table name to prevent SQL injection
    validateName(table, 'Table name');
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required');
    }
    
    if (!where || Object.keys(where).length === 0) {
      throw new Error('WHERE clause is required for safety (use * to update all)');
    }
    
    // Get database connection
    const connection = await getConnection(connectionName, dbConfig);
    
    // Validate column names
    validateColumnNames(Object.keys(data));
    validateColumnNames(Object.keys(where));
    
    // Build UPDATE query
    const setClauses = Object.keys(data).map(key => `${key} = ?`);
    const setValues = Object.values(data);
    
    const whereConditions = Object.entries(where).map(([key, value]) => `${key} = ?`);
    const whereValues = Object.values(where);
    
    const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereConditions.join(' AND ')}`;
    const params = [...setValues, ...whereValues];
    
    const result = await connection.raw(query, params);
    const affectedRows = result[0]?.affectedRows || result[0]?.rowCount || 0;
    
    return {
      success: true,
      table,
      affectedRows,
      data,
      where
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete records from a table
 * @param {Object} config - Delete configuration
 * @returns {Promise<Object>} Number of deleted rows
 */
async function deleteRecord(config = {}) {
  try {
    const { table, where, connectionName, dbConfig } = config;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    // Validate table name to prevent SQL injection
    validateName(table, 'Table name');
    
    if (!where || Object.keys(where).length === 0) {
      throw new Error('WHERE clause is required for safety');
    }
    
    // Get database connection
    const connection = await getConnection(connectionName, dbConfig);
    
    // Validate column names
    validateColumnNames(Object.keys(where));
    
    // Build DELETE query
    const whereConditions = Object.entries(where).map(([key, value]) => `${key} = ?`);
    const whereValues = Object.values(where);
    
    const query = `DELETE FROM ${table} WHERE ${whereConditions.join(' AND ')}`;
    const result = await connection.raw(query, whereValues);
    const affectedRows = result[0]?.affectedRows || result[0]?.rowCount || 0;
    
    return {
      success: true,
      table,
      deletedRows: affectedRows,
      where
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Execute raw SQL query for complex operations
 * @param {Object} config - Query configuration
 * @returns {Promise<Object>} Query results
 */
async function executeRawSql(config = {}) {
  try {
    const { sql, params, connectionName, dbConfig } = config;
    
    if (!sql) {
      throw new Error('SQL query is required');
    }
    
    // Get database connection
    const connection = await getConnection(connectionName, dbConfig);
    
    const results = await connection.raw(sql, params || []);
    const data = results[0] || results;
    
    return {
      success: true,
      sql,
      count: Array.isArray(data) ? data.length : 1,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get table schema information
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Table schema
 */
async function getTableSchema(config = {}) {
  try {
    const { table, connectionName, dbConfig } = config;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    // Validate table name to prevent SQL injection
    validateName(table, 'Table name');
    
    // Get database connection
    const connection = await getConnection(connectionName, dbConfig);
    
    // Get table schema
    const schemaQuery = `DESCRIBE ${table}`;
    const schemaResults = await connection.raw(schemaQuery);
    const schema = schemaResults[0] || schemaResults;
    
    // Get indexes
    const indexQuery = `SHOW INDEX FROM ${table}`;
    const indexResults = await connection.raw(indexQuery);
    const indexes = indexResults[0] || indexResults;
    
    return {
      success: true,
      table,
      columns: schema.map(col => ({
        name: col.Field,
        type: col.Type,
        nullable: col.Null === 'YES',
        key: col.Key,
        default: col.Default,
        extra: col.Extra
      })),
      indexes: indexes.map(idx => ({
        name: idx.Key_name,
        column: idx.Column_name,
        unique: idx.Non_unique === 0,
        type: idx.Index_type
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Créer le serveur MCP
const server = new Server(
  {
    name: 'outlet-orm-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Liste des outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Génération de code
      {
        name: 'generate_model',
        description: 'Generate a new Model class file with relations, casts, fillable, and other configurations',
        inputSchema: {
          type: 'object',
          properties: {
            modelName: { type: 'string', description: 'Model class name (e.g., "User", "Post")' },
            table: { type: 'string', description: 'Database table name' },
            fillable: { type: 'array', items: { type: 'string' }, description: 'Mass assignable attributes' },
            hidden: { type: 'array', items: { type: 'string' }, description: 'Hidden attributes for serialization' },
            casts: { 
              type: 'object', 
              description: 'Attribute type casts (e.g., {"is_active": "boolean", "metadata": "json"})' 
            },
            timestamps: { type: 'boolean', description: 'Enable created_at/updated_at (default: true)' },
            primaryKey: { type: 'string', description: 'Primary key column name (default: "id")' },
            relations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string', 
                    enum: ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'hasManyThrough', 'morphMany', 'morphOne'],
                    description: 'Relation type'
                  },
                  name: { type: 'string', description: 'Method name for the relation' },
                  model: { type: 'string', description: 'Related model class name' },
                  foreignKey: { type: 'string', description: 'Foreign key column' },
                  localKey: { type: 'string', description: 'Local key column' },
                  pivotTable: { type: 'string', description: 'Pivot table name (for belongsToMany)' },
                  morphType: { type: 'string', description: 'Morph type column (for polymorphic relations)' },
                  morphId: { type: 'string', description: 'Morph ID column (for polymorphic relations)' },
                  through: { type: 'string', description: 'Through model (for hasManyThrough)' },
                },
                required: ['type', 'name', 'model'],
              },
              description: 'Model relations configuration',
            },
            outputPath: { type: 'string', description: 'Output directory (default: "src/models/")' },
          },
          required: ['modelName', 'table'],
        },
      },
      {
        name: 'generate_controller',
        description: 'Generate a new Controller class file with CRUD methods (index, show, store, update, destroy)',
        inputSchema: {
          type: 'object',
          properties: {
            controllerName: { type: 'string', description: 'Controller class name (e.g., "UserController")' },
            modelName: { type: 'string', description: 'Associated Model class name (e.g., "User")' },
            outputPath: { type: 'string', description: 'Output directory (default: "src/controllers/")' },
          },
          required: ['controllerName', 'modelName'],
        },
      },
      {
        name: 'generate_migration',
        description: 'Generate a new migration file with up/down methods for creating, altering, or dropping tables',
        inputSchema: {
          type: 'object',
          properties: {
            migrationName: { 
              type: 'string', 
              description: 'Migration name (e.g., "create_users_table", "add_email_to_users")' 
            },
            table: { type: 'string', description: 'Table name' },
            action: { 
              type: 'string', 
              enum: ['create', 'alter', 'drop'],
              description: 'Migration action: create table, alter table, or drop table'
            },
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Column name' },
                  type: { 
                    type: 'string', 
                    enum: ['id', 'string', 'text', 'integer', 'bigInteger', 'boolean', 'date', 'datetime', 'timestamp', 'decimal', 'float', 'double', 'json', 'enum', 'uuid', 'foreignId'],
                    description: 'Column type'
                  },
                  length: { type: 'number', description: 'Column length (for string types)' },
                  precision: { type: 'number', description: 'Precision (for decimal/float)' },
                  scale: { type: 'number', description: 'Scale (for decimal)' },
                  nullable: { type: 'boolean', description: 'Allow NULL values' },
                  unique: { type: 'boolean', description: 'Unique constraint' },
                  default: { description: 'Default value' },
                  unsigned: { type: 'boolean', description: 'Unsigned (for numeric types)' },
                  autoIncrement: { type: 'boolean', description: 'Auto increment (for integer types)' },
                  comment: { type: 'string', description: 'Column comment' },
                  after: { type: 'string', description: 'Position column after this column' },
                  first: { type: 'boolean', description: 'Position column first' },
                  enumValues: { type: 'array', items: { type: 'string' }, description: 'Enum values (for enum type)' },
                },
                required: ['name', 'type'],
              },
              description: 'Table columns definition',
            },
            indexes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  columns: { type: 'array', items: { type: 'string' }, description: 'Columns for index' },
                  type: { type: 'string', enum: ['index', 'unique'], description: 'Index type' },
                },
                required: ['columns'],
              },
              description: 'Table indexes',
            },
            foreignKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  column: { type: 'string', description: 'Foreign key column' },
                  references: { type: 'string', description: 'Referenced column' },
                  on: { type: 'string', description: 'Referenced table' },
                  onDelete: { 
                    type: 'string', 
                    enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'],
                    description: 'On delete action'
                  },
                  onUpdate: { 
                    type: 'string', 
                    enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'],
                    description: 'On update action'
                  },
                },
                required: ['column', 'references', 'on'],
              },
              description: 'Foreign key constraints',
            },
            timestamps: { type: 'boolean', description: 'Add created_at/updated_at columns (default: true)' },
            softDeletes: { type: 'boolean', description: 'Add deleted_at column for soft deletes' },
            outputPath: { type: 'string', description: 'Output directory (default: "src/database/migrations/")' },
          },
          required: ['migrationName', 'table', 'action'],
        },
      },
      
      // Verification and Analysis tools
      {
        name: 'verify_model_schema',
        description: 'Verify if a Model file configuration matches the actual database table schema. Checks fillable attributes, casts, and database columns.',
        inputSchema: {
          type: 'object',
          properties: {
            modelPath: { type: 'string', description: 'Absolute or relative path to the Model file' },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (driver, host, port, database, user, password)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'], description: 'Database driver' },
                host: { type: 'string', description: 'Database host' },
                port: { type: 'number', description: 'Database port' },
                database: { type: 'string', description: 'Database name' },
                user: { type: 'string', description: 'Database user' },
                password: { type: 'string', description: 'Database password' },
              },
            },
          },
          required: ['modelPath'],
        },
      },
      {
        name: 'verify_relations',
        description: 'Verify if model relations are correctly defined and match foreign keys in the database. Detects missing foreign keys and orphaned relations.',
        inputSchema: {
          type: 'object',
          properties: {
            modelPath: { type: 'string', description: 'Absolute or relative path to the Model file' },
            dbConfig: {
              type: 'object',
              description: 'Database configuration',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['modelPath'],
        },
      },
      {
        name: 'verify_migration_status',
        description: 'Check which migrations have been applied to the database and detect pending or deleted migrations.',
        inputSchema: {
          type: 'object',
          properties: {
            migrationsPath: { type: 'string', description: 'Path to migrations directory (default: "database/migrations")' },
            dbConfig: {
              type: 'object',
              description: 'Database configuration',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      {
        name: 'analyze_controller',
        description: 'Analyze a Controller file to verify proper Model usage, CRUD methods implementation, error handling, and best practices.',
        inputSchema: {
          type: 'object',
          properties: {
            controllerPath: { type: 'string', description: 'Absolute or relative path to the Controller file' },
            modelName: { type: 'string', description: 'Name of the associated Model class' },
          },
          required: ['controllerPath', 'modelName'],
        },
      },
      {
        name: 'check_consistency',
        description: 'Comprehensive consistency check between Model, Controller, Migrations, and Database. Verifies schema alignment, relation integrity, and migration status.',
        inputSchema: {
          type: 'object',
          properties: {
            modelPath: { type: 'string', description: 'Path to the Model file' },
            controllerPath: { type: 'string', description: 'Path to the Controller file' },
            migrationsPath: { type: 'string', description: 'Path to migrations directory (default: "database/migrations")' },
            dbConfig: {
              type: 'object',
              description: 'Database configuration',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      
      // Opérations CRUD pour enrichir le contexte
      {
        name: 'query_data',
        description: 'Query data from a database table with optional filters, sorting, and pagination. Useful for enriching context with actual database content.',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name to query' },
            select: { type: 'string', description: 'Columns to select (default: "*")' },
            where: { 
              type: 'object', 
              description: 'WHERE conditions as key-value pairs (e.g., {"status": "active", "user_id": 5})' 
            },
            orderBy: { type: 'string', description: 'ORDER BY clause (e.g., "created_at DESC")' },
            limit: { type: 'number', description: 'Maximum number of rows to return' },
            offset: { type: 'number', description: 'Number of rows to skip' },
            connectionName: { 
              type: 'string', 
              description: 'Name of the connection to use (uses active connection if not specified)' 
            },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (optional if using env vars)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'create_record',
        description: 'Insert a new record into a database table. Returns the inserted ID.',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            data: { 
              type: 'object', 
              description: 'Data to insert as key-value pairs (e.g., {"name": "John", "email": "john@example.com"})' 
            },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (optional if using env vars)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['table', 'data'],
        },
      },
      {
        name: 'update_record',
        description: 'Update existing records in a database table. Requires WHERE conditions for safety.',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            data: { 
              type: 'object', 
              description: 'Data to update as key-value pairs (e.g., {"status": "active"})' 
            },
            where: { 
              type: 'object', 
              description: 'WHERE conditions (e.g., {"id": 5}). Required for safety.' 
            },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (optional if using env vars)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['table', 'data', 'where'],
        },
      },
      {
        name: 'delete_record',
        description: 'Delete records from a database table. Requires WHERE conditions for safety.',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            where: { 
              type: 'object', 
              description: 'WHERE conditions (e.g., {"id": 5}). Required for safety.' 
            },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (optional if using env vars)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['table', 'where'],
        },
      },
      {
        name: 'execute_raw_sql',
        description: 'Execute a raw SQL query for complex operations. Use with caution.',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'Raw SQL query to execute' },
            params: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Query parameters for prepared statements' 
            },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (optional if using env vars)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'get_table_schema',
        description: 'Get detailed schema information about a table including columns, types, and indexes.',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            dbConfig: {
              type: 'object',
              description: 'Database configuration (optional if using env vars)',
              properties: {
                driver: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
                host: { type: 'string' },
                port: { type: 'number' },
                database: { type: 'string' },
                user: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
          required: ['table'],
        },
      },
      
      // Database Connection Management
      {
        name: 'connect_database',
        description: 'Connect to a database with a custom name. Allows managing multiple database connections simultaneously.',
        inputSchema: {
          type: 'object',
          properties: {
            connectionName: { 
              type: 'string', 
              description: 'Unique name for this connection (e.g., "myapp_db", "analytics_db")' 
            },
            driver: { 
              type: 'string', 
              enum: ['mysql', 'postgres', 'sqlite'],
              description: 'Database driver' 
            },
            host: { type: 'string', description: 'Database host' },
            port: { type: 'number', description: 'Database port' },
            database: { type: 'string', description: 'Database name' },
            user: { type: 'string', description: 'Database user' },
            password: { type: 'string', description: 'Database password' },
            setAsActive: { 
              type: 'boolean', 
              description: 'Set this connection as the active one (default: true if first connection)' 
            },
          },
          required: ['connectionName', 'driver', 'database'],
        },
      },
      {
        name: 'switch_connection',
        description: 'Switch the active database connection to a different one.',
        inputSchema: {
          type: 'object',
          properties: {
            connectionName: { 
              type: 'string', 
              description: 'Name of the connection to make active' 
            },
          },
          required: ['connectionName'],
        },
      },
      {
        name: 'list_connections',
        description: 'List all active database connections with their details.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'disconnect_database',
        description: 'Disconnect from a specific database connection.',
        inputSchema: {
          type: 'object',
          properties: {
            connectionName: { 
              type: 'string', 
              description: 'Name of the connection to disconnect. If not provided, disconnects the active connection.' 
            },
          },
        },
      },
      {
        name: 'disconnect_all',
        description: 'Disconnect from all database connections.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Gestionnaire des appels d'outils
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'generate_model': {
        const outputPath = args.outputPath || 'src/models';
        const filePath = join(process.cwd(), outputPath, `${args.modelName}.js`);
        
        // Check if file already exists
        checkFileExists(filePath);
        
        const fileContent = generateModelFile(args.modelName, {
          table: args.table,
          fillable: args.fillable || [],
          hidden: args.hidden || [],
          casts: args.casts || {},
          timestamps: args.timestamps !== false,
          primaryKey: args.primaryKey || 'id',
          relations: args.relations || [],
        });
        
        if (!existsSync(join(process.cwd(), outputPath))) {
          mkdirSync(join(process.cwd(), outputPath), { recursive: true });
        }
        
        writeFileSync(filePath, fileContent, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Model ${args.modelName} generated successfully`,
              filePath,
            }, null, 2)
          }],
        };
      }

      case 'generate_controller': {
        const outputPath = args.outputPath || 'src/controllers';
        const filePath = join(process.cwd(), outputPath, `${args.controllerName}.js`);
        
        // Check if file already exists
        checkFileExists(filePath);
        
        const fileContent = generateControllerFile(args.controllerName, args.modelName);
        
        if (!existsSync(join(process.cwd(), outputPath))) {
          mkdirSync(join(process.cwd(), outputPath), { recursive: true });
        }
        
        writeFileSync(filePath, fileContent, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Controller ${args.controllerName} generated successfully`,
              filePath,
            }, null, 2)
          }],
        };
      }

      case 'generate_migration': {
        const outputPath = args.outputPath || 'src/database/migrations';
        
        const result = generateMigrationFile(args.migrationName, {
          table: args.table,
          action: args.action,
          columns: args.columns || [],
          indexes: args.indexes || [],
          foreignKeys: args.foreignKeys || [],
          timestamps: args.timestamps !== false,
          softDeletes: args.softDeletes || false,
        });
        
        const { fileName, content: fileContent } = result;
        const filePath = join(process.cwd(), outputPath, fileName);
        
        // Check if file already exists
        checkFileExists(filePath);
        
        if (!existsSync(join(process.cwd(), outputPath))) {
          mkdirSync(join(process.cwd(), outputPath), { recursive: true });
        }
        
        writeFileSync(filePath, fileContent, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Migration ${args.migrationName} generated successfully`,
              filePath,
              fileName,
            }, null, 2)
          }],
        };
      }
      
      case 'verify_model_schema': {
        const modelPath = join(process.cwd(), args.modelPath);
        const result = await verifyModelSchema(modelPath, args.dbConfig || {});
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'verify_relations': {
        const modelPath = join(process.cwd(), args.modelPath);
        const result = await verifyRelations(modelPath, args.dbConfig || {});
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'verify_migration_status': {
        const result = await verifyMigrationStatus(
          args.migrationsPath || 'database/migrations',
          args.dbConfig || {}
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'analyze_controller': {
        const controllerPath = join(process.cwd(), args.controllerPath);
        const result = analyzeController(controllerPath, args.modelName);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'check_consistency': {
        const config = {
          modelPath: args.modelPath ? join(process.cwd(), args.modelPath) : undefined,
          controllerPath: args.controllerPath ? join(process.cwd(), args.controllerPath) : undefined,
          migrationsPath: args.migrationsPath || 'database/migrations',
          dbConfig: args.dbConfig || {}
        };
        
        const result = await checkConsistency(config);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'query_data': {
        const result = await queryData({
          table: args.table,
          select: args.select,
          where: args.where,
          orderBy: args.orderBy,
          limit: args.limit,
          offset: args.offset,
          dbConfig: args.dbConfig
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'create_record': {
        const result = await createRecord({
          table: args.table,
          data: args.data,
          dbConfig: args.dbConfig
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'update_record': {
        const result = await updateRecord({
          table: args.table,
          data: args.data,
          where: args.where,
          dbConfig: args.dbConfig
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'delete_record': {
        const result = await deleteRecord({
          table: args.table,
          where: args.where,
          dbConfig: args.dbConfig
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'execute_raw_sql': {
        const result = await executeRawSql({
          sql: args.sql,
          params: args.params,
          dbConfig: args.dbConfig
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      case 'get_table_schema': {
        const result = await getTableSchema({
          table: args.table,
          dbConfig: args.dbConfig
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
        };
      }
      
      // Database Connection Management
      case 'connect_database': {
        try {
          const config = {
            driver: args.driver,
            host: args.host || 'localhost',
            port: args.port || (args.driver === 'mysql' ? 3306 : args.driver === 'postgres' ? 5432 : 0),
            database: args.database,
            user: args.user,
            password: args.password
          };
          
          await connectionManager.connect(args.connectionName, config);
          
          if (args.setAsActive !== false) {
            connectionManager.setActive(args.connectionName);
          }
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Successfully connected to database '${args.database}' as '${args.connectionName}'`,
                connectionName: args.connectionName,
                database: args.database,
                driver: args.driver,
                isActive: connectionManager.activeConnection === args.connectionName,
                totalConnections: connectionManager.connections.size
              }, null, 2)
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Failed to connect: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      
      case 'switch_connection': {
        try {
          connectionManager.setActive(args.connectionName);
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Switched to connection '${args.connectionName}'`,
                activeConnection: args.connectionName
              }, null, 2)
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      
      case 'list_connections': {
        const connections = connectionManager.listConnections();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              activeConnection: connectionManager.activeConnection,
              totalConnections: connections.length,
              connections: connections
            }, null, 2)
          }],
        };
      }
      
      case 'disconnect_database': {
        try {
          const connectionName = args.connectionName || connectionManager.activeConnection;
          if (!connectionName) {
            throw new Error('No connection to disconnect');
          }
          
          await connectionManager.disconnect(connectionName);
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Disconnected from '${connectionName}'`,
                remainingConnections: connectionManager.connections.size,
                activeConnection: connectionManager.activeConnection
              }, null, 2)
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      
      case 'disconnect_all': {
        try {
          await connectionManager.disconnectAll();
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'All database connections have been closed'
              }, null, 2)
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }],
            isError: true
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error.message, stack: error.stack }, null, 2) }],
      isError: true,
    };
  }
});

// Démarrer le serveur
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Outlet ORM MCP Server running on stdio');
