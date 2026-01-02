// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';

// ⬇️ Default export from App.jsx (name can be anything)
import BeClauseApp from './App.jsx';

// ⬇️ Adjust this path/name to match your file exactly
import TxnUploadPage from './pages/TxnUploadPage.tsx'; // or './pages/TxnUploadPage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<BeClauseApp />} />
        <Route path="/transactions/:id" element={<TxnUploadPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
