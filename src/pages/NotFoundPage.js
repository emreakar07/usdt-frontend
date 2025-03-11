import React from 'react';
import { Box, Heading, Text, Button, Container, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={6} textAlign="center">
        <Heading as="h1" size="4xl" color="red.500">
          404
        </Heading>
        <Heading as="h2" size="xl" mb={4}>
          Sayfa Bulunamadı
        </Heading>
        <Text fontSize="lg" color="gray.600" mb={6}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </Text>
        <Box>
          <Button colorScheme="blue" size="lg" onClick={() => navigate('/')}>
            Ana Sayfaya Dön
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default NotFoundPage; 