const { isBrevoConfigured, sendTransactionalEmail } = require('./brevo');
const { isMnotifyConfigured, sendTransactionalSms } = require('./mnotify');
const { formatPhoneForMnotify } = require('./phone');
const { vrantEmailLayout } = require('./emailTemplate');
const { publicSiteUrl } = require('./publicSiteUrl');

const GARMENT_LABEL = {
  two_piece_set: 'Two-piece set',
  shirt: 'Shirt',
  kaftan: 'Kaftan',
  smock: 'Smock / batakari',
  trousers: 'Trousers',
  jeans: 'Jeans',
  footwear: 'Footwear',
  other: 'Other',
};

const escapeHtml = (s) =>
  String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Email + SMS the VRANT team when a customer submits a custom design */
async function notifyAdminCustomRequest(request) {
  const garment = GARMENT_LABEL[request.garmentType] || request.garmentType;
  const adminUrl = `${publicSiteUrl()}/admin/custom-orders`;

  const email = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (isBrevoConfigured() && email) {
    const rows = [
      ['Reference', request.reference],
      ['Customer', request.name],
      ['Phone', request.phone],
      ['Email', request.email || '—'],
      ['Garment', garment],
      ['Budget', request.budget || '—'],
      ['Needed by', request.neededBy ? new Date(request.neededBy).toDateString() : '—'],
    ]
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#888;font-size:12px;">${k}</td><td style="padding:4px 0;font-size:12px;">${escapeHtml(v)}</td></tr>`)
      .join('');
    const images = request.images
      .map((src) => `<img src="${escapeHtml(src)}" alt="" width="120" style="margin:0 8px 8px 0;border:1px solid #eee;" />`)
      .join('');

    try {
      await sendTransactionalEmail({
        to: { email, name: 'VRANT' },
        subject: `New custom design request — ${garment} (${request.reference})`,
        htmlContent: vrantEmailLayout({
          title: 'New custom design request',
          preheader: `${request.name} wants a ${garment.toLowerCase()} made`,
          bodyHtml: `
            <table role="presentation" style="margin-bottom:16px;">${rows}</table>
            <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.12em;">Design</p>
            <p style="margin:0 0 16px;font-size:13px;line-height:1.6;white-space:pre-line;">${escapeHtml(request.description)}</p>
            ${request.sizing ? `<p style="margin:0 0 16px;font-size:13px;"><strong>Sizing:</strong> ${escapeHtml(request.sizing)}</p>` : ''}
            ${images ? `<div style="margin-bottom:16px;">${images}</div>` : ''}
            <p style="margin:0;"><a href="${adminUrl}" style="color:#7F011F;">Open in admin →</a></p>`,
        }),
        textContent: `${request.name} (${request.phone}) requested a ${garment}. Ref ${request.reference}. ${adminUrl}`,
      });
    } catch (err) {
      console.error('[notify] custom request email failed:', err.message);
    }
  }

  const phone = formatPhoneForMnotify(process.env.ADMIN_NOTIFY_PHONE);
  if (isMnotifyConfigured() && phone) {
    try {
      await sendTransactionalSms({
        recipient: phone,
        content: `VRANT: New custom design request ${request.reference} — ${garment} for ${request.name} (${request.phone}).`,
      });
    } catch (err) {
      console.error('[notify] custom request sms failed:', err.message);
    }
  }
}

function queueAdminCustomRequest(request) {
  setImmediate(() => notifyAdminCustomRequest(request));
}

module.exports = { queueAdminCustomRequest, GARMENT_LABEL };
