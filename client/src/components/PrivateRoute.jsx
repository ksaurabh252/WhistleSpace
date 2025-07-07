import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Flex } from '@chakra-ui/react';

/**
 * A wrapper component to protect private routes.
 * Renders children only if the user is authenticated.
 * Shows a loading spinner while authentication state is being determined.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component(s) to render when authenticated
 * @returns {JSX.Element}
 */
export default function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  // Show a full-screen spinner while auth status is loading
  if (loading) {
    return (
      <Flex
        justify="center"
        align="center"
        minH="100vh"
        bg="gray.50"
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
          role="status"
          aria-label="Loading"
        />
      </Flex>
    );
  }

  // If authenticated, render the protected content; otherwise, redirect to login
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
