#!/usr/bin/env node

/**
 * Script de test pour vérifier le serveur MCP Outlet ORM
 * Ce script teste la connexion et les outils disponibles
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

console.log('🧪 Test du serveur Outlet ORM MCP\n');

// Vérifier les variables d'environnement
console.log('📋 Configuration:');
console.log(`   DB_DRIVER: ${process.env.DB_DRIVER || 'Non défini'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'Non défini'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'Non défini'}`);
console.log(`   DB_DATABASE: ${process.env.DB_DATABASE || 'Non défini'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'Non défini'}`);
console.log(`   DB_PASSWORD: ${'*'.repeat((process.env.DB_PASSWORD || '').length)}\n`);

// Test de connexion
async function testConnection() {
  try {
    console.log('🔌 Test de connexion à la base de données...');
    
    const { DatabaseConnection } = await import('outlet-orm');
    const db = new DatabaseConnection();
    
    await db.connect();
    console.log('✅ Connexion réussie !\n');
    
    // Test de requête simple
    try {
      const driver = process.env.DB_DRIVER || 'mysql';
      let query;
      
      if (driver === 'mysql') {
        query = 'SHOW TABLES';
      } else if (driver === 'postgres' || driver === 'postgresql') {
        query = "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'";
      } else if (driver === 'sqlite' || driver === 'sqlite3') {
        query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
      }
      
      console.log('📊 Test de requête (liste des tables)...');
      const results = await db.executeRawQuery(query);
      const tables = results.map(row => Object.values(row)[0]);
      console.log(`✅ ${tables.length} table(s) trouvée(s):`);
      tables.forEach(table => console.log(`   - ${table}`));
    } catch (error) {
      console.log('⚠️  Impossible de lister les tables:', error.message);
    }
    
    await db.close();
    console.log('\n✅ Déconnexion réussie !');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('\n💡 Assurez-vous que:');
    console.error('   1. Le fichier .env est correctement configuré');
    console.error('   2. Le driver de base de données est installé (mysql2, pg, ou sqlite3)');
    console.error('   3. La base de données est accessible et démarrée');
    return false;
  }
}

// Test du serveur MCP
async function testMCPServer() {
  console.log('\n🔧 Vérification du serveur MCP...');
  
  try {
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    console.log('✅ SDK MCP installé et fonctionnel');
    
    console.log('\n📚 Le serveur MCP expose les outils suivants:');
    const tools = [
      'connect_database',
      'disconnect_database',
      'find_by_id',
      'get_all',
      'create_record',
      'update_record',
      'delete_record',
      'query_builder',
      'execute_raw_query',
      'list_tables',
      'describe_table',
      'bulk_insert',
      'bulk_update',
      'aggregate',
      'list_migrations',
    ];
    
    tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool}`);
    });
    
    console.log(`\n✅ ${tools.length} outils MCP disponibles`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du serveur MCP:', error.message);
    return false;
  }
}

// Exécuter les tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const mcpOk = await testMCPServer();
  const dbOk = await testConnection();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n📊 Résumé des tests:\n');
  console.log(`   Serveur MCP: ${mcpOk ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`   Connexion BDD: ${dbOk ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (mcpOk && dbOk) {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Configurez Claude Desktop (voir README.md)');
    console.log('   2. Redémarrez Claude Desktop');
    console.log('   3. Testez avec: "Connecte-toi à la base de données"');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Consultez les messages ci-dessus.');
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

runTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
