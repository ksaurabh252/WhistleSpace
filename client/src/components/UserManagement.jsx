import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Stack,
  Input,
  useToast,
  Spinner,
  Flex,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Checkbox,
  VStack,
  HStack,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import {
  FaBan,
  FaUndo,
  FaExclamationTriangle,
  FaEye,
  FaHistory,
  FaShieldAlt,
  FaUsers,
  FaFlag,
  FaClock,
  FaChartBar
} from 'react-icons/fa';
import api from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * UserManagement component - Advanced admin dashboard for comprehensive user and security management.
 *
 * Features:
 * - Security Overview Dashboard: Real-time system health monitoring, user statistics, and activity metrics
 * - Flagged Users Management: Advanced filtering by risk level, bulk actions, detailed flag history
 * - User Details Modal: Complete user profile with flag history, activity metrics, and risk assessment
 * - Bulk Operations: Mass ban/unban, warning issuance, and flag clearing for multiple users
 * - Admin Activity Log: Comprehensive audit trail of all administrative actions
 * - Risk Assessment: Color-coded user risk levels (HIGH/MEDIUM/LOW) with automated flagging
 * - Advanced Search & Filtering: Multi-criteria search with severity filters and user selection
 * - Real-time Status Tracking: Live ban status, warning counts, and user activity monitoring
 *
 * Security Features:
 * - Automated risk level calculation based on user behavior patterns
 * - Comprehensive flag tracking with detailed reason categorization
 * - Bulk action confirmation with impact warnings
 * - Activity logging for audit compliance
 * - System health monitoring with critical alerts
 *
 * Dependencies:
 * - React with hooks for state management
 * - Chakra UI for comprehensive component library
 * - React Icons for consistent iconography
 * - Custom useAuth hook for authentication context
 * - API instance for secure backend communication
 *
 * @component
 * @requires admin privileges
 */
