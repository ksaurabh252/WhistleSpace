/**
 * Handles API errors and displays appropriate toast notifications
 * @param {Error} error - The error object from the API call
 * @param {Function} toast - Toast notification function
 * @returns {Object} Error information including message, status code, and original error
 */
export const handleApiError = (error, toast) => {
  const defaultMessage = "An unknown error occurred";
  let message = defaultMessage;
  let statusCode = 500;

  if (error.response) {
    statusCode = error.response.status;
    message =
      error.response.data?.message ||
      error.response.statusText ||
      defaultMessage;

    switch (statusCode) {
      case 401:
        message = "Session expired. Please login again.";
        setTimeout(() => (window.location.href = "/login"), 2000);
        break;
      case 403:
        message = "You are not authorized for this action";
        break;
      case 404:
        message = "Resource not found";
        break;
      default:
        if (statusCode >= 500) {
          message = "Server error. Please try again later.";
        }
    }
  } else if (error.request) {
    message = "Network error. Please check your connection.";
  }

  toast({
    title: "Error",
    description: message,
    status: "error",
    duration: 5000,
    isClosable: true,
    position: "top-right",
  });

  return {
    message,
    statusCode,
    originalError: error,
  };
};

/**
 * Handles successful API responses and displays success toast notifications
 * @param {Object} response - The API response object
 * @param {Function} toast - Toast notification function
 * @param {string} successMessage - Optional success message to display
 * @returns {any} Response data
 */
export const handleApiSuccess = (response, toast, successMessage) => {
  if (successMessage) {
    toast({
      title: "Success",
      description: successMessage,
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top-right",
    });
  }

  return response.data;
};
