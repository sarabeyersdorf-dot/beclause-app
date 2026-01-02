// inside TxnUploader.tsx -> onFile()
const { data: { session } } = await supabase.auth.getSession();
const userToken = session?.access_token;
if (!userToken) { setError('No session'); setBusy(false); return; }

const res = await fetch(`${SUPA_URL}/functions/v1/create-upload-url`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // ⬇️ Gateway expects ANON key here
    'Authorization': `Bearer ${SUPA_ANON}`,
    'apikey': SUPA_ANON,
    // ⬇️ Send the user JWT in a separate header
    'x-supabase-auth': userToken,
  },
  body: JSON.stringify({ transactionId, filename: file.name }),
});
