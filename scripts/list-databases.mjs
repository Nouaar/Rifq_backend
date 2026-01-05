// List all databases in MongoDB
import { MongoClient } from 'mongodb';

async function listDatabases() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('Available databases:');
    for (const db of databases) {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // List collections in each database
      const database = client.db(db.name);
      const collections = await database.listCollections().toArray();
      if (collections.length > 0) {
        console.log(`    Collections:`);
        for (const coll of collections) {
          const count = await database.collection(coll.name).countDocuments();
          console.log(`      - ${coll.name}: ${count} documents`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

listDatabases();
