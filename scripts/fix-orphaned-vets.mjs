// Script to fix orphaned veterinarian records
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rifq';

async function fixOrphanedVets() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const vetsCollection = db.collection('veterinarians');
    const usersCollection = db.collection('users');
    
    // Find all veterinarian records
    const allVets = await vetsCollection.find({}).toArray();
    console.log(`Found ${allVets.length} veterinarian records`);
    
    let orphanedCount = 0;
    
    for (const vet of allVets) {
      // Check if the user exists
      const user = await usersCollection.findOne({ _id: vet.user });
      
      if (!user) {
        console.log(`Orphaned vet record found: ${vet._id}`);
        // Delete the orphaned record
        await vetsCollection.deleteOne({ _id: vet._id });
        orphanedCount++;
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`Removed ${orphanedCount} orphaned veterinarian record(s)`);
    console.log(`Remaining veterinarians: ${allVets.length - orphanedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixOrphanedVets();
