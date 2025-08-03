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

const TAG_OPTIONS = ["bug", "feature", "ui", "performance", "other"];

const FeedbackForm = ({ onSuccess }) => {
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const handleAddTag = (tag) => {
    if (!tags.includes(tag)) setTags([...tags, tag]);
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!text.trim()) {
      setLoading(false);
      toast({ title: "Feedback text is required.", status: "error" });
      return;
    }
    try {
      await createFeedback({ text, tags });
      setText("");
      setTags([]);
      toast({ title: "Feedback submitted!", status: "success" });
      if (onSuccess) onSuccess();
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Submission failed.");
      toast({ title: "Submission failed.", status: "error" });
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
      {error && (
        <Alert status="error" mb={2}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      <FormControl mb={3} isRequired>
        <FormLabel>Feedback</FormLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your feedback..."
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Tags</FormLabel>
        <HStack spacing={2} mb={2}>
          {tags.map((tag) => (
            <Tag key={tag} colorScheme="blue">
              <TagLabel>{tag}</TagLabel>
              <TagCloseButton onClick={() => handleRemoveTag(tag)} />
            </Tag>
          ))}
        </HStack>
        <HStack spacing={2}>
          {TAG_OPTIONS.filter((tag) => !tags.includes(tag)).map((tag) => (
            <Button key={tag} size="sm" onClick={() => handleAddTag(tag)}>
              {tag}
            </Button>
          ))}
        </HStack>
      </FormControl>
      <Button colorScheme="teal" type="submit" isLoading={loading}>
        Submit Anonymously
      </Button>
    </Box>
  );
};

export default FeedbackForm;
