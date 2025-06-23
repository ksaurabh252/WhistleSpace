import { useState } from 'react'
import { Input, Button, VStack, Container, Heading, useToast } from '@chakra-ui/react'

import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const toast = useToast()
  const navigate = useNavigate()
  const login = useAuth()
  const handleLogin = async () => {
    try {
      const res = await await api.post('/api/admin/login', { email, password })
      login(res.data.token); localStorage.setItem('token', res.data.token)
      toast({ title: 'Login successful', status: 'success' })
      navigate('/admin')

    } catch {
      toast({ title: 'Login failed', status: 'error' })
    }
  }

  return (
    <Container py={20}>
      <Heading mb={6}>Admin Login</Heading>
      <VStack spacing={4}>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button colorScheme="blue" onClick={handleLogin}>Login</Button>
      </VStack>
    </Container>
  )
}
