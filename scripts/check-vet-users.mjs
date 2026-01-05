// Check if veterinarian user IDs exist in users collection
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb+srv://rifq_user:aazzeerr12@rifq.srwricr.mongodb.net/?appName=Rifq';

async function checkVetUsers() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('test');
    
    const vets = await db.collection('veterinarians').find({}).toArray();
    console.log(`Found ${vets.length} veterinarian records\n`);
    
    for (const vet of vets) {
      console.log(`Vet ID: ${vet._id}`);
      console.log(`  User ID: ${vet.user}`);
      
      // Try to find the user
      const userId = typeof vet.user === 'string' ? new ObjectId(vet.user) : vet.user;
      const user = await db.collection('users').findOne({ _id: userId });
      
      if (user) {
        console.log(`  ✅ User found: ${user.name} (${user.email})`);
      } else {
        console.log(`  ❌ User NOT found`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkVetUsers();
