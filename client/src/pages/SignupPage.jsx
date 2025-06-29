import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { GoogleLogin } from '@react-oauth/google';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * SignupPage - User registration page supporting email/password
 * and Google OAuth signup.
 */
export default function SignupPage() {
  // Local state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleToken, setGoogleToken] = useState(null); // For storing Google credential
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const { signup } = useAuth(); // Custom auth context hook
  const navigate = useNavigate();

  /**
   * Handle Google login success
   * @param {Object} credentialResponse - Response from Google OAuth
   */
  const handleGoogleSuccess = (credentialResponse) => {
    setGoogleToken(credentialResponse.credential);

    toast({
      title: 'Google account linked',
      description: 'Google authentication successful',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  /**
   * Handle form submission for signup
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email) {
      toast({
        title: 'Error',
        description: 'Email is required',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!googleToken && !password) {
      toast({
        title: 'Error',
        description: 'Password is required',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!googleToken && password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt signup via context method
      const { success, error } = await signup(
        email,
        googleToken ? undefined : password,
        googleToken
      );

      if (success) {
        toast({
          title: 'Account created',
          description: 'Your account has been successfully created',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
        navigate('/admin');
      } else {
        toast({
          title: 'Signup failed',
          description: error || 'Please try again later',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Unexpected error',
        description: 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Heading */}
        <Flex justify="center" mb={8}>
          <Heading size="xl" color="blue.500">
            Create Account
          </Heading>
        </Flex>

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Email field */}
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

            {/* Password field (disabled if using Google) */}
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 8 characters)"
                autoComplete="new-password"
              />
            </FormControl>

            {/* Confirm password field (disabled if using Google) */}
            <FormControl id="confirm-password" isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </FormControl>

            {/* Google Sign Up */}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                toast({
                  title: 'Google signup failed',
                  description: 'Please try again later.',
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
                })
              }
            />

            {/* Submit Button */}
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              fontSize="md"
              isLoading={isSubmitting}
              loadingText="Creating account..."
              isDisabled={!email || (!googleToken && (!password || !confirmPassword))}
            >
              {googleToken ? 'Complete Signup with Google' : 'Sign Up'}
            </Button>
          </Stack>
        </form>

        {/* Login link for existing users */}
        <Text mt={4} textAlign="center">
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="blue.500">
            Log in
          </Link>
        </Text>
      </Box>
    </Container>
  );
}
