function validateShippingAddress(addr) {
  if (!addr?.fullName?.trim() || !addr?.phone?.trim()) {
    return 'Name and phone are required';
  }
  if (!addr?.country?.trim()) {
    return 'Country is required';
  }
  if (!addr?.city?.trim() || !addr?.region?.trim()) {
    return 'City and region are required';
  }

  const method = addr.deliveryMethod || 'delivery';
  if (method === 'pickup') {
    const station = (addr.pickupStation || addr.street || '').trim();
    if (!station) {
      return 'Pickup station or location is required';
    }
    return null;
  }

  if (!addr.street?.trim()) {
    return 'Street / area is required for home delivery';
  }
  return null;
}

module.exports = { validateShippingAddress };
