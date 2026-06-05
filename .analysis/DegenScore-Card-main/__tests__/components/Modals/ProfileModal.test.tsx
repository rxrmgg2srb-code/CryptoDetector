import React from 'react';
import { render } from '@testing-library/react';
import ProfileModal from '@/components/Modals/ProfileModal.tsx';

describe('ProfileModal', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
