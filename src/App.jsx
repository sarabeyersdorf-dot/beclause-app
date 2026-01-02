// src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import {
  Home, FileText, Calendar, TrendingUp, Users, Bell,
  CheckSquare, AlertCircle, Search, Plus, Bot, Clock, Award,
  LogOut, Sparkles, Target, Shield
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

  // auth
  const [user, setUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');

  // transactions
  const [txns, setTxns] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // ---------- Auth bootstrap ----------
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

  // ---------- Load transactions for logged-in user ----------
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

  // ---------- Auth UI ----------
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

      // Optional: create a matching profile row (RLS policy must allow it)
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
      if (error) { setError(error.message); }
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: brandColors.lightBg }}>
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 classNam
