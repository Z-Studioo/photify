import { useState, useEffect } from 'react';
import { Loader2, Save, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import {
  STORE_STATUS_KEY,
  DEFAULT_STORE_STATUS,
  parseStoreStatus,
  isStoreCurrentlyClosed,
  formatReopenDate,
} from '@/lib/store-status';

/**
 * Admin card for opening/closing the store. Saving writes the public
 * `store_status` row in `site_settings`; the storefront shows a closed
 * screen and the API rejects new orders while the store is closed.
 */
export function StoreStatusCard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);
  const [reopenDate, setReopenDate] = useState('');
  const [message, setMessage] = useState('');
  // What's actually saved in the DB, to show a live Open/Closed badge that
  // doesn't move while the admin edits the form.
  const [savedStatus, setSavedStatus] = useState(DEFAULT_STORE_STATUS);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', STORE_STATUS_KEY)
          .maybeSingle();
        if (error) throw error;

        const status = data
          ? parseStoreStatus(data.setting_value)
          : DEFAULT_STORE_STATUS;
        setClosed(status.closed);
        setReopenDate(status.reopen_date ?? '');
        setMessage(status.message);
        setSavedStatus(status);
      } catch (error: any) {
        toast.error('Failed to load store status: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const status = {
        closed,
        reopen_date: reopenDate || null,
        message: message.trim(),
      };
      const { error } = await supabase.from('site_settings').upsert(
        {
          setting_key: STORE_STATUS_KEY,
          setting_value: status,
          category: 'general',
          description:
            'Store open/closed status. When closed, the storefront shows a closed screen and the API rejects new orders.',
          is_public: true,
        },
        { onConflict: 'setting_key' }
      );
      if (error) throw error;

      setSavedStatus(status);
      toast.success(
        status.closed
          ? 'Store closed — customers now see the closed screen.'
          : 'Store is open for orders.'
      );
    } catch (error: any) {
      toast.error('Failed to save store status: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const currentlyClosed = isStoreCurrentlyClosed(savedStatus);
  const reopenLabel =
    closed && reopenDate ? formatReopenDate(reopenDate) : null;

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <Store className='w-5 h-5 text-[#f63a9e]' />
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif]"
            style={{ fontSize: '20px', fontWeight: '600' }}
          >
            Store Status
          </h2>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            currentlyClosed
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {currentlyClosed ? 'Closed' : 'Open'}
        </span>
      </div>

      {loading ? (
        <div className='py-6 text-center text-gray-500'>
          <Loader2 className='w-5 h-5 animate-spin mx-auto mb-2' />
          Loading store status...
        </div>
      ) : (
        <div className='space-y-5'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>Close the store</p>
              <p className='text-sm text-gray-600'>
                Customers see a &ldquo;temporarily closed&rdquo; screen and new
                orders are rejected. Existing orders are unaffected.
              </p>
            </div>
            <Switch checked={closed} onCheckedChange={setClosed} />
          </div>

          {closed && (
            <>
              <div>
                <Label htmlFor='reopenDate'>Reopen date</Label>
                <Input
                  id='reopenDate'
                  type='date'
                  value={reopenDate}
                  onChange={e => setReopenDate(e.target.value)}
                  className='mt-1'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  {reopenLabel
                    ? `Shown to customers — the store reopens automatically on ${reopenLabel}.`
                    : 'Optional. If set, it is shown to customers and the store reopens automatically on that day.'}
                </p>
              </div>

              <div>
                <Label htmlFor='closedMessage'>Message (optional)</Label>
                <Textarea
                  id='closedMessage'
                  placeholder="e.g. We're away for a short break — back soon!"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                  className='mt-1'
                />
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
          >
            {saving ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='w-4 h-4' />
                Save Store Status
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
