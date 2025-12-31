import React from 'react'

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#F5F7FA'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '40px' }}>
        <h1 style={{ 
          fontSize: '64px', 
          color: '#2A2947', 
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          BECLAUSE
        </h1>
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #3BB4C1, #E91E63, #FDB913)',
          marginBottom: '30px',
          borderRadius: '2px'
        }}></div>
        <p style={{ 
          fontSize: '24px', 
          color: '#3BB4C1',
          marginBottom: '30px',
          fontWeight: '500'
        }}>
          Real Estate Transaction Management Platform
        </p>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginTop: '40px'
        }}>
          <h2 style={{ color: '#2A2947', marginBottom: '20px' }}>
            🎉 Deployment Successful!
          </h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Your BeClause platform is now live. Next steps: Configure Supabase and add features.
          </p>
          <div style={{ marginTop: '30px' }}>
            <span style={{ 
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#3BB4C1',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              BE READY. BE COMPLIANT. BECLAUSE.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
```
