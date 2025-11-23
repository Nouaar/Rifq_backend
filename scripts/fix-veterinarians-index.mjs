// Script to fix veterinarians collection index issue (ESM version)
// Run this with: node scripts/fix-veterinarians-index.mjs

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rifq';

async function fixIndexes() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('veterinarians');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop the email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ email_1 index does not exist (already removed)');
      } else {
        console.error('Error dropping email_1 index:', error.message);
      }
    }
    
    // Also try dropping any email index variations
    try {
      await collection.dropIndex('email_1_1');
      console.log('✅ Dropped email_1_1 index');
    } catch (error) {
      // Ignore if doesn't exist
    }
    
    // Verify indexes after
    const indexesAfter = await collection.indexes();
    console.log('Indexes after fix:', indexesAfter);
    
    console.log('✅ Index fix completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixIndexes();

