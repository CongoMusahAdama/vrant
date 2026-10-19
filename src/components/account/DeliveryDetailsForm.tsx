import { useState, useEffect, useRef, useCallback } from 'react';
import type { DeliveryDetails, DeliveryMethod } from '@/types/customer';
import { COUNTRIES, PICKUP_STATIONS_GHANA } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const inputClass =
  'w-full border border-black bg-white text-[11px] font-bold tracking-[0.1em] uppercase py-3 px-4 min-h-[48px] focus:outline-none focus:ring-1 focus:ring-black rounded-none';

const selectClass =
  'w-full appearance-none border border-black bg-white text-[11px] font-bold tracking-[0.1em] uppercase py-3 px-4 pr-10 min-h-[48px] focus:outline-none focus:ring-1 focus:ring-black rounded-none';

const labelClass = 'block text-[10px] font-bold tracking-[0.2em] uppercase text-black mb-2';

const emptyForm: DeliveryDetails = {
  fullName: '',
  phone: '',
  deliveryMethod: 'delivery',
  street: '',
  city: '',
  region: '',
  country: 'Ghana',
  pickupStation: '',
};

interface DeliveryDetailsFormProps {
  initial?: Partial<DeliveryDetails> | null;
  onSubmit: (delivery: DeliveryDetails) => void | Promise<void>;
  /** Inline on product page — live updates, no submit button */
  embedded?: boolean;
  onChange?: (delivery: DeliveryDetails) => void;
  submitLabel?: string;
  className?: string;
  loading?: boolean;
  /** Tighter fields for product page panel */
  compact?: boolean;
}

