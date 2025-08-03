export const getErrorMessage = (error) => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export const handleApiError = (
  error,
  toast,
  defaultMessage = "Operation failed"
) => {
  const message = getErrorMessage(error);
  toast({
    title: defaultMessage,
    description: message,
    status: "error",
    duration: 5000,
    isClosable: true,
  });
};
