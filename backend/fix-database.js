const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://zaynbu269_db_user:1999@cluster0.rdbierg.mongodb.net/collabWorkspace?retryWrites=true&w=majority';

async function fixDatabase() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db;
    
    // Drop users collection to clear corrupt indexes
    console.log('\n📦 Dropping users collection...');
    try {
      await db.collection('users').drop();
      console.log('✅ Users collection dropped');
    } catch (e) {
      console.log('⚠️ Users collection does not exist:', e.message);
    }

    // Drop all other collections to start fresh
    const collections = ['workspaces', 'notes', 'tasks', 'documents', 'messages', 'activities'];
    for (const col of collections) {
      try {
        await db.collection(col).drop();
        console.log(`✅ ${col} collection dropped`);
      } catch (e) {
        if (!e.message.includes('not found')) {
          console.log(`⚠️ Error dropping ${col}:`, e.message);
        }
      }
    }

    console.log('\n✅ Database cleaned successfully');
    console.log('📝 Indexes will be recreated automatically when models are loaded');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDatabase();
