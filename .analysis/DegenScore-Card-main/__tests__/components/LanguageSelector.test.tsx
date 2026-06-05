import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '@/components/LanguageSelector';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'es',
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

describe('LanguageSelector', () => {
  it('renders current language', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('opens dropdown when button clicked', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('shows all language options in dropdown', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });
});
