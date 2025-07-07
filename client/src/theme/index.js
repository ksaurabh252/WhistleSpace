import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      100: "#f7fafc",
    },
  },
  fonts: {
    body: "system-ui, sans-serif",
    heading: "Georgia, serif",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
      },
      sizes: {
        xl: {
          h: "56px",
          fontSize: "lg",
          px: "32px",
        },
      },
    },
  },
});

export default theme;
