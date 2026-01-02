import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import TxnUploadPage from './pages/TxnUploadPage.tsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transactions/:id" element={<TxnUploadPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
