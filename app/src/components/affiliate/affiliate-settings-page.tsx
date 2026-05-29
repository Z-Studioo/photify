import { useEffect, useState } from 'react';
import { AffiliateLayout } from './affiliate-layout';
import { affiliateFetch } from './affiliate-api';
import { useAffiliate } from '@/context/AffiliateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const METHODS = [
  { id: 'bank_transfer', label: 'Bank transfer (UK)' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'wise', label: 'Wise' },
  { id: 'other', label: 'Other' },
];

export function AffiliateSettingsPage() {
  const { affiliate, refresh, getAccessToken } = useAffiliate();
  const [name, setName] = useState(affiliate?.name || '');
  const [method, setMethod] = useState(affiliate?.payout_method || 'bank_transfer');
  const [details, setDetails] = useState<Record<string, string>>(
    (affiliate?.payout_details as Record<string, string>) || {}
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(affiliate?.name || '');
    setMethod(affiliate?.payout_method || 'bank_transfer');
    setDetails((affiliate?.payout_details as Record<string, string>) || {});
  }, [affiliate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getAccessToken();
      await affiliateFetch('/api/affiliates/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name,
          payout_method: method,
          payout_details: details,
        }),
      });
      await refresh();
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const detailFields = method === 'bank_transfer'
    ? [
        { key: 'account_name', label: 'Account holder' },
        { key: 'sort_code', label: 'Sort code' },
        { key: 'account_number', label: 'Account number' },
      ]
    : method === 'paypal'
      ? [{ key: 'paypal_email', label: 'PayPal email' }]
      : method === 'wise'
        ? [{ key: 'wise_email', label: 'Wise email' }]
        : [{ key: 'notes', label: 'Payout instructions' }];

  return (
    <AffiliateLayout>
      <div className='space-y-6 max-w-2xl'>
        <div>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
            style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Settings
          </h2>
          <p className='text-gray-500 mt-1'>
            Update your profile and how you&apos;d like to receive payouts.
          </p>
        </div>

        <div className='bg-white border border-gray-200 rounded-xl p-6 space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Display name</Label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              className='max-w-sm'
            />
          </div>

          <div className='space-y-2'>
            <Label>Email</Label>
            <Input value={affiliate?.email || ''} disabled className='max-w-sm bg-gray-50' />
            <p className='text-xs text-gray-500'>Contact support to change your email.</p>
          </div>

          <div className='space-y-2'>
            <Label>Referral code</Label>
            <Input value={affiliate?.code || '—'} disabled className='max-w-xs bg-gray-50 font-mono' />
          </div>

          <hr className='border-gray-200' />

          <div className='space-y-2'>
            <Label htmlFor='method'>Payout method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id='method' className='max-w-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid sm:grid-cols-2 gap-4'>
            {detailFields.map(f => (
              <div key={f.key} className='space-y-2'>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={details[f.key] || ''}
                  onChange={e => setDetails({ ...details, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className='pt-2'>
            <Button
              onClick={handleSave}
              disabled={saving}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </AffiliateLayout>
  );
}
