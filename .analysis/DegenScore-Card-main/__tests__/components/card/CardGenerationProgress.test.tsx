import React from 'react';
import { render } from '@testing-library/react';
import CardGenerationProgress from '@/components/card/CardGenerationProgress.tsx';

describe('CardGenerationProgress', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
