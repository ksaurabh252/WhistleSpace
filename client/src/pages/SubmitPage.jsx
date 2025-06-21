import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  VStack,
  Text,
  Spinner,
} from '@chakra-ui/react'
import { useState } from 'react'
import axios from 'axios'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

function SubmitPage() {
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [loading, setLoading] = useState(false)

  const { width, height } = useWindowSize()

  const handleSubmit = async () => {
    if (text.length < 10) {
      setErrorMsg('Feedback must be at least 10 characters.')
      setSuccessMsg('')
      return
    }

    try {
      setLoading(true)
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/feedback`, {
        text,
        email,
      })
      setSuccessMsg('Feedback sent successfully!')
      setErrorMsg('')
      setText('')
      setEmail('')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to send feedback. Please try again.')
      setSuccessMsg('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="md" py={12}>
      {showConfetti && <Confetti width={width} height={height} />}
      <Heading mb={6}>Submit Feedback</Heading>
      <VStack spacing={4} align="stretch">
        <Textarea
          placeholder="Your feedback"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          isDisabled={loading}
        />
        <Text textAlign="right" color={text.length > 500 ? 'red.500' : 'gray.500'}>
          {text.length}/500 chars
        </Text>
        <Input
          type="email"
          placeholder="Optional Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          isDisabled={loading}
        />
        <Button
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={loading}
          loadingText="Submitting"
        >
          Submit
        </Button>
        {successMsg && (
          <Alert status="success"><AlertIcon />{successMsg}</Alert>
        )}
        {errorMsg && (
          <Alert status="error"><AlertIcon />{errorMsg}</Alert>
        )}
      </VStack>
    </Container>
  )
}

export default SubmitPage
