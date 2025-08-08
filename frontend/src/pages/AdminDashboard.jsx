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
  Alert,
  AlertIcon,
  useColorModeValue,
  IconButton,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { InfoOutlineIcon, DeleteIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion"; import { keyframes } from "@emotion/react";
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

const MotionBox = motion(Box);
const TAG_OPTIONS = ["bug", "feature", "ui", "performance", "other"];
const STATUS_COLORS = { resolved: "green", closed: "gray", open: "orange" };

const breathingAnimation = keyframes`
  0% { 
    border-color: var(--chakra-colors-teal-200);
     box-shadow: 0 0 5px rgba(45, 212, 191, 0.2);
  }
  50% { 
   border-color: var(--chakra-colors-teal-300);
    box-shadow: 0 0 15px rgba(45, 212, 191, 0.4);
  }
  100% { 
    border-color: var(--chakra-colors-teal-200);
   box-shadow: 0 0 5px rgba(45, 212, 191, 0.2);
  }
`;

const SkeletonCard = ({ bg, border, commentBg, detailed }) => (
  <Box
    p={detailed ? 6 : 5}
    borderWidth={2}
    borderRadius="xl"
    bg={bg}
    boxShadow={detailed ? "lg" : "md"}
    borderColor={detailed ? border : undefined}
  >
    <HStack mb={2}>
      {[...Array(detailed ? 2 : 4)].map((_, i) => (
        <Skeleton key={i} height="24px" width="60px" borderRadius="full" />
      ))}
    </HStack>
    <SkeletonText mt="4" noOfLines={detailed ? 3 : 2} spacing="4" />
    <Skeleton height="20px" width="120px" mt={2} />
    {detailed && (
      <>
        <HStack mt={4} spacing={3}>
          <Skeleton height="32px" width="140px" borderRadius="md" />
          <Skeleton height="32px" width="140px" borderRadius="md" />
        </HStack>
        <Box mt={8}>
          <Skeleton height="24px" width="120px" mb={3} />
          <Stack spacing={3}>
            {[...Array(2)].map((_, i) => (
              <Box
                key={i}
                p={3}
                borderWidth={1}
                borderRadius="md"
                bg={commentBg}
              >
                <SkeletonText noOfLines={2} spacing="2" />
              </Box>
            ))}
          </Stack>
        </Box>
      </>
    )}
  </Box>
);

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

  const cardBg = useColorModeValue("white", "gray.800");
  const cardSelectedBg = useColorModeValue("teal.50", "blue.900");
  const cardBorder = useColorModeValue("teal.200", "blue.400");
  const mainBg = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const commentBg = useColorModeValue("gray.50", "gray.700");

  const showToast = (title, status = "success") =>
    toast({ title, status, duration: 3000, isClosable: true });

  const fetchFeedbacks = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
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

      // SIMPLE FIX: Set data first, then loading false
      setFeedbacks(res.data || []);
      setTimeout(() => setLoading(false), 150); // Small delay

    } catch (err) {
      if (err.name !== "AbortError" && err.message !== "canceled") {
        setError(getErrorMessage(err));
        handleApiError(err, toast, "Failed to load feedback");
      }
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFeedbacks();
    return () => abortControllerRef.current?.abort();
  }, [filterTag, filterStatus]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateFeedbackStatus(id, status);
      showToast("Status updated");
      fetchFeedbacks();
      if (selected?._id === id) fetchDetails(id);
    } catch (err) {
      handleApiError(err, toast, "Failed to update status");
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      await deleteFeedback(id);
      showToast("Feedback deleted");
      setSelected(null);
      fetchFeedbacks();
    } catch (err) {
      console.error("API call failed:", err);
      handleApiError(err, toast, "Failed to delete feedback");
    }
  };

  const fetchDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const res = await getFeedbackById(id);
      setSelected({ ...res.data.feedback, comments: res.data.comments });
    } catch {
      showToast("Failed to load details", "error");
    }
    setDetailsLoading(false);
  };

  const handleDeleteComment = async (feedbackId, commentId) => {
    try {
      await deleteComment(feedbackId, commentId);
      showToast("Comment deleted");
      fetchDetails(feedbackId);
    } catch {
      showToast("Failed to delete comment", "error");
    }
  };

  const FeedbackCard = ({ fb }) => (
    <Box
      p={5}
      borderWidth={2}
      borderRadius="xl"
      bg={selected?._id === fb._id ? cardSelectedBg : cardBg}
      borderColor={selected?._id === fb._id ? cardBorder : "transparent"}
      boxShadow="md"
      cursor="pointer"
      onClick={() => fetchDetails(fb._id)}
      _hover={{
        boxShadow: "xl",
        transform: "scale(1.02)",
        borderColor: cardBorder,
      }}
      transition="all 0.2s"
    >
      <HStack justify="space-between" mb={2}>
        <HStack>
          {fb.tags.map((tag) => (
            <Tag
              key={tag}
              colorScheme="purple"
              variant="solid"
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
          colorScheme={STATUS_COLORS[fb.status]}
          fontSize="0.9em"
          px={3}
          py={1}
          borderRadius="md"
        >
          {fb.status.toUpperCase()}
        </Badge>
      </HStack>
      <Text
        mt={2}
        mb={2}
        noOfLines={2}
        fontSize="md"
        fontWeight="medium"
        color={textColor}
      >
        {fb.text || <i>No feedback text</i>}
      </Text>
      <HStack justify="space-between" mt={3}>
        <Text fontSize="sm" color={subTextColor}>
          {new Date(fb.createdAt).toLocaleString()}
        </Text>
        <HStack onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            colorScheme="teal"
            leftIcon={<InfoOutlineIcon />}
            onClick={() => fetchDetails(fb._id)}
          >
            Details
          </Button>
          <ConfirmModal
            onConfirm={() => handleDeleteFeedback(fb._id)}
            title="Delete Feedback"
            body="Are you sure? This action cannot be undone."
          >
            <Button
              size="sm"
              colorScheme="red"
              leftIcon={<DeleteIcon />}
              variant="outline"
            >
              Delete
            </Button>
          </ConfirmModal>
        </HStack>
      </HStack>
    </Box>
  );

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
        <Heading size="lg" color="teal.500">
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
          {["open", "resolved", "closed"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Button
          onClick={() => {
            setFilterTag("");
            setFilterStatus("");
          }}
          colorScheme="teal"
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
        <Box flex="1" minW="350px">
          <Heading size="md" mb={4} color="teal.400">
            Feedback List
          </Heading>

          {loading ? (
            <Stack spacing={5}>
              {[...Array(3)].map((_, i) => (
                <SkeletonCard
                  key={i}
                  bg={cardBg}
                  border={cardBorder}
                  commentBg={commentBg}
                />
              ))}
            </Stack>
          ) : (
            <Stack spacing={5}>
              {feedbacks.length === 0 ? (
                <Box
                  textAlign="center"
                  py={10}
                  px={6}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor={cardBorder}
                  boxShadow="md"
                  animation={`${breathingAnimation} 3s ease-in-out infinite`}
                  _hover={{
                    animation: `${breathingAnimation} 1.5s ease-in-out infinite`,
                    transform: "translateY(-2px)",
                  }}
                  transition="transform 0.3s ease"
                >
                  <Text fontSize="lg" color={subTextColor} mb={2}>
                    📝 No feedback found
                  </Text>
                  <Text fontSize="sm" color={subTextColor}>
                    {filterTag || filterStatus
                      ? "Try adjusting your filters or clear them to see all feedback."
                      : "No feedback has been submitted yet."}
                  </Text>
                  {(filterTag || filterStatus) && (
                    <Button
                      mt={3}
                      size="sm"
                      colorScheme="teal"
                      variant="outline"
                      onClick={() => {
                        setFilterTag("");
                        setFilterStatus("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Box>
              ) : (
                feedbacks.map((fb) => <FeedbackCard key={fb._id} fb={fb} />)
              )}
            </Stack>
          )}
        </Box>

        <Box flex="2" minW="350px">
          <AnimatePresence mode="wait">
            {loading || detailsLoading ? (
              <SkeletonCard
                key="skeleton"
                bg={cardBg}
                border={cardBorder}
                commentBg={commentBg}
                detailed
              />
            ) : (
              selected && (
                <MotionBox
                  key={selected._id}
                  p={6}
                  borderWidth={2}
                  borderRadius="xl"
                  bg={cardBg}
                  boxShadow="lg"
                  borderColor={cardBorder}
                  mt={2}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  transition={{ duration: 0.35, type: "spring" }}
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
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="sm"
                      >
                        {tag}
                      </Tag>
                    ))}
                    <Badge
                      colorScheme={STATUS_COLORS[selected.status]}
                      fontSize="0.9em"
                      px={3}
                      py={1}
                      borderRadius="md"
                    >
                      {selected.status.toUpperCase()}
                    </Badge>
                  </HStack>
                  <Text
                    mb={2}
                    fontSize="lg"
                    fontWeight="semibold"
                    color={textColor}
                  >
                    {selected.text}
                  </Text>
                  <Text fontSize="sm" color={subTextColor}>
                    {new Date(selected.createdAt).toLocaleString()}
                  </Text>
                  <HStack mt={4} spacing={3}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() =>
                        handleStatusChange(selected._id, "resolved")
                      }
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
                      {selected?.comments?.length === 0 ? (
                        <Box
                          textAlign="center"
                          py={6}
                          px={4}
                          bg={commentBg}
                          borderRadius="md"
                          borderWidth={1}
                          borderStyle="dashed"
                        >
                          <Text color={subTextColor} fontSize="sm">
                            💬 No comments yet
                          </Text>
                        </Box>
                      ) : (
                        selected.comments.map((c) => (
                          <Box
                            key={c._id}
                            p={3}
                            borderWidth={1}
                            borderRadius="md"
                            bg={commentBg}
                          >
                            <Text color={textColor}>{c.text}</Text>
                            <HStack justify="space-between" mt={2}>
                              <Text fontSize="xs" color={subTextColor}>
                                {new Date(c.createdAt).toLocaleString()}
                              </Text>
                              <ConfirmModal
                                onConfirm={() =>
                                  handleDeleteComment(selected._id, c._id)
                                }
                                title="Delete Comment"
                                body="Are you sure? This action cannot be undone."
                              >
                                <IconButton
                                  size="xs"
                                  colorScheme="red"
                                  icon={<DeleteIcon />}
                                  variant="ghost"
                                />
                              </ConfirmModal>
                            </HStack>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Box>
                </MotionBox>
              )
            )}
          </AnimatePresence>
        </Box>
      </Stack>
    </Box>
  );
};

export default AdminDashboard;