const UserManagement = () => {
  // Authentication and core utilities
  const { user } = useAuth();
  const toast = useToast();

  // Main data state management
  const [users, setUsers] = useState([]); // All platform users
  const [flaggedUsers, setFlaggedUsers] = useState([]); // Users with active flags
  const [selectedUsers, setSelectedUsers] = useState([]); // Users selected for bulk actions
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  // Search and filtering state
  const [searchTerm, setSearchTerm] = useState(''); // User search input
  const [filterSeverity, setFilterSeverity] = useState(''); // Risk level filter

  // User details and modals state
  const [selectedUser, setSelectedUser] = useState(null); // Currently selected user
  const [userDetails, setUserDetails] = useState(null); // Detailed user information
  const [securityOverview, setSecurityOverview] = useState({}); // System security metrics
  const [adminActivity, setAdminActivity] = useState([]); // Admin action history

  // Modal control hooks
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure(); // Bulk actions modal
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure(); // User details modal
  const { isOpen: isBanOpen, onOpen: onBanOpen, onClose: onBanClose } = useDisclosure(); // Ban confirmation modal

  // Bulk action state
  const [bulkAction, setBulkAction] = useState(''); // Selected bulk action type
  const [banDuration, setBanDuration] = useState('24'); // Ban duration in hours
  const [banReason, setBanReason] = useState(''); // Reason for ban action

  // Initialize component data on mount
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Fetches all required data for the dashboard including users, flagged users,
   * security overview, and admin activity log
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      // Parallel API calls for optimal performance
      const [usersRes, flaggedRes, securityRes, activityRes] = await Promise.all([
        api.get('/api/admin/users'), // All users data
        api.get('/api/admin/users/flagged'), // Flagged users with risk assessment
        api.get('/api/admin/security-overview'), // System security metrics
        api.get('/api/admin/activity-log') // Admin action audit log
      ]);

      // Update state with fetched data
      setUsers(usersRes.data.users || []);
      setFlaggedUsers(flaggedRes.data.users || []);
      setSecurityOverview(securityRes.data.overview || {});
      setAdminActivity(activityRes.data.activities || []);
    } catch (err) {
      toast({
        title: 'Error loading data',
        description: err.response?.data?.error || 'Failed to load user management data',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches detailed information for a specific user including flag history
   * and opens the user details modal
   * @param {string} userId - The ID of the user to view details for
   */
  const handleViewUserDetails = async (userId) => {
    try {
      const { data } = await api.get(`/api/admin/users/${userId}/flags`);
      setUserDetails(data);
      setSelectedUser(userId);
      onDetailOpen();
    } catch (err) {
      toast({
        title: 'Error loading user details',
        description: 'Failed to load user flag history',
        status: 'error',
        duration: 3000
      });
    }
  };

  /**
   * Executes bulk actions on selected users with validation and confirmation
   * Supports ban, unban, warning, and flag clearing operations
   */
  const handleBulkAction = async () => {
    // Validate user selection
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform bulk action',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      // Prepare payload with action-specific data
      const payload = {
        userIds: selectedUsers,
        action: bulkAction,
        // Include ban-specific parameters if action is ban
        ...(bulkAction === 'ban' && {
          duration: parseInt(banDuration),
          reason: banReason
        })
      };

      const { data } = await api.post('/api/admin/users/bulk-action', payload);

      toast({
        title: 'Bulk action completed',
        description: data.message,
        status: 'success',
        duration: 3000
      });

      // Reset selection and refresh data
      setSelectedUsers([]);
      onBulkClose();
      fetchData();
    } catch (err) {
      toast({
        title: 'Bulk action failed',
        description: err.response?.data?.error || 'Failed to perform bulk action',
        status: 'error',
        duration: 3000
      });
    }
  };

  /**
   * Returns appropriate color scheme for user risk levels
   * @param {string} level - Risk level (HIGH, MEDIUM, LOW)
   * @returns {string} Chakra UI color scheme
   */
  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'yellow';
      default: return 'green';
    }
  };

  /**
   * Returns appropriate color scheme for system health status
   * @param {string} health - System health status
   * @returns {string} Chakra UI color scheme
   */
  const getSystemHealthColor = (health) => {
    switch (health) {
      case 'CRITICAL': return 'red';
      case 'WARNING': return 'orange';
      case 'MODERATE': return 'yellow';
      default: return 'green';
    }
  };

  // Loading state display
  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading user management dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Security Overview Dashboard */}
      <Card mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold">
              <FaShieldAlt style={{ display: 'inline', marginRight: '8px' }} />
              Advanced User Management & Security
            </Text>
            <Badge
              colorScheme={getSystemHealthColor(securityOverview.systemHealth)}
              fontSize="md"
              px={3}
              py={1}
            >
              System: {securityOverview.systemHealth}
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody>
          {/* Key Metrics Grid */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Total Users</StatLabel>
              <StatNumber>{securityOverview.totalUsers}</StatNumber>
              <StatHelpText>Registered accounts</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Flagged Users</StatLabel>
              <StatNumber color="orange.500">{securityOverview.flaggedUsers}</StatNumber>
              <StatHelpText>{securityOverview.flaggedPercentage}% of total</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Currently Banned</StatLabel>
              <StatNumber color="red.500">{securityOverview.bannedUsers}</StatNumber>
              <StatHelpText>Active bans</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>24h Activity</StatLabel>
              <StatNumber color="blue.500">{securityOverview.recentActivity}</StatNumber>
              <StatHelpText>Recent submissions</StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Main Navigation Tabs */}
      <Tabs>
        <TabList>
          <Tab>
            <FaFlag style={{ marginRight: '8px' }} />
            Flagged Users ({flaggedUsers.length})
          </Tab>
          <Tab>
            <FaUsers style={{ marginRight: '8px' }} />
            All Users ({users.length})
          </Tab>
          <Tab>
            <FaHistory style={{ marginRight: '8px' }} />
            Admin Activity Log
          </Tab>
        </TabList>

        <TabPanels>
          {/* Flagged Users Management Tab */}
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              {/* Search and Filter Controls */}
              <Flex justify="space-between" wrap="wrap" gap={4}>
                <HStack spacing={4}>
                  <Input
                    placeholder="Search by email or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    maxW="300px"
                  />
                  <Select
                    placeholder="Filter by risk level"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    maxW="200px"
                  >
                    <option value="HIGH">High Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="LOW">Low Risk</option>
                  </Select>
                </HStack>

                {/* Bulk Action Button - Only shown when users are selected */}
                {selectedUsers.length > 0 && (
                  <Button
                    leftIcon={<FaBan />}
                    colorScheme="red"
                    onClick={onBulkOpen}
                  >
                    Bulk Action ({selectedUsers.length})
                  </Button>
                )}
              </Flex>

              {/* Flagged Users Table */}
              <Box overflowX="auto">
                <Table variant="striped">
                  <Thead>
                    <Tr>
                      <Th>
                        {/* Select All Checkbox */}
                        <Checkbox
                          isChecked={selectedUsers.length === flaggedUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(flaggedUsers.map(u => u._id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </Th>
                      <Th>User Info</Th>
                      <Th>Risk Level</Th>
                      <Th>Flags Summary</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {flaggedUsers
                      .filter(user =>
                        // Apply search and severity filters
                        (!searchTerm ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.systemId.toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (!filterSeverity || user.riskLevel === filterSeverity)
                      )
                      .map((user) => (
                        <Tr key={user._id}>
                          {/* Individual User Selection */}
                          <Td>
                            <Checkbox
                              isChecked={selectedUsers.includes(user._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user._id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                }
                              }}
                            />
                          </Td>

                          {/* User Information */}
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">{user.systemId}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {user.email.substring(0, 20)}...
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                Last login: {user.lastLogin
                                  ? new Date(user.lastLogin).toLocaleDateString()
                                  : 'Never'
                                }
                              </Text>
                            </VStack>
                          </Td>

                          {/* Risk Level Badge */}
                          <Td>
                            <Badge
                              colorScheme={getRiskLevelColor(user.riskLevel)}
                              size="lg"
                            >
                              {user.riskLevel}
                            </Badge>
                          </Td>

                          {/* Flags Summary */}
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm">
                                <strong>{user.warnings}</strong> warnings
                              </Text>
                              {/* Display flag categories and counts */}
                              {Object.entries(user.flagSummary || {}).map(([reason, count]) => (
                                <Badge key={reason} variant="outline" size="sm">
                                  {reason}: {count}
                                </Badge>
                              ))}
                            </VStack>
                          </Td>

                          {/* User Status */}
                          <Td>
                            {user.banUntil && new Date(user.banUntil) > new Date() ? (
                              <Badge colorScheme="red">
                                Banned until {new Date(user.banUntil).toLocaleDateString()}
                              </Badge>
                            ) : (
                              <Badge colorScheme="green">Active</Badge>
                            )}
                          </Td>

                          {/* Action Buttons */}
                          <Td>
                            <HStack spacing={2}>
                              {/* View Details Button */}
                              <Tooltip label="View Details">
                                <IconButton
                                  icon={<FaEye />}
                                  size="sm"
                                  onClick={() => handleViewUserDetails(user._id)}
                                />
                              </Tooltip>

                              {/* Conditional Ban/Unban Button */}
                              {user.banUntil && new Date(user.banUntil) > new Date() ? (
                                <Tooltip label="Unban User">
                                  <IconButton
                                    icon={<FaUndo />}
                                    colorScheme="green"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                    }}
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip label="Ban User">
                                  <IconButton
                                    icon={<FaBan />}
                                    colorScheme="red"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      onBanOpen();
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </TabPanel>

          {/* All Users Tab - Placeholder */}
          <TabPanel px={0}>
            {/* TODO: Implement comprehensive user management interface */}
            <Text>All users management interface here...</Text>
          </TabPanel>

          {/* Admin Activity Log Tab */}
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                <FaChartBar style={{ display: 'inline', marginRight: '8px' }} />
                Recent Admin Actions
              </Text>

              {/* Activity Log Cards */}
              {adminActivity.map((activity, index) => (
                <Card key={index} size="sm">
                  <CardBody>
                    <Flex justify="space-between" align="start">
                      {/* Action Details */}
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Badge colorScheme="blue">{activity.action}</Badge>
                          <Text fontSize="sm" fontWeight="medium">
                            by {activity.admin?.name || 'Unknown Admin'}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {activity.feedback?.text}
                        </Text>
                        {activity.notes && (
                          <Text fontSize="xs" color="gray.500">
                            Note: {activity.notes}
                          </Text>
                        )}
                      </VStack>

                      {/* Timestamp and Category */}
                      <VStack align="end" spacing={1}>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Text>
                        <Badge variant="outline">{activity.feedback?.category}</Badge>
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* User Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="80vh" overflowY="auto">
          <ModalHeader>
            User Details: {userDetails?.user?.systemId}
          </ModalHeader>
          <ModalBody>
            {userDetails && (
              <VStack spacing={6} align="stretch">
                {/* User Risk Overview */}
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Risk Level</StatLabel>
                    <StatNumber>
                      <Badge
                        colorScheme={getRiskLevelColor(userDetails.user.riskLevel)}
                        fontSize="md"
                      >
                        {userDetails.user.riskLevel}
                      </Badge>
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Total Warnings</StatLabel>
                    <StatNumber color="orange.500">{userDetails.user.warnings}</StatNumber>
                  </Stat>
                </SimpleGrid>

                <Divider />

                {/* Detailed Flag History */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>Flag History</Text>
                  <Accordion allowToggle>
                    {userDetails.flagHistory?.map((flag, index) => (
                      <AccordionItem key={index}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <HStack>
                              <Badge colorScheme="red">{flag.reason}</Badge>
                              <Text fontSize="sm">
                                {new Date(flag.timestamp).toLocaleDateString()}
                              </Text>
                              <Badge variant="outline">{flag.actionTaken}</Badge>
                            </HStack>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          {/* Detailed Flag Information */}
                          {flag.feedback && (
                            <Box p={4} bg="gray.50" borderRadius="md">
                              <Text fontSize="sm" color="gray.700">
                                <strong>Flagged Content:</strong>
                              </Text>
                              <Text fontSize="sm" mt={2}>
                                {flag.feedback.text}
                              </Text>
                              <HStack mt={2} spacing={2}>
                                <Badge>{flag.feedback.category}</Badge>
                                <Badge variant="outline">{flag.feedback.sentiment}</Badge>
                              </HStack>
                            </Box>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Box>

                {/* User Activity Metrics */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>Activity Metrics</Text>
                  <SimpleGrid columns={3} spacing={4}>
                    <Stat>
                      <StatLabel>Total Feedbacks</StatLabel>
                      <StatNumber>{userDetails.activityMetrics?.totalFeedbacks}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Flags</StatLabel>
                      <StatNumber color="red.500">{userDetails.activityMetrics?.totalFlags}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Last Activity</StatLabel>
                      <StatNumber fontSize="sm">
                        {userDetails.activityMetrics?.lastActivity
                          ? new Date(userDetails.activityMetrics.lastActivity).toLocaleDateString()
                          : 'No activity'
                        }
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal isOpen={isBulkOpen} onClose={onBulkClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bulk Action</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              {/* Action Selection */}
              <FormControl>
                <FormLabel>Action</FormLabel>
                <Select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Select action...</option>
                  <option value="ban">Ban Users</option>
                  <option value="unban">Unban Users</option>
                  <option value="warning">Issue Warning</option>
                  <option value="clearFlags">Clear Flags</option>
                </Select>
              </FormControl>

              {/* Ban-specific Options */}
              {bulkAction === 'ban' && (
                <>
                  <FormControl>
                    <FormLabel>Duration (hours)</FormLabel>
                    <Select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                    >
                      <option value="1">1 Hour</option>
                      <option value="24">24 Hours</option>
                      <option value="72">3 Days</option>
                      <option value="168">1 Week</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Reason</FormLabel>
                    <Input
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Reason for ban..."
                    />
                  </FormControl>
                </>
              )}

              {/* Impact Warning */}
              <Alert status="warning">
                <AlertIcon />
                This action will affect {selectedUsers.length} users
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBulkClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleBulkAction}
              isDisabled={!bulkAction}
            >
              Execute Action
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserManagement;
