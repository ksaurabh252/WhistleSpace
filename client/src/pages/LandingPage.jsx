import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
  VStack,
  useColorMode,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Stack,
  HStack,
  useColorModeValue
} from '@chakra-ui/react'
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'

function LandingPage() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')

  const handleScrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Box bg={bgColor} color={textColor} py={4} px={8} >
        <Flex justify="space-between" align="center">
          <Heading size="md">WhistleSpace</Heading>
          <HStack display={{ base: 'none', md: 'flex' }} gap={4} align="center">
            <Button variant="ghost" onClick={() => handleScrollTo('features')}>Features</Button>
            <Button variant="ghost" onClick={() => handleScrollTo('about')}>About</Button>
            <Button as={RouterLink} to="/submit" variant="ghost">Submit Feedback</Button>
            <Button as={RouterLink} to="/admin" variant="ghost">Admin Dashboard</Button>
            <IconButton
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle color mode"
            />
          </HStack>
          <IconButton
            aria-label="Open Menu"
            icon={<HamburgerIcon />}
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
          />
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.700" color="white">
          <DrawerCloseButton />
          <DrawerHeader>Navigation</DrawerHeader>
          <DrawerBody>
            <Stack spacing={4}>
              <Button variant="ghost" onClick={() => { handleScrollTo('features'); onClose() }}>Features</Button>
              <Button variant="ghost" onClick={() => { handleScrollTo('about'); onClose() }}>About</Button>
              <Button as={RouterLink} to="/submit" variant="ghost" onClick={onClose}>Submit Feedback</Button>
              <Button as={RouterLink} to="/admin" variant="ghost" onClick={onClose}>Admin Dashboard</Button>
              <IconButton
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={() => { toggleColorMode(); onClose() }}
                variant="ghost"
                aria-label="Toggle color mode"
              />
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Container maxW="container.lg" py={12}>
        <VStack spacing={6} mt={10} textAlign="center">
          <Heading size="2xl">Share feedback. Stay anonymous.</Heading>
          <Text fontSize="xl">
            Empower your team to speak up safely. No logins. No fear.
          </Text>
          <Button as={RouterLink} to="/submit" colorScheme="blue" size="lg">
            Start Submitting
          </Button>
        </VStack>

        <Box id="features" mt={20} >
          <Heading size="lg" mb={4}>🔍 Features</Heading>
          <Box as="ul" pl={5} listStyleType="disc">
            <li>Anonymous submissions</li>
            <li>AI-powered categorization & sentiment</li>
            <li>Admin dashboard with filters</li>
            <li>Mobile responsive</li>
          </Box>
        </Box>

        <Box id="about" mt={20}>
          <Heading size="lg" mb={4}>📖 About</Heading>
          <Text>
            WhistleSpace was built to give employees, students, and communities a voice —
            without risking their privacy. AI auto-tags concerns and filters out noise so
            admins can take real action.
          </Text>
        </Box>
      </Container>
    </>
  )
}

export default LandingPage