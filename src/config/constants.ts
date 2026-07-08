// frontend/src/config/constants.ts

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
} as const;

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'classportrait-access-token',
  USER_EMAIL_STORAGE_KEY: 'classportrait-user-email',
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  ROWS_PER_PAGE: 4,
  DEFAULT_LAYOUT: 5,
  AVAILABLE_LAYOUTS: [4, 5, 6] as const,
} as const;

/**
 * Student Photo Configuration
 */
// SVG "No Photo" xám tự chứa (data-URI), đồng bộ với placeholder do backend sinh ra.
// Dùng làm fallback khi không tải được ảnh, không phụ thuộc dịch vụ ngoài.
const NO_PHOTO_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">' +
      '<rect width="240" height="240" fill="#6c757d"/>' +
      '<text x="120" y="120" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#ffffff">No Photo</text>' +
      '</svg>',
  );

export const PHOTO_CONFIG = {
  PLACEHOLDER_URL: NO_PHOTO_PLACEHOLDER,
  DEFAULT_HEIGHT: 250,
  DEFAULT_WIDTH: 250,
} as const;
