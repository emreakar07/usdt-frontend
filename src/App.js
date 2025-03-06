import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react';
import PaymentForm from './components/PaymentForm';
import PaymentStatus from './components/PaymentStatus';
import './App.css';

// We'll add these components later
// import PaymentForm from './components/PaymentForm';
// import PaymentStatus from './components/PaymentStatus';

function App() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [paymentId, setPaymentId] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const handlePaymentSuccess = (id, hash) => {
    setPaymentId(id);
    setTxHash(hash);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>USDT Payment System</h1>
        <button onClick={() => open()} className="connect-button">
          {isConnected ? 'Connected: ' + address.substring(0, 6) + '...' + address.substring(address.length - 4) : 'Connect Wallet'}
        </button>
      </header>
      
      <main className="App-main">
        {isConnected ? (
          <div className="payment-container">
            <div className="wallet-info">
              <h2>Connected Wallet</h2>
              <p className="address">{address}</p>
            </div>
            
            {!paymentId ? (
              <PaymentForm 
                walletAddress={address} 
                onPaymentSuccess={handlePaymentSuccess} 
              />
            ) : (
              <PaymentStatus 
                paymentId={paymentId} 
                txHash={txHash} 
                onReset={() => {
                  setPaymentId(null);
                  setTxHash(null);
                }} 
              />
            )}
          </div>
        ) : (
          <div className="connect-prompt">
            <h2>Please connect your wallet to make a payment</h2>
            <p>Click the "Connect Wallet" button above to get started</p>
          </div>
        )}
      </main>
      
      <footer className="App-footer">
        <p>&copy; {new Date().getFullYear()} USDT Payment System</p>
      </footer>
    </div>
  );
}

export default App;
