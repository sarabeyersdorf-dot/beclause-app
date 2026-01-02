// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

// ⬇️ Default import (no curly braces). Must match a *default* export in App.jsx.
import App from './App.jsx';

console.log('main.jsx: rendering <App />');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
export default BeClauseApp;
