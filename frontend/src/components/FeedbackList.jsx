import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Spinner,
  Stack,
  Text,
  Tag,
  HStack,
  Badge,
  Button,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { getFeedbacks } from "../api/feedback";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../utils/errorHandler";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchFeedbacks = async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");
    try {
      const res = await getFeedbacks({
        signal: abortControllerRef.current.signal,
      });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setFeedbacks(res.data);
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (
        err.name !== "AbortError" &&
        err.message === "canceled"
        &&
        isMountedRef.current
      ) {
        console.log("Fetch aborted:", err);
        // setError(getErrorMessage(err) || "Failed to load feedback");
      }
      else if (isMountedRef.current) {
        setError(getErrorMessage(err) || 'Failed to load feedback');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }

  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeedbacks();
    }, 100);
    // Cleanup function
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  if (loading) return <Spinner size="lg" />;

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
        <Button ml={4} size="sm" onClick={fetchFeedbacks}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Stack spacing={4}>
      {feedbacks.length === 0 && <Text>No feedback yet.</Text>}
      {feedbacks.map((fb) => (
        <Box key={fb._id} p={4} borderWidth={1} borderRadius="md">
          <HStack justify="space-between">
            <HStack>
              {fb.tags.map((tag) => (
                <Tag key={tag} colorScheme="blue">
                  {tag}
                </Tag>
              ))}
            </HStack>
            <Badge colorScheme={fb.status === "resolved" ? "green" : "orange"}>
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
            <Button
              as={Link}
              to={`/feedback/${fb._id}`}
              size="sm"
              colorScheme="teal"
              variant="outline"
            >
              View Details
            </Button>
          </HStack>
        </Box>
      ))}
    </Stack>
  );
};

export default FeedbackList;
