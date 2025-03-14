import React, { useEffect, useState } from 'react';
import { 
  WagmiConfig, 
  configureChains, 
  createClient,
  mainnet
} from 'wagmi';
import { bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useNetwork,
  useSwitchNetwork
} from 'wagmi';
import { ethers } from 'ethers';
import { 
  Box, 
  Button, 
  Text, 
  VStack, 
  HStack,
  useToast, 
  SimpleGrid,
  Image,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Divider,
  Badge
} from '@chakra-ui/react';
import { ExternalLinkIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

// Ağ yapılandırması
const CHAIN_CONFIGS = {
  eth: {
    chain: mainnet,
    name: 'Ethereum',
    icon: '/ethereum-logo.svg',
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    bridgeInfo: {
      toBsc: {
        name: 'Binance Bridge',
        url: 'https://www.bnbchain.org/en/bridge',
        estimatedTime: '10-30 dakika',
      }
    }
  },
  bsc: {
    chain: bsc,
    name: 'BNB Smart Chain',
    icon: '/bsc-logo.svg',
    usdtAddress: '0x55d398326f99059fF775485246999027B3197955',
    bridgeInfo: {
      toEth: {
        name: 'Binance Bridge',
        url: 'https://www.bnbchain.org/en/bridge',
        estimatedTime: '10-30 dakika',
      }
    }
  }
};

// Wagmi yapılandırması
const { chains, provider } = configureChains(
  [mainnet, bsc], // Doğrudan chain objelerini geçiriyoruz
  [publicProvider()]
);

// Desteklenen zincirleri birleştir
const SUPPORTED_CHAINS = Object.entries(CHAIN_CONFIGS).reduce((acc, [key, config]) => {
  acc[key] = {
    ...config.chain,
    ...config
  };
  return acc;
}, {});

// WalletConnect yapılandırması
const walletConnectConnector = new WalletConnectConnector({
  chains,
  options: {
    projectId: '40a5ee6300013fda8e17bf84e3c21e37',
    showQrModal: true,
    metadata: {
      name: 'USDT Payment',
      description: 'USDT Payment System',
      url: window.location.origin,
      icons: [`${window.location.origin}/walletconnect-logo.svg`]
    },
    qrModalOptions: {
      themeMode: "light",
      explorerRecommendedWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', 'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18', '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'],
      enableExplorer: true,
      explorerExcludedWalletIds: []
    }
  }
});

// Desteklenen cüzdanlar
const SUPPORTED_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/metamask-logo.svg',
    connector: walletConnectConnector,
    type: 'both',
    chains: ['eth', 'bsc'],
    checkAvailability: async () => true,
    walletUrl: 'https://metamask.io/download'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '/trustwallet-logo.svg',
    connector: walletConnectConnector,
    type: 'mobile',
    chains: ['eth', 'bsc'],
    checkAvailability: async () => true,
    walletUrl: 'https://trustwallet.com/download'
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    icon: '/binance-logo.svg',
    connector: walletConnectConnector,
    type: 'both',
    chains: ['eth', 'bsc'],
    checkAvailability: async () => true,
    walletUrl: 'https://www.binance.com/en/wallet-direct'
  }
];

// Wagmi client
const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    walletConnectConnector,
    new MetaMaskConnector({ chains })
  ],
  provider
});

// USDT ABI
const USDT_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  }
];

