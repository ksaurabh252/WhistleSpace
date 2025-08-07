/* eslint-disable react-refresh/only-export-components */
import API from './axios';

// Auth
export const adminLogin = (data, config = {}) => API.post('/admin/login', data, config);

// Feedback moderation
export const getAllFeedbacks = (params, config = {}) => API.get('/feedback', { params, ...config });

export const updateFeedbackStatus = (id, status, config = {}) => API.patch(`/feedback/${id}`, { status }, config);

export const deleteFeedback = (id, config = {}) => API.delete(`/feedback/${id}`, config);

// Comments moderation
export const deleteComment = (feedbackId, commentId, config = {}) => API.delete(`/feedback/${feedbackId}/comment/${commentId}`, config);

export const getFeedbackById = (id, config = {}) => API.get(`/feedback/${id}`, config);

export default API;