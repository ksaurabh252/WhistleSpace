import { Box, Text, Link, HStack } from "@chakra-ui/react";

const Footer = () => (
  <Box as="footer" py={4} textAlign="center" color="gray.500">
    <HStack justify="center" spacing={2}>
      <Text>© {new Date().getFullYear()} Saurabh Kumar</Text>
      <Link href="https://github.com/ksaurabh252" isExternal color="teal.500">
        GitHub
      </Link>
      <Text>|</Text>
      <Link href="https://linkedin.com/in/ksaurabh252" isExternal color="teal.500">
        LinkedIn
      </Link>
    </HStack>
  </Box>
);

export default Footer;