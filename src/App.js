import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WalletPayment from './components/WalletPayment';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WalletPayment />} />
          <Route path="/payment" element={<WalletPayment />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
