// frontend/src/config/constants.ts

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  ROWS_PER_PAGE: 4,
  DEFAULT_LAYOUT: 4,
  AVAILABLE_LAYOUTS: [4, 5] as const,
} as const;

/**
 * Student Photo Configuration
 */
export const PHOTO_CONFIG = {
  PLACEHOLDER_URL: 'https://via.placeholder.com/250x250/e9ecef/6c757d?text=No+Photo',
  DEFAULT_HEIGHT: 250,
  DEFAULT_WIDTH: 250,
} as const;
