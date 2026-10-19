import { MessageCircle } from 'lucide-react';
import { buildSupportMessage, openWhatsApp } from '@/lib/whatsapp';

const WhatsAppButton = () => {
  const handleClick = () => {
    openWhatsApp(buildSupportMessage());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-[90] bg-black text-white w-12 h-12 sm:w-auto sm:h-auto justify-center sm:pl-4 sm:pr-5 sm:py-3 rounded-full shadow-2xl hover:bg-army-green transition-colors duration-300 flex items-center gap-2"
      aria-label="Contact us for support on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 shrink-0" strokeWidth={1.5} aria-hidden />
      {/* Icon-only on phones so it never covers content */}
      <span className="hidden sm:inline text-[10px] font-bold tracking-[0.15em] uppercase">
        Contact us for support
      </span>
    </button>
  );
};

export default WhatsAppButton;
