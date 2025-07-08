import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Flex,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FaBell, FaCheck, FaTrash, FaSync } from 'react-icons/fa';
import api from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * UserDashboard Component
 * 
 * Displays user notifications with the following features:
 * - View all notifications or filter by unread
 * - Mark individual or all notifications as read
 * - Display notification severity levels and types
 * - Real-time notification count updates
 * - Responsive design with light/dark mode support
 */
const UserDashboard = () => {
  // Get authenticated user data
  const { user } = useAuth();
  const toast = useToast();

  // State management for notifications and UI
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [stats, setStats] = useState({
    totalCount: 0,
    unreadCount: 0
  });

  // Color mode values for theming
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  /**
   * Effect hook to initialize component data
   * Fetches notifications and unread count on component mount
   */
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  /**
   * Fetches notifications from the API
   * @param {boolean} unreadOnly - If true, fetches only unread notifications
   */
  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/users/notifications', {
        params: { unreadOnly }
      });

      // Update notifications and stats from API response
      setNotifications(data.data.notifications);
      setStats({
        totalCount: data.data.totalCount,
        unreadCount: data.data.unreadCount
      });
    } catch (error) {
      // Show error toast notification
      toast({
        title: 'Error fetching notifications',
        description: error.response?.data?.error || 'Failed to load notifications',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches only the unread notification count
   * Used for updating the counter without refetching all notifications
   */
  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/users/notifications/unread-count');
      setStats(prev => ({
        ...prev,
        unreadCount: data.unreadCount
      }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  /**
   * Marks notifications as read
   * @param {Array} notificationIds - Array of notification IDs to mark as read. 
   *                                  If empty, marks all notifications as read
   */
  const markAsRead = async (notificationIds = []) => {
    try {
      setMarkingRead(true);
      await api.post('/api/users/notifications/mark-read', {
        notificationIds
      });

      // Update local state to reflect read status
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: notificationIds.length === 0 || notificationIds.includes(notification._id)
        }))
      );

      // Refresh unread count
      fetchUnreadCount();

      toast({
        title: 'Notifications marked as read',
        status: 'success',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error marking notifications',
        description: 'Failed to mark notifications as read',
        status: 'error',
        duration: 3000
      });
    } finally {
      setMarkingRead(false);
    }
  };

  /**
   * Returns appropriate color scheme based on notification severity
   * @param {string} severity - Notification severity level
   * @returns {string} Chakra UI color scheme name
   */
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  /**
   * Returns appropriate emoji icon based on notification type
   * @param {string} type - Notification type
   * @returns {string} Emoji representing the notification type
   */
  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'ban': return '🚫';
      case 'info': return 'ℹ️';
      case 'review': return '🛡️';
      default: return '📢';
    }
  };

  /**
   * Individual notification card component
   * Displays notification details with appropriate styling based on read status
   * @param {Object} notification - Notification object containing all notification data
   */
  const NotificationCard = ({ notification }) => (
    <Card
      mb={4}
      bg={notification.read ? 'gray.50' : bgColor}
      borderLeft={
        notification.read
          ? '4px solid gray'
          : `4px solid ${getSeverityColor(notification.severity)}.500`
      }
      _dark={{
        bg: notification.read ? 'gray.700' : 'gray.800'
      }}
    >
      <CardBody>
        <Flex justify="space-between" align="start">
          <Box flex="1">
            {/* Notification header with icon, title, and badges */}
            <HStack mb={2}>
              <Text fontSize="lg">{getTypeIcon(notification.type)}</Text>
              <Text fontWeight="bold" fontSize="md">
                {notification.title}
              </Text>
              {/* Show "New" badge for unread notifications */}
              {!notification.read && (
                <Badge colorScheme="blue" size="sm">New</Badge>
              )}
              {/* Severity level badge */}
              <Badge
                colorScheme={getSeverityColor(notification.severity)}
                size="sm"
              >
                {notification.severity}
              </Badge>
            </HStack>

            {/* Notification message */}
            <Text
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              mb={3}
            >
              {notification.message}
            </Text>

            {/* Notification timestamp */}
            <Text fontSize="sm" color="gray.500">
              {new Date(notification.timestamp).toLocaleString()}
            </Text>
          </Box>

          {/* Mark as read button for unread notifications */}
          {!notification.read && (
            <IconButton
              icon={<FaCheck />}
              size="sm"
              colorScheme="green"
              variant="ghost"
              onClick={() => markAsRead([notification._id])}
              isLoading={markingRead}
              aria-label="Mark as read"
            />
          )}
        </Flex>
      </CardBody>
    </Card>
  );

  // Loading state display
  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading notifications...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header section with title and action buttons */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>
              <HStack>
                <FaBell />
                <Text>Notifications</Text>
              </HStack>
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              Welcome back, {user?.email}
            </Text>
          </Box>

          {/* Action buttons */}
          <HStack>
            <Button
              leftIcon={<FaSync />}
              onClick={() => fetchNotifications()}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
            {/* Show "Mark All Read" button only if there are unread notifications */}
            {stats.unreadCount > 0 && (
              <Button
                leftIcon={<FaCheck />}
                onClick={() => markAsRead()}
                colorScheme="green"
                size="sm"
                isLoading={markingRead}
              >
                Mark All Read
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Statistics section showing notification counts */}
        <HStack spacing={4}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">
                {stats.unreadCount} unread notifications
              </Text>
              <Text fontSize="sm">
                {stats.totalCount} total notifications
              </Text>
            </Box>
          </Alert>
        </HStack>

        {/* Tabbed interface for all notifications vs unread only */}
        <Tabs>
          <TabList>
            <Tab>All Notifications ({stats.totalCount})</Tab>
            <Tab>Unread ({stats.unreadCount})</Tab>
          </TabList>

          <TabPanels>
            {/* All notifications tab */}
            <TabPanel px={0}>
              {notifications.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text>No notifications yet. Welcome to WhistleSpace!</Text>
                </Alert>
              ) : (
                <VStack spacing={4} align="stretch">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                    />
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Unread notifications tab */}
            <TabPanel px={0}>
              <Button
                mb={4}
                onClick={() => fetchNotifications(true)}
                variant="outline"
                size="sm"
              >
                Show Unread Only
              </Button>

              {/* Display unread notifications or success message */}
              {notifications.filter(n => !n.read).length === 0 ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Text>No unread notifications. You're all caught up! 🎉</Text>
                </Alert>
              ) : (
                <VStack spacing={4} align="stretch">
                  {notifications
                    .filter(n => !n.read)
                    .map((notification) => (
                      <NotificationCard
                        key={notification._id}
                        notification={notification}
                      />
                    ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default UserDashboard;
