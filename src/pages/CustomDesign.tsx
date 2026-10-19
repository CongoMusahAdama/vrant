import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ImagePlus, Ruler, Scissors, Sparkles, X } from 'lucide-react';
import Header from '@/components/navigation/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { apiFormFetch } from '@/admin/lib/apiForm';
import { GARMENT_OPTIONS, MAX_DESIGN_IMAGES } from '@/lib/custom-design';
import { SITE_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { cn } from '@/lib/utils';

const HERO_IMAGE = '/lookbook/look-6.jpg';

const labelClass = 'block text-[10px] font-bold tracking-[0.15em] uppercase text-black/60 mb-1.5';
const inputClass =
  'w-full h-12 border border-black/15 bg-white px-4 text-sm text-black placeholder:text-black/30 outline-none focus:border-black transition-colors';

const STEPS = [
  { icon: Sparkles, title: 'Share your idea', text: 'Describe it and add sketches, screenshots or inspiration photos.' },
  { icon: Ruler, title: 'We call you', text: 'We confirm fabric, fit and measurements, then send a price.' },
  { icon: Scissors, title: 'We make it', text: 'Cut and finished by hand in Takoradi, made just for you.' },
];

type Preview = { file: File; url: string };

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  garmentType: '',
  description: '',
  sizing: '',
  fabricPreference: '',
  budget: '',
  neededBy: '',
};

