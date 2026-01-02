// src/App.jsx
import React from 'react';
import { IS_SUPABASE_CONFIGURED } from './lib/supabase';

export default function App() {
  return (
    <div style={{padding:24,fontFamily:'system-ui'}}>
      <h1>BeClause · Smoke Test</h1>
      <p>App bundle loaded ✅</p>
      <p>Supabase configured: <b>{String(IS_SUPABASE_CONFIGURED)}</b></p>
    </div>
  );
}
