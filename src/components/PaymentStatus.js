import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PaymentStatus = ({ paymentId, txHash, onReset }) => {
  const [status, setStatus] = useState('loading');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/payments/${paymentId}`);
        setPayment(response.data);
        setStatus(response.data.status);
        
        // If payment is still pending, check again after 5 seconds
        if (response.data.status === 'pending') {
          setTimeout(checkPaymentStatus, 5000);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError('Failed to check payment status');
        setStatus('error');
      }
    };

    checkPaymentStatus();
  }, [paymentId]);

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Checking payment status...';
      case 'pending':
        return 'Payment is being processed. This may take a few minutes.';
      case 'completed':
        return 'Payment confirmed! Thank you for your payment.';
      case 'failed':
        return 'Payment verification failed. Please contact support.';
      case 'error':
        return error || 'An error occurred while checking payment status.';
      default:
        return 'Unknown payment status.';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return 'success-message';
      case 'failed':
      case 'error':
        return 'error-message';
      default:
        return '';
    }
  };

  return (
    <div className="payment-status">
      <h2>Payment Status</h2>
      
      <div className={`status-message ${getStatusClass()}`}>
        {getStatusMessage()}
      </div>
      
      <div className="payment-details">
        <h3>Transaction Details</h3>
        <p><strong>Transaction Hash:</strong></p>
        <p className="address">{txHash}</p>
        
        {payment && (
          <>
            <p><strong>Amount:</strong> {payment.amount} USDT</p>
            <p><strong>Status:</strong> {payment.status}</p>
            <p><strong>Payment Method:</strong> {payment.paymentMethod || 'USDT'}</p>
            <p><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
            {payment.completedAt && (
              <p><strong>Completed At:</strong> {new Date(payment.completedAt).toLocaleString()}</p>
            )}
          </>
        )}
      </div>
      
      <button onClick={onReset}>Make Another Payment</button>
    </div>
  );
};

export default PaymentStatus; 