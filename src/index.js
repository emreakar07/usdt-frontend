import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Web3Modal } from '@web3modal/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import './index.css';

// Configure chains & providers
const chains = [mainnet];
const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLET_CONNECT_PROJECT_ID'; // Get from .env file

const { publicClient, webSocketPublicClient } = configureChains(chains, [
  w3mProvider({ projectId }),
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
  webSocketPublicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <App />
    </WagmiConfig>
    <Web3Modal
      projectId={projectId}
      ethereumClient={ethereumClient}
      themeMode="light"
    />
  </React.StrictMode>
);
