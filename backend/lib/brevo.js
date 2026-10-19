const BREVO_API = 'https://api.brevo.com/v3';

function isBrevoConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

function brevoHeaders() {
  return {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function sender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || 'VRANT',
  };
}

async function brevoRequest(path, options = {}) {
  if (!isBrevoConfigured()) {
    const err = new Error('Brevo is not configured');
    err.code = 'BREVO_NOT_CONFIGURED';
    throw err;
  }

  const res = await fetch(`${BREVO_API}${path}`, {
    method: options.method || 'GET',
    headers: brevoHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || data.error || `Brevo request failed (${res.status})`;
    const err = new Error(message);
    err.code = 'BREVO_API_ERROR';
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function sendTransactionalEmail({ to, subject, htmlContent, textContent }) {
  if (!to?.email) return { skipped: true, reason: 'no_recipient' };

  return brevoRequest('/smtp/email', {
    method: 'POST',
    body: {
      sender: sender(),
      to: [{ email: to.email, name: to.name || to.email }],
      subject,
      htmlContent,
      textContent: textContent || undefined,
    },
  });
}

module.exports = {
  isBrevoConfigured,
  sendTransactionalEmail,
};
