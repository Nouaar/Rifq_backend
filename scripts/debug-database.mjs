// Debug script to check database state
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rifq';

async function debugDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log(`Database: ${client.db().databaseName}\n`);
    
    const db = client.db();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  - ${coll.name}: ${count} documents`);
    }
    
    // Check veterinarians specifically
    console.log('\n--- Veterinarians Collection ---');
    const vetsCollection = db.collection('veterinarians');
    const vets = await vetsCollection.find({}).toArray();
    console.log(`Total: ${vets.length}`);
    
    if (vets.length > 0) {
      console.log('\nSample veterinarian records:');
      for (const vet of vets.slice(0, 3)) {
        console.log(`  ID: ${vet._id}, User ID: ${vet.user}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugDatabase();
