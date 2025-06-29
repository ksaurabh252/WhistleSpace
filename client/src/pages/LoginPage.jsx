import { useEffect, useState } from 'react'
import {
  Box, Button, Container, Flex, FormControl, FormLabel,
  Heading, Input, Link, Stack, Text, useToast,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, } from 'react-router-dom'
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
// import api from '../api'
import { useAuth } from '../context/AuthContext'
import api from '../api';

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await api.get("/admin/validate");
          navigate("/admin");
        } catch (err) {
          localStorage.removeItem("token");
        }
      }
    };
    validateToken();
  }, [navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { success, error } = await login(email, password)

    setIsSubmitting(false)

    if (success) {
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      })

    } else {
      toast({
        title: 'Login failed',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      })
    }
  }

  return (
    <Container maxW="md" py={12}>
      <Box
        p={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg="white"
        _dark={{ bg: 'gray.700' }}
      >
        <Flex justify="center" mb={8}>
          <Heading size="xl" color="blue.500">
            Admin Login
          </Heading>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              fontSize="md"
              isLoading={isSubmitting}
              loadingText="Logging in..."
              isDisabled={!email || !password}
            >
              Log In
            </Button>
          </Stack>
          <Stack spacing={4} align="center">
            <Text>Or</Text>
            <GoogleAuthButton />
          </Stack>
        </form>

        <Text mt={4} textAlign="center">
          Don't have an account?{' '}
          <Link as={RouterLink} to="/signup" color="blue.500">
            Sign up
          </Link>
        </Text>
      </Box>
    </Container>
  )
}
