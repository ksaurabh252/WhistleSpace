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
  Stack,
  Select,
  Text,
  HStack,
  Skeleton,
  IconButton,
  useBreakpointValue,
  Flex,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { unparse } from "papaparse";
import {
  FaList,
  FaChartBar,
  FaTrash,
  FaSignOutAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import api from "../api";

function highlightMatch(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={index}>{part}</mark>
    ) : (
      part
    )
  );
}

function AdminFeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sentiment, setSentiment] = useState("");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const limit = 5;
  const toast = useToast();

  const fetchFeedbacks = useCallback(async () => {
    const params = new URLSearchParams({
      search,
      page,
      limit,
      sentiment,
      category,
    });
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    if (status) params.append('status', status);

    try {
      setLoading(true);
      const res = await api.get(`/api/feedback?${params.toString()}`);
      setFeedbacks(res.data.feedbacks || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching feedbacks", err);
      toast({ title: "Server error fetching feedbacks", status: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, page, sentiment, category, fromDate, toDate, status]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const confirmDelete = (id) => {
    setSelectedId(id);
    onOpen();
  };

  const deleteFeedback = async () => {
    try {
      await api.delete(`/api/feedback/${selectedId}`);
      toast({ title: "Feedback deleted", status: "success" });
      fetchFeedbacks();
    } catch (err) {
      toast({ title: "Delete failed", status: "error" });
    } finally {
      onClose();
    }
  };

  const moderateFeedback = async (id, action) => {
    try {
      await api.patch(`/api/feedback/${id}/status`, { status: action });
      toast({ title: `Marked as ${action}`, status: "info" });
      fetchFeedbacks();
    } catch {
      toast({ title: "Moderation failed", status: "error" });
    }
  };

  const exportToCSV = () => {
    if (!feedbacks.length) return;
    const csv = unparse(
      feedbacks.map(({ text, email, sentiment, category, timestamp }) => ({
        Feedback: text,
        Email: email || "Anonymous",
        Sentiment: sentiment || "-",
        Category: category || "-",
        Date: new Date(timestamp).toLocaleDateString(),
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "feedbacks.csv");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Container maxW="6xl" py={10} pb={isMobile ? 24 : 10}>
      <HStack justify="space-between" mb={4}>
        <Heading>Admin Feedback List</Heading>
        <Button
          colorScheme="red"
          onClick={handleLogout}
          leftIcon={<FaSignOutAlt />}
        >
          Logout
        </Button>
      </HStack>

      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={4}>
        <Input
          placeholder="Search feedback"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          _hover={{ borderColor: "blue.400" }}
        />
        <Select
          placeholder="Sentiment"
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
        >
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Neutral">Neutral</option>
        </Select>
        <Select
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Harassment">Harassment</option>
          <option value="Suggestion">Suggestion</option>
          <option value="Technical Issue">Technical Issue</option>
          <option value="Praise">Praise</option>
          <option value="Other">Other</option>
        </Select>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </Stack>

      <Button
        onClick={exportToCSV}
        colorScheme="green"
        size="sm"
        mb={4}
        _hover={{ bg: "green.500" }}
      >
        Export CSV
      </Button>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Feedback</Th>
              <Th>Email</Th>
              <Th>Sentiment</Th>
              <Th>Category</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading
              ? [...Array(5)].map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={6}>
                    <Skeleton height="20px" />
                  </Td>
                </Tr>
              ))
              : feedbacks.map((item) => (
                <Tr key={item._id} _hover={{ bg: "gray.700" }}>
                  <Td>{highlightMatch(item.text, search)}</Td>
                  <Td>{item.email || "Anonymous"}</Td>
                  <Td>
                    <Badge>{item.sentiment || "-"}</Badge>
                  </Td>
                  <Td>
                    <Badge>{item.category || "-"}</Badge>
                  </Td>
                  <Td>{new Date(item.timestamp).toLocaleDateString()}</Td>
                  <Td>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        icon={<FaCheck />}
                        size="sm"
                        colorScheme="green"
                        aria-label="Approve"
                        onClick={() => moderateFeedback(item._id, "approved")}
                      />
                      <IconButton
                        icon={<FaTimes />}
                        size="sm"
                        colorScheme="yellow"
                        aria-label="Reject"
                        onClick={() => moderateFeedback(item._id, "rejected")}
                      />
                      <IconButton
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        aria-label="Delete"
                        onClick={() => confirmDelete(item._id)}
                      />
                    </Stack>
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
            variant={page === i + 1 ? "solid" : "outline"}
          >
            {i + 1}
          </Button>
        ))}
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>Are you sure you want to delete this feedback?</ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={deleteFeedback}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {isMobile && (
        <Flex
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          borderTop="1px solid #ddd"
          justify="space-around"
          py={2}
          zIndex={1000}
        >
          <IconButton icon={<FaList />} aria-label="List" variant="ghost" />
          <IconButton
            icon={<FaChartBar />}
            aria-label="Analytics"
            variant="ghost"
          />
        </Flex>
      )}
    </Container>
  );
}

export default AdminFeedbackList;
