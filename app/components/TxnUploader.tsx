'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TxnUploader({
  transactionId,
  checklistItemId,
}: {
  transactionId: string;
  checklistItemId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > (Number(process.env.NEXT_PUBLIC_MAX_FILE_MB || 25) * 1024 * 1024)) {
      setError('File too large');
      return;
    }

    setBusy(true);
    setError(undefined);
    setDone(false);

    try {
      // session + user
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;
      if (!token || !userId) throw new Error('Not signed in');

      // 1) create-upload-url (Edge Function)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-upload-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // required when calling from browser
          },
          body: JSON.stringify({ transactionId, filename: file.name }),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload URL error (${res.status}): ${txt}`);
      }
      const { path, token: signedToken } = await res.json();

      // 2) upload directly to Storage
      const { error: upErr } = await supabase.storage
        .from('txn-docs')
        .uploadToSignedUrl(path, signedToken, file);
      if (upErr) throw upErr;

      // 3) register document row (RLS requires uploaded_by = auth.uid())
      const { error: docErr } = await supabase.from('documents').insert({
        transaction_id: transactionId,
        uploaded_by: userId,                 // <-- IMPORTANT
        storage_path: path,
        filename: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        checklist_item_id: checklistItemId ?? null,
      });
      if (docErr) throw docErr;

      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        onChange={onFile}
        disabled={busy}
      />
      {busy && <p>Uploading…</p>}
      {done && <p>Uploaded ✔</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
