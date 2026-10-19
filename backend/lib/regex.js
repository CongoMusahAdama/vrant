/** Escape user input for safe use in MongoDB $regex */
function escapeRegex(term) {
  if (!term || typeof term !== 'string') return '';
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
