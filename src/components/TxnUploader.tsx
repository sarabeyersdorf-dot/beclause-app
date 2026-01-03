// /src/components/TxnUploader.tsx
'use client';

import { useState } from 'react';
// Use your central client to avoid multiple GoTrue instances
import { supabase } from '../lib/supabase';

type Props = {
  transactionId: string;
  checklistItemId?: string | null;
};

const MAX_MB = Number(import.meta.env.VITE_MAX_FILE_MB || 25);

export default function TxnUploader({ transactionId, checklistItemId }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [err, setErr] = useState<string>();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // size guard
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`File too large (>${MAX_MB} MB).`);
      e.currentTarget.value = '';
      return;
    }

    setBusy(true);
    setErr(undefined);
    setMsg(undefined);

    try {
      // must be signed in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('You are not signed in.');
      }

      // 1) Ask edge function for a signed upload URL
      const { data: signed, error: fnErr } = await supabase.functions.invoke(
        'create-upload-url',
        { body: { transactionId, filename: file.name } }
      );
      if (fnErr) {
        // @ts-expect-error supabase error can have details from your function
        const extra = fnErr?.context ?? '';
        throw new Error(`${fnErr.message}${extra ? ` — ${extra}` : ''}`);
      }

      const { path, token } = signed as { path: string; token: string };

      // 2) Upload directly to Storage with the signed token
      const { error: upErr } = await supabase
        .storage
        .from('txn-docs')
        .uploadToSignedUrl(path, token, file);
      if (upErr) throw new Error(upErr.message);

      // 3) Insert the document row (RLS must allow this)
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Could not determine current user.');

      // IMPORTANT: your table requires `document_name` (NOT NULL)
      // If your schema ALSO has `filename`, you can keep it. If it doesn't, remove it.
      const { error: docErr } = await supabase.from('documents').insert({
        transaction_id: transactionId,
        uploaded_by: userId,
        storage_path: path,
        document_name: file.name,     // <-- required by your schema
        // filename: file.name,       // <-- leave commented if your table does NOT have this column
        mime_type: file.type || null,
        size_bytes: file.size,
        checklist_item_id: checklistItemId ?? null,
      });
      if (docErr) throw new Error(docErr.message);

      setMsg('Uploaded ✔');
    } catch (e: any) {
      setErr(e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
      // allow re-selecting the same file
      e.currentTarget.value = '';
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
      {msg && <p>{msg}</p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </div>
  );
}
