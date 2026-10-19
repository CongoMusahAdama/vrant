const MNOTIFY_QUICK_SMS_URL = 'https://api.mnotify.com/api/sms/quick';

function isMnotifyConfigured() {
  return Boolean(process.env.MNOTIFY_API_KEY && process.env.MNOTIFY_SENDER_ID);
}

function senderId() {
  return String(process.env.MNOTIFY_SENDER_ID || 'VRANT').trim();
}

async function mnotifyRequest(body) {
  if (!isMnotifyConfigured()) {
    const err = new Error('Mnotify is not configured');
    err.code = 'MNOTIFY_NOT_CONFIGURED';
    throw err;
  }

  const url = `${MNOTIFY_QUICK_SMS_URL}?key=${encodeURIComponent(process.env.MNOTIFY_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== 'success') {
    const message = data.message || data.error || `Mnotify request failed (${res.status})`;
    const err = new Error(message);
    err.code = 'MNOTIFY_API_ERROR';
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Send a transactional SMS via Mnotify.
 * @param {{ recipient: string | string[], content: string }} params
 */
async function sendTransactionalSms({ recipient, content }) {
  if (!recipient) return { skipped: true, reason: 'no_phone' };
  if (!content?.trim()) return { skipped: true, reason: 'no_content' };

  const recipients = Array.isArray(recipient) ? recipient : [recipient];
  const filtered = recipients.filter(Boolean);
  if (!filtered.length) return { skipped: true, reason: 'no_phone' };

  return mnotifyRequest({
    recipient: filtered,
    sender: senderId(),
    message: content.trim(),
    is_schedule: false,
    schedule_date: null,
  });
}

module.exports = {
  isMnotifyConfigured,
  sendTransactionalSms,
};
