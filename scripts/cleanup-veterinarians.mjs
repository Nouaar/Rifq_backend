// Cleanup veterinarians collection - remove documents with null email
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function cleanup() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const dbName = new URL(MONGO_URI).pathname.slice(1) || 'test';
    const db = client.db(dbName);
    const collection = db.collection('veterinarians');
    
    // Find documents with null email
    const nullEmailDocs = await collection.find({ email: { $exists: true, $eq: null } }).toArray();
    
    if (nullEmailDocs.length > 0) {
      console.log(`\n📋 Found ${nullEmailDocs.length} documents with null email:`);
      nullEmailDocs.forEach(doc => {
        console.log(`  - _id: ${doc._id}, user: ${doc.user}`);
      });
      
      // Remove email field from these documents (since it shouldn't exist)
      const result = await collection.updateMany(
        { email: { $exists: true, $eq: null } },
        { $unset: { email: "" } }
      );
      
      console.log(`\n✅ Removed email field from ${result.modifiedCount} documents`);
    } else {
      console.log('\n✅ No documents with null email found');
    }
    
    // Verify cleanup
    const remaining = await collection.countDocuments({ email: { $exists: true, $eq: null } });
    console.log(`\n📊 Remaining documents with null email: ${remaining}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

cleanup();

