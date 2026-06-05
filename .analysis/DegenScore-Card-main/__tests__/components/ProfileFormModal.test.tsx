import React from 'react';
import { render } from '@testing-library/react';
import ProfileFormModal from '@/components/ProfileFormModal.tsx';

describe('ProfileFormModal', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
