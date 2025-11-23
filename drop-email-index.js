// Drop email index from veterinarians collection
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function dropIndex() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('veterinarians');
    
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Successfully dropped email_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️ Index email_1 does not exist');
      } else {
        console.error('Error dropping index:', err.message);
      }
    }
    
    // List remaining indexes
    const indexes = await collection.indexes();
    console.log('\nRemaining indexes:');
    indexes.forEach(idx => console.log('  -', idx.name, JSON.stringify(idx.key)));
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

dropIndex();
