// Drop email index from veterinarians collection
// Run: node scripts/drop-email-index.mjs

import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables manually (no dotenv dependency)
function loadEnv() {
  try {
    const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    });
  } catch (err) {
    // .env file not found, use defaults
  }
}

loadEnv();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function dropIndex() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Extract database name from URI
    const dbName = new URL(MONGO_URI).pathname.slice(1) || 'test';
    const db = client.db(dbName);
    const collection = db.collection('veterinarians');
    
    console.log(`📊 Database: ${dbName}`);
    console.log(`📦 Collection: veterinarians`);
    
    // List current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Drop the email index
    console.log('\n🗑️  Attempting to drop email_1 index...');
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Successfully dropped email_1 index');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index email_1 does not exist (already removed)');
      } else {
        console.error('❌ Error dropping index:', err.message);
        throw err;
      }
    }
    
    // List indexes after
    console.log('\n📋 Indexes after fix:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Also check for any documents with null email (shouldn't exist, but let's see)
    const nullEmailCount = await collection.countDocuments({ email: null });
    if (nullEmailCount > 0) {
      console.log(`\n⚠️  Found ${nullEmailCount} documents with null email`);
      console.log('   These should not exist. Consider cleaning them up.');
    }
    
    console.log('\n✅ Index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('authentication')) {
      console.error('   Make sure your MONGO_URI includes credentials if needed');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

dropIndex();

