// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>BeClause · SMOKE OK ✅</h1>
      <p>If you see this, the entry is correct and the bundle is fresh.</p>
    </div>
  );
}

console.log('SMOKE main.jsx loaded — rendering <App />');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
