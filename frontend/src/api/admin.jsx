/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'http://localhost:5000',
  withCredentials: true, //Needed for refresh/logout cookies
});


// Attach token to requests
//Add access token to every request if avilable
API.interceptors.request.use(config => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 errors by trying to refresh the access token
API.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    // If 401 and not already retried, try to refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Call refresh endpoint (cookie is sent automatically)
        const res = await API.post('/admin/refresh', {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        // Save new access token
        localStorage.setItem('adminAccessToken', newToken);
        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and redirect to login
        localStorage.removeItem('adminAccessToken');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
)

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