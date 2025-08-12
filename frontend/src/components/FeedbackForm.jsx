// FeedbackForm: lets users submit anonymous feedback (text + optional tags).
// Shows inline errors and success toasts, and calls onSuccess after submit.

import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Tag,
  TagCloseButton,
  TagLabel,
  HStack,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { createFeedback } from "../api/feedback";

// Available tags to choose from
const TAG_OPTIONS = ["bug", "feature", "ui", "performance", "other"];

const FeedbackForm = ({ onSuccess }) => {
  // Form state
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  // Add a tag if not already selected
  const handleAddTag = (tag) => {
    if (!tags.includes(tag)) setTags([...tags, tag]);
  };

  // Remove a selected tag
  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Submit handler: basic validation + API call + success/error UI
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Require some text
    if (!text.trim()) {
      setLoading(false);
      toast({ title: "Feedback text is required.", status: "error" });
      return;
    }

    try {
      await createFeedback({ text, tags });
      // Reset form and notify
      setText("");
      setTags([]);
      toast({ title: "Feedback submitted!", status: "success" });
      if (onSuccess) onSuccess();
    } catch (err) {
      // Show AI/block or generic errors
      if (err.message.includes("blocked")) {
        setError(err.message);
      } else {
        setError("Submission failed.");
        toast({ title: "Submission failed.", status: "error" });
      }
    }
    setLoading(false);
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={4}
      borderWidth={1}
      borderRadius="md"
      mb={6}
      align="center"
      justify="center"
    >
      {/* Inline error alert */}
      {error && (
        <Alert status="error" mb={2}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Feedback text input */}
      <FormControl mb={3} isRequired>
        <FormLabel>Feedback</FormLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your feedback..."
        />
      </FormControl>

      {/* Tags: selected + available */}
      <FormControl mb={3}>
        <FormLabel>Tags</FormLabel>

        {/* Selected tags */}
        <HStack spacing={2} mb={2}>
          {tags.map((tag) => (
            <Tag key={tag} colorScheme="blue">
              <TagLabel>{tag}</TagLabel>
              <TagCloseButton onClick={() => handleRemoveTag(tag)} />
            </Tag>
          ))}
        </HStack>

        {/* Tag choices (hide ones already selected) */}
        <HStack spacing={2}>
          {TAG_OPTIONS.filter((tag) => !tags.includes(tag)).map((tag) => (
            <Button key={tag} size="sm" onClick={() => handleAddTag(tag)}>
              {tag}
            </Button>
          ))}
        </HStack>
      </FormControl>

      {/* Submit button with loading state */}
      <Button colorScheme="teal" type="submit" isLoading={loading}>
        Submit Anonymously
      </Button>
    </Box>
  );
};

export default FeedbackForm;