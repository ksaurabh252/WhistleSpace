/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Spinner,
  Text,
  Tag,
  HStack,
  Badge,
  VStack,
  Divider,
  Heading,
  useToast,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { getFeedbackById, addComment } from "../api/feedback";
import { useParams } from "react-router-dom";
import { getErrorMessage, handleApiError } from "../utils/errorHandler";

const FeedbackDetails = () => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const abortControllerRef = useRef(null);

  const fetchDetails = async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError("");

    try {
      const res = await getFeedbackById(id, {
        signal: abortControllerRef.current.signal,
      });

      console.log("Response received:", res);

      setFeedback(res.data.feedback);
      setComments(res.data.comments);
    } catch (err) {
      if (err.name !== "AbortError") {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        handleApiError(err, toast, "Failed to load feedback details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (id) {
        fetchDetails();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast({
        title: "Validation Error",
        description: "Comment cannot be empty",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSubmitting(true);
    try {
      await addComment(id, { text: commentText });

      setCommentText("");
      await fetchDetails(); // Refresh to get updated comments

      toast({
        title: "Success",
        description: "Comment added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // }
    } catch (err) {
      handleApiError(err, toast, "Failed to add comment");
      // }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner size="lg" />;

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
        <Button ml={4} size="sm" onClick={fetchDetails}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!feedback) {
    return (
      <Alert status="warning">
        <AlertIcon />
        Feedback not found
      </Alert>
    );
  }

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={2}>
        <HStack>
          {feedback?.tags?.map((tag) => (
            <Tag key={tag} colorScheme="blue">
              {tag}
            </Tag>
          ))}
        </HStack>
        <Badge
          colorScheme={feedback.status === "resolved" ? "green" : "orange"}
        >
          {feedback.status}
        </Badge>
      </HStack>
      <Heading size="md" mb={2}>
        Feedback
      </Heading>
      <Text mb={2}>{feedback.text}</Text>
      <Text fontSize="sm" color="gray.500">
        {new Date(feedback.createdAt).toLocaleString()}
      </Text>
      <Divider my={4} />
      <Heading size="sm" mb={2}>
        Comments
      </Heading>

      <VStack align="stretch" spacing={2} mb={4}>
        {comments.length === 0 && (
          <Text color="gray.500">No comments yet.</Text>
        )}
        {comments.map((c) => (
          <Box key={c._id} p={2} borderWidth={1} borderRadius="md">
            <Text>{c.text}</Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(c.createdAt).toLocaleString()}
            </Text>
          </Box>
        ))}
      </VStack>

      <Box as="form" onSubmit={handleAddComment}>
        <FormControl mb={2}>
          <FormLabel>Add a Comment</FormLabel>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            disabled={submitting}
          />
        </FormControl>
        <Button
          type="submit"
          colorScheme="teal"
          isLoading={submitting}
          loadingText="Submitting..."
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default FeedbackDetails;
