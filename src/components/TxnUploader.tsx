// /src/components/TxnUploader.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL!;
const SUPA_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const UPLOAD_MODE = (import.meta.env.VITE_UPLOAD_MODE || 'demo').toLowerCase(); // 'demo' | 'edge'
const MAX_MB = Number(import.meta.env.VITE_MAX_FILE_MB || 25);

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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`File too large (>${MAX_MB}MB)`); 
      return;
    }

    setBusy(true); setErr(undefined); setMsg(undefined);

    try {
      // Must be logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not signed in');

      // Decide path
      const { data: { user } } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^\w.\-]/g, '_');
      const basePath = `transaction_${transactionId}/user_${user!.id}`;
      const objectPath = `${basePath}/${crypto.randomUUID()}_${safeName}`;

      if (UPLOAD_MODE === 'edge') {
        // Your original Edge flow (kept so we can flip back later)
        const { data: signed, error: fnErr } = await supabase.functions.invoke(
          'create-upload-url',
          { body: { transactionId, filename: file.name } }
        );
        if (fnErr) throw fnErr;
        const { path, token } = signed as { path: string; token: string };

        const { error: upErr } = await supabase
          .storage.from('txn-docs')
          .uploadToSignedUrl(path, token, file);
        if (upErr) throw upErr;

        await insertDocRow(path, file);
      } else {
        // === DEMO MODE: Direct upload to Storage (no Edge Function) ===
        const { error: upErr } = await supabase
          .storage.from('txn-docs')
          .upload(objectPath, file, { upsert: false });
        if (upErr) throw upErr;

        await insertDocRow(objectPath, file);
      }

      setMsg('Uploaded ✔');
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      input.value = ''; // allow reselecting same file
    }
  }

  async function insertDocRow(path: string, file: File) {
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
      {msg && <p>{msg}</p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}
      <small style={{opacity:.6}}>
        Mode: <code>{UPLOAD_MODE}</code>
      </small>
    </div>
  );
}
