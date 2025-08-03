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
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  Text,
} from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { SunIcon, MoonIcon, HamburgerIcon } from "@chakra-ui/icons";

const Navbar = () => {
  const { isLoggedIn, logout } = useAdminAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const inactiveLinkColor = useColorModeValue("gray.700", "gray.200");
  const navLinks = [
    { to: "/", label: "Feedback Board" },
    ...(isLoggedIn
      ? [{ to: "/admin/dashboard", label: "Admin Dashboard" }]
      : []),
  ];

  const activeLinkStyle = {
    bg: useColorModeValue("teal.100", "teal.700"),
    color: useColorModeValue("teal.600", "teal.200"),
    borderRadius: "md",
    fontWeight: "bold",
    px: 3,
    py: 1,
    transition: "all 0.2s",
  };

  return (
    <Box
      bg={useColorModeValue("white", "gray.900")}
      px={4}
      boxShadow="sm"
      borderBottom="1px"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex h={16} alignItems={"center"} justifyContent="space-between">
        {/* Brand */}
        <Box
          fontWeight="extrabold"
          fontSize="2xl"
          color="teal.500"
          letterSpacing="tight"
          cursor="pointer"
          onClick={() => navigate("/")}
          _hover={{ color: "teal.400" }}
        >
          Whistle
          <Box as="span" color="teal.300">
            Space
          </Box>
        </Box>

        {/* Desktop Nav */}
        <HStack
          as="nav"
          spacing={8}
          display={{ base: "none", md: "flex" }}
          ml={8}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) =>
                isActive
                  ? activeLinkStyle

                  : {
                    color: inactiveLinkColor,
                    px: 3,
                    py: 1,
                    borderRadius: "md",
                    fontWeight: "medium",
                    transition: "all 0.2s",
                    fontSize: "lg",
                  }
              }
            >
              {link.label}
            </NavLink>
          ))}
        </HStack>

        <Spacer />

        {/* Actions */}
        <HStack spacing={2}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
          />
          {!isLoggedIn ? (
            <Button
              as={NavLink}
              to="/admin/login"
              colorScheme="teal"
              size="sm"
              fontWeight="bold"
            >
              Admin Login
            </Button>
          ) : (
            <Button colorScheme="red" size="sm" onClick={logout} fontWeight="bold">
              Logout
            </Button>
          )}
          {/* Hamburger for mobile */}
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            display={{ base: "inline-flex", md: "none" }}
            onClick={onOpen}
            variant="ghost"
            size="md"
          />
        </HStack>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue("white", "gray.900")}>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4} mt={10} align="stretch">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  style={({ isActive }) =>
                    isActive
                      ? { ...activeLinkStyle, display: "block" }
                      : {
                        color: inactiveLinkColor,
                        fontWeight: "medium",
                        px: 3,
                        py: 2,
                        borderRadius: "md",
                        display: "block",
                      }
                  }
                  onClick={onClose}
                >
                  {link.label}
                </NavLink>
              ))}
              <Button
                onClick={toggleColorMode}
                leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                size="md"
              >
                {colorMode === "light" ? "Dark" : "Light"} Mode
              </Button>
              {!isLoggedIn ? (
                <Button
                  as={NavLink}
                  to="/admin/login"
                  colorScheme="teal"
                  size="md"
                  fontWeight="bold"
                  onClick={onClose}
                >
                  Admin Login
                </Button>
              ) : (
                <Button
                  colorScheme="red"
                  size="md"
                  fontWeight="bold"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                >
                  Logout
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;