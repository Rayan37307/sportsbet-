import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CalendarDaysIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const { register: registerUser, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    trigger
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  });

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, agreeToTerms, ...userData } = data;

      const result = await registerUser(userData);

      if (result.success) {
        toast.success('Registration successful! Welcome to Sportsbook!');
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Registration failed'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred'
      });
    }
  };

  const handleNextStep = async () => {
    const fieldsToValidate = step === 1
      ? ['firstName', 'lastName', 'username', 'email']
      : ['phone', 'dateOfBirth', 'password', 'confirmPassword'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <UserPlusIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            1
          </div>
          <div className={`h-1 w-12 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            2
          </div>
          <div className={`h-1 w-12 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            3
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>

              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                    errors.firstName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                    errors.lastName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores'
                      }
                    })}
                    type="text"
                    className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                      errors.username
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                    placeholder="Choose a username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    autoComplete="email"
                    className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Personal Details
              </h3>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[\+]?[1-9][\d]{0,15}$/,
                        message: 'Invalid phone number'
                      }
                    })}
                    type="tel"
                    className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                      errors.phone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('dateOfBirth', {
                      required: 'Date of birth is required',
                      validate: (value) => {
                        const today = new Date();
                        const birthDate = new Date(value);
                        const age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();

                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }

                        if (age < 18) {
                          return 'You must be at least 18 years old';
                        }
                        return true;
                      }
                    })}
                    type="date"
                    className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                      errors.dateOfBirth
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border ${
                      errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Terms and Submit */}
          {step === 3 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Terms and Conditions
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-48 overflow-y-auto">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Terms of Service</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By creating an account, you agree to our terms of service and privacy policy.
                  You must be at least 18 years old to use our services.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  You are responsible for maintaining the security of your account and password.
                  We are not liable for any loss or damage from unauthorized access to your account.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gambling can be addictive. Please bet responsibly and within your limits.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms and conditions'
                  })}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-600 hover:text-indigo-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.agreeToTerms.message}
                </p>
              )}
            </motion.div>
          )}

          {/* Error message */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md bg-red-50 dark:bg-red-900 p-4"
            >
              <p className="text-sm text-red-800 dark:text-red-200">
                {errors.root.message}
              </p>
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            {step > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handlePrevStep}
                className="flex justify-center py-3 px-6 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Previous
              </motion.button>
            )}

            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleNextStep}
                className="flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ml-auto"
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            )}
          </div>
        </motion.form>

        {/* Back to home */}
        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
