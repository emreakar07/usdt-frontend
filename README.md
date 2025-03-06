# USDT Payment Frontend

This is a React application for making USDT payments on the Ethereum blockchain.

## Setup

1. Clone the repository
2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
REACT_APP_WALLET_CONNECT_PROJECT_ID=YOUR_WALLET_CONNECT_PROJECT_ID
REACT_APP_RECIPIENT_ADDRESS=YOUR_RECIPIENT_ADDRESS
REACT_APP_API_URL=YOUR_BACKEND_API_URL
```

- `REACT_APP_WALLET_CONNECT_PROJECT_ID`: Get this from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `REACT_APP_RECIPIENT_ADDRESS`: The Ethereum address that will receive the USDT payments
- `REACT_APP_API_URL`: The URL of your backend API (e.g., `http://localhost:5000/api` for local development)

## Development

To start the development server:
```
npm start
```

## Production Build

To create a production build:
```
npm run build
```

## Deployment

The application can be deployed to various platforms:

### Netlify

1. Create a new site in Netlify
2. Connect to your Git repository
3. Set the build command to `npm run build`
4. Set the publish directory to `build`
5. Add the environment variables in the Netlify dashboard

### Vercel

1. Import your project in Vercel
2. Set the framework preset to "Create React App"
3. Add the environment variables in the Vercel dashboard

### GitHub Pages

1. Install gh-pages:
```
npm install --save-dev gh-pages
```

2. Add the following to your `package.json`:
```json
"homepage": "https://yourusername.github.io/your-repo-name",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. Deploy:
```
npm run deploy
```

## Features

- Connect to Ethereum wallet via WalletConnect
- Make USDT payments
- View payment status and transaction details

## Dependencies

- React
- ethers.js
- wagmi
- Web3Modal
- axios
