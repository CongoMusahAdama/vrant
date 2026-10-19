/**
 * Normalize phone numbers for SMS (digits only, no +).
 * Supports international numbers and local Ghana format (0XXXXXXXXX → 233XXXXXXXXX).
 */
function normalizePhoneForSms(phone, defaultCountryCode = '233') {
  if (!phone || typeof phone !== 'string') return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Local Ghana mobile: 0XXXXXXXXX (9 digits after 0)
  if (digits.startsWith('0') && digits.length >= 10 && digits.length <= 11) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }

  // Minimum viable international length (country code + subscriber)
  if (digits.length < 10 || digits.length > 15) return null;

  return digits;
}

function isValidPhoneInput(phone) {
  if (!phone || typeof phone !== 'string') return true;
  const trimmed = phone.trim();
  if (!trimmed) return true;
  if (!/^\+?[\d\s-()]{7,20}$/.test(trimmed)) return false;
  return normalizePhoneForSms(trimmed) !== null;
}

/** Ghana local format for SMS/MoMo (0XXXXXXXXX). */
function formatPhoneForMnotify(phone, defaultCountryCode = '233') {
  const normalized = normalizePhoneForSms(phone, defaultCountryCode);
  if (!normalized) return null;

  if (normalized.startsWith(defaultCountryCode)) {
    return `0${normalized.slice(defaultCountryCode.length)}`;
  }

  return normalized;
}

const formatPhoneForPaystack = formatPhoneForMnotify;

/** Paystack Ghana MoMo provider codes: mtn | vod | atl */
function detectGhanaMoMoProvider(phone) {
  const local = formatPhoneForPaystack(phone);
  if (!local || local.length < 10) return null;

  const prefix = local.slice(0, 3);
  if (['024', '054', '055', '059', '025'].includes(prefix)) return 'mtn';
  if (['020', '050'].includes(prefix)) return 'vod';
  if (['026', '027', '056', '057'].includes(prefix)) return 'atl';
  return null;
}

function moMoProviderLabel(code) {
  if (code === 'mtn') return 'MTN';
  if (code === 'vod') return 'Telecel';
  if (code === 'atl') return 'AT Money';
  return code || '';
}

module.exports = {
  normalizePhoneForSms,
  formatPhoneForMnotify,
  formatPhoneForPaystack,
  detectGhanaMoMoProvider,
  moMoProviderLabel,
  isValidPhoneInput,
};
