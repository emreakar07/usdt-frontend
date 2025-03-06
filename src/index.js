import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Web3Modal } from '@web3modal/react';
import { EthereumClient } from '@web3modal/ethereum';
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import './index.css';

// Configure chains & providers
const chains = [mainnet];
const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLET_CONNECT_PROJECT_ID'; // Get from .env file

const { provider, webSocketProvider } = configureChains(chains, [
  publicProvider(),
]);

// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        qrcode: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
});

// Create ethereum client for Web3Modal
const ethereumClient = new EthereumClient(client, chains);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <App />
    </WagmiConfig>
    <Web3Modal
      projectId={projectId}
      ethereumClient={ethereumClient}
      themeMode="light"
    />
  </React.StrictMode>
);
