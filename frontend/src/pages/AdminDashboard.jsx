import { useEffect, useRef, useState } from "react";
import {
  Box,
  Heading,
  Button,
  Tag,
  HStack,
  Badge,
  Stack,
  Select,
  Text,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import { InfoOutlineIcon, DeleteIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";
import {
  getAllFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackById,
  deleteComment,
} from "../api/admin";
import { useAdminAuth } from "../context/AdminAuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { getErrorMessage, handleApiError } from "../utils/errorHandler";

const TAG_OPTIONS = ["bug", "feature", "ui", "performance", "other"];

const AdminDashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const { logout } = useAdminAuth();
  const abortControllerRef = useRef(null);
  const commentBg = useColorModeValue("gray.50", "gray.700");

  // Color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const cardSelectedBg = useColorModeValue("blue.50", "blue.900");
  const cardBorder = useColorModeValue("blue.200", "blue.400");
  const mainBg = useColorModeValue("gray.50", "gray.900");

  const fetchFeedbacks = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterTag) params.tags = filterTag;
      if (filterStatus) params.status = filterStatus;
      const res = await getAllFeedbacks(params, {
        signal: abortControllerRef.current.signal,
      });
      setFeedbacks(res.data);
    } catch (err) {
      if (err.name !== "AbortError" && err.message !== "canceled") {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        handleApiError(err, toast, "Failed to load feedback");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filterTag, filterStatus]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateFeedbackStatus(id, status);
      toast({
        title: "Success",
        description: "Status updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchFeedbacks();
      if (selected && selected._id === id) {
        fetchDetails(id);
      }
    } catch (err) {
      handleApiError(err, toast, "Failed to update status");
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await deleteFeedback(id);
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setSelected(null);
      fetchFeedbacks();
    } catch (err) {
      handleApiError(err, toast, "Failed to delete feedback");
    }
  };

  const fetchDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const res = await getFeedbackById(id);
      setSelected({ ...res.data.feedback, comments: res.data.comments });
    } catch {
      toast({ title: "Failed to load details", status: "error" });
    }
    setDetailsLoading(false);
  };

  const handleDeleteComment = async (feedbackId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(feedbackId, commentId);
      toast({ title: "Comment deleted", status: "success" });
      fetchDetails(feedbackId);
    } catch {
      toast({ title: "Failed to delete comment", status: "error" });
    }
  };

  if (loading) return <Spinner size="xl" mt={20} />;

  return (
    <Box
      maxW="1200px"
      mx="auto"
      p={{ base: 2, md: 6 }}
      minH="100vh"
      bg={mainBg}
      borderRadius="2xl"
      boxShadow="lg"
    >
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" letterSpacing="tight">
          Admin Dashboard
        </Heading>
        <Button colorScheme="red" onClick={logout} size="md" fontWeight="bold">
          Logout
        </Button>
      </HStack>

      <HStack mb={6} spacing={4}>
        <Select
          placeholder="Filter by tag"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          maxW="200px"
          bg={cardBg}
        >
          {TAG_OPTIONS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </Select>
        <Select
          placeholder="Filter by status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          maxW="200px"
          bg={cardBg}
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
        <Button
          onClick={() => {
            setFilterTag("");
            setFilterStatus("");
          }}
          colorScheme="blue"
          variant="outline"
        >
          Clear Filters
        </Button>
      </HStack>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={8}
        align="flex-start"
      >
        {/* Feedback List */}
        <Box flex="1" minW="350px">
          <Heading size="md" mb={4} color="blue.400" letterSpacing="tight">
            Feedback List
          </Heading>
          <Stack spacing={5}>
            {feedbacks.map((fb) => (
              <Box
                key={fb._id}
                p={5}
                borderWidth={2}
                borderColor={selected?._id === fb._id ? cardBorder : "transparent"}
                borderRadius="xl"
                bg={selected?._id === fb._id ? cardSelectedBg : cardBg}
                boxShadow="md"
                _hover={{
                  boxShadow: "xl",
                  transform: "scale(1.02)",
                  borderColor: cardBorder,
                }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => fetchDetails(fb._id)}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    {fb.tags.map((tag) => (
                      <Tag
                        key={tag}
                        colorScheme="purple"
                        variant="solid"
                        fontWeight="bold"
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="sm"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </HStack>
                  <Badge
                    colorScheme={
                      fb.status === "resolved"
                        ? "green"
                        : fb.status === "closed"
                          ? "gray"
                          : "orange"
                    }
                    fontSize="0.9em"
                    px={3}
                    py={1}
                    borderRadius="md"
                  >
                    {fb.status.toUpperCase()}
                  </Badge>
                </HStack>
                <Text mt={2} mb={2} noOfLines={2} fontSize="md" fontWeight="medium">
                  {fb.text || <i>No feedback text</i>}
                </Text>
                <HStack justify="space-between" mt={3}>
                  <Text fontSize="sm" color="gray.400">
                    {new Date(fb.createdAt).toLocaleString()}
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<InfoOutlineIcon />}
                      variant="solid"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchDetails(fb._id);
                      }}
                    >
                      Details
                    </Button>
                    <ConfirmModal
                      onConfirm={() => handleDeleteFeedback(fb._id)}
                      title="Delete Feedback"
                      body="Are you sure you want to delete this feedback? This action cannot be undone."
                    >
                      <Button
                        size="sm"
                        colorScheme="red"
                        leftIcon={<DeleteIcon />}
                        variant="outline"
                        onClick={e => e.stopPropagation()}
                      >
                        Delete
                      </Button>
                    </ConfirmModal>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Feedback Details */}
        <Box flex="2" minW="350px">
          {detailsLoading && <Spinner />}
          {selected && !detailsLoading && (
            <Box
              p={6}
              borderWidth={2}
              borderRadius="xl"
              bg={cardBg}
              boxShadow="lg"
              borderColor={cardBorder}
            >
              <Heading size="md" mb={3} color="blue.400">
                Feedback Details
              </Heading>
              <HStack mb={2}>
                {selected?.tags?.map((tag) => (
                  <Tag
                    key={tag}
                    colorScheme="purple"
                    variant="solid"
                    fontWeight="bold"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="sm"
                  >
                    {tag}
                  </Tag>
                ))}
                <Badge
                  colorScheme={
                    selected.status === "resolved"
                      ? "green"
                      : selected.status === "closed"
                        ? "gray"
                        : "orange"
                  }
                  fontSize="0.9em"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {selected.status.toUpperCase()}
                </Badge>
              </HStack>
              <Text mb={2} fontSize="lg" fontWeight="semibold">
                {selected.text}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {new Date(selected.createdAt).toLocaleString()}
              </Text>
              <HStack mt={4} spacing={3}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => handleStatusChange(selected._id, "resolved")}
                  variant="solid"
                >
                  Mark as Resolved
                </Button>
                <Button
                  size="sm"
                  colorScheme="gray"
                  onClick={() => handleStatusChange(selected._id, "closed")}
                  variant="outline"
                >
                  Mark as Closed
                </Button>
              </HStack>
              <Box mt={8}>
                <Heading size="sm" mb={3} color="blue.400">
                  Comments
                </Heading>
                <Stack spacing={3}>
                  {selected?.comments?.length === 0 && (
                    <Text color="gray.500">No comments.</Text>
                  )}


                  {selected.comments.map((c) => (
                    <Box
                      key={c._id}
                      p={3}
                      borderWidth={1}
                      borderRadius="md"
                      bg={commentBg}
                    >
                      <Text>{c.text}</Text>
                      <HStack justify="space-between" mt={2}>
                        <Text fontSize="xs" color="gray.400">
                          {new Date(c.createdAt).toLocaleString()}
                        </Text>
                        <ConfirmModal
                          onConfirm={() =>
                            handleDeleteComment(selected._id, c._id)
                          }
                          title="Delete Comment"
                          body="Are you sure you want to delete this comment? This action cannot be undone."
                        >
                          <IconButton
                            size="xs"
                            colorScheme="red"
                            icon={<DeleteIcon />}
                            variant="ghost"
                            aria-label="Delete comment"
                          />
                        </ConfirmModal>
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default AdminDashboard;