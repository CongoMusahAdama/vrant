import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ImagePlus,
  MessageCircle,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { apiFormFetch } from '@/admin/lib/apiForm';
import { MAX_DESIGN_IMAGES, type GarmentType } from '@/lib/custom-design';
import { openWhatsApp } from '@/lib/whatsapp';
import { SITE_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { cn } from '@/lib/utils';

/** Garment tiles — photo where we have one, a clean text tile otherwise */
const GARMENTS: { value: GarmentType; label: string; image?: string }[] = [
  { value: 'two_piece_set', label: 'Two-piece set', image: '/products/ember-diamond-zip-set-1.jpg' },
  { value: 'shirt', label: 'Shirt', image: '/products/coral-panel-shirt-set-2.jpg' },
  { value: 'kaftan', label: 'Kaftan', image: '/products/abstract-bib-kaftan-1.jpg' },
  { value: 'footwear', label: 'Footwear', image: '/products/vrant-cross-suede-slides-1.jpg' },
  { value: 'smock', label: 'Smock / batakari' },
  { value: 'trousers', label: 'Trousers' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'other', label: 'Something else' },
];

const STEPS = [
  { icon: Sparkles, title: 'Share your idea', text: 'Describe it and add a sketch, a screenshot or a photo you love.' },
  { icon: Ruler, title: 'We call you', text: 'We talk through fabric, fit and measurements, then confirm your price.' },
  { icon: Scissors, title: 'We make it', text: 'Cut and finished by our tailors in Takoradi — made only for you.' },
];

const FAQS = [
  {
    q: 'How much does a custom piece cost?',
    a: 'It depends on the design and fabric. We always confirm the price with you before any work starts — nothing is made until you approve.',
  },
  {
    q: 'How long does it take?',
    a: 'Timing depends on the piece and fabric. When we call you, we agree a ready date before we begin.',
  },
  {
    q: 'Can you deliver?',
    a: 'Yes — we deliver across Ghana and ship internationally, or you can collect from us in Takoradi.',
  },
  {
    q: 'I only have an idea, no sketch. Is that okay?',
    a: 'Absolutely. Describe it in your own words or send a photo of something close — we will take it from there.',
  },
];

const HERO_IMAGE = '/lookbook/look-6.jpg';

const labelClass = 'block text-[10px] font-bold tracking-[0.18em] uppercase text-black mb-2';
const hintClass = 'text-xs text-black/50 normal-case tracking-normal font-normal leading-relaxed';
const inputClass =
  'w-full h-12 border border-black/15 bg-white px-4 text-sm font-normal normal-case tracking-normal text-black placeholder:text-black/35 outline-none focus:border-army-green focus:ring-2 focus:ring-army-green/10 transition';

type Preview = { file: File; url: string };

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  garmentType: '' as GarmentType | '',
  description: '',
  sizing: '',
  fabricPreference: '',
  budget: '',
  neededBy: '',
};

const SectionHeading = ({ n, title, hint }: { n: number; title: string; hint?: string }) => (
  <div className="flex items-start gap-4 mb-5">
    <span className="shrink-0 w-8 h-8 rounded-full bg-army-green text-white text-xs font-bold flex items-center justify-center">
      {n}
    </span>
    <div className="pt-1">
      <h3 className="text-sm font-bold tracking-[0.12em] uppercase text-black mb-0">{title}</h3>
      {hint ? <p className={cn(hintClass, 'mt-1')}>{hint}</p> : null}
    </div>
  </div>
);

/** Customers send their own design for the VRANT team to make */
const CustomDesign = () => {
  const { user } = useAuth();
  const { storePhone } = useSiteSettings();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<Preview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const pickGarment = (value: GarmentType) => {
    setForm((f) => ({ ...f, garmentType: value }));
    setError('');
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_DESIGN_IMAGES - images.length;
    const valid = Array.from(files).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    const picked = valid.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (valid.length > room) setError(`You can attach up to ${MAX_DESIGN_IMAGES} images`);
    else if (valid.length < files.length) setError('Please use JPG, PNG or WebP images');
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
    if (!form.garmentType) {
      setError('Please choose what you would like made');
      return scrollToForm();
    }
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
      requestAnimationFrame(scrollToForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your design');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUs = () =>
    openWhatsApp('Hello VRANT, I would like to talk about a custom design.');

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <Header variant="solid" />

      <main className={cn('w-full', SITE_HEADER_OFFSET_PT)}>
        {/* ── Hero ── */}
        <section className={cn('max-w-[1280px] mx-auto', PAGE_X)}>
          <div className="grid lg:grid-cols-[1.05fr_1fr] bg-[#f7f4f3] overflow-hidden">
            <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 lg:py-20 order-2 lg:order-1">
              <ScrollReveal variant="fade-up">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-army-green mb-5">
                  Bespoke · Made to order
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[0.03em] uppercase text-black leading-[1.08] mb-6">
                  Your design.
                  <br />
                  <span className="text-army-green">Our tailors.</span>
                </h1>
                <p className="text-base text-black/65 normal-case tracking-normal font-normal leading-relaxed max-w-md mb-9">
                  Sketch it, screenshot it or simply describe it. We turn your idea into a piece made only for you —
                  cut and finished by hand in Takoradi.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className="inline-flex items-center gap-2 h-12 px-7 bg-army-green text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-army-green-light transition-colors"
                  >
                    Start your design <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={whatsappUs}
                    className="inline-flex items-center gap-2 h-12 px-6 border border-black/20 bg-white text-[11px] font-bold tracking-[0.2em] uppercase text-black hover:border-black transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat with us
                  </button>
                </div>
              </ScrollReveal>
            </div>
            <div className="relative order-1 lg:order-2 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[560px]">
              <img src={HERO_IMAGE} alt="A VRANT made-to-order set" className="absolute inset-0 w-full h-full object-cover object-[center_30%]" />
              <div className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 bg-white px-4 py-3 shadow-lg">
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/45 mb-0.5">Made in</p>
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-black">Takoradi, Ghana</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className={cn('max-w-[1280px] mx-auto py-14 sm:py-20', PAGE_X)}>
          <ScrollReveal variant="fade-up">
            <p className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-army-green mb-3">How it works</p>
            <h2 className="text-center text-xl sm:text-2xl font-bold tracking-[0.1em] uppercase text-black mb-10 sm:mb-14">
              Three simple steps
            </h2>
            <ol className="grid md:grid-cols-3 gap-px bg-black/10 border border-black/10">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="bg-white p-7 sm:p-9">
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-11 h-11 rounded-full bg-army-green/10 text-army-green flex items-center justify-center">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-3xl font-bold text-black/10 tabular-nums">0{i + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-black mb-2">{title}</h3>
                  <p className="text-sm text-black/60 normal-case tracking-normal font-normal leading-relaxed mb-0">{text}</p>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </section>

        {/* ── Form ── */}
        <section className="bg-[#f7f4f3] py-14 sm:py-20">
          <div
            ref={formRef}
            className={cn('max-w-[1280px] mx-auto grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 scroll-mt-32 md:scroll-mt-60', PAGE_X)}
          >
            {reference ? (
              <div className="lg:col-span-2 bg-white px-6 py-16 text-center border border-black/10">
                <span className="mx-auto mb-6 w-16 h-16 rounded-full bg-army-green/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-army-green" strokeWidth={1.5} />
                </span>
                <h2 className="text-2xl font-bold tracking-[0.1em] uppercase text-black mb-3">Design received</h2>
                <p className="text-base text-black/60 normal-case tracking-normal font-normal leading-relaxed max-w-md mx-auto mb-3">
                  Thank you! Our team will call you within 1–2 working days to talk through your design and confirm the price.
                </p>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/45 mb-9">
                  Reference <span className="text-army-green">{reference}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReference('')}
                    className="h-12 px-7 border border-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors"
                  >
                    Send another design
                  </button>
                  <Link
                    to="/products"
                    className="h-12 px-7 inline-flex items-center gap-2 bg-army-green text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-army-green-light"
                  >
                    Shop the collection <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="bg-white border border-black/10 p-5 sm:p-10 space-y-10 min-w-0">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-army-green mb-2">Custom order</p>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-[0.08em] uppercase text-black mb-1">Tell us about your piece</h2>
                    <p className={hintClass}>Takes about 2 minutes. Fields marked * are required.</p>
                  </div>

                  {error && (
                    <div className="border-l-4 border-red-600 bg-red-50 text-red-800 px-4 py-3 text-sm normal-case tracking-normal font-normal">
                      {error}
                    </div>
                  )}

                  {/* 1. What */}
                  <div>
                    <SectionHeading n={1} title="What would you like made? *" />
                    {/* Photo tiles for the pieces we have pictures of */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {GARMENTS.filter((g) => g.image).map((g) => {
                        const active = form.garmentType === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => pickGarment(g.value)}
                            className={cn(
                              'group relative aspect-[3/4] overflow-hidden border text-left transition-all',
                              active ? 'border-army-green ring-2 ring-army-green' : 'border-black/10 hover:border-black/40'
                            )}
                          >
                            <img src={g.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <span className="absolute bottom-0 left-0 w-full p-3 text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase text-white">
                              {g.label}
                            </span>
                            {active && (
                              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-army-green text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Compact buttons for everything else */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {GARMENTS.filter((g) => !g.image).map((g) => {
                        const active = form.garmentType === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => pickGarment(g.value)}
                            className={cn(
                              'h-12 px-3 inline-flex items-center justify-center gap-2 border text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase transition-colors',
                              active
                                ? 'bg-army-green text-white border-army-green'
                                : 'bg-[#f7f4f3] text-black border-black/10 hover:border-black/40'
                            )}
                          >
                            {active && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Idea */}
                  <div>
                    <SectionHeading n={2} title="Your idea" hint="The more detail, the better — style, occasion, colours, anything that matters to you." />
                    <label htmlFor="cd-description" className={labelClass}>Describe your design *</label>
                    <textarea
                      id="cd-description"
                      value={form.description}
                      onChange={set('description')}
                      rows={5}
                      maxLength={2000}
                      required
                      placeholder="E.g. A two-piece set with a kente panel across the chest, mandarin collar and slim trousers — for a wedding in December."
                      className={cn(inputClass, 'h-auto py-3 resize-y leading-relaxed')}
                    />
                    <p className="mt-1 text-right text-[11px] text-black/35 font-normal normal-case tracking-normal">
                      {form.description.length}/2000
                    </p>

                    <span className={cn(labelClass, 'mt-6')}>Sketches or inspiration photos</span>
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        addFiles(e.dataTransfer.files);
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center text-center gap-2 px-6 py-8 border-2 border-dashed cursor-pointer transition-colors',
                        dragging ? 'border-army-green bg-army-green/5' : 'border-black/15 hover:border-army-green/60 bg-[#fcfbfa]',
                        images.length >= MAX_DESIGN_IMAGES && 'opacity-50 pointer-events-none'
                      )}
                    >
                      <span className="w-12 h-12 rounded-full bg-army-green/10 text-army-green flex items-center justify-center">
                        <ImagePlus className="w-5 h-5" strokeWidth={1.75} />
                      </span>
                      <span className="text-sm font-bold text-black normal-case tracking-normal">
                        Drop images here or <span className="text-army-green underline underline-offset-2">browse</span>
                      </span>
                      <span className={hintClass}>
                        A drawing, screenshot or photo — up to {MAX_DESIGN_IMAGES} images (JPG, PNG, WebP)
                      </span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        onChange={(e) => addFiles(e.target.files)}
                      />
                    </label>
                    {images.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-3">
                        {images.map((p, i) => (
                          <div key={p.url} className="relative aspect-square bg-[#f2f2f2] overflow-hidden border border-black/10">
                            <img src={p.url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-black/70 text-white hover:bg-black"
                              aria-label={`Remove image ${i + 1}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Details */}
                  <div>
                    <SectionHeading n={3} title="Fit & details" hint="Optional — we confirm everything with you on the phone." />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="cd-sizing" className={labelClass}>Size or measurements</label>
                        <input id="cd-sizing" value={form.sizing} onChange={set('sizing')} placeholder="L, or chest 40 / waist 32" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="cd-fabric" className={labelClass}>Fabric or colour</label>
                        <input id="cd-fabric" value={form.fabricPreference} onChange={set('fabricPreference')} placeholder="Kente, wine-red linen…" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="cd-budget" className={labelClass}>Budget</label>
                        <input id="cd-budget" value={form.budget} onChange={set('budget')} placeholder="GHS 800" className={inputClass} />
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
                  </div>

                  {/* 4. Contact */}
                  <div>
                    <SectionHeading n={4} title="How do we reach you?" />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="cd-name" className={labelClass}>Full name *</label>
                        <input id="cd-name" value={form.name} onChange={set('name')} required autoComplete="name" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="cd-phone" className={labelClass}>Phone / WhatsApp *</label>
                        <input id="cd-phone" type="tel" value={form.phone} onChange={set('phone')} required autoComplete="tel" placeholder="024 123 4567" className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="cd-email" className={labelClass}>Email <span className="text-black/35">(optional)</span></label>
                        <input id="cd-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@email.com" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-[56px] inline-flex items-center justify-center gap-2 bg-army-green hover:bg-army-green-light disabled:opacity-60 text-white text-[11px] font-bold tracking-[0.22em] uppercase transition-colors"
                    >
                      {submitting ? 'Sending your design…' : <>Send my design <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="mt-3 text-center text-xs text-black/45 normal-case tracking-normal font-normal">
                      No payment now — we confirm the price with you first.
                    </p>
                  </div>
                </form>

                {/* Sticky reassurance panel */}
                <aside className="lg:sticky lg:top-28 h-fit space-y-4">
                  <div className="bg-army-green text-white p-7">
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60 mb-5">What happens next</p>
                    <ul className="space-y-5">
                      {[
                        { icon: Clock, title: 'We call within 1–2 days', text: 'To talk through your idea, fabric and fit.' },
                        { icon: ShieldCheck, title: 'Price before we start', text: 'Nothing is made until you approve the quote.' },
                        { icon: Scissors, title: 'Made by hand', text: 'Cut and finished by our tailors in Takoradi.' },
                      ].map(({ icon: Icon, title, text }) => (
                        <li key={title} className="flex gap-3">
                          <Icon className="w-5 h-5 shrink-0 text-white/80 mt-0.5" strokeWidth={1.75} />
                          <div>
                            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white mb-1">{title}</p>
                            <p className="text-sm text-white/70 normal-case tracking-normal font-normal leading-snug mb-0">{text}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-black/10 p-6">
                    <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-black/45 mb-2">Prefer to talk?</p>
                    <p className="text-sm text-black/70 normal-case tracking-normal font-normal leading-relaxed mb-4">
                      Call or WhatsApp us on <span className="font-bold text-black">{storePhone}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={whatsappUs}
                      className="w-full h-11 inline-flex items-center justify-center gap-2 border border-black/20 text-[10px] font-bold tracking-[0.2em] uppercase hover:border-army-green hover:text-army-green transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp us
                    </button>
                  </div>
                </aside>
              </>
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={cn('max-w-[820px] mx-auto py-14 sm:py-20', PAGE_X)}>
          <p className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-army-green mb-3">Questions</p>
          <h2 className="text-center text-xl sm:text-2xl font-bold tracking-[0.1em] uppercase text-black mb-10">Good to know</h2>
          <div className="border-t border-black/10">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="border-b border-black/10">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-xs sm:text-sm font-bold tracking-[0.1em] uppercase text-black">{f.q}</span>
                    <ChevronDown className={cn('w-4 h-4 shrink-0 text-army-green transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <p className="pb-5 -mt-1 text-sm text-black/60 normal-case tracking-normal font-normal leading-relaxed animate-fade-in">
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
};

export default CustomDesign;
