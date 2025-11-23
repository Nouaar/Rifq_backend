// Quick fix for veterinarians email index
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function fixIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('veterinarians');
    
    // Drop the email index
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️ Index already removed');
      } else {
        console.error('Error:', err.message);
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIndex();
