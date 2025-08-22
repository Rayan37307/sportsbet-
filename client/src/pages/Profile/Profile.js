import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  LockClosedIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || ''
    });
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Handle password change logic here
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="mt-2 text-blue-100">
              Manage your account settings and preferences
            </p>
          </div>
          <UserIcon className="h-16 w-16 text-blue-300 opacity-50 hidden md:block" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-16 h-16 text-gray-400" />
              </div>
              <button className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                <CameraIcon className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {user?.role} Account
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
            </p>
          </div>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">{user?.firstName || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">{user?.lastName || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">{user?.email || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">{user?.phone || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">{formatDate(user?.dateOfBirth)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your account security and password
            </p>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LockClosedIcon className="w-4 h-4 mr-2" />
              Change Password
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Update Password
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center">
              <LockClosedIcon className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Password last changed
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  30 days ago
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Account Status
            </p>
            <p className="text-lg font-bold text-green-900 dark:text-green-100 capitalize">
              {user?.status || 'Active'}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Account Type
            </p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 capitalize">
              {user?.role || 'User'}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Verification
            </p>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
              Verified
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
