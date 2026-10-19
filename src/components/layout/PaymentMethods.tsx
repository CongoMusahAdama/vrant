/** Accepted payment method badges (footer / checkout trust strip) */
const PAYMENT_METHODS = [
  { name: 'American Express', file: 'amex.svg' },
  { name: 'Apple Pay', file: 'apple-pay.svg' },
  { name: 'Diners Club', file: 'diners.svg' },
  { name: 'Discover', file: 'discover.svg' },
  { name: 'Google Pay', file: 'google-pay.svg' },
  { name: 'Mastercard', file: 'mastercard.svg' },
  { name: 'PayPal', file: 'paypal.svg' },
  { name: 'Shop Pay', file: 'shop-pay.svg' },
  { name: 'UnionPay', file: 'unionpay.svg' },
  { name: 'Visa', file: 'visa.svg' },
  { name: 'MTN MoMo', file: 'mtn-momo.svg' },
  { name: 'Paystack', file: 'paystack.svg' },
] as const;

interface PaymentMethodsProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const PaymentMethods = ({ variant = 'light', className = '' }: PaymentMethodsProps) => {
  const bg = variant === 'dark' ? 'bg-white/10' : 'bg-white border border-black/10';

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 md:gap-2.5 ${className}`}
      role="list"
      aria-label="Accepted payment methods"
    >
      {PAYMENT_METHODS.map((method) => (
        <div
          key={method.name}
          role="listitem"
          className={`h-7 w-11 md:h-8 md:w-12 rounded overflow-hidden flex items-center justify-center shrink-0 ${bg}`}
          title={method.name}
        >
          <img
            src={`/payments/${method.file}`}
            alt={method.name}
            className="h-full w-full object-contain p-0.5"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default PaymentMethods;
