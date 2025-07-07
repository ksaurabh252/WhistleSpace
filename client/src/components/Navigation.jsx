import { Box, Button, Flex, Heading, HStack, IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'

/**
 * Navigation component renders the main navigation bar for the application.
 * It provides links to Home, Submit Feedback, Login, and Admin pages,
 * and includes a color mode toggle button.
 *
 * Uses Chakra UI for styling and React Router for navigation.
 *
 * @component
 * @returns {JSX.Element} The rendered navigation bar component.
 */
function Navigation() {
  const { colorMode, toggleColorMode } = useColorMode()
  const location = useLocation()
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')

  const isActiveRoute = (path) => location.pathname === path

  return (
    <Box bg={bgColor} color={textColor} py={4} px={8} boxShadow="sm">
      <Flex justify="space-between" align="center">
        <Heading size="md" as={RouterLink} to="/" _hover={{ textDecoration: 'none', color: 'blue.500' }}>
          WhistleSpace
        </Heading>

        <HStack spacing={4} align="center">
          <Button
            as={RouterLink}
            to="/"
            variant="ghost"
            colorScheme={isActiveRoute('/') ? 'blue' : 'gray'}
          >
            Home
          </Button>

          <Button
            as={RouterLink}
            to="/submit"
            variant="ghost"
            colorScheme={isActiveRoute('/submit') ? 'blue' : 'gray'}
          >
            Submit Feedback
          </Button>

          <Button
            as={RouterLink}
            to="/login"
            variant="ghost"
            colorScheme={isActiveRoute('/login') ? 'blue' : 'gray'}
          >
            Login
          </Button>

          <Button
            as={RouterLink}
            to="/admin"
            variant="ghost"
            colorScheme={isActiveRoute('/admin') ? 'blue' : 'gray'}
          >
            Admin
          </Button>

          <IconButton
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Toggle color mode"
          />
        </HStack>
      </Flex>
    </Box>
  )
}

export default Navigation