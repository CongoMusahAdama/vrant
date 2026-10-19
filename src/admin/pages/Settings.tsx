import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import AdminPanel from '../components/ui/AdminPanel';
import AdminSingleImagePicker from '../components/ui/AdminSingleImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { apiFormFetch, ADMIN_INPUT, ADMIN_LABEL, ADMIN_BTN } from '../lib/apiForm';
import { sweetSuccessCenter } from '@/lib/sweet-alert';
import { productImageUrl } from '../lib/productImage';
import { formatAboutBody, DEFAULT_STORE_CITY, DEFAULT_STORE_EMAIL } from '@/lib/site-content';
import type { SiteSettings } from '../types/admin';

type HeroSlot = 'left' | 'centre' | 'right';

/** The homepage hero is a triptych on desktop; the centre image is also the phone hero */
const HERO_SLOTS: {
  slot: HeroSlot;
  field: string;
  key: 'heroImageLeftUrl' | 'heroImageUrl' | 'heroImageRightUrl';
  label: string;
  hint: string;
}[] = [
  { slot: 'left', field: 'heroImageLeft', key: 'heroImageLeftUrl', label: 'Left', hint: 'Desktop' },
  { slot: 'centre', field: 'heroImage', key: 'heroImageUrl', label: 'Centre', hint: 'Desktop + phones' },
  { slot: 'right', field: 'heroImageRight', key: 'heroImageRightUrl', label: 'Right', hint: 'Desktop' },
];

const noHeroFiles: Record<HeroSlot, File | null> = { left: null, centre: null, right: null };
const noHeroPreviews: Record<HeroSlot, string | null> = { left: null, centre: null, right: null };

const heroUrlsFrom = (s: SiteSettings): Record<HeroSlot, string> => ({
  left: s.heroImageLeftUrl || '',
  centre: s.heroImageUrl || '',
  right: s.heroImageRightUrl || '',
});