/** Customers send their own design for the VRANT team to make */
const CustomDesign = () => {
  const { user } = useAuth();
  const { storePhone } = useSiteSettings();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<Preview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Prefill from the signed-in account
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      email: f.email || user.email || '',
      phone: f.phone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => () => imagesRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const set = (key: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_DESIGN_IMAGES - images.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, room)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (files.length > room) setError(`You can attach up to ${MAX_DESIGN_IMAGES} images`);
    setImages((prev) => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.garmentType) return setError('Please choose what you would like made');
    if (form.description.trim().length < 10) return setError('Please describe your design (at least 10 characters)');

    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v.trim() && fd.append(k, v.trim()));
      images.forEach((p) => fd.append('images', p.file));
      const res = await apiFormFetch<{ data: { reference: string } }>('/api/custom-requests', fd, {
        token: localStorage.getItem('vrant_token'),
      });
      setReference(res.data.reference);
      images.forEach((p) => URL.revokeObjectURL(p.url));
      setImages([]);
      setForm(emptyForm);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your design');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <Header variant="solid" />

      <main className={cn('w-full', SITE_HEADER_OFFSET_PT, 'pb-20')}>
        {/* Intro */}
        <section className={cn('max-w-[1200px] mx-auto grid md:grid-cols-2 gap-8 md:gap-14 items-center mb-14 md:mb-20', PAGE_X)}>
          <ScrollReveal variant="fade-up">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-army-green mb-3">Made for you</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.06em] uppercase text-black leading-tight mb-5">
              Bring your own design
            </h1>
            <p className="text-[11px] md:text-xs font-bold tracking-[0.06em] uppercase leading-[1.9] text-black/70 mb-8">
              Have a style in mind? Send us your sketch, a photo or just your idea. Our tailors in Takoradi
              will bring it to life — two-piece sets, shirts, kaftans, jeans and footwear.
            </p>
            <ol className="space-y-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-army-green/10 text-army-green flex items-center justify-center">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-black">
                      {i + 1}. {title}
                    </p>
                    <p className="text-[10px] font-bold tracking-[0.04em] uppercase text-black/45 leading-relaxed mt-0.5">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={100} className="hidden md:block">
            <div className="aspect-[4/5] overflow-hidden bg-[#f2f2f2]">
              <img src={HERO_IMAGE} alt="VRANT tailored set" className="w-full h-full object-cover" />
            </div>
          </ScrollReveal>
        </section>

        {/* Form / confirmation */}
        <section id="design-form" className={cn('max-w-[760px] mx-auto scroll-mt-40', PAGE_X)}>
          {reference ? (
            <div className="border border-army-green/20 bg-army-green/[0.04] px-6 py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-army-green mx-auto mb-5" strokeWidth={1.5} />
              <h2 className="text-lg font-bold tracking-[0.12em] uppercase text-black mb-3">Design received!</h2>
              <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-black/60 leading-relaxed max-w-md mx-auto mb-2">
                Thank you. Our team will call you within 1–2 working days to talk through your design and price.
              </p>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/40 mb-8">
                Your reference: <span className="text-army-green">{reference}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setReference('')}
                  className="h-12 px-6 border border-black text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors"
                >
                  Send another design
                </button>
                <Link
                  to="/products"
                  className="h-12 px-6 inline-flex items-center bg-army-green text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-army-green-light"
                >
                  Shop the collection
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border border-black/10 p-5 sm:p-8 space-y-6">
              <div>
                <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-black mb-1">Your design</h2>
                <p className="text-[10px] font-bold tracking-[0.06em] uppercase text-black/40">
                  Fields marked * are required
                </p>
              </div>

              {error && (
                <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              {/* What to make */}
              <div>
                <span className={labelClass}>What would you like made? *</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GARMENT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, garmentType: o.value }));
                        setError('');
                      }}
                      className={cn(
                        'min-h-[44px] px-2 text-[9px] font-bold tracking-[0.12em] uppercase border transition-colors',
                        form.garmentType === o.value
                          ? 'bg-army-green text-white border-army-green'
                          : 'bg-white text-black/60 border-black/15 hover:border-black/40'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="cd-description" className={labelClass}>Describe your design *</label>
                <textarea
                  id="cd-description"
                  value={form.description}
                  onChange={set('description')}
                  rows={5}
                  maxLength={2000}
                  required
                  placeholder="E.g. A kente-panel shirt with a mandarin collar and matching slim trousers, for a wedding…"
                  className={cn(inputClass, 'h-auto py-3 resize-y leading-relaxed')}
                />
              </div>

              {/* Reference images */}
              <div>
                <span className={labelClass}>Sketches or inspiration photos</span>
                <p className="text-[9px] font-bold tracking-[0.08em] uppercase text-black/40 mb-3">
                  Up to {MAX_DESIGN_IMAGES} images — a drawing, a screenshot or a photo you love
                </p>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {images.map((p, i) => (
                    <div key={p.url} className="relative aspect-square bg-[#f2f2f2] border border-black/10 overflow-hidden">
                      <img src={p.url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/70 text-white hover:bg-black"
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_DESIGN_IMAGES && (
                    <label className="aspect-square border border-dashed border-black/25 flex flex-col items-center justify-center gap-1 cursor-pointer text-black/45 hover:border-army-green hover:text-army-green transition-colors">
                      <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[8px] font-bold tracking-[0.15em] uppercase">Add</span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        onChange={(e) => addFiles(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cd-sizing" className={labelClass}>Size or measurements</label>
                  <input id="cd-sizing" value={form.sizing} onChange={set('sizing')} placeholder="E.g. L, or chest 40 / waist 32" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="cd-fabric" className={labelClass}>Fabric or colour</label>
                  <input id="cd-fabric" value={form.fabricPreference} onChange={set('fabricPreference')} placeholder="E.g. Kente, wine red linen" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="cd-budget" className={labelClass}>Budget</label>
                  <input id="cd-budget" value={form.budget} onChange={set('budget')} placeholder="E.g. GHS 800" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="cd-date" className={labelClass}>Needed by</label>
                  <input
                    id="cd-date"
                    type="date"
                    value={form.neededBy}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={set('neededBy')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-black/10">
                <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mt-4 mb-4">How do we reach you?</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cd-name" className={labelClass}>Full name *</label>
                    <input id="cd-name" value={form.name} onChange={set('name')} required autoComplete="name" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="cd-phone" className={labelClass}>Phone / WhatsApp *</label>
                    <input id="cd-phone" type="tel" value={form.phone} onChange={set('phone')} required autoComplete="tel" placeholder="024 123 4567" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="cd-email" className={labelClass}>Email</label>
                    <input id="cd-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@email.com" className={inputClass} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[52px] bg-army-green hover:bg-army-green-light disabled:opacity-60 text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
              >
                {submitting ? 'Sending your design…' : 'Send my design'}
              </button>
              <p className="text-center text-[9px] font-bold tracking-[0.1em] uppercase text-black/40">
                Prefer to talk? Call or WhatsApp {storePhone}
              </p>
            </form>
          )}
        </section>
      </main>

      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
};

export default CustomDesign;
