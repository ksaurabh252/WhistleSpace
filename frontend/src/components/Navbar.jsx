import React from "react";
import {
  Box,
  Flex,
  HStack,
  Link,
  Button,
  Spacer,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const Navbar = () => {
  const { isLoggedIn, logout } = useAdminAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  return (
    <Box bg={useColorModeValue("gray.100", "gray.900")} px={4} boxShadow="sm">
      <Flex h={16} alignItems={"center"}>
        <HStack spacing={8} alignItems={"center"}>
          <Box
            fontWeight="bold"
            fontSize="xl"
            color="teal.500"
            cursor="pointer"
            onClick={() => navigate("/")}
          >
            WhistleSpace
          </Box>
          <HStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? "#319795" : "inherit",
              })}
            >
              Feedback Board
            </NavLink>
            {isLoggedIn && (
              <NavLink
                to="/admin/dashboard"
                style={({ isActive }) => ({
                  color: isActive ? "#319795" : "inherit",
                })}
              >
                Admin Dashboard
              </NavLink>
            )}
          </HStack>
        </HStack>
        <Spacer />
        <HStack spacing={4}>
          <Button onClick={toggleColorMode} size="sm">
            {colorMode === "light" ? "Dark" : "Light"}
          </Button>
          {!isLoggedIn ? (
            <Button as={NavLink} to="/admin/login" colorScheme="teal" size="sm">
              Admin Login
            </Button>
          ) : (
            <Button colorScheme="red" size="sm" onClick={logout}>
              Logout
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
