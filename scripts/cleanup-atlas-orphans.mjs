// Clean up orphaned veterinarian records from MongoDB Atlas
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb+srv://rifq_user:aazzeerr12@rifq.srwricr.mongodb.net/?appName=Rifq';

async function cleanupOrphanedVets() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('test');
    
    const vets = await db.collection('veterinarians').find({}).toArray();
    console.log(`Found ${vets.length} veterinarian records\n`);
    
    let deletedCount = 0;
    
    for (const vet of vets) {
      const userId = typeof vet.user === 'string' ? new ObjectId(vet.user) : vet.user;
      const user = await db.collection('users').findOne({ _id: userId });
      
      if (!user) {
        console.log(`❌ Deleting orphaned vet: ${vet._id} (user ${vet.user} not found)`);
        await db.collection('veterinarians').deleteOne({ _id: vet._id });
        deletedCount++;
      } else {
        console.log(`✅ Keeping vet: ${vet._id} (user: ${user.name})`);
      }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Cleanup complete!`);
    console.log(`Deleted: ${deletedCount} orphaned record(s)`);
    console.log(`Remaining: ${vets.length - deletedCount} valid veterinarian(s)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

cleanupOrphanedVets();
