// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

// If App.jsx exports `export default function BeClauseApp() { ... }`
// you can import it with *any* name because it's a default export:
import BeClauseApp from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BeClauseApp />
  </React.StrictMode>
);
