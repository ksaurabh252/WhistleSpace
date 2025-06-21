import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Stack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import axios from 'axios'

function AdminFeedbackList() {
  const [feedbacks, setFeedbacks] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 5

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/feedback?search=${search}&page=${page}&limit=${limit}`)
      setFeedbacks(res.data.feedbacks || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      console.error('Error fetching feedbacks', err)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [search, page])

  return (
    <Container maxW="6xl" py={10}>
      <Heading mb={4}>Admin Feedback List</Heading>
      <Input
        placeholder="Search feedback"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        mb={4}
      />

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Feedback</Th>
              <Th>Email</Th>
              <Th>Sentiment</Th>
              <Th>Category</Th>
              <Th>Date</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {(feedbacks || []).map((item) => (
              <Tr key={item._id}>
                <Td>{item.text}</Td>
                <Td>{item.email || 'Anonymous'}</Td>
                <Td>{item.sentiment || '-'}</Td>
                <Td>{item.category || '-'}</Td>
                <Td>{new Date(item.timestamp).toLocaleDateString()}</Td>
                <Td>
                  <Button size="sm" isDisabled>
                    Reply (coming soon)
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Stack direction="row" spacing={2} justify="center" mt={6}>
        {[...Array(totalPages)].map((_, i) => (
          <Button
            key={i}
            onClick={() => setPage(i + 1)}
            variant={page === i + 1 ? 'solid' : 'outline'}
          >
            {i + 1}
          </Button>
        ))}
      </Stack>
    </Container>
  )
}

export default AdminFeedbackList