// Script to fix orphaned veterinarian and pet-sitter records
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rifq';

async function fixOrphanedRecords() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    const vetsCollection = db.collection('veterinarians');
    const sittersCollection = db.collection('petsitters');
    const usersCollection = db.collection('users');
    
    // Fix veterinarians
    console.log('Checking veterinarians...');
    const allVets = await vetsCollection.find({}).toArray();
    console.log(`Found ${allVets.length} veterinarian records`);
    
    let orphanedVetsCount = 0;
    for (const vet of allVets) {
      const user = await usersCollection.findOne({ _id: vet.user });
      if (!user) {
        console.log(`  ❌ Orphaned vet record: ${vet._id}`);
        await vetsCollection.deleteOne({ _id: vet._id });
        orphanedVetsCount++;
      }
    }
    
    // Fix pet-sitters
    console.log('\nChecking pet-sitters...');
    const allSitters = await sittersCollection.find({}).toArray();
    console.log(`Found ${allSitters.length} pet-sitter records`);
    
    let orphanedSittersCount = 0;
    for (const sitter of allSitters) {
      const user = await usersCollection.findOne({ _id: sitter.user });
      if (!user) {
        console.log(`  ❌ Orphaned sitter record: ${sitter._id}`);
        await sittersCollection.deleteOne({ _id: sitter._id });
        orphanedSittersCount++;
      }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log('✅ Cleanup complete!');
    console.log(`${'='.repeat(50)}`);
    console.log(`Veterinarians:`);
    console.log(`  - Removed: ${orphanedVetsCount}`);
    console.log(`  - Remaining: ${allVets.length - orphanedVetsCount}`);
    console.log(`\nPet Sitters:`);
    console.log(`  - Removed: ${orphanedSittersCount}`);
    console.log(`  - Remaining: ${allSitters.length - orphanedSittersCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixOrphanedRecords();
