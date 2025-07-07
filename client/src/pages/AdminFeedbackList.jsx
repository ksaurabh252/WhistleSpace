import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { FaHome, FaPlus, FaUserCog, FaTrash, FaCheck, FaTimes, FaComment, FaChevronDown, FaChevronUp, FaFileExport } from 'react-icons/fa';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Stack,
  Input,
  Select,
  useToast,
  Spinner,
  Flex,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  HStack,
  Heading
} from '@chakra-ui/react';

import api from '../api';
import { handleApiError } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { unparse } from 'papaparse';

const AdminFeedbackList = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    sentiment: '',
    category: '',
    status: '',
    fromDate: '',
    toDate: ''
  });
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters, page: pagination.page, limit: pagination.limit };
      const { data } = await api.get('/api/feedback', { params });
      setFeedbacks(data.feedbacks || []);
      setPagination(prev => ({ ...prev, totalPages: data.totalPages || 1 }));
    } catch (err) {
      handleApiError(err, toast);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await api.patch(`/api/feedback/${id}/status`, { status });
      toast({
        title: `Feedback ${status}`,
        status: 'success',
        duration: 2000
      });
      fetchFeedbacks();
    } catch (err) {
      handleApiError(err, toast);
    }
  }, [fetchFeedbacks, toast]);

  const handleDelete = useCallback(async () => {
    try {
      await api.delete(`/api/feedback/${selectedFeedback}`);
      toast({
        title: 'Feedback deleted',
        status: 'success',
        duration: 2000
      });
      onClose();
      fetchFeedbacks();
    } catch (err) {
      handleApiError(err, toast);
    }
  }, [selectedFeedback, fetchFeedbacks, toast, onClose]);

  const exportToCSV = useCallback(() => {
    const csvData = feedbacks.map(fb => ({
      Feedback: fb.text,
      Email: fb.email || 'Anonymous',
      Sentiment: fb.sentiment || '-',
      Category: fb.category || '-',
      Status: fb.status || 'pending',
      Date: new Date(fb.timestamp).toLocaleString()
    }));

    const csv = unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `feedbacks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(fb => {
      return (
        (!filters.status || fb.status === filters.status) &&
        (!filters.sentiment || fb.sentiment === filters.sentiment) &&
        (!filters.category || fb.category === filters.category) &&
        (!filters.search || fb.text.toLowerCase().includes(filters.search.toLowerCase()))
      );
    });
  }, [feedbacks, filters]);

  if (!user) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Admin Navigation Bar */}
      <Box bg="blue.500" color="white" px={6} py={4} mb={6}>
        <Flex justify="space-between" align="center">
          <HStack spacing={6}>
            <Heading size="md">WhistleSpace Admin</Heading>
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/"
                leftIcon={<FaHome />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'blue.600' }}
                size="sm"
              >
                Home
              </Button>
              <Button
                as={RouterLink}
                to="/submit"
                leftIcon={<FaPlus />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'blue.600' }}
                size="sm"
              >
                Submit Feedback
              </Button>
              <Button
                leftIcon={<FaUserCog />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'blue.600' }}
                size="sm"
                onClick={() => {
                  toast({
                    title: 'User Management',
                    description: 'Feature coming soon!',
                    status: 'info',
                    duration: 2000
                  });
                }}
              >
                User Management
              </Button>
            </HStack>
          </HStack>

          <HStack spacing={4}>
            <Text fontSize="sm">Welcome, {user?.name || user?.email}</Text>
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={logout}
            >
              Logout
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Dashboard Title */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Feedback Dashboard
        </Text>
        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.500">
            Total Feedbacks: {feedbacks.length}
          </Text>
          <Badge colorScheme="blue" px={2} py={1}>
            Page {pagination.page} of {pagination.totalPages}
          </Badge>
        </HStack>
      </Flex>

      {/* Filters */}
      <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={6}>
        <Input
          placeholder="Search feedback..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          placeholder="All Statuses"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Select
          placeholder="All Sentiments"
          value={filters.sentiment}
          onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
        >
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Neutral">Neutral</option>
        </Select>
        <Button
          leftIcon={<FaFileExport />}
          onClick={exportToCSV}
          isDisabled={feedbacks.length === 0}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Feedback Table */}
      {loading ? (
        <Box textAlign="center" mt={10}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Feedback</Th>
                <Th>Details</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredFeedbacks.map((feedback) => (
                <React.Fragment key={feedback._id}>
                  <Tr>
                    <Td>
                      <Text noOfLines={1}>
                        {feedback.text.substring(0, 100)}
                        {feedback.text.length > 100 && '...'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </Text>
                    </Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        <Badge colorScheme={
                          feedback.sentiment === 'Positive' ? 'green' :
                            feedback.sentiment === 'Negative' ? 'red' : 'gray'
                        }>
                          {feedback.sentiment || '-'}
                        </Badge>
                        <Badge colorScheme="purple">
                          {feedback.category || '-'}
                        </Badge>
                        <Badge colorScheme={
                          feedback.status === 'approved' ? 'blue' :
                            feedback.status === 'rejected' ? 'orange' : 'gray'
                        }>
                          {feedback.status || 'pending'}
                        </Badge>
                      </Stack>
                    </Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        <Tooltip label="Approve">
                          <IconButton
                            icon={<FaCheck />}
                            colorScheme="green"
                            size="sm"
                            onClick={() => handleStatusChange(feedback._id, 'approved')}
                          />
                        </Tooltip>
                        <Tooltip label="Reject">
                          <IconButton
                            icon={<FaTimes />}
                            colorScheme="yellow"
                            size="sm"
                            onClick={() => handleStatusChange(feedback._id, 'rejected')}
                          />
                        </Tooltip>
                        <Tooltip label="Delete">
                          <IconButton
                            icon={<FaTrash />}
                            colorScheme="red"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(feedback._id);
                              onOpen();
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="View details">
                          <IconButton
                            icon={expandedFeedback === feedback._id ? <FaChevronUp /> : <FaChevronDown />}
                            size="sm"
                            onClick={() => setExpandedFeedback(
                              expandedFeedback === feedback._id ? null : feedback._id
                            )}
                          />
                        </Tooltip>
                      </Stack>
                    </Td>
                  </Tr>
                  {expandedFeedback === feedback._id && (
                    <Tr>
                      <Td colSpan={3} p={4} bg="gray.50">
                        <Box>
                          <Text fontWeight="bold">Full Feedback:</Text>
                          <Text mb={4}>{feedback.text}</Text>
                          {feedback.email && (
                            <Text mb={2}>
                              <strong>Email:</strong> {feedback.email}
                            </Text>
                          )}
                          {feedback.comments?.length > 0 && (
                            <Box mb={4}>
                              <Text fontWeight="bold">Comments:</Text>
                              {feedback.comments.map((comment, idx) => (
                                <Box key={idx} p={2} my={2} bg="white" borderRadius="md">
                                  <Text>{comment.text}</Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {new Date(comment.timestamp).toLocaleString()} •{' '}
                                    {comment.anonymous ? 'Anonymous' : 'Admin'}
                                  </Text>
                                </Box>
                              ))}
                            </Box>
                          )}
                          <Box mt={4}>
                            <Button
                              leftIcon={<FaComment />}
                              size="sm"
                              onClick={() => { }}
                            >
                              Add Comment
                            </Button>
                          </Box>
                        </Box>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Flex justify="center" mt={6}>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => setPagination({
                ...pagination,
                page: Math.max(1, pagination.page - 1)
              })}
              isDisabled={pagination.page === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = pagination.page <= 3 ? i + 1 :
                pagination.page >= pagination.totalPages - 2 ?
                  pagination.totalPages - 4 + i :
                  pagination.page - 2 + i;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setPagination({ ...pagination, page: pageNum })}
                  colorScheme={pagination.page === pageNum ? 'blue' : 'gray'}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              onClick={() => setPagination({
                ...pagination,
                page: Math.min(pagination.totalPages, pagination.page + 1)
              })}
              isDisabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </Stack>
        </Flex>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this feedback? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminFeedbackList;