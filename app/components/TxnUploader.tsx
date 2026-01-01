'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TxnUploader({ transactionId, checklistItemId }: { transactionId: string; checklistItemId?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > (Number(process.env.NEXT_PUBLIC_MAX_FILE_MB || 25) * 1024 * 1024)) {
      setError('File too large'); return;
    }
    setBusy(true); setError(undefined); setDone(false);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setError('No session'); setBusy(false); return; }

    // 1) create-upload-url (POST)
const res = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-upload-url`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // required for functions from browser
    },
    body: JSON.stringify({ transactionId, filename: file.name }),
  }
);

    if (!res.ok) { setError('Cannot get upload URL'); setBusy(false); return; }
    const { path, token: signedToken } = await res.json();

    // 2) upload directly to Storage
    const { error: upErr } = await supabase.storage.from('txn-docs').uploadToSignedUrl(path, signedToken, file);
    if (upErr) { setError(upErr.message); setBusy(false); return; }

    // 3) register document row
    const { error: docErr } = await supabase.from('documents').insert({
      transaction_id: transactionId,
      storage_path: path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      checklist_item_id: checklistItemId ?? null
    });
    if (docErr) { setError(docErr.message); setBusy(false); return; }

    setDone(true); setBusy(false);
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={onFile} disabled={busy} />
      {busy && <p>Uploading…</p>}
      {done && <p>Uploaded ✔</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
