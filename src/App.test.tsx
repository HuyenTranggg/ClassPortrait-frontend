import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./features/roster', () => ({ AppShell: () => <div>App shell</div> }));
jest.mock('./features/auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  LoginModal: () => null,
}));
jest.mock('./features/landing', () => ({
  LandingPage: ({ onLoginClick, onFeatureClick }: any) => (
    <div>
      <h1>Sổ ảnh thí sinh dự thi</h1>
      <button onClick={onLoginClick}>Đăng nhập</button>
    </div>
  ),
}));

test('renders landing page with login actions', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /sổ ảnh thí sinh dự thi/i })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /đăng nhập/i }).length).toBeGreaterThan(0);
});
