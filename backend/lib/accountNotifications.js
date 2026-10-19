const { isMnotifyConfigured, sendTransactionalSms } = require('./mnotify');
const { formatPhoneForMnotify } = require('./phone');
const { publicSiteUrl } = require('./publicSiteUrl');
const { isBrevoConfigured, sendTransactionalEmail } = require('./brevo');
const { vrantEmailLayout } = require('./emailTemplate');

async function safeSend(label, fn) {
  try {
    await fn();
  } catch (err) {
    if (err.code === 'MNOTIFY_NOT_CONFIGURED') {
      console.warn(`[notify] ${label} skipped — Mnotify not configured`);
      return;
    }
    console.error(`[notify] ${label} failed:`, err.message);
  }
}

/** SMS when a customer registers successfully */
async function notifyWelcomeSms(user) {
  if (!isMnotifyConfigured()) return;

  await safeSend('welcome sms', async () => {
    const phone = formatPhoneForMnotify(user.phone);
    if (!phone) return;

    const name = user.name || 'there';
    const shopUrl = publicSiteUrl();
    const sms = `VRANT: Welcome ${name}! Your account is ready. Shop at ${shopUrl}`;

    await sendTransactionalSms({ recipient: phone, content: sms.slice(0, 480) });
  });
}

function queueWelcomeSms(user) {
  setImmediate(() => notifyWelcomeSms(user));
}

/**
 * Email a password reset link. Returns false when Brevo isn't configured,
 * so the route can still answer generically without revealing whether the email exists.
 */
async function sendPasswordResetEmail(user, resetUrl) {
  if (!isBrevoConfigured()) {
    console.warn('[notify] password reset email skipped — Brevo not configured');
    return false;
  }

  const name = user.name || 'there';
  const html = vrantEmailLayout({
    title: 'Reset your password',
    preheader: 'Use this link within 30 minutes to choose a new password.',
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
        We received a request to reset the password for your VRANT account.
        This link works for 30 minutes.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#7F011F;color:#fff;text-decoration:none;
          padding:12px 22px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
          Choose a new password
        </a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#666;">
        If you didn't ask for this, you can ignore this email — your password won't change.
      </p>`,
  });

  try {
    await sendTransactionalEmail({
      to: { email: user.email, name },
      subject: 'VRANT — reset your password',
      htmlContent: html,
      textContent: `Reset your VRANT password (valid 30 minutes): ${resetUrl}`,
    });
    return true;
  } catch (err) {
    console.error('[notify] password reset email failed:', err.message);
    return false;
  }
}

module.exports = {
  notifyWelcomeSms,
  queueWelcomeSms,
  sendPasswordResetEmail,
};
