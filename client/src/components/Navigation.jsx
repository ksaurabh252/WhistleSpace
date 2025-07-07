import { Box, Button, Flex, Heading, HStack, IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { Badge } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import api from '../api'

/**
 * Navigation component renders the main navigation bar for the application.
 * It provides links to Home, Submit Feedback, Login, and Admin pages,
 * and includes a color mode toggle button.
 *
 * Uses Chakra UI for styling and React Router for navigation.
 *
 * @component
 * @returns {JSX.Element} The rendered navigation bar component
 */
function Navigation() {
  // Theme and routing hooks
  const { colorMode, toggleColorMode } = useColorMode()
  const location = useLocation()

  // Theme values
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')

  // State for unread notifications count
  const [unreadCount, setUnreadCount] = useState(0)

  // Check if current route matches the given path
  const isActiveRoute = (path) => location.pathname === path

  // Fetch unread notifications count when user changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount()
    }
  }, [user])

  /**
   * Fetches the count of unread notifications from the API
   */
  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/users/notifications/unread-count')
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <Box bg={bgColor} color={textColor} py={4} px={8} boxShadow="sm">
      <Flex justify="space-between" align="center">
        {/* App Logo/Title */}
        <Heading
          size="md"
          as={RouterLink}
          to="/"
          _hover={{ textDecoration: 'none', color: 'blue.500' }}
        >
          WhistleSpace
        </Heading>

        {/* Navigation Links */}
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

          {/* Notifications with badge */}
          <Button
            as={RouterLink}
            to="/user/dashboard"
            variant="ghost"
            position="relative"
          >
            Notifications
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-1"
                right="-1"
                fontSize="xs"
              >
                {unreadCount}
              </Badge>
            )}
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

          {/* Color mode toggle */}
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