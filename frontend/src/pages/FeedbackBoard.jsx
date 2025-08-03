import React, { useState } from "react";
import { Box, Heading } from "@chakra-ui/react";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

const FeedbackBoard = () => {
  const [refresh, setRefresh] = useState(false);

  // Refresh list after submission
  const handleSuccess = () => setRefresh((r) => !r);

  return (
    <Box maxW="700px" mx="auto" p={4}>
      <Heading mb={6}>WhistleSpace Feedback Board</Heading>
      <FeedbackForm onSuccess={handleSuccess} />
      <FeedbackList key={refresh} />
    </Box>
  );
};

export default FeedbackBoard;
