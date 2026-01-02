// src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import TxnUploader from './components/TxnUploader';
import {
  Home, FileText, Calendar, TrendingUp, Users, Bell,
  AlertCircle, Search, Plus, Clock, LogOut, Sparkles, Target, Shield
} from 'lucide-react';

const brandColors = {
  navy: '#2A2947',
  teal: '#3BB4C1',
  magenta: '#E91E63',
  gold: '#FDB913',
  purple: '#6B5B95',
  lightBg: '#F5F7FA',
  white: '#FFFFFF',
};

export default function BeClauseApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTransaction, setActiveTransaction] = useState(null);

  const [user, setUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');

  const [txns, setTxns] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // --- bootstrap auth ---
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

  // --- load transactions for agent ---
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingTx(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('id, property_address, client_name, transaction_type, status, created_at, date_close')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setTxns(data ?? []);
      setLoadingTx(false);
    })();
  }, [user]);

  // --- Auth UI ---
  const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
      e.preventDefault();
      setError('');
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } }
      });
      if (error) { setError(error.message); return; }

      // optional profile upsert (policy must allow)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'agent',
      });

      alert('Account created! Please log in.');
      setAuthMode('login');
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: brandColors.lightBg }}>
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: brandColors.gold }}>BECLAUSE</h1>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${brandColors.teal}, ${brandColors.magenta}, ${brandColors.gold})`, borderRadius: 2, marginBottom: 20 }} />
            <p className="text-sm" style={{ color: brandColors.teal }}>BE READY. BE COMPLIANT.</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className="flex-1 py-2 rounded-lg"
              style={{
                backgroundColor: authMode === 'login' ? brandColors.teal : brandColors.lightBg,
                color: authMode === 'login' ? 'white' : brandColors.navy
              }}
            >Login</button>
            <button
              onClick={() => setAuthMode('signup')}
              className="flex-1 py-2 rounded-lg"
              style={{
                backgroundColor: authMode === 'signup' ? brandColors.teal : brandColors.lightBg,
                color: authMode === 'signup' ? 'white' : brandColors.navy
              }}
            >Sign Up</button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp}>
            {authMode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Full Name</label>
                <input className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                  value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Email</label>
              <input type="email" className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Password</label>
              <input type="password" className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold"
              style={{ backgroundColor: brandColors.magenta }}>
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Demo Mode: Account created instantly (no email verification needed)</p>
          </div>
        </div>
      </div>
    );
  };

  // --- New Transaction Modal ---
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);

  const NewTransactionModal = () => {
    const [form, setForm] = useState({
      property_address: '',
      client_name: '',
      transaction_type: 'buy', // 'buy' | 'sell'
      date_close: '',
    });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      setSaving(true);
      const { error } = await supabase.from('transactions').insert([{
        agent_id: user.id,
        property_address: form.property_address,
        client_name: form.client_name,
        transaction_type: form.transaction_type,
        status: 'active',
        date_close: form.date_close || null
      }]);
      setSaving(false);
      if (error) return alert(error.message);
      setShowNewTransactionModal(false);
      setForm({ property_address: '', client_name: '', transaction_type: 'buy', date_close: '' });

      const { data } = await supabase
        .from('transactions')
        .select('id, property_address, client_name, transaction_type, status, created_at, date_close')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
      setTxns(data ?? []);
      alert('Transaction created!');
    };

    if (!showNewTransactionModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-y-auto">
          <div className="p-6 border-b" style={{ backgroundColor: brandColors.navy }}>
            <h2 className="text-2xl font-bold text-white">New Transaction</h2>
          </div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Property Address *</label>
              <input className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                value={form.property_address} onChange={e => setForm(f => ({ ...f, property_address: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Client Name *</label>
              <input className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Type *</label>
                <select className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                  value={form.transaction_type} onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value }))}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: brandColors.navy }}>Expected Close</label>
                <input type="date" className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: brandColors.teal }}
                  value={form.date_close} onChange={e => setForm(f => ({ ...f, date_close: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" className="flex-1 px-6 py-3 rounded-lg border-2"
                onClick={() => setShowNewTransactionModal(false)}
                style={{ borderColor: brandColors.navy, color: brandColors.navy }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-6 py-3 rounded-lg text-white font-bold"
                style={{ backgroundColor: brandColors.magenta }}>
                {saving ? 'Creating…' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- Dashboard ---
  const Dashboard = () => {
    const demo = [{
      id: 'demo-1',
      property_address: '1234 Oak Street, San Francisco, CA',
      client_name: 'Sarah & John Martinez',
      transaction_type: 'buy',
      status: 'active',
      date_close: null,
      created_at: new Date().toISOString()
    }];
    const list = txns.length ? txns : demo;

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: brandColors.navy }}>Transaction Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}!</p>
          </div>
          <button
            onClick={() => setShowNewTransactionModal(true)}
            className="px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: brandColors.magenta, color: 'white' }}>
            <Plus size={20} />
            <span className="font-bold">New Transaction</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Transactions', value: txns.length.toString(), icon: Target, color: brandColors.teal },
            { label: 'Action Items Due', value: '12', icon: AlertCircle, color: brandColors.magenta },
            { label: 'Avg Compliance Score', value: '94%', icon: Shield, color: brandColors.gold },
            { label: 'Avg Days to Close', value: '28', icon: Clock, color: brandColors.purple }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <s.icon size={24} style={{ color: s.color }} />
                <span className="text-2xl font-bold" style={{ color: brandColors.navy }}>{s.value}</span>
              </div>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b" style={{ backgroundColor: brandColors.navy }}>
            <h2 className="text-xl font-bold text-white">Transactions</h2>
          </div>

          {loadingTx ? (
            <div className="p-12 text-center text-gray-500">Loading…</div>
          ) : (
            <div className="divide-y">
              {list.map((t) => (
                <div key={t.id} className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setActiveTransaction(t); setCurrentView('transaction'); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1" style={{ color: brandColors.navy }}>
                        {t.property_address}
                      </h3>
                      <p className="text-sm text-gray-600">{t.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        {t.status?.[0]?.toUpperCase() + t.status?.slice(1) || 'Active'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm" style={{
                        backgroundColor: t.transaction_type === 'buy' ? brandColors.teal : brandColors.purple,
                        color: 'white'
                      }}>
                        {t.transaction_type === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Expected Close</p>
                      <p className="text-sm font-medium" style={{ color: brandColors.navy }}>
                        {t.date_close || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="text-sm font-medium" style={{ color: brandColors.navy }}>
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
  };

  // --- Transaction Detail (with uploader) ---
  const TransactionDetail = () => {
    if (!activeTransaction) {
      setCurrentView('dashboard');
      return null;
    }

    return (
      <div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mb-4 text-sm"
          style={{ color: brandColors.teal }}
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: brandColors.navy }}>
            {activeTransaction.property_address}
          </h1>
          <p className="text-gray-600">{activeTransaction.client_name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: brandColors.navy }}>
              Upload a document for this transaction
            </h2>
            <TxnUploader transactionId={activeTransaction.id} />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-2" style={{ color: brandColors.navy }}>
              Notes
            </h3>
            <p className="text-gray-600 text-sm">
              After upload, check Supabase → Storage → <code>txn-docs</code> and the
              <code> documents</code> table for the row.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <div className="w-64 min-h-screen p-6" style={{ backgroundColor: brandColors.navy }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: brandColors.gold }}>BECLAUSE</h1>
        <p className="text-xs" style={{ color: brandColors.teal }}>BE READY. BE COMPLIANT.</p>
      </div>

      <nav className="space-y-2">
        {[
          { icon: Home, label: 'Dashboard', view: 'dashboard' },
          { icon: FileText, label: 'Documents', view: 'documents' },
          { icon: Calendar, label: 'Calendar', view: 'calendar' },
          { icon: TrendingUp, label: 'Analytics', view: 'analytics' },
          { icon: Users, label: 'Contacts', view: 'contacts' }
        ].map(item => (
          <button key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.view ? 'text-white' : 'text-gray-300 hover:text-white'
            }`}
            style={currentView === item.view ? { backgroundColor: brandColors.teal } : {}}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t" style={{ borderColor: brandColors.purple, marginTop: 200 }}>
        <button
          onClick={async () => { await supabase.auth.signOut(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white text-sm">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  const Header = () => (
    <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input className="pl-10 pr-4 py-2 border rounded-lg w-96 focus:outline-none focus:ring-2"
            style={{ borderColor: brandColors.teal }}
            placeholder="Search transactions, documents, contacts..." />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell size={20} style={{ color: brandColors.navy }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: brandColors.magenta }} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColors.purple, color: 'white' }}>
            {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
          </div>
          <span className="text-sm font-medium" style={{ color: brandColors.navy }}>
            {user?.user_metadata?.full_name || user?.email || 'User'}
          </span>
        </div>
      </div>
    </div>
  );

  if (loadingApp) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: brandColors.lightBg }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: brandColors.gold }}>BECLAUSE</h1>
          <p style={{ color: brandColors.teal }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (showAuth || !user) return <Auth />;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: brandColors.lightBg }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'transaction' && <TransactionDetail />}
          {currentView !== 'dashboard' && currentView !== 'transaction' && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Sparkles size={48} className="mx-auto mb-4" style={{ color: brandColors.teal }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: brandColors.navy }}>
                {currentView[0].toUpperCase() + currentView.slice(1)}
              </h2>
              <p className="text-gray-600">This feature is coming soon!</p>
            </div>
          )}
        </main>
      </div>

      <NewTransactionModal />
    </div>
  );
}
