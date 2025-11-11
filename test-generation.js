#!/usr/bin/env node

/**
 * Script de test pour vérifier la génération de code
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Générer un fichier Model (copie de la fonction du serveur MCP)
 */
function generateModelFile(modelName, config = {}) {
  const {
    table = modelName.toLowerCase() + 's',
    fillable = [],
    hidden = [],
    casts = {},
    timestamps = true,
    primaryKey = 'id',
    relations = []
  } = config;

  const className = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  let content = `const { Model } = require('outlet-orm');\n\n`;
  
  // Imports pour les relations
  const relatedModels = new Set();
  relations.forEach(rel => {
    if (rel.model) {
      relatedModels.add(rel.model);
    }
  });
  
  relatedModels.forEach(model => {
    content += `const ${model} = require('./${model}');\n`;
  });
  
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
  relations.forEach(rel => {
    content += `  // ${rel.type} relation\n`;
    content += `  ${rel.name}() {\n`;
    
    switch (rel.type) {
      case 'hasOne':
        content += `    return this.hasOne(${rel.model}, '${rel.foreignKey || table.slice(0, -1) + '_id'}');\n`;
        break;
      case 'hasMany':
        content += `    return this.hasMany(${rel.model}, '${rel.foreignKey || table.slice(0, -1) + '_id'}');\n`;
        break;
      case 'belongsTo':
        content += `    return this.belongsTo(${rel.model}, '${rel.foreignKey || rel.model.toLowerCase() + '_id'}');\n`;
        break;
      case 'belongsToMany':
        const relatedKey = rel.localKey || rel.model.toLowerCase() + '_id';
        content += `    return this.belongsToMany(\n`;
        content += `      ${rel.model},\n`;
        content += `      '${rel.pivotTable}',\n`;
        content += `      '${rel.foreignKey || table.slice(0, -1) + '_id'}',\n`;
        content += `      '${relatedKey}'\n`;
        content += `    );\n`;
        break;
      case 'hasManyThrough':
        content += `    return this.hasManyThrough(\n`;
        content += `      ${rel.model},\n`;
        content += `      ${rel.through},\n`;
        content += `      '${rel.foreignKey || table.slice(0, -1) + '_id'}',\n`;
        content += `      '${rel.localKey || rel.through.toLowerCase() + '_id'}'\n`;
        content += `    );\n`;
        break;
      case 'morphOne':
      case 'morphMany':
        const morphName = rel.morphType ? rel.morphType.replace('_type', '') : 'morphable';
        content += `    return this.${rel.type}(${rel.model}, '${morphName}');\n`;
        break;
    }
    
    content += `  }\n\n`;
  });
  
  content += `}\n\nmodule.exports = ${className};\n`;
  
  return content;
}

// Test 1: Model User avec relations hasMany et belongsTo
console.log('=== Test 1: User Model avec relations ===\n');

const userModel = generateModelFile('User', {
  table: 'users',
  fillable: ['name', 'email', 'password'],
  hidden: ['password'],
  casts: {
    email_verified_at: 'datetime',
    is_active: 'boolean'
  },
  timestamps: true,
  primaryKey: 'id',
  relations: [
    {
      type: 'hasMany',
      name: 'posts',
      model: 'Post',
      foreignKey: 'user_id'
    },
    {
      type: 'hasOne',
      name: 'profile',
      model: 'Profile',
      foreignKey: 'user_id'
    },
    {
      type: 'belongsToMany',
      name: 'roles',
      model: 'Role',
      pivotTable: 'role_user',
      foreignKey: 'user_id',
      localKey: 'role_id'
    }
  ]
});

console.log(userModel);

// Test 2: Model Post avec belongsTo et morphMany
console.log('\n=== Test 2: Post Model avec belongsTo et morphMany ===\n');

const postModel = generateModelFile('Post', {
  table: 'posts',
  fillable: ['title', 'content', 'user_id', 'published_at'],
  casts: {
    published_at: 'datetime',
    is_published: 'boolean'
  },
  relations: [
    {
      type: 'belongsTo',
      name: 'author',
      model: 'User',
      foreignKey: 'user_id'
    },
    {
      type: 'morphMany',
      name: 'comments',
      model: 'Comment',
      morphType: 'commentable_type'
    },
    {
      type: 'hasMany',
      name: 'tags',
      model: 'Tag',
      foreignKey: 'post_id'
    }
  ]
});

console.log(postModel);

// Test 3: Model avec hasManyThrough
console.log('\n=== Test 3: Country Model avec hasManyThrough ===\n');

const countryModel = generateModelFile('Country', {
  table: 'countries',
  fillable: ['name', 'code'],
  relations: [
    {
      type: 'hasMany',
      name: 'users',
      model: 'User',
      foreignKey: 'country_id'
    },
    {
      type: 'hasManyThrough',
      name: 'posts',
      model: 'Post',
      through: 'User',
      foreignKey: 'country_id',
      localKey: 'user_id'
    }
  ]
});

console.log(countryModel);

console.log('\n✅ Tous les tests sont terminés !');
console.log('\nVérifiez que :');
console.log('1. Les imports des modèles liés sont présents');
console.log('2. Les méthodes de relation sont générées avec les bons noms');
console.log('3. Les foreignKey sont correctement configurées');
console.log('4. Les relations belongsToMany ont les pivotTable');
console.log('5. Les relations polymorphiques utilisent les bons noms de morph');
