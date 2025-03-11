import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
  useColorModeValue,
  useBreakpointValue,
  HStack,
  Badge,
  Progress,
  Icon,
  Flex
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, TimeIcon } from '@chakra-ui/icons';
import WalletPayment from '../components/WalletPayment';
import { getPaymentInfo, getPaymentStatus } from '../services/api';
import useInterval from '../hooks/useInterval';

const PaymentPage = () => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 dakika
  const location = useLocation();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const containerWidth = useBreakpointValue({ base: "95%", sm: "85%", md: "container.md" });
  
  // URL'den payment_id'yi al
  const searchParams = new URLSearchParams(location.search);
  const paymentId = searchParams.get('payment_id');
  
  // Ödeme bilgilerini getir
  const fetchPaymentInfo = async () => {
    if (!paymentId) {
      setError('Ödeme kimliği bulunamadı');
      setLoading(false);
      return;
    }
    
    try {
      const response = await getPaymentInfo(paymentId);
      setPayment(response.payment);
      setLoading(false);
    } catch (error) {
      console.error('Ödeme bilgisi getirme hatası:', error);
      setError(error.response?.data?.error || 'Ödeme bilgisi getirilirken bir hata oluştu');
      setLoading(false);
    }
  };
  
  // Ödeme durumunu kontrol et
  const checkPaymentStatus = async () => {
    if (!paymentId || !payment || payment.status !== 'pending') return;
    
    try {
      const response = await getPaymentStatus(paymentId);
      if (response.success && response.payment.status !== payment.status) {
        setPayment(response.payment);
      }
    } catch (error) {
      console.error('Ödeme durumu kontrol hatası:', error);
    }
  };
  
  // Sayfa yüklendiğinde ödeme bilgilerini getir
  useEffect(() => {
    fetchPaymentInfo();
  }, [paymentId]);
  
  // Her 15 saniyede bir ödeme durumunu kontrol et
  useInterval(checkPaymentStatus, 15000);

  // Geri sayım sayacı
  useEffect(() => {
    if (payment?.status === 'pending' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [payment?.status, timeLeft]);

  // Kalan süreyi formatla
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // İşlem doğrulama başarılı olduğunda
  const handleVerificationSuccess = (response) => {
    setPayment((prev) => ({
      ...prev,
      status: 'completed',
      tx_hash: response.txHash,
    }));
  };
  
  // Yükleniyor durumu
  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} py={4}>
        <Container maxW={containerWidth} centerContent>
          <Center h="50vh" flexDirection="column">
            <Spinner size="xl" mb={4} color="blue.500" thickness="4px" />
            <Text>Ödeme bilgileri yükleniyor...</Text>
          </Center>
        </Container>
      </Box>
    );
  }
  
  // Hata durumu
  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} py={4}>
        <Container maxW={containerWidth} centerContent>
          <Alert 
            status="error" 
            borderRadius="xl" 
            flexDirection="column" 
            alignItems="center" 
            p={6}
            bg={cardBgColor}
            boxShadow="lg"
            width="100%"
          >
            <AlertIcon boxSize={10} mr={0} mb={4} />
            <AlertTitle mb={2} fontSize="lg">Ödeme Bilgisi Bulunamadı</AlertTitle>
            <AlertDescription textAlign="center">{error}</AlertDescription>
            <Button mt={4} colorScheme="red" onClick={() => navigate('/')}>
              Ana Sayfaya Dön
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }
  
  // Ödeme tamamlandı durumu
  if (payment && payment.status === 'completed') {
    return (
      <Box minH="100vh" bg={bgColor} py={4}>
        <Container maxW={containerWidth} centerContent>
          <Alert 
            status="success" 
            borderRadius="xl" 
            flexDirection="column" 
            alignItems="center" 
            p={8}
            bg={cardBgColor}
            boxShadow="lg"
            width="100%"
          >
            <Icon as={CheckIcon} boxSize={12} color="green.500" mb={4} />
            <AlertTitle mb={2} fontSize="xl">Ödeme Başarıyla Tamamlandı</AlertTitle>
            <VStack spacing={4} mt={4} width="100%">
              <HStack justify="space-between" width="100%" p={3} bg="green.50" borderRadius="lg">
                <Text color="green.700">Ödeme Tutarı:</Text>
                <Text fontWeight="bold" color="green.700">{payment.amount} USDT</Text>
              </HStack>
              <HStack justify="space-between" width="100%" p={3} bg="green.50" borderRadius="lg">
                <Text color="green.700">İşlem Hash:</Text>
                <Text fontWeight="bold" color="green.700" fontSize="sm">
                  {payment.tx_hash?.slice(0, 8)}...{payment.tx_hash?.slice(-8)}
                </Text>
              </HStack>
            </VStack>
            <Button mt={6} colorScheme="green" onClick={() => window.close()}>
              Pencereyi Kapat
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }
  
  // Ödeme başarısız durumu
  if (payment && payment.status === 'failed') {
    return (
      <Box minH="100vh" bg={bgColor} py={4}>
        <Container maxW={containerWidth} centerContent>
          <Alert 
            status="error" 
            borderRadius="xl" 
            flexDirection="column" 
            alignItems="center" 
            p={8}
            bg={cardBgColor}
            boxShadow="lg"
            width="100%"
          >
            <Icon as={WarningIcon} boxSize={12} color="red.500" mb={4} />
            <AlertTitle mb={2} fontSize="xl">Ödeme Başarısız</AlertTitle>
            <AlertDescription textAlign="center" maxW="sm">
              Ödeme işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin veya destek ekibiyle iletişime geçin.
            </AlertDescription>
            <Button mt={6} colorScheme="blue" onClick={() => window.location.reload()}>
              Tekrar Dene
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }
  
  // Normal ödeme sayfası
  return (
    <Box minH="100vh" bg={bgColor} py={4}>
      <Container maxW={containerWidth} centerContent>
        <VStack spacing={4} width="100%">
          {/* Ödeme Özeti Kartı */}
          <Box 
            bg={cardBgColor} 
            p={6} 
            borderRadius="xl" 
            boxShadow="lg" 
            width="100%"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="lg">Ödeme Detayları</Heading>
                <Badge 
                  colorScheme="yellow" 
                  p={2} 
                  borderRadius="lg" 
                  fontSize="sm"
                >
                  <HStack spacing={1}>
                    <TimeIcon />
                    <Text>{formatTimeLeft()}</Text>
                  </HStack>
                </Badge>
              </Flex>

              <Progress 
                value={(timeLeft / 1800) * 100} 
                size="xs" 
                colorScheme="yellow" 
                borderRadius="full"
              />

              <VStack spacing={4} align="stretch" bg="gray.50" p={4} borderRadius="lg">
                <HStack justify="space-between">
                  <Text color="gray.600">Ödeme Tutarı:</Text>
                  <Text fontWeight="bold" fontSize="xl">{payment.amount} USDT</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text color="gray.600">Ağ:</Text>
                  <Badge 
                    colorScheme={
                      payment.chain === 'eth' ? 'blue' : 
                      payment.chain === 'tron' ? 'red' : 
                      'purple'
                    }
                    p={2}
                    borderRadius="lg"
                  >
                    {payment.chain === 'eth' ? 'Ethereum' :
                     payment.chain === 'tron' ? 'Tron' :
                     'Solana'}
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text color="gray.600">Durum:</Text>
                  <Badge colorScheme="yellow" p={2} borderRadius="lg">
                    Ödeme Bekleniyor
                  </Badge>
                </HStack>
              </VStack>
            </VStack>
          </Box>

          {/* Cüzdan Bağlantı ve Ödeme Bölümü */}
          {payment && payment.status === 'pending' && (
            <WalletPayment 
              payment={payment} 
              onSuccess={handleVerificationSuccess} 
            />
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default PaymentPage; 