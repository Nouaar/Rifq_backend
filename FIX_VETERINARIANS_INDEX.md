# Fix Veterinarians Collection Index Error

## Problem
The `veterinarians` collection has a unique index on the `email` field, but the schema doesn't include an `email` field. This causes a duplicate key error when trying to insert veterinarian records.

## Error
```
E11000 duplicate key error collection: test.veterinarians index: email_1 dup key: { email: null }
```

## Solution

### Option 1: Using MongoDB Shell (Recommended)

1. Connect to your MongoDB database:
```bash
mongosh "mongodb://localhost:27017/test"
# Or your actual connection string
```

2. Drop the problematic index:
```javascript
db.veterinarians.dropIndex("email_1")
```

3. Verify the index is removed:
```javascript
db.veterinarians.getIndexes()
```

### Option 2: Using Node.js Script

1. Run the fix script:
```bash
cd /Users/mac/Documents/DAM/rifq_backend
node fix-index.js
```

Or if you have the MongoDB URI in your environment:
```bash
MONGO_URI="your_mongodb_uri" node fix-index.js
```

### Option 3: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `veterinarians` collection
4. Go to the "Indexes" tab
5. Find the `email_1` index
6. Click the delete button (trash icon)

## Verification

After removing the index, verify it's gone:
```javascript
db.veterinarians.getIndexes()
```

You should only see:
- `_id_` (default)
- `user_1` (unique index on user field)

## Prevention

The schema has been updated to explicitly create only the `user` unique index. The old `email` index was likely from an older version of the schema.

## After Fix

Once the index is removed, the subscription flow should work correctly:
1. User clicks "Subscribe per month"
2. Subscription is created
3. User converts to vet/sitter (no duplicate key error)

