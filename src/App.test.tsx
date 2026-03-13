import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/AppShell', () => () => <div>App shell</div>);
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

test('renders landing page with login actions', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /sổ ảnh thí sinh dự thi/i })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /đăng nhập/i }).length).toBeGreaterThan(0);
});
