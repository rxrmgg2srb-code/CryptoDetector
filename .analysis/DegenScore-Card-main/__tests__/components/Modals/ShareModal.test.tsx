import React from 'react';
import { render } from '@testing-library/react';
import ShareModal from '@/components/Modals/ShareModal.tsx';

describe('ShareModal', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ShareModal isOpen={true} onClose={() => {}} url="https://test.com" />
    );
    expect(container).toBeInTheDocument();
  });
});
