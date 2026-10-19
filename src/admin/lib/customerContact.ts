/** Ghana-friendly WhatsApp digits for wa.me links */
export function whatsAppDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0') && digits.length >= 10) {
    return `233${digits.slice(1)}`;
  }
  if (digits.startsWith('233')) return digits;
  return digits.length >= 10 ? digits : null;
}

export function customerEmailHref(email: string, customerName: string) {
  const subject = encodeURIComponent('VRANT — regarding your account');
  const body = encodeURIComponent(
    `Hi ${customerName},\n\nThis is VRANT support. We are reaching out regarding your account or order.\n\n`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function customerPhoneHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  return `tel:${digits.startsWith('0') ? `+233${digits.slice(1)}` : `+${digits}`}`;
}

export function customerWhatsAppHref(phone: string, customerName: string) {
  const wa = whatsAppDigits(phone);
  if (!wa) return null;
  const text = encodeURIComponent(
    `Hi ${customerName}, this is VRANT support. We are reaching out regarding your account or order.`
  );
  return `https://wa.me/${wa}?text=${text}`;
}
