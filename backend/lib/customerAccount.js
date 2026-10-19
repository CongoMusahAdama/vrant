const crypto = require('crypto');

/** Anonymize a customer account — orders are kept for shop records. */
async function anonymizeCustomerUser(user) {
  const deletedId = user._id.toString();
  user.name = 'Deleted User';
  user.email = `deleted_${deletedId}@deleted.vrant.local`;
  user.phone = undefined;
  user.addresses = [];
  user.wishlist = [];
  user.avatar = '';
  user.isActive = false;
  user.phoneVerified = false;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.password = crypto.randomBytes(32).toString('hex');
  await user.save();
  return user;
}

function isDeletedCustomerEmail(email) {
  return /@deleted.vrant.local$/i.test(String(email || ''));
}

module.exports = { anonymizeCustomerUser, isDeletedCustomerEmail };
