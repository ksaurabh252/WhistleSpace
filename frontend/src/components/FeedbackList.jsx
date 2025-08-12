// Shows a list of feedback cards with loading skeletons, error state, and empty state.
// Uses Chakra UI for styling and a small timeout to avoid skeleton flicker.

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Text,
  Tag,
  HStack,
  Badge,
  Button,
  Alert,
  AlertIcon,
  Skeleton,
  SkeletonText,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { keyframes } from "@emotion/react";

import { getFeedbacks } from "../api/feedback";
import { getErrorMessage } from "../utils/errorHandler";

// Subtle breathing border animation for the empty state card
const breathingAnimation = keyframes`
  0% { border-color: var(--chakra-colors-teal-200); box-shadow: 0 0 5px rgba(45, 212, 191, 0.2); }
  50% { border-color: var(--chakra-colors-teal-300); box-shadow: 0 0 15px rgba(45, 212, 191, 0.4); }
  100% { border-color: var(--chakra-colors-teal-200); box-shadow: 0 0 5px rgba(45, 212, 191, 0.2); }
`;

// Skeleton card used while loading
const FeedbackCardSkeleton = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("teal.200", "blue.400");

  return (
    <Box
      p={5}
      borderWidth={2}
      borderRadius="xl"
      bg={cardBg}
      boxShadow="md"
      borderColor={cardBorder}
    >
      <HStack mb={2}>
        <Skeleton height="24px" width="60px" borderRadius="full" />
        <Skeleton height="24px" width="60px" borderRadius="full" />
      </HStack>
      <SkeletonText mt="4" noOfLines={2} spacing="4" />
      <HStack justify="space-between" mt={4}>
        <Skeleton height="20px" width="120px" />
        <Skeleton height="32px" width="100px" borderRadius="md" />
      </HStack>
    </Box>
  );
};

const FeedbackList = () => {
  // Data + UI state
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep references for aborting requests and clearing timeouts
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Theme-aware colors
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("teal.200", "blue.400");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");

  // Fetch feedbacks with cancellation and basic error handling
  const fetchFeedbacks = async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");

    try {
      const res = await getFeedbacks({
        signal: abortControllerRef.current.signal,
      });
      setFeedbacks(res.data || []);

      // Tiny delay so the skeleton doesn't flash too quickly
      setTimeout(() => setLoading(false), 150);
    } catch (err) {
      // Ignore abort/cancel errors; show others
      if (
        err.name !== "AbortError" &&
        err.message !== "canceled" &&
        err.code !== "ERR_CANCELED"
      ) {
        setError(getErrorMessage(err) || "Failed to load feedback");
      }
      setLoading(false);
    } finally {
      // Clear any global timeout if set
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  // On mount: load data and set a 10s safety timeout
  useEffect(() => {
    fetchFeedbacks();

    // If request hangs, stop loading and show a helpful message
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(
          "Request timed out. Please check your connection or try again."
        );
      }
    }, 10000);

    // Cleanup on unmount: abort requests and clear timers
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state: show 3 skeleton cards
  if (loading)
    return (
      <Stack spacing={5}>
        {[...Array(3)].map((_, i) => (
          <FeedbackCardSkeleton key={i} />
        ))}
      </Stack>
    );

  // Error state with retry button
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
        <Button ml={4} size="sm" onClick={fetchFeedbacks}>
          Retry
        </Button>
      </Alert>
    );
  }

  // Main content: empty state or list of feedback cards
  return (
    <Stack spacing={5}>
      {feedbacks.length === 0 ? (
        // Empty state card
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
          <Text fontSize="xl" color={subTextColor} mb={3} fontWeight="semibold">
            📝 No feedback yet
          </Text>
          <Text fontSize="md" color={subTextColor} mb={4}>
            Be the first to share your thoughts and help us improve!
          </Text>
          <Text fontSize="sm" color={subTextColor}>
            Your anonymous feedback is valuable to us. 💭
          </Text>
        </Box>
      ) : (
        // Feedback list
        feedbacks.map((fb) => (
          <Box
            key={fb._id}
            p={5}
            borderWidth={2}
            borderRadius="xl"
            bg={cardBg}
            boxShadow="md"
            borderColor={cardBorder}
            _hover={{
              boxShadow: "xl",
              transform: "scale(1.01)",
              borderColor: cardBorder,
            }}
            transition="all 0.2s"
          >
            <HStack justify="space-between" mb={2}>
              <HStack>
                {/* Assuming fb.tags is an array */}
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
                colorScheme={fb.status === "resolved" ? "green" : "orange"}
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
              fontSize="md"
              fontWeight="medium"
              color={textColor}
              noOfLines={2}
            >
              {fb.text}
            </Text>

            <HStack justify="space-between" mt={3}>
              <Text fontSize="sm" color={subTextColor}>
                {new Date(fb.createdAt).toLocaleString()}
              </Text>
              <Button
                as={Link}
                to={`/feedback/${fb._id}`}
                size="sm"
                colorScheme="teal"
                variant="outline"
                fontWeight="bold"
              >
                View Details
              </Button>
            </HStack>
          </Box>
        ))
      )}
    </Stack>
  );
};

export default FeedbackList;
