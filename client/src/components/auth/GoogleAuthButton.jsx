import { GoogleLogin } from "@react-oauth/google";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import api from "../../api";
import { useAuth } from "../../context/AuthContext";

/**
 * GoogleAuthButton Component
 * 
 * A component that handles Google OAuth authentication flow with features like:
 * - Google One-Tap login integration
 * - Token management and user context update
 * - Error handling with user feedback
 * - Automatic navigation post-authentication
 * 
 * @component
 * @returns {JSX.Element} Rendered GoogleAuthButton component
 */
export default function GoogleAuthButton() {
  // Hook Initializations
  const toast = useToast();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  /**
   * Processes successful Google authentication response
   * 
   * @param {Object} credentialResponse - Response object from Google OAuth
   * @returns {Promise<void>}
   */
  const handleSuccess = async (credentialResponse) => {
    try {
      // API Authentication Request
      const res = await api.post(
        "/api/admin/google-login",
        { token: credentialResponse.credential },
        { timeout: 5000 }
      );

      // Authentication Data Management
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser({
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name,
        avatar: res.data.user.avatar,
        isGoogleAuth: true
      });

      // Post-authentication Actions
      navigate("/admin");
      toast({
        title: "Login successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Google auth error:", err);

      // Error Handling
      let errorMessage = "Authentication failed";
      if (err.code === "ECONNABORTED") {
        errorMessage = "Connection timeout - check your network";
      } else if (err.response?.status === 401) {
        errorMessage = err.response?.data?.error || "Invalid Google credentials";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || "Invalid request";
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * Error handler for Google login failures
   */
  const handleError = () => {
    console.log("Google login failed");
    toast({
      title: "Login failed",
      description: "Could not authenticate with Google",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <div className="google-auth-container">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        auto_select
        shape="rectangular"
        size="large"
        text="continue_with"
      />

      <p className="cookie-warning">
        Note: Enable third-party cookies if login fails
      </p>
    </div>
  );
}
