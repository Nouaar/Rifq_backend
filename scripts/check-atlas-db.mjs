// Check MongoDB Atlas database
import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb+srv://rifq_user:aazzeerr12@rifq.srwricr.mongodb.net/?appName=Rifq';

async function checkAtlasDatabase() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // List all databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('Available databases:');
    for (const db of databases) {
      console.log(`  - ${db.name}`);
    }
    
    // Check the default database (the one without explicit name)
    const db = client.db();
    console.log(`\nUsing database: ${db.databaseName}\n`);
    
    const collections = await db.listCollections().toArray();
    console.log('Collections:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  - ${coll.name}: ${count} documents`);
    }
    
    // Specifically check veterinarians
    console.log('\n--- Veterinarians ---');
    const vets = await db.collection('veterinarians').find({}).limit(3).toArray();
    console.log(`Total: ${await db.collection('veterinarians').countDocuments()}`);
    if (vets.length > 0) {
      console.log('Sample records:');
      for (const vet of vets) {
        console.log(`  - ID: ${vet._id}, User: ${vet.user}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkAtlasDatabase();
