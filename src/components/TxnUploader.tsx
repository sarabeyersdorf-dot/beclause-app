const { data: { session } } = await supabase.auth.getSession();
const userJwt = session?.access_token;
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL!;
const ANON     = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const res = await fetch(`${SUPA_URL}/functions/v1/create-upload-url`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON}`,  // ANON
    'apikey': ANON,                      // ANON
    'x-supabase-auth': userJwt!,         // USER JWT
  },
  body: JSON.stringify({ transactionId, filename: file.name }),
});
