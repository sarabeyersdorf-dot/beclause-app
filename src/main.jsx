// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';                   // ← default import, no { }
import TxnUploadPage from './pages/TxnUploadPage.tsx'; // adjust to .jsx if that's your file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transactions/:id" element={<TxnUploadPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
