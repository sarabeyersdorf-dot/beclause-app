// /src/components/TxnUploader.tsx
'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase'; // <-- use ONE shared client

// Config via Vite envs (set these in Vercel too)
const MAX_MB = Number(import.meta.env.VITE_MAX_FILE_MB || 25);
// 'demo' = direct Storage upload (no Edge), 'edge' = use create-upload-url function
const UPLOAD_MODE = String(import.meta.env.VITE_UPLOAD_MODE || 'demo').toLowerCase(); // 'demo' | 'edge'

// Helper: build a safe object path inside the 'txn-docs' bucket
function buildObjectPath(transactionId: string, userId: string, filename: string) {
  const safeName = filename.replace(/[^\w.\-]/g, '_');
  const base = `transaction_${transactionId}/user_${userId}`;
  const id = (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
  return `${base}/${id}_${safeName}`;
}

export default function TxnUploader(props: { transactionId: string; checklistItemId?: string }) {
  const { transactionId, checklistItemId } = props;

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [err, setErr] = useState<string>();

  // Insert a row in public.documents
  async function insertDocRow(path: string, file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('No user');

    // Build payload; only include checklist_item_id if provided
    const payload: Record<string, any> = {
      transaction_id: transactionId,
      uploaded_by: user.id,
      storage_path: path,
      filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    };
    if (typeof checklistItemId === 'string') {
      payload.checklist_item_id = checklistItemId; // omit if undefined to avoid schema cache errors
    }

    const { error } = await supabase.from('documents').insert(payload);
    if (error) throw error;
  }

  // Fixed handler: keep a reference to the <input> BEFORE awaits
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget; // keep DOM ref so we can reset after awaits
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`File too large (>${MAX_MB}MB)`); 
      return;
    }

    setBusy(true);
    setErr(undefined);
    setMsg(undefined);

    try {
      // Must be logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not signed in');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('No user');

      if (UPLOAD_MODE === 'edge') {
        // === Secure mode: use Edge Function to get a signed upload token ===
        const { data: signed, error: fnErr } = await supabase.functions.invoke(
          'create-upload-url',
          { body: { transactionId, filename: file.name } }
        );
        if (fnErr) throw fnErr;

        const { path, token } = signed as { path: string; token: string };

        // Upload to Storage using the signed token
        const { error: upErr } = await supabase
          .storage.from('txn-docs')
          .uploadToSignedUrl(path, token, file);
        if (upErr) throw upErr;

        // Record in DB
        await insertDocRow(path, file);
      } else {
        // === Demo mode: direct upload to Storage (no Edge Function) ===
        const objectPath = buildObjectPath(transactionId, user.id, file.name);

        const { error: upErr } = await supabase
          .storage.from('txn-docs')
          .upload(objectPath, file, { upsert: false });
        if (upErr) throw upErr;

        await insertDocRow(objectPath, file);
      }

      setMsg('Uploaded ✔');
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
      // Optional: console.error for deeper diagnostics
      // console.error('Upload error:', e);
    } finally {
      setBusy(false);
      input.value = ''; // allow re-selecting the same file
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input
        type="file"
        onChange={onFile}
        disabled={busy}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
      />
      {busy && <p>Uploading…</p>}
      {msg && <p>{msg}</p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}
      <small style={{ opacity: 0.6 }}>Mode: <code>{UPLOAD_MODE}</code></small>
    </div>
  );
}
