/* eslint-disable no-unused-vars */
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
} from "@chakra-ui/react";
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
  // const isMountedRef = useRef(true);

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

      // if (isMountedRef.current) {
      setFeedbacks(res.data);
      // }
    } catch (err) {
      if (err.name !== "AbortError" && err.message !== "canceled") {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        handleApiError(err, toast, "Failed to load feedback");
      }
    } finally {
      // if (isMountedRef.current) {
      setLoading(false);
      // }
    }
  };

  useEffect(() => {
    fetchFeedbacks();

    return () => {
      // isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filterTag, filterStatus]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateFeedbackStatus(id, status);

      // if (isMountedRef.current) {
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
      // }
    } catch (err) {
      // if (isMountedRef.current) {
      handleApiError(err, toast, "Failed to update status");
      // }
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await deleteFeedback(id);

      // if (isMountedRef.current) {
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
      // if (isMountedRef.current) {
      handleApiError(err, toast, "Failed to delete feedback");
      // }
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

  if (loading) return <Spinner />;

  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <HStack justify="space-between" mb={4}>
        <Heading>Admin Dashboard</Heading>
        <Button colorScheme="red" onClick={logout}>
          Logout
        </Button>
      </HStack>

      <HStack mb={4}>
        <Select
          placeholder="Filter by tag"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          maxW="200px"
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
        >
          Clear Filters
        </Button>
      </HStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={6}
        align="flex-start"
      >
        <Box flex="1" minW="350px">
          <Heading size="sm" mb={2}>
            Feedback List
          </Heading>
          <Stack spacing={3}>
            {feedbacks.map((fb) => (
              <Box
                key={fb._id}
                p={3}
                borderWidth={1}
                borderRadius="md"
                bg={selected && selected._id === fb._id ? "gray.100" : "white"}
              >
                <HStack justify="space-between">
                  <HStack>
                    {fb.tags.map((tag) => (
                      <Tag key={tag} colorScheme="blue">
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
                  >
                    {fb.status}
                  </Badge>
                </HStack>
                <Text mt={2} mb={2} noOfLines={2}>
                  {fb.text}
                </Text>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.500">
                    {new Date(fb.createdAt).toLocaleString()}
                  </Text>
                  <HStack>
                    <Button
                      size="xs"
                      colorScheme="teal"
                      variant="outline"
                      onClick={() => fetchDetails(fb._id)}
                    >
                      Details
                    </Button>
                    {/* <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleDeleteFeedback(fb._id)}>
                      Delete
                    </Button> */}
                    <ConfirmModal
                      onConfirm={() => handleDeleteFeedback(fb._id)}
                      title="Delete Feedback"
                      body="Are you sure you want to delete this feedback? This action cannot be undone."
                    >
                      <Button size="xs" colorScheme="red" variant="outline">
                        Delete
                      </Button>
                    </ConfirmModal>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box flex="2" minW="350px">
          {detailsLoading && <Spinner />}
          {selected && !detailsLoading && (
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="sm" mb={2}>
                Feedback Details
              </Heading>
              <HStack mb={2}>
                {selected?.tags?.map((tag) => (
                  <Tag key={tag} colorScheme="blue">
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
                >
                  {selected.status}
                </Badge>
              </HStack>

              <Text mb={2}>{selected.text}</Text>
              <Text fontSize="sm" color="gray.500">
                {new Date(selected.createdAt).toLocaleString()}
              </Text>
              <HStack mt={3} spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => handleStatusChange(selected._id, "resolved")}
                >
                  Mark as Resolved
                </Button>
                <Button
                  size="sm"
                  colorScheme="gray"
                  onClick={() => handleStatusChange(selected._id, "closed")}
                >
                  Mark as Closed
                </Button>
              </HStack>
              <Box mt={6}>
                <Heading size="xs" mb={2}>
                  Comments
                </Heading>
                <Stack spacing={2}>
                  {selected?.comments?.length === 0 && (
                    <Text color="gray.500">No comments.</Text>
                  )}
                  {selected.comments.map((c) => (
                    <Box key={c._id} p={2} borderWidth={1} borderRadius="md">
                      <Text>{c.text}</Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">
                          {new Date(c.createdAt).toLocaleString()}
                        </Text>
                        {/* <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleDeleteComment(selected._id, c._id)}>
                          Delete
                        </Button> */}
                        <ConfirmModal
                          onConfirm={() =>
                            handleDeleteComment(selected._id, c._id)
                          }
                          title="Delete Comment"
                          body="Are you sure you want to delete this comment? This action cannot be undone."
                        >
                          <Button size="xs" colorScheme="red" variant="outline">
                            Delete
                          </Button>
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
