import API from "./axios.js";

// Feedback APIs
export const createFeedback = (data, config = {}) =>
  API.post("/feedback", data, config);

export const getFeedbacks = (config = {}) => API.get("/feedback", config);

export const getFeedbackById = (id, config = {}) =>
  API.get(`/feedback/${id}`, config);

export const addComment = (id, data, config = {}) =>
  API.post(`/feedback/${id}/comment`, data, config);
