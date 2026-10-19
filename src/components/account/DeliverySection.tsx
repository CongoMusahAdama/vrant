import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import DeliveryDetailsForm from './DeliveryDetailsForm';
import type { DeliveryDetails } from '@/types/customer';
import { getDeliveryFromUser, isDeliveryComplete, deliveryToAddressPayload } from '@/lib/delivery';
import type { AuthUser } from '@/types/customer';
import { apiFetch } from '@/lib/api';
import { sweetSuccess, sweetError } from '@/lib/sweet-alert';

type DeliverySectionProps = {
  user: AuthUser | null;
  token: string | null;
  onSaved: () => Promise<void>;
};

function formatSavedDelivery(d: DeliveryDetails) {
  if (d.deliveryMethod === 'pickup') {
    return `${d.pickupStation} · ${d.city}, ${d.region}, ${d.country}`;
  }
  return `${d.street}, ${d.city}, ${d.region}, ${d.country}`;
}

const DeliverySection = ({ user, token, onSaved }: DeliverySectionProps) => {
  const savedDelivery = getDeliveryFromUser(user);
  const hasSaved = savedDelivery && isDeliveryComplete(savedDelivery);
  const [editing, setEditing] = useState(!hasSaved);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!hasSaved) setEditing(true);
  }, [hasSaved]);

  const handleSave = async (delivery: DeliveryDetails) => {
    if (!token) return;
    setSaving(true);
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify(deliveryToAddressPayload(delivery)),
      });
      await onSaved();
      setEditing(false);
      setFormKey((k) => k + 1);
      sweetSuccess('Delivery updated', 'Your new details will be used at checkout.');
    } catch (e) {
      sweetError('Could not save', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setFormKey((k) => k + 1);
    setEditing(true);
  };

  return (
    <section className="w-full max-w-lg">
      {hasSaved && !editing && (
        <div className="mb-5 p-4 sm:p-5 border border-black bg-[#fafafa]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
                Saved delivery / pickup
              </p>
              <p className="text-[10px] font-bold uppercase text-black leading-relaxed">
                {savedDelivery.deliveryMethod === 'pickup' ? 'Pickup' : 'Home delivery'}
              </p>
              <p className="text-[9px] font-bold text-black/60 mt-1 leading-relaxed break-words">
                {formatSavedDelivery(savedDelivery)}
              </p>
              <p className="text-[9px] font-bold text-black/45 mt-2 break-all">
                {savedDelivery.fullName} · {savedDelivery.phone}
              </p>
            </div>
            <button
              type="button"
              onClick={startEdit}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 border border-black px-4 py-3 min-h-[48px] text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white active:bg-black active:text-white transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Change
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div>
          {hasSaved && (
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-black/50 mb-4">
              Update your delivery or pickup details below.
            </p>
          )}
          <DeliveryDetailsForm
            key={formKey}
            initial={savedDelivery}
            onSubmit={handleSave}
            submitLabel={hasSaved ? 'Update delivery details' : 'Save delivery details'}
            loading={saving}
          />
          {hasSaved && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mt-3 w-full border border-black/20 py-3 min-h-[48px] text-[10px] font-bold tracking-[0.15em] uppercase text-black/50 hover:text-black active:bg-black/[0.03]"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default DeliverySection;