const Settings = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [heroUrls, setHeroUrls] = useState<Record<HeroSlot, string>>({ left: '', centre: '', right: '' });
  const [heroFiles, setHeroFiles] = useState(noHeroFiles);
  const [heroPreviews, setHeroPreviews] = useState(noHeroPreviews);

  const pickHero = (slot: HeroSlot, file: File | null) => {
    if (heroPreviews[slot]) URL.revokeObjectURL(heroPreviews[slot]!);
    setHeroFiles((f) => ({ ...f, [slot]: file }));
    setHeroPreviews((p) => ({ ...p, [slot]: file ? URL.createObjectURL(file) : null }));
  };
  const [form, setForm] = useState({
    logoAlt: 'VRANT',
    storeName: 'VRANT',
    storeEmail: DEFAULT_STORE_EMAIL,
    storePhone: '',
    storeCity: DEFAULT_STORE_CITY,
    heroImageAlt: 'VRANT campaign',
    aboutEyebrow: 'Our story',
    aboutTitle: 'About VRANT',
    aboutBody: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          data: { settings: SiteSettings };
        }>('/api/settings');
        if (cancelled) return;
        const s = res.data.settings;
        setCurrentLogoUrl(s.logoUrl || '');
        setHeroUrls(heroUrlsFrom(s));
        setForm({
          logoAlt: s.logoAlt || 'VRANT',
          storeName: s.storeName || 'VRANT',
          storeEmail: s.storeEmail || '',
          storePhone: s.storePhone || '',
          storeCity: s.storeCity || '',
          heroImageAlt: s.heroImageAlt || 'VRANT campaign',
          aboutEyebrow: s.aboutEyebrow || 'Our story',
          aboutTitle: s.aboutTitle || 'About VRANT',
          aboutBody: formatAboutBody(s.aboutParagraphs || []),
        });
      } catch {
        if (!cancelled) setError('Could not load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('logoAlt', form.logoAlt.trim());
      fd.append('storeName', form.storeName.trim());
      fd.append('storeEmail', form.storeEmail.trim());
      fd.append('storePhone', form.storePhone.trim());
      fd.append('storeCity', form.storeCity.trim());
      fd.append('heroImageAlt', form.heroImageAlt.trim());
      fd.append('aboutEyebrow', form.aboutEyebrow.trim());
      fd.append('aboutTitle', form.aboutTitle.trim());
      fd.append('aboutBody', form.aboutBody.trim());
      if (logoFile) fd.append('image', logoFile);
      HERO_SLOTS.forEach(({ slot, field }) => {
        const file = heroFiles[slot];
        if (file) fd.append(field, file);
      });

      const res = await apiFormFetch<{
        success: boolean;
        data: { settings: SiteSettings };
      }>('/api/settings', fd, { method: 'PUT', token });

      setCurrentLogoUrl(res.data.settings.logoUrl || '');
      setHeroUrls(heroUrlsFrom(res.data.settings));
      setLogoFile(null);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      Object.values(heroPreviews).forEach((p) => p && URL.revokeObjectURL(p));
      setHeroFiles(noHeroFiles);
      setHeroPreviews(noHeroPreviews);
      setForm((f) => ({
        ...f,
        aboutBody: formatAboutBody(res.data.settings.aboutParagraphs || []),
      }));
      sweetSuccessCenter('Settings saved', 'Your site content is updated.');
      window.dispatchEvent(new CustomEvent('vrant:settings-changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const displayLogo = logoPreview || (currentLogoUrl ? productImageUrl(currentLogoUrl) : '');
  const heroSrc = (slot: HeroSlot) =>
    heroPreviews[slot] || (heroUrls[slot] ? productImageUrl(heroUrls[slot]) : '');

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Settings"
        description="Update branding, homepage hero, About page copy, and store contact details."
      />

      {loading ? (
        <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {error ? (
            <p className="lg:col-span-2 text-[9px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          ) : null}

          <AdminPanel title="Homepage hero">
            <div className="space-y-4">
              <div>
                <span className={ADMIN_LABEL}>Hero images</span>
                <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider mb-3">
                  Three side-by-side panels on desktop. Portrait photos work best (JPG or PNG, max 5MB).
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {HERO_SLOTS.map(({ slot, label, hint }) => {
                    const src = heroSrc(slot);
                    const pending = Boolean(heroFiles[slot]);
                    return (
                      <div key={slot}>
                        <div className="relative aspect-[3/4] bg-black/[0.04] border border-black/15 overflow-hidden">
                          {src ? (
                            <img src={src} alt={`${label} hero panel`} className="absolute inset-0 w-full h-full object-cover" />
                          ) : null}
                          {pending ? (
                            <>
                              <span className="absolute top-1 left-1 bg-army-green text-white text-[8px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5">
                                New
                              </span>
                              <button
                                type="button"
                                onClick={() => pickHero(slot, null)}
                                className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/75 text-white hover:bg-black"
                                aria-label={`Undo ${label} image`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[9px] font-bold tracking-[0.15em] uppercase text-black">{label}</p>
                        <p className="text-[8px] font-bold tracking-[0.1em] uppercase text-black/40">{hint}</p>
                        <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-[9px] font-bold tracking-[0.15em] uppercase text-army-green hover:underline">
                          <ImagePlus className="w-3 h-3" /> Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              pickHero(slot, e.target.files?.[0] ?? null);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className={ADMIN_LABEL}>Hero image alt text</span>
                <input
                  className={ADMIN_INPUT}
                  value={form.heroImageAlt}
                  onChange={(e) => setForm((f) => ({ ...f, heroImageAlt: e.target.value }))}
                />
              </label>

              <button type="submit" disabled={saving} className={ADMIN_BTN}>
                {saving ? 'Saving…' : 'Save homepage hero'}
              </button>
            </div>
          </AdminPanel>

          <AdminPanel title="About page">
            <div className="space-y-4">
              <label className="block">
                <span className={ADMIN_LABEL}>Eyebrow label</span>
                <input
                  className={ADMIN_INPUT}
                  value={form.aboutEyebrow}
                  onChange={(e) => setForm((f) => ({ ...f, aboutEyebrow: e.target.value }))}
                  placeholder="Our story"
                />
              </label>

              <label className="block">
                <span className={ADMIN_LABEL}>Page title</span>
                <input
                  className={ADMIN_INPUT}
                  value={form.aboutTitle}
                  onChange={(e) => setForm((f) => ({ ...f, aboutTitle: e.target.value }))}
                  placeholder="About VRANT"
                />
              </label>

              <label className="block">
                <span className={ADMIN_LABEL}>About copy</span>
                <textarea
                  className={`${ADMIN_INPUT} min-h-[200px] resize-y normal-case tracking-normal font-medium leading-relaxed`}
                  value={form.aboutBody}
                  onChange={(e) => setForm((f) => ({ ...f, aboutBody: e.target.value }))}
                  placeholder="Write your story here. Leave a blank line between paragraphs."
                />
                <p className="text-[8px] font-bold uppercase text-black/40 mt-2">
                  Separate paragraphs with a blank line
                </p>
              </label>

              <button type="submit" disabled={saving} className={ADMIN_BTN}>
                {saving ? 'Saving…' : 'Save about page'}
              </button>
            </div>
          </AdminPanel>

          <AdminPanel title="Branding">
            <div className="space-y-4">
              {displayLogo ? (
                <div>
                  <span className={ADMIN_LABEL}>Current navbar logo</span>
                  <div className="mt-1 border border-black/15 bg-white p-4 inline-block">
                    <img
                      src={displayLogo}
                      alt="Current logo"
                      className="h-12 w-auto max-w-[200px] object-contain"
                    />
                  </div>
                </div>
              ) : null}

              <AdminSingleImagePicker
                file={logoFile}
                preview={logoPreview}
                onChange={(file, preview) => {
                  setLogoFile(file);
                  setLogoPreview(preview);
                }}
                label="Upload new logo"
                hint="PNG or JPG with a transparent or white background works best. Shown in the top navbar."
              />

              <label className="block">
                <span className={ADMIN_LABEL}>Logo alt text</span>
                <input
                  className={ADMIN_INPUT}
                  value={form.logoAlt}
                  onChange={(e) => setForm((f) => ({ ...f, logoAlt: e.target.value }))}
                />
              </label>

              <button type="submit" disabled={saving} className={ADMIN_BTN}>
                {saving ? 'Saving…' : 'Save branding'}
              </button>
            </div>
          </AdminPanel>

          <AdminPanel title="Store contact">
            <div className="space-y-4">
              {[
                { id: 'storeName', label: 'Store name', key: 'storeName' as const },
                { id: 'storeEmail', label: 'Email', key: 'storeEmail' as const },
                { id: 'storePhone', label: 'Phone', key: 'storePhone' as const },
                { id: 'storeCity', label: 'City', key: 'storeCity' as const },
              ].map((field) => (
                <label key={field.id} className="block">
                  <span className={ADMIN_LABEL}>{field.label}</span>
                  <input
                    id={field.id}
                    className={ADMIN_INPUT}
                    value={form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                </label>
              ))}
              <button type="submit" disabled={saving} className={ADMIN_BTN}>
                {saving ? 'Saving…' : 'Save contact info'}
              </button>
            </div>
          </AdminPanel>
        </form>
      )}
    </AdminLayout>
  );
};

export default Settings;
