
import { Box, Heading, Text, Button } from '@chakra-ui/react';
// import { WarningTwoIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

const NotFound = () => {
  return (
    <Box textAlign="center" py={10} px={6}>
      {/* <WarningTwoIcon boxSize={'50px'} color={'orange.300'} /> */}
      <Heading as="h2" size="xl" mt={6} mb={2}>
        Page Not Found
      </Heading>
      <Text color={'gray.500'}>
        Sorry, we couldn't find the page you're looking for.
      </Text>

      <Button
        as={RouterLink}
        to="/"
        colorScheme="teal"
        bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
        color="white"
        variant="solid"
        mt={6}
      >
        Go to Home
      </Button>
    </Box>
  );
};

export default NotFound;
