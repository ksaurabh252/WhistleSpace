import { useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';


export default function GoogleAuthButton() {
  const toast = useToast();
  const navigate = useNavigate();
  const { setAuthState } = useAuth();

  /**
   * Processes successful Google authentication response
   * 
   * @param {Object} credentialResponse - Response object from Google OAuth
   * @param {string} credentialResponse.credential - Google-issued ID token
   * @returns {Promise<void>}
   */
  const handleSuccess = useCallback(async (credentialResponse) => {
    try {
      // Check backend health first
      await api.get('/api/health-check');

      // Send token to backend for validation and user info retrieval
      const { data } = await api.post('/api/admin/google-login', {
        token: credentialResponse.credential
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Update auth state and local storage
      setAuthState({
        token: data.token,
        user: data.user,
        isLoggedIn: true
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to admin dashboard
      navigate('/admin');

      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    } catch (err) {
      console.error('Google auth error:', err);

      // Determine appropriate error message
      let errorMessage = 'Authentication failed';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - check your connection';
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid Google credentials';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      // Show error toast
      toast({
        title: 'Login failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    }
  }, [navigate, setAuthState, toast]);

  return (
    <div className="google-auth-container">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          // Handle failure in initiating Google login
          toast({
            title: 'Google authentication failed',
            description: 'Please try again or use another method',
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        }}
        useOneTap
        auto_select
        shape="rectangular"
        size="large"
        text="continue_with"
        theme="filled_blue"
        width="300"
        locale="en_US"
      />
      <p className="cookie-warning text-sm mt-2 text-gray-500">
        Note: Enable third-party cookies if login fails
      </p>
    </div>
  );
}
