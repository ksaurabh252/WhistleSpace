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
  AlertIcon
} from '@chakra-ui/react';
import { FaBan, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import api from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * UserManagement component for admin users to manage platform users.
 *
 * Features:
 * - Fetches and displays a list of users with their email, warnings, ban status, and ban expiration.
 * - Allows searching users by email.
 * - Enables admins to issue warnings, ban users for a specified duration with an optional reason, and unban users.
 * - Shows modals for ban and unban confirmation.
 * - Displays user status (active/banned) and warning count with color-coded badges.
 * - Users with 3 or more warnings are automatically banned.
 *
 * Dependencies:
 * - React, Chakra UI components, custom `useAuth` hook, and an `api` instance for HTTP requests.
 *
 * @component
 */
const UserManagement = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDuration, setBanDuration] = useState('24');
  const [banReason, setBanReason] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isUnbanOpen,
    onOpen: onUnbanOpen,
    onClose: onUnbanClose
  } = useDisclosure();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      toast({
        title: 'Error fetching users',
        description: err.response?.data?.error || 'Failed to load users',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    try {
      await api.post(`/api/admin/users/${selectedUser._id}/ban`, {
        duration: parseInt(banDuration),
        reason: banReason
      });

      toast({
        title: 'User banned successfully',
        description: `${selectedUser.email} has been banned for ${banDuration} hours`,
        status: 'success',
        duration: 3000
      });

      fetchUsers();
      onClose();
      setBanReason('');
    } catch (err) {
      toast({
        title: 'Ban failed',
        description: err.response?.data?.error || 'Failed to ban user',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleUnbanUser = async () => {
    try {
      await api.post(`/api/admin/users/${selectedUser._id}/unban`);

      toast({
        title: 'User unbanned successfully',
        description: `${selectedUser.email} has been unbanned`,
        status: 'success',
        duration: 3000
      });

      fetchUsers();
      onUnbanClose();
    } catch (err) {
      toast({
        title: 'Unban failed',
        description: err.response?.data?.error || 'Failed to unban user',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleWarningUser = async (userId) => {
    try {
      await api.post(`/api/admin/users/${userId}/warning`);

      toast({
        title: 'Warning issued',
        description: 'Warning has been issued to the user',
        status: 'warning',
        duration: 3000
      });

      fetchUsers();
    } catch (err) {
      toast({
        title: 'Warning failed',
        description: err.response?.data?.error || 'Failed to issue warning',
        status: 'error',
        duration: 3000
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUserBanned = (user) => {
    return user.banUntil && new Date(user.banUntil) > new Date();
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          User Management
        </Text>
        <Alert status="info" maxW="400px">
          <AlertIcon />
          <Text fontSize="sm">
            Manage user warnings and bans. Users with 3+ warnings are auto-banned.
          </Text>
        </Alert>
      </Flex>

      {/* Search */}
      <Stack direction="row" spacing={4} mb={6}>
        <Input
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="400px"
        />
      </Stack>

      {/* Users Table */}
      <Box overflowX="auto">
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>User Email</Th>
              <Th>Warnings</Th>
              <Th>Status</Th>
              <Th>Ban Until</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((userData) => (
              <Tr key={userData._id}>
                <Td>
                  <Text fontWeight="medium">{userData.email}</Text>
                  {userData.isGoogleAuth && (
                    <Badge colorScheme="blue" size="sm">Google</Badge>
                  )}
                </Td>

                <Td>
                  <Badge
                    colorScheme={userData.warnings >= 2 ? 'red' : userData.warnings >= 1 ? 'orange' : 'green'}
                  >
                    {userData.warnings || 0} warnings
                  </Badge>
                </Td>

                <Td>
                  {isUserBanned(userData) ? (
                    <Badge colorScheme="red">Banned</Badge>
                  ) : (
                    <Badge colorScheme="green">Active</Badge>
                  )}
                </Td>

                <Td>
                  {userData.banUntil && isUserBanned(userData) ? (
                    <Text fontSize="sm" color="red.500">
                      {new Date(userData.banUntil).toLocaleString()}
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.500">-</Text>
                  )}
                </Td>

                <Td>
                  <Stack direction="row" spacing={2}>
                    {!isUserBanned(userData) ? (
                      <>
                        <Tooltip label="Issue Warning">
                          <IconButton
                            icon={<FaExclamationTriangle />}
                            colorScheme="orange"
                            size="sm"
                            onClick={() => handleWarningUser(userData._id)}
                          />
                        </Tooltip>

                        <Tooltip label="Ban User">
                          <IconButton
                            icon={<FaBan />}
                            colorScheme="red"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(userData);
                              onOpen();
                            }}
                          />
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip label="Unban User">
                        <IconButton
                          icon={<FaUndo />}
                          colorScheme="green"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userData);
                            onUnbanOpen();
                          }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Ban Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ban User</ModalHeader>
          <ModalBody>
            <Text mb={4}>
              Ban user: <strong>{selectedUser?.email}</strong>
            </Text>

            <FormControl mb={4}>
              <FormLabel>Ban Duration</FormLabel>
              <Select value={banDuration} onChange={(e) => setBanDuration(e.target.value)}>
                <option value="1">1 Hour</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days</option>
                <option value="168">1 Week</option>
                <option value="720">1 Month</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Reason (Optional)</FormLabel>
              <Input
                placeholder="Enter ban reason..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleBanUser}>
              Ban User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Unban Modal */}
      <Modal isOpen={isUnbanOpen} onClose={onUnbanClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Unban User</ModalHeader>
          <ModalBody>
            <Text>
              Are you sure you want to unban <strong>{selectedUser?.email}</strong>?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUnbanClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleUnbanUser}>
              Unban User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserManagement;