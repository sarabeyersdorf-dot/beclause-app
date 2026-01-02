'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const SUPA_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_ANON =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAX_MB =
  Number((import.meta as any).env?.VITE_MAX_FILE_MB || process.env.NEXT_PUBLIC_MAX_FILE_MB || 25);

const supabase = createClient(SUPA_URL!, SUPA_ANON!);

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
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large (>${MAX_MB}MB)`); return;
    }
    setBusy(true); setError(undefined); setDone(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;
      if (!token || !userId) throw new Error('Not signed in');

      // 1) Edge Function to get signed upload URL
      const res = await fetch(`${SUPA_URL}/functions/v1/create-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPA_ANON!,
        },
        body: JSON.stringify({ transactionId, filename: file.name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { path, token: signedToken } = await res.json();

      // 2) Upload file to Storage using signed URL
      const { error: upErr } = await supabase
        .storage.from('txn-docs')
        .uploadToSignedUrl(path, signedToken, file);
      if (upErr) throw upErr;

      // 3) Insert document row (RLS requires uploaded_by)
      const { error: docErr } = await supabase.from('documents').insert({
        transaction_id: transactionId,
        uploaded_by: userId,
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
