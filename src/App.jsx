// src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import TxnUploader from './components/TxnUploader';
import {
  Home, FileText, Calendar, TrendingUp, Users, Bell,
  AlertCircle, Search, Plus, LogOut, Sparkles, Target, Shield, Clock
} from 'lucide-react';

const brand = {
  navy: '#2A2947',
  teal: '#3BB4C1',
  magenta: '#E91E63',
  gold: '#FDB913',
  purple: '#6B5B95',
  lightBg: '#F5F7FA',
};

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'transaction'
  const [user, setUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [showAuth, setShowAuth] = useState(true);

  const [txns, setTxns] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [activeTxn, setActiveTxn] = useState(null);

  const [showNewTxn, setShowNewTxn] = useState(false);

  // ---------- Bootstrap auth ----------
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
      setLoadingApp(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---------- Load transactions once logged in ----------
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingTx(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('id, property_address, client_name, transaction_type, status, date_close, created_at')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setTxns(data ?? []);
      setLoadingTx(false);
    })();
  }, [user]);

  // ---------- Auth UI ----------
  function Auth() {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [err, setErr] = useState('');

    const signUp = async (e) => {
      e.preventDefault(); setErr('');
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } }
      });
      if (error) return setErr(error.message);

      // Create/ensure profile row (RLS should allow upsert by owner)
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'agent',
        });
      }
      alert('Account created! Please log in.'); setMode('login');
    };

    const login = async (e) => {
      e.preventDefault(); setErr('');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: brand.lightBg }}>
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: brand.gold }}>BECLAUSE</h1>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${brand.teal}, ${brand.magenta}, ${brand.gold})`, borderRadius: 2, marginBottom: 20 }} />
            <p className="text-sm" style={{ color: brand.teal }}>BE READY. BE COMPLIANT.</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className="flex-1 py-2 rounded-lg"
              style={{ background: mode === 'login' ? brand.teal : brand.lightBg, color: mode === 'login' ? 'white' : brand.navy }}
            >Login</button>
            <button
              onClick={() => setMode('signup')}
              className="flex-1 py-2 rounded-lg"
              style={{ background: mode === 'signup' ? brand.teal : brand.lightBg, color: mode === 'signup' ? 'white' : brand.navy }}
            >Sign Up</button>
          </div>

          <form onSubmit={mode === 'login' ? login : signUp}>
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: brand.navy }}>Full Name</label>
                <input className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                  value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: brand.navy }}>Email</label>
              <input type="email" className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-2" style={{ color: brand.navy }}>Password</label>
              <input type="password" className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ background: brand.magenta }}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- New Transaction Modal ----------
  function NewTxnModal() {
    const [form, setForm] = useState({
      property_address: '',
      client_name: '',
      transaction_type: 'buy', // buy | sell
      date_close: '',
    });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
      e.preventDefault(); setSaving(true);
      const { error } = await supabase.from('transactions').insert([{
        agent_id: user.id,
        property_address: form.property_address,
        client_name: form.client_name,
        transaction_type: form.transaction_type, // constraint expects 'buy' or 'sell'
        status: 'active',
        date_close: form.date_close || null,
      }]);
      setSaving(false);
      if (error) return alert(error.message);

      // refresh list
      const { data } = await supabase
        .from('transactions')
        .select('id, property_address, client_name, transaction_type, status, date_close, created_at')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
      setTxns(data ?? []);
      setShowNewTxn(false);
      setForm({ property_address: '', client_name: '', transaction_type: 'buy', date_close: '' });
      alert('Transaction created!');
    };

    if (!showNewTxn) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-y-auto">
          <div className="p-6 border-b" style={{ background: brand.navy }}>
            <h2 className="text-2xl font-bold text-white">New Transaction</h2>
          </div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: brand.navy }}>Property Address *</label>
              <input className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                value={form.property_address} onChange={e => setForm(f => ({ ...f, property_address: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: brand.navy }}>Client Name *</label>
              <input className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: brand.navy }}>Type *</label>
                <select className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                  value={form.transaction_type} onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value }))}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: brand.navy }}>Expected Close</label>
                <input type="date" className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brand.teal }}
                  value={form.date_close} onChange={e => setForm(f => ({ ...f, date_close: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="flex-1 px-6 py-3 rounded-lg border-2"
                onClick={() => setShowNewTxn(false)}
                style={{ borderColor: brand.navy, color: brand.navy }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-6 py-3 rounded-lg text-white font-bold"
                style={{ background: brand.magenta }}>
                {saving ? 'Creating…' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Dashboard ----------
  function Dashboard() {
    const list = txns;

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: brand.navy }}>Transaction Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}!</p>
          </div>
          <button
            onClick={() => setShowNewTxn(true)}
            className="px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl"
            style={{ background: brand.magenta, color: 'white' }}>
            <Plus size={20} />
            <span className="font-bold">New Transaction</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Transactions', value: list.length.toString(), icon: Target, color: brand.teal },
            { label: 'Action Items Due', value: '—', icon: AlertCircle, color: brand.magenta },
            { label: 'Avg Compliance Score', value: '—', icon: Shield, color: brand.gold },
            { label: 'Avg Days to Close', value: '—', icon: Clock, color: brand.purple }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <s.icon size={24} style={{ color: s.color }} />
                <span className="text-2xl font-bold" style={{ color: brand.navy }}>{s.value}</span>
              </div>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b" style={{ background: brand.navy }}>
            <h2 className="text-xl font-bold text-white">Transactions</h2>
          </div>

          {loadingTx ? (
            <div className="p-12 text-center text-gray-500">Loading…</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles size={48} className="mx-auto mb-4" style={{ color: brand.teal }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: brand.navy }}>No transactions yet</h3>
              <p className="text-gray-600 mb-4">Create your first deal to get started.</p>
              <button
                onClick={() => setShowNewTxn(true)}
                className="px-6 py-3 rounded-lg"
                style={{ background: brand.teal, color: 'white' }}>
                Create First Transaction
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {list.map((t) => (
                <div key={t.id} className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setActiveTxn(t); setView('transaction'); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1" style={{ color: brand.navy }}>
                        {t.property_address}
                      </h3>
                      <p className="text-sm text-gray-600">{t.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        {t.status?.[0]?.toUpperCase() + t.status?.slice(1) || 'Active'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm" style={{
                        background: t.transaction_type === 'buy' ? brand.teal : brand.purple,
                        color: 'white'
                      }}>
                        {t.transaction_type === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Expected Close</p>
                      <p className="text-sm font-medium" style={{ color: brand.navy }}>
                        {t.date_close || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="text-sm font-medium" style={{ color: brand.navy }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Transaction Detail ----------
  function TransactionDetail() {
    if (!activeTxn) return null;
    return (
      <div>
        <button onClick={() => setView('dashboard')} className="mb-4 text-sm" style={{ color: brand.teal }}>
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: brand.navy }}>{activeTxn.property_address}</h1>
          <p className="text-gray-600">{activeTxn.client_name} • {activeTxn.transaction_type === 'buy' ? 'Buy' : 'Sell'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-3" style={{ color: brand.navy }}>Upload documents</h2>
          {/* ⬇️ Uploader wired here */}
          <TxnUploader transactionId={activeTxn.id} />
        </div>
      </div>
    );
  }

  function Sidebar() {
    return (
      <div className="w-64 min-h-screen p-6" style={{ background: brand.navy }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: brand.gold }}>BECLAUSE</h1>
          <p className="text-xs" style={{ color: brand.teal }}>BE READY. BE COMPLIANT.</p>
        </div>

        <nav className="space-y-2">
          {[
            { icon: Home, label: 'Dashboard', v: 'dashboard' },
            { icon: FileText, label: 'Documents', v: 'documents' },
            { icon: Calendar, label: 'Calendar', v: 'calendar' },
            { icon: TrendingUp, label: 'Analytics', v: 'analytics' },
            { icon: Users, label: 'Contacts', v: 'contacts' },
          ].map(i => (
            <button key={i.v}
              onClick={() => setView(i.v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === i.v ? 'text-white' : 'text-gray-300 hover:text-white'}`}
              style={view === i.v ? { background: brand.teal } : {}}
            >
              <i.icon size={20} />
              <span className="text-sm font-medium">{i.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t" style={{ borderColor: brand.purple, marginTop: 200 }}>
          <button
            onClick={async () => { await supabase.auth.signOut(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white text-sm">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    );
  }

  function Header() {
    return (
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input className="pl-10 pr-4 py-2 border rounded-lg w-96 focus:outline-none focus:ring-2"
              style={{ borderColor: brand.teal }}
              placeholder="Search transactions, documents, contacts..." />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell size={20} style={{ color: brand.navy }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: brand.magenta }} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: brand.purple, color: 'white' }}>
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <span className="text-sm font-medium" style={{ color: brand.navy }}>
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  if (loadingApp) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: brand.lightBg }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: brand.gold }}>BECLAUSE</h1>
          <p style={{ color: brand.teal }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (showAuth || !user) return <Auth />;

  return (
    <div className="flex min-h-screen" style={{ background: brand.lightBg }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {view === 'dashboard' && <Dashboard />}
          {view === 'transaction' && <TransactionDetail />}
          {!['dashboard', 'transaction'].includes(view) && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Sparkles size={48} className="mx-auto mb-4" style={{ color: brand.teal }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>
                {view[0].toUpperCase() + view.slice(1)}
              </h2>
              <p className="text-gray-600">This feature is coming soon!</p>
            </div>
          )}
        </main>
      </div>
      <NewTxnModal />
    </div>
  );
}
