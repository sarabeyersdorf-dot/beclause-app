// Connected to Supabase
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Home, FileText, MessageSquare, TrendingUp, Users, Bell, CheckSquare, AlertCircle, Search, Plus, Upload, Send, Bot, Clock, Award, DollarSign, ChevronRight, ChevronDown, Eye, Download, Settings, LogOut, Sparkles, Target, Shield, BookOpen } from 'lucide-react';

const brandColors = {
  navy: '#2A2947',
  teal: '#3BB4C1',
  magenta: '#E91E63',
  gold: '#FDB913',
  purple: '#6B5B95',
  lightBg: '#F5F7FA',
  white: '#FFFFFF'
};

// TEMPORARY: Hardcoded values for testing
const supabaseUrl = 'https://ureqqhxodmgchupvzmoa.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZXFxaHhvZG1nY2h1cHZ6bW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzE1NjgsImV4cCI6MjA1MTIwNzU2OH0.cKt4_wNC9kcPHZsvpCQIlU6lKaHJsLlkX_LrJf0cAVU';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected!');
} else {
  console.warn('⚠️ Supabase env vars not found - running in demo mode');
}

const BeClausePlatform = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAICopilot, setShowAICopilot] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [userRole, setUserRole] = useState('agent');
  
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');

  // Check if user is logged in
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const transactions = [
    {
      id: 1,
      address: '1234 Oak Street, San Francisco, CA 94102',
      type: 'Buy-Side',
      status: 'Active',
      client: 'Sarah & John Martinez',
      closeDate: '2025-02-15',
      progress: 65,
      riskLevel: 'low',
      nextMilestone: 'Inspection Contingency Removal',
      daysUntil: 3,
      missingDocs: 2,
      complianceScore: 92
    },
    {
      id: 2,
      address: '5678 Pine Avenue, Oakland, CA 94610',
      type: 'Sell-Side',
      status: 'Pending',
      client: 'Michael Chen',
      closeDate: '2025-01-28',
      progress: 85,
      riskLevel: 'medium',
      nextMilestone: 'Final Walkthrough',
      daysUntil: 7,
      missingDocs: 1,
      complianceScore: 88
    }
  ];

  // Auth Component
  const AuthView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
      e.preventDefault();
      setError('');
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        
        if (error) throw error;
        
        // Create profile
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'agent'
          });
        }
        
        alert('Account created! You can now login.');
        setAuthMode('login');
      } catch (error) {
        setError(error.message);
      }
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
      } catch (error) {
        setError(error.message);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: brandColors.lightBg }}>
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: brandColors.gold }}>BECLAUSE</h1>
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${brandColors.teal}, ${brandColors.magenta}, ${brandColors.gold})`, marginBottom: '20px', borderRadius: '2px' }}></div>
            <p className="text-sm" style={{ color: brandColors.teal }}>BE READY. BE COMPLIANT.</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className="flex-1 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: authMode === 'login' ? brandColors.teal : brandColors.lightBg,
                color: authMode === 'login' ? 'white' : brandColors.navy
              }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className="flex-1 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: authMode === 'signup' ? brandColors.teal : brandColors.lightBg,
                color: authMode === 'signup' ? 'white' : brandColors.navy
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp}>
            {authMode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: brandColors.navy }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: brandColors.teal }}
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: brandColors.navy }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: brandColors.teal }}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: brandColors.navy }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: brandColors.teal }}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-white font-bold"
              style={{ backgroundColor: brandColors.magenta }}
            >
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

  const AICopilot = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6" style={{ borderLeft: `4px solid ${brandColors.magenta}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot size={24} style={{ color: brandColors.magenta }} />
          <h3 className="text-lg font-bold" style={{ color: brandColors.navy }}>AI Copilot</h3>
          <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: brandColors.gold, color: brandColors.navy }}>Active</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF3F2', borderLeft: `3px solid ${brandColors.magenta}` }}>
          <p className="text-sm" style={{ color: brandColors.navy }}>Martinez transaction progressing smoothly. Consider sending celebration update to clients.</p>
          <button className="mt-2 px-3 py-1 text-xs rounded" style={{ backgroundColor: brandColors.teal, color: 'white' }}>Send Update</button>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: brandColors.navy }}>Transaction Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}!</p>
        </div>
        <button className="px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg" style={{ backgroundColor: brandColors.magenta, color: 'white' }}>
          <Plus size={20} />
          <span className="font-bold">New Transaction</span>
        </button>
      </div>

      <AICopilot />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Transactions', value: '8', icon: Target, color: brandColors.teal },
          { label: 'Action Items Due', value: '12', icon: AlertCircle, color: brandColors.magenta },
          { label: 'Avg Compliance Score', value: '94%', icon: Shield, color: brandColors.gold },
          { label: 'Avg Days to Close', value: '28', icon: Clock, color: brandColors.purple }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={24} style={{ color: stat.color }} />
              <span className="text-2xl font-bold" style={{ color: brandColors.navy }}>{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b" style={{ backgroundColor: brandColors.navy }}>
          <h2 className="text-xl font-bold text-white">Active Transactions</h2>
        </div>
        <div className="divide-y">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => {
              setActiveTransaction(transaction);
              setCurrentView('transaction-detail');
            }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1" style={{ color: brandColors.navy }}>{transaction.address}</h3>
                  <p className="text-sm text-gray-600">{transaction.client}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {transaction.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm" style={{ 
                    backgroundColor: transaction.type === 'Buy-Side' ? brandColors.teal : brandColors.purple,
                    color: 'white'
                  }}>
                    {transaction.type}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Next Milestone</p>
                  <p className="text-sm font-medium" style={{ color: brandColors.navy }}>{transaction.nextMilestone}</p>
                  <p className="text-xs" style={{ color: brandColors.magenta }}>Due in {transaction.daysUntil} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Close Date</p>
                  <p className="text-sm font-medium" style={{ color: brandColors.navy }}>{transaction.closeDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Compliance Score</p>
                  <p className="text-sm font-bold" style={{ 
                    color: transaction.complianceScore >= 90 ? brandColors.teal : brandColors.gold
                  }}>{transaction.complianceScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Missing Docs</p>
                  <p className="text-sm font-bold" style={{ color: brandColors.magenta }}>{transaction.missingDocs}</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ 
                  width: `${transaction.progress}%`,
                  backgroundColor: brandColors.teal
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TransactionDetailView = () => {
    if (!activeTransaction) return <DashboardView />;
    
    return (
      <div>
        <button onClick={() => setCurrentView('dashboard')} className="mb-4 text-sm flex items-center gap-1" style={{ color: brandColors.teal }}>
          ← Back to Dashboard
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: brandColors.navy }}>{activeTransaction.address}</h1>
          <p className="text-gray-600">{activeTransaction.client}</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: brandColors.navy }}>Transaction Timeline</h2>
            <div className="space-y-4">
              {[
                { title: 'Offer Accepted', date: '2024-12-15', status: 'completed', icon: CheckSquare },
                { title: 'Inspection Scheduled', date: '2024-12-20', status: 'completed', icon: CheckSquare },
                { title: 'Inspection Contingency Removal', date: '2025-01-03', status: 'upcoming', icon: Clock },
                { title: 'Close Escrow', date: '2025-02-15', status: 'pending', icon: Award }
              ].map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    milestone.status === 'completed' ? 'bg-green-100' :
                    milestone.status === 'upcoming' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <milestone.icon size={20} style={{ 
                      color: milestone.status === 'completed' ? brandColors.teal : 
                             milestone.status === 'upcoming' ? brandColors.gold : brandColors.navy 
                    }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: brandColors.navy }}>{milestone.title}</p>
                    <p className="text-sm text-gray-500">{milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: brandColors.navy }}>Compliance</h2>
            <div className="space-y-3">
              {[
                { name: 'RPA-CA', status: 'complete' },
                { name: 'TDS', status: 'complete' },
                { name: 'NHD', status: 'missing' },
                { name: 'HOA Docs', status: 'missing' }
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: brandColors.lightBg }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${doc.status === 'complete' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium" style={{ color: brandColors.navy }}>{doc.name}</span>
                  </div>
                  {doc.status === 'missing' && (
                    <button className="text-xs px-2 py-1 rounded" style={{ backgroundColor: brandColors.teal, color: 'white' }}>
                      Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
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
        ].map((item) => (
          <button
            key={item.view}
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

      <div className="mt-auto pt-8 border-t" style={{ borderColor: brandColors.purple, marginTop: '200px' }}>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white text-sm"
        >
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions, documents, contacts..."
            className="pl-10 pr-4 py-2 border rounded-lg w-96 focus:outline-none focus:ring-2"
            style={{ borderColor: brandColors.teal }}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell size={20} style={{ color: brandColors.navy }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: brandColors.magenta }}></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColors.purple, color: 'white' }}>
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-medium" style={{ color: brandColors.navy }}>
            {user?.user_metadata?.full_name || user?.email || 'User'}
          </span>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: brandColors.lightBg }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: brandColors.gold }}>BECLAUSE</h1>
          <p style={{ color: brandColors.teal }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth if not logged in
  if (showAuth || !user) {
    return <AuthView />;
  }

  // Main app
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: brandColors.lightBg }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'transaction-detail' && <TransactionDetailView />}
          {!['dashboard', 'transaction-detail'].includes(currentView) && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Sparkles size={48} className="mx-auto mb-4" style={{ color: brandColors.teal }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: brandColors.navy }}>
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </h2>
              <p className="text-gray-600">This feature is coming soon!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BeClausePlatform;
