const mongoose = require('mongoose');
const { logUtil } = require('../config/logger');

async function optimizeIndexes() {
  try {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      const currentIndexes = await collection.indexes();
      const stats = await collection.stats();
      
      logUtil.info(`Analyzing indexes for collection: ${collection.collectionName}`);
      
      for (const index of currentIndexes) {
        const indexStats = await collection.aggregate([
          { $indexStats: {} },
          { $match: { name: index.name } }
        ]).toArray();

        if (indexStats.length > 0 && indexStats[0].accesses.ops === 0) {
          logUtil.warn(`Unused index found: ${index.name} on collection ${collection.collectionName}`);
        }
      }

      const totalIndexSize = stats.indexSize;
      const dataSize = stats.size;
      const indexRatio = totalIndexSize / dataSize;

      if (indexRatio > 0.5) {
        logUtil.warn(`High index to data ratio (${indexRatio.toFixed(2)}) in collection ${collection.collectionName}`);
      }

      const indexKeys = currentIndexes.map(index => 
        JSON.stringify(Object.entries(index.key).sort())
      );
      const duplicates = indexKeys.filter((item, index) => 
        indexKeys.indexOf(item) !== index
      );

      if (duplicates.length > 0) {
        logUtil.warn(`Found duplicate indexes in collection ${collection.collectionName}`);
      }
    }

    logUtil.info('Index optimization analysis completed');
  } catch (error) {
    logUtil.error('Error during index optimization:', error);
  }
}

module.exports = { optimizeIndexes };