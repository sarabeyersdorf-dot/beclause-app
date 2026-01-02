import { HashRouter, Routes, Route } from 'react-router-dom';
// ...
<HashRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/transactions/:id" element={<TxnUploadPage />} />
  </Routes>
</HashRouter>
