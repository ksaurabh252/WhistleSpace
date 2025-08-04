import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/admin";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await adminLogin({ username, password });

      login(res.data.token);
      toast({
        title: "Login successful",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      navigate("/admin/dashboard");
    } catch (err) {
      const errorMessage =
        err?.response?.data?.error || err?.message || "Login failed";
      setError(errorMessage);

      toast({
        title: "Login failed",
        status: "error",
        description: errorMessage,
        duration: 4000,
        isClosable: true,
      });
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="md">
      <Heading mb={6} size="md">
        Admin Login
      </Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormControl mb={4} isRequired>
          <FormLabel>Username</FormLabel>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormControl>
        <FormControl mb={6} isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </FormControl>
        <Button
          colorScheme="teal"
          type="submit"
          isLoading={loading}
          width="full"
        >
          Login
        </Button>
      </form>
    </Box>
  );
};

export default AdminLogin;
