import React from 'react';
import { render } from '@testing-library/react';
import InputSection from '@/components/SuperTokenScorer/InputSection.tsx';

describe('InputSection', () => {
  it('renders without crashing', () => {
    const { container } = render(<InputSection onAnalyze={() => {}} loading={false} />);
    expect(container).toBeInTheDocument();
  });
});
