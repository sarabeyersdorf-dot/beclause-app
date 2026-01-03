// src/components/TxnUploader.tsx
'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL!;
const SUPA_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const MAX_MB    = Number(import.meta.env.VITE_MAX_FILE_MB || 25);

// Supabase browser client
const supabase = createClient(SUPA_URL, SUPA_ANON);

export default function TxnUploader({
  transactionId,
  checklistItemId,
}: {
  transactionId: string;
  checklistItemId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState<string>();
  const [err, setErr]   = useState<string>();

  // <-- THIS is the onFile handler
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`File too large (>${MAX_MB}MB)`); return;
    }

    setBusy(true); setErr(undefined); setMsg(undefined);

    try {
      // Must be logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not signed in');

      // 1) Call your Edge Function using the SDK (auto-attaches user JWT)
      const { data: signed, error: fnErr } = await supabase.functions.invoke(
        'create-upload-url',
        { body: { transactionId, filename: file.name } }
      );
      if (fnErr) throw fnErr;
      const { path, token } = signed as { path: string; token: string };

      // 2) Upload to Storage with the signed token
      const { error: upErr } = await supabase
        .storage.from('txn-docs')
        .uploadToSignedUrl(path, token, file);
      if (upErr) throw upErr;

      // 3) Insert a row in documents (RLS must allow it)
      const { data: { user } } = await supabase.auth.getUser();
      const { error: docErr } = await supabase.from('documents').insert({
        transaction_id: transactionId,
        uploaded_by: user!.id,
        storage_path: path,
        filename: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        checklist_item_id: checklistItemId ?? null,
      });
      if (docErr) throw docErr;

      setMsg('Uploaded ✔');
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.currentTarget.value = ''; // allow re-selecting same file
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        onChange={onFile}     // <-- wired here
        disabled={busy}
      />
      {busy && <p>Uploading…</p>}
      {msg && <p>{msg}</p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </div>
  );
}