const DeliveryDetailsForm = ({
  initial,
  onSubmit,
  submitLabel = 'Save delivery details',
  embedded = false,
  onChange,
  className,
  loading = false,
  compact = false,
}: DeliveryDetailsFormProps) => {
  const buildFormFromInitial = useCallback((source?: Partial<DeliveryDetails> | null) => {
    if (!source) return { form: emptyForm, customPickup: false };

    const method = source.deliveryMethod || 'delivery';
    const station = source.pickupStation || '';
    const isCustom =
      method === 'pickup' &&
      station.length > 0 &&
      !PICKUP_STATIONS_GHANA.slice(0, -1).some((s) => s === station);

    const form = {
      ...emptyForm,
      ...source,
      deliveryMethod: method,
      country: source.country || 'Ghana',
    };

    return {
      form,
      customPickup: isCustom || station === 'Other — specify below',
    };
  }, []);

  const [form, setForm] = useState<DeliveryDetails>(() => buildFormFromInitial(initial).form);
  const [customPickup, setCustomPickup] = useState(
    () => buildFormFromInitial(initial).customPickup
  );
  const [error, setError] = useState('');
  const hydratedRef = useRef(false);

  // Hydrate once on mount only — avoid wiping typed fields when parent re-renders
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const { form: next, customPickup: nextCustom } = buildFormFromInitial(initial);
    setForm(next);
    setCustomPickup(nextCustom);
    if (embedded && onChange) onChange(next);
  }, [buildFormFromInitial, initial, embedded, onChange]);

  const scrollFieldIntoView = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    requestAnimationFrame(() => {
      e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const isGhana = form.country === 'Ghana';
  const isPickup = form.deliveryMethod === 'pickup';

  const emitChange = (next: DeliveryDetails) => {
    if (embedded && onChange) onChange(next);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      emitChange(next);
      return next;
    });
    setError('');
  };

  const setMethod = (method: DeliveryMethod) => {
    setForm((prev) => {
      const next = { ...prev, deliveryMethod: method };
      emitChange(next);
      return next;
    });
    setError('');
  };

  const handlePickupSelect = (value: string) => {
    if (value === 'Other — specify below') {
      setCustomPickup(true);
      setForm((prev) => ({ ...prev, pickupStation: '' }));
    } else {
      setCustomPickup(false);
      setForm((prev) => ({ ...prev, pickupStation: value }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.country.trim()) {
      setError('Please fill in name, phone, and country');
      return;
    }
    if (!form.city.trim() || !form.region.trim()) {
      setError('Please enter city and region');
      return;
    }
    if (isPickup && !form.pickupStation.trim()) {
      setError('Please select or enter a pickup station / location');
      return;
    }
    if (!isPickup && !form.street.trim()) {
      setError('Please enter your street / area for delivery');
      return;
    }
    await onSubmit(form);
  };

  const SelectField = ({
    id,
    name,
    label,
    value,
    options,
    placeholder,
  }: {
    id: string;
    name: string;
    label: string;
    value: string;
    options: readonly string[];
    placeholder?: string;
  }) => (
    <div>
      <label className={labelCls} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          className={selectCls}
          required
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-black/40" />
      </div>
    </div>
  );

  const inputCls = compact
    ? 'w-full border border-black bg-white text-[10px] font-bold tracking-[0.08em] uppercase py-2 px-3 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-black rounded-none'
    : inputClass;
  const selectCls = compact
    ? 'w-full appearance-none border border-black bg-white text-[10px] font-bold tracking-[0.08em] uppercase py-2 px-3 pr-9 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-black rounded-none'
    : selectClass;
  const labelCls = compact
    ? 'block text-[9px] font-bold tracking-[0.16em] uppercase text-black mb-1'
    : labelClass;

  return (
    <form onSubmit={handleSubmit} className={cn(compact ? 'space-y-3' : 'space-y-5', className)}>
      <div>
        <label className={labelCls} htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          onFocus={scrollFieldIntoView}
          autoComplete="name"
          className={inputCls}
          required
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="phone">
          Phone (WhatsApp)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          onFocus={scrollFieldIntoView}
          autoComplete="tel"
          inputMode="tel"
          className={inputCls}
          required
        />
      </div>

      <SelectField
        id="country"
        name="country"
        label="Country"
        value={form.country}
        options={COUNTRIES}
      />

      <div>
        <span className={labelCls}>How do you want to receive your order?</span>
        <div className="grid grid-cols-2 gap-2">
          {(['delivery', 'pickup'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setMethod(method)}
              className={cn(
                compact ? 'min-h-[40px] text-[9px]' : 'min-h-[48px] text-[10px]',
                'border font-bold tracking-[0.15em] uppercase transition-colors',
                form.deliveryMethod === method
                  ? 'border-black bg-black text-white'
                  : 'border-black/20 bg-white text-black/60 hover:border-black/40'
              )}
            >
              {method === 'delivery' ? 'Home delivery' : 'Pickup'}
            </button>
          ))}
        </div>
      </div>

      {isPickup ? (
        <>
          {isGhana ? (
            <div>
              <label className={labelCls} htmlFor="pickupStationSelect">
                Pickup station
              </label>
              <div className="relative">
                <select
                  id="pickupStationSelect"
                  value={customPickup ? 'Other — specify below' : form.pickupStation}
                  onChange={(e) => handlePickupSelect(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select pickup station</option>
                  {PICKUP_STATIONS_GHANA.map((station) => (
                    <option key={station} value={station}>
                      {station}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-black/40" />
              </div>
            </div>
          ) : null}
          {(customPickup || !isGhana) && (
            <div>
              <label className={labelCls} htmlFor="pickupStation">
                {isGhana ? 'Your pickup location' : 'Pickup location / station'}
              </label>
              <input
                id="pickupStation"
                name="pickupStation"
                value={form.pickupStation}
                onChange={handleChange}
                placeholder="e.g. mall, bus station, landmark"
                className={inputCls}
                required
              />
            </div>
          )}
        </>
      ) : (
        <div>
          <label className={labelCls} htmlFor="street">
            Street / area
          </label>
          <input
            id="street"
            name="street"
            value={form.street}
            onChange={handleChange}
            onFocus={scrollFieldIntoView}
            autoComplete="street-address"
            className={inputCls}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            onFocus={scrollFieldIntoView}
            autoComplete="address-level2"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="region">
            Region / state
          </label>
          <input
            id="region"
            name="region"
            value={form.region}
            onChange={handleChange}
            onFocus={scrollFieldIntoView}
            autoComplete="address-level1"
            autoCapitalize="words"
            className={inputCls}
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{error}</p>
      )}

      {embedded ? (
        <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-black/40 leading-relaxed">
          These details are included when you checkout on WhatsApp or Paystack.
        </p>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-4 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase disabled:opacity-40"
        >
          {loading ? 'Saving…' : submitLabel}
        </button>
      )}
    </form>
  );
};

export default DeliveryDetailsForm;
