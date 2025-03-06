import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { useAccount, useWalletClient } from 'wagmi';

// USDT Contract ABI (only the functions we need)
const USDT_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// USDT Contract Address (Ethereum Mainnet)
const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// Backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Recipient address for USDT payments
const RECIPIENT_ADDRESS = process.env.REACT_APP_RECIPIENT_ADDRESS || '0xYourRecipientAddressHere';

const PaymentForm = ({ walletAddress, onPaymentSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { data: walletClient } = useWalletClient();

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate amount
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!walletClient) {
        throw new Error('Wallet not connected properly');
      }
      
      // Create a provider from the wallet client
      const provider = new ethers.providers.Web3Provider({
        request: walletClient.request.bind(walletClient),
      });
      const signer = provider.getSigner();
      
      // Create USDT contract instance
      const usdtContract = new ethers.Contract(
        USDT_CONTRACT_ADDRESS,
        USDT_ABI,
        signer
      );
      
      // Get USDT decimals
      const decimals = await usdtContract.decimals();
      
      // Convert amount to USDT units (with proper decimals)
      const amountInUSDT = ethers.utils.parseUnits(amount, decimals);
      
      // Send USDT transaction
      const tx = await usdtContract.transfer(RECIPIENT_ADDRESS, amountInUSDT);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Register payment with backend
      const response = await axios.post(`${API_URL}/payments/register`, {
        walletAddress,
        amount: parseFloat(amount),
        txHash: receipt.transactionHash,
        payment_met: 'usdt'
      });
      
      // Call success callback with payment ID and transaction hash
      onPaymentSuccess(response.data.paymentId, receipt.transactionHash);
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h2>Make USDT Payment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount (USDT)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount in USDT"
            disabled={loading}
            step="0.01"
            min="0.01"
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Send USDT Payment'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm; 