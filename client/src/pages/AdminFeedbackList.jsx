import {
  Badge,
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useDisclosure,
  useToast,
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
  FaComment,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import api from "../api";
import { handleApiError } from "../utils/errorHandler";

/**
 * Highlights matching text in search results
 * @param {string} text - The text to search within
 * @param {string} keyword - The search term to highlight
 * @returns {JSX.Element} - Text with highlighted matches
 */
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

/**
 * Admin Feedback List Component - Displays and manages user feedback
 */
function AdminFeedbackList() {
  // State for feedback data and UI
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sentiment, setSentiment] = useState("");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  // Modal control for delete confirmation
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const toast = useToast();
  const limit = 5; // Number of items per page
  const isMobile = useBreakpointValue({ base: true, md: false });

  /**
   * Fetches feedback data from the API with current filters
   */
  const fetchFeedbacks = useCallback(async () => {
    const params = new URLSearchParams({
      search,
      page,
      limit,
      sentiment,
      category,
      status: statusFilter,
    });

    // Add date filters if they exist
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    try {
      setLoading(true);
      const res = await api.get(`/api/feedback?${params.toString()}`);
      setFeedbacks(res.data.feedbacks || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      handleApiError(err, toast);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    page,
    sentiment,
    category,
    fromDate,
    toDate,
    statusFilter,
    toast,
  ]);

  // Fetch feedback when component mounts or filters change
  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  /**
   * Opens delete confirmation modal
   * @param {string} id - ID of the feedback to delete
   */
  const confirmDelete = (id) => {
    setSelectedId(id);
    onDeleteModalOpen();
  };

  /**
   * Deletes the selected feedback
   */
  const deleteFeedback = async () => {
    try {
      await api.delete(`/api/feedback/${selectedId}`);
      toast({
        title: "Feedback deleted",
        status: "success",
        duration: 3000,
      });
      fetchFeedbacks();
    } catch (err) {
      handleApiError(err, toast);
    } finally {
      onDeleteModalClose();
    }
  };

  /**
   * Approves or rejects feedback
   * @param {string} id - Feedback ID
   * @param {string} action - Either "approved" or "rejected"
   */
  const moderateFeedback = async (id, action) => {
    try {
      await api.patch(`/api/feedback/${id}/status`, { status: action });
      toast({
        title: `Feedback ${action}`,
        status: "success",
        duration: 3000,
      });
      fetchFeedbacks();
    } catch (err) {
      handleApiError(err, toast);
    }
  };

  /**
   * Exports feedback data to CSV file
   */
  const exportToCSV = () => {
    if (!feedbacks.length) {
      toast({
        title: "No data to export",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      // Format data for CSV export
      const csv = unparse(
        feedbacks.map(
          ({ text, email, sentiment, category, timestamp, status }) => ({
            Feedback: text,
            Email: email || "Anonymous",
            Sentiment: sentiment || "-",
            Category: category || "-",
            Status: status || "pending",
            Date: new Date(timestamp).toLocaleDateString(),
          })
        )
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `feedbacks_${new Date().toISOString().split("T")[0]}.csv`);

      toast({
        title: "Export successful",
        description: `${feedbacks.length} records exported`,
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      handleApiError(err, toast);
    }
  };

  /**
   * Adds a comment to a feedback item
   * @param {string} feedbackId - ID of the feedback to comment on
   */
  const addComment = async (feedbackId) => {
    if (!commentTexts[feedbackId]?.trim()) {
      toast({
        title: "Comment cannot be empty",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      setCommentLoading((prev) => ({ ...prev, [feedbackId]: true }));

      await api.post(`/api/feedback/${feedbackId}/comments`, {
        text: commentTexts[feedbackId],
        anonymous: true,
      });

      toast({
        title: "Comment added",
        status: "success",
        duration: 3000,
      });

      setCommentTexts((prev) => ({ ...prev, [feedbackId]: "" }));
      fetchFeedbacks();
    } catch (err) {
      handleApiError(err, toast);
    } finally {
      setCommentLoading((prev) => ({ ...prev, [feedbackId]: false }));
    }
  };

  /**
   * Handles user logout
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  /**
   * Toggles expanded view for a feedback item
   * @param {string} id - Feedback ID to expand/collapse
   */
  const toggleExpandFeedback = (id) => {
    setExpandedFeedback((prev) => (prev === id ? null : id));
  };

  return (
    <Container maxW="6xl" py={10} pb={isMobile ? 24 : 10}>
      {/* Header with logout button */}
      <HStack justify="space-between" mb={4}>
        <Heading>Feedback Dashboard</Heading>
        <Button
          colorScheme="red"
          onClick={handleLogout}
          leftIcon={<FaSignOutAlt />}
        >
          Logout
        </Button>
      </HStack>

      {/* Filters Section */}
      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={6}>
        <Input
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <Select
          placeholder="All Sentiments"
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
        >
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Neutral">Neutral</option>
        </Select>

        <Select
          placeholder="All Categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Harassment">Harassment</option>
          <option value="Suggestion">Suggestion</option>
          <option value="Technical Issue">Technical Issue</option>
          <option value="Praise">Praise</option>
          <option value="Other">Other</option>
        </Select>

        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Stack>

      {/* Date Range Section */}
      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={6}>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="From date"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="To date"
        />
        <Button
          onClick={() => {
            setFromDate("");
            setToDate("");
          }}
          variant="outline"
        >
          Clear Dates
        </Button>
      </Stack>

      {/* Actions Section */}
      <Flex justify="space-between" mb={4}>
        <Button
          onClick={exportToCSV}
          colorScheme="blue"
          leftIcon={<FaChartBar />}
        >
          Export CSV
        </Button>
        <Text>
          Showing page {page} of {totalPages} ({feedbacks.length} items)
        </Text>
      </Flex>

      {/* Feedback Table */}
      <Box overflowX="auto" mb={6}>
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>Feedback</Th>
              <Th>Details</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* Loading state */}
            {loading ? (
              [...Array(5)].map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={3}>
                    <Skeleton height="40px" />
                  </Td>
                </Tr>
              ))
            ) : feedbacks.length === 0 ? (
              // Empty state
              <Tr>
                <Td colSpan={3} textAlign="center">
                  <Text py={4}>No feedback found matching your criteria</Text>
                </Td>
              </Tr>
            ) : (
              // Feedback items
              feedbacks.map((item) => (
                <React.Fragment key={item._id}>
                  <Tr
                    _hover={{ bg: "gray.100" }}
                    cursor="pointer"
                    onClick={() => toggleExpandFeedback(item._id)}
                  >
                    <Td>
                      <Box>
                        <Text fontWeight="bold">
                          {highlightMatch(item.text.substring(0, 100), search)}
                          {item.text.length > 100 && "..."}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                      </Box>
                    </Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        {/* Sentiment badge */}
                        <Badge
                          colorScheme={
                            item.sentiment === "Positive"
                              ? "green"
                              : item.sentiment === "Negative"
                                ? "red"
                                : "gray"
                          }
                        >
                          {item.sentiment || "-"}
                        </Badge>
                        {/* Category badge */}
                        <Badge colorScheme="purple">
                          {item.category || "-"}
                        </Badge>
                        {/* Status badge */}
                        <Badge
                          colorScheme={
                            item.status === "approved"
                              ? "blue"
                              : item.status === "rejected"
                                ? "orange"
                                : "gray"
                          }
                        >
                          {item.status || "pending"}
                        </Badge>
                      </Stack>
                    </Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        {/* Approve button */}
                        <IconButton
                          icon={<FaCheck />}
                          size="sm"
                          colorScheme="green"
                          aria-label="Approve"
                          onClick={(e) => {
                            e.stopPropagation();
                            moderateFeedback(item._id, "approved");
                          }}
                        />
                        {/* Reject button */}
                        <IconButton
                          icon={<FaTimes />}
                          size="sm"
                          colorScheme="yellow"
                          aria-label="Reject"
                          onClick={(e) => {
                            e.stopPropagation();
                            moderateFeedback(item._id, "rejected");
                          }}
                        />
                        {/* Delete button */}
                        <IconButton
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(item._id);
                          }}
                        />
                        {/* Expand/collapse button */}
                        <IconButton
                          icon={
                            expandedFeedback === item._id ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )
                          }
                          size="sm"
                          variant="ghost"
                          aria-label="Expand"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandFeedback(item._id);
                          }}
                        />
                      </Stack>
                    </Td>
                  </Tr>

                  {/* Expanded Row with additional details */}
                  <Tr>
                    <Td colSpan={3}>
                      <Collapse in={expandedFeedback === item._id}>
                        <Box p={4} bg="gray.50" borderRadius="md">
                          <Text mb={2}>
                            <strong>Full Feedback:</strong> {item.text}
                          </Text>

                          {item.email && (
                            <Text mb={2}>
                              <strong>Email:</strong> {item.email}
                            </Text>
                          )}

                          {/* Comments section */}
                          {item.comments?.length > 0 && (
                            <Box mb={4}>
                              <Text fontWeight="bold" mb={2}>
                                Comments:
                              </Text>
                              {item.comments.map((comment, idx) => (
                                <Box
                                  key={idx}
                                  p={2}
                                  mb={2}
                                  bg="white"
                                  borderRadius="md"
                                >
                                  <Text>{comment.text}</Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {new Date(
                                      comment.timestamp
                                    ).toLocaleString()}{" "}
                                    •
                                    {comment.anonymous
                                      ? " Anonymous"
                                      : " Admin"}
                                  </Text>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Add comment form */}
                          <Box>
                            <Textarea
                              value={commentTexts[item._id] || ""}
                              onChange={(e) =>
                                setCommentTexts((prev) => ({
                                  ...prev,
                                  [item._id]: e.target.value,
                                }))
                              }
                              placeholder="Add a comment..."
                              mb={2}
                            />
                            <Button
                              onClick={() => addComment(item._id)}
                              colorScheme="blue"
                              size="sm"
                              isLoading={commentLoading[item._id]}
                              leftIcon={<FaComment />}
                            >
                              Add Comment
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </Td>
                  </Tr>
                </React.Fragment>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Stack direction="row" spacing={2} justify="center" mt={6}>
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>

          {/* Dynamic page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                variant={page === pageNum ? "solid" : "outline"}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </Stack>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this feedback? This action cannot be
            undone.
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDeleteModalClose} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={deleteFeedback}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Flex
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          justify="space-around"
          py={3}
          zIndex="sticky"
        >
          <IconButton
            icon={<FaList />}
            aria-label="List"
            variant="ghost"
            colorScheme="blue"
          />
          <IconButton
            icon={<FaChartBar />}
            aria-label="Analytics"
            variant="ghost"
            colorScheme="blue"
          />
        </Flex>
      )}
    </Container>
  );
}

export default AdminFeedbackList;