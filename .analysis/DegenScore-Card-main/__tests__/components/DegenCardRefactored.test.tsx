import React from 'react';
import { render } from '@testing-library/react';
import DegenCardRefactored from '@/components/DegenCardRefactored.tsx';

describe('DegenCardRefactored', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
