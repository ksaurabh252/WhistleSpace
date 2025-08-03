import { Box } from "@chakra-ui/react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => (
  <>
    <Navbar />
    <Box w="100vw" px={{ base: 2, md: 6 }} py={4}>
      {children}
    </Box>
    <Footer />
  </>
);

export default Layout;
