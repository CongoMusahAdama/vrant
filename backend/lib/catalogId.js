const { CATALOG_ID_BASE, CATALOG_ID_MOD } = require('./constants');

function catalogIdFromMongoId(mongoId) {
  const id = String(mongoId);
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CATALOG_ID_BASE + (hash % CATALOG_ID_MOD);
}

module.exports = { catalogIdFromMongoId };