function PaymentApp() {
  // State yönetimi
  const [paymentData, setPaymentData] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const [networkAvailability, setNetworkAvailability] = useState({});
  const [usdtBalance, setUsdtBalance] = useState(null);
  const [gasEstimates, setGasEstimates] = useState({});
  const [recommendedChain, setRecommendedChain] = useState(null);
  const [showBridgeInfo, setShowBridgeInfo] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const toast = useToast();

  // Ödeme adımları
  const PAYMENT_STEPS = [
    { title: 'Cüzdan Bağlantısı', description: 'Cüzdanınızı bağlayın' },
    { title: 'Ödeme', description: 'Ödemeyi onaylayın' }
  ];

  // URL'den ödeme verisini alma
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');

    if (!encodedData) {
      toast({
        title: 'Hata',
        description: 'Ödeme verisi bulunamadı. Lütfen geçerli bir ödeme bağlantısı kullanın.',
        status: 'error',
        duration: null,
        isClosable: true,
      });
      return;
    }

    try {
      const decodedData = atob(encodedData);
      const paymentData = JSON.parse(decodedData);
      
      // Gerekli alanları kontrol et
      if (!paymentData.address || !ethers.utils.isAddress(paymentData.address)) {
        throw new Error('Geçersiz alıcı adresi');
      }

      if (!paymentData.amount || isNaN(paymentData.amount) || paymentData.amount <= 0) {
        throw new Error('Geçersiz ödeme tutarı');
      }

      if (!paymentData.paymentId || typeof paymentData.paymentId !== 'string') {
        throw new Error('Geçersiz ödeme ID');
      }

      setPaymentData(paymentData);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Geçersiz ödeme verisi: ' + error.message,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  }, []);

  // Cüzdan kullanılabilirlik kontrolü
  useEffect(() => {
    const checkWallets = async () => {
      const availability = {};
      for (const wallet of SUPPORTED_WALLETS) {
        try {
          availability[wallet.id] = await wallet.checkAvailability();
        } catch (error) {
          availability[wallet.id] = false;
        }
      }
      setNetworkAvailability(availability);
    };

    checkWallets();
  }, []);

  // USDT bakiye kontrolü
  useEffect(() => {
    const checkBalance = async () => {
      if (!isConnected || !chain || !address) return;

      try {
        const currentChain = SUPPORTED_CHAINS[chain.id];
        if (!currentChain) return;

        const contract = new ethers.Contract(
          currentChain.usdtAddress,
          USDT_ABI,
          provider
        );

        const [balance, decimals] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals()
        ]);

        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        setUsdtBalance(formattedBalance);
        
        // Bakiye kontrolü
        if (paymentData && Number(formattedBalance) < paymentData.amount) {
          toast({
            title: 'Yetersiz Bakiye',
            description: `Gereken: ${paymentData.amount} USDT, Mevcut: ${Number(formattedBalance).toFixed(2)} USDT`,
            status: 'warning',
            duration: null,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Bakiye kontrolü hatası:', error);
      }
    };

    checkBalance();
  }, [isConnected, chain, address]);

  // Gas ücretlerini kontrol et
  useEffect(() => {
    const checkGasFees = async () => {
      const estimates = {};
      
      try {
        // Ethereum gas ücreti
        const ethResponse = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
        const ethData = await ethResponse.json();
        if (ethData.status === '1') {
          estimates.eth = {
            price: ethData.result.SafeGasPrice,
            usdPrice: ethData.result.UsdPrice,
            estimatedCost: (ethData.result.SafeGasPrice * 65000 * ethData.result.UsdPrice) / 1e9 // 65000 gas için yaklaşık maliyet
          };
        }

        // BSC gas ücreti
        const bscResponse = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
        const bscData = await bscResponse.json();
        if (bscData.status === '1') {
          estimates.bsc = {
            price: bscData.result.SafeGasPrice,
            usdPrice: bscData.result.UsdPrice,
            estimatedCost: (bscData.result.SafeGasPrice * 65000 * bscData.result.UsdPrice) / 1e9
          };
        }

        setGasEstimates(estimates);

        // En uygun ağı belirle
        if (estimates.eth && estimates.bsc) {
          const recommended = estimates.eth.estimatedCost > estimates.bsc.estimatedCost ? 'bsc' : 'eth';
          setRecommendedChain(recommended);
        }
      } catch (error) {
        console.error('Gas fee kontrolü hatası:', error);
      }
    };

    checkGasFees();
    const interval = setInterval(checkGasFees, 30000); // Her 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  // Bridge bilgisi kontrolü
  useEffect(() => {
    if (selectedChainId && chain?.id !== selectedChainId) {
      const currentChain = SUPPORTED_CHAINS[chain?.id];
      const targetChain = SUPPORTED_CHAINS[selectedChainId];
      
      if (currentChain && targetChain && currentChain.bridgeInfo) {
        setShowBridgeInfo(true);
      } else {
        setShowBridgeInfo(false);
      }
    } else {
      setShowBridgeInfo(false);
    }
  }, [chain, selectedChainId]);

  // Cüzdan bağlantı fonksiyonu
  const handleWalletConnect = async (wallet) => {
    try {
      setSelectedWallet(wallet);
      setLoading(true);

      // Mobil cihaz kontrolü
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // WalletConnect ile bağlan
      await connect({ 
        connector: walletConnectConnector,
        chainId: isMobile ? undefined : (recommendedChain === 'bsc' ? 56 : 1)
      });

      setPaymentStep(1); // Bir sonraki adıma geç
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: 'Bağlantı Hatası',
        description: 'Cüzdan bağlantısı sırasında bir hata oluştu. Lütfen tekrar deneyin.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Ödeme işlemi
  const handlePayment = async () => {
    if (!isConnected || !chain || !paymentData) return;

    try {
      setLoading(true);
      setPaymentStep(3);

      const currentChain = SUPPORTED_CHAINS[chain.id];
      if (!currentChain) throw new Error('Desteklenmeyen ağ');

      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        currentChain.usdtAddress,
        USDT_ABI,
        signer
      );

      // Transfer işlemi
      const decimals = await contract.decimals();
      const amount = ethers.utils.parseUnits(paymentData.amount.toString(), decimals);
      const tx = await contract.transfer(paymentData.address, amount);
      
      // İşlem onayı bekleniyor
      const receipt = await tx.wait();

      // Backend'e bildir
      const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.transactionHash,
          chain: chain.id === 1 ? 'eth' : 'bsc',
          paymentId: paymentData.paymentId,
          amount: paymentData.amount,
          senderAddress: address
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Ödeme doğrulanamadı');
      }

      setPaymentStep(4);
      toast({
        title: 'Ödeme Başarılı',
        description: `İşlem hash: ${receipt.transactionHash}`,
        status: 'success',
        duration: null,
        isClosable: true,
      });
    } catch (error) {
      console.error('Ödeme hatası:', error);
      toast({
        title: 'Ödeme Hatası',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Ödeme verisi yoksa hata göster
  if (!paymentData) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Ödeme Başlatılamadı</AlertTitle>
            <AlertDescription>
              Geçerli bir ödeme bağlantısı kullanmanız gerekmektedir.
              <Text fontSize="sm" mt={2}>
                Format: https://usdt-payment.vercel.app/payment?data={"base64EncodedData"}
              </Text>
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} borderWidth="1px" borderRadius="xl" shadow="lg">
      <VStack spacing={6} align="stretch">
        {/* Başlık */}
        <Text textAlign="center" fontSize="xl" fontWeight="bold">
          USDT Ödeme
        </Text>

        {/* İlerleme çubuğu */}
        <Box>
          <Progress value={(paymentStep / PAYMENT_STEPS.length) * 100} size="sm" colorScheme="blue" />
          <HStack justify="space-between" mt={2}>
            {PAYMENT_STEPS.map((step, index) => (
              <VStack key={index} flex={1} spacing={1}>
                <Badge 
                  colorScheme={paymentStep >= index ? 'blue' : 'gray'}
                  variant={paymentStep === index ? 'solid' : 'outline'}
                >
                  {index + 1}
                </Badge>
                <Text fontSize="xs" textAlign="center">{step.title}</Text>
              </VStack>
            ))}
          </HStack>
        </Box>

        {/* Ödeme bilgileri */}
        <VStack align="stretch" spacing={4}>
          <Text><strong>Ödeme Adresi:</strong> {paymentData.address}</Text>
          <Text><strong>Tutar:</strong> {paymentData.amount} USDT</Text>
          <Text><strong>Ödeme ID:</strong> {paymentData.paymentId}</Text>
          
          {usdtBalance && (
            <Alert status={Number(usdtBalance) >= paymentData.amount ? 'success' : 'warning'}>
              <AlertIcon />
              <Box>
                <AlertTitle>USDT Bakiyeniz</AlertTitle>
                <AlertDescription>
                  {Number(usdtBalance).toFixed(2)} USDT
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>

        <Divider />

        {/* Cüzdan seçimi */}
        {!isConnected && (
          <>
            <Text fontWeight="medium">Cüzdan Seçin:</Text>
            
            <VStack align="stretch" spacing={4}>
              <Button
                onClick={() => handleWalletConnect({ id: 'walletconnect' })}
                height="60px"
                variant="outline"
                colorScheme="blue"
                isLoading={loading}
                loadingText="QR Kodu Hazırlanıyor..."
              >
                <VStack spacing={2}>
                  <Image
                    src="/walletconnect-logo.svg"
                    alt="WalletConnect"
                    boxSize="24px"
                    fallback={<Icon as={ExternalLinkIcon} />}
                  />
                  <Text fontSize="sm">Mobil Cüzdan ile Bağlan</Text>
                </VStack>
              </Button>
            </VStack>
          </>
        )}

        {/* Ödeme butonu */}
        {isConnected && paymentStep >= 1 && (
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handlePayment}
            isLoading={loading}
            loadingText="İşlem Gönderiliyor..."
            isDisabled={loading || !usdtBalance || Number(usdtBalance) < paymentData.amount}
          >
            {paymentData.amount} USDT Öde
          </Button>
        )}

        {/* Cüzdan bağlantısı durumu */}
        {isConnected && (
          <HStack justify="space-between" fontSize="sm">
            <Text>
              <Icon as={CheckCircleIcon} color="green.500" mr={2} />
              Bağlı Adres: {address?.slice(0, 6)}...{address?.slice(-4)}
            </Text>
            <Button size="sm" variant="ghost" onClick={disconnect}>
              Bağlantıyı Kes
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

export default function WalletPayment() {
  return (
    <WagmiConfig client={wagmiClient}>
      <PaymentApp />
    </WagmiConfig>
  );
} 