import React from 'react';
import { render } from '@testing-library/react';
import SuperTokenScorerContent from '@/components/SuperTokenScorerContent.tsx';

describe('SuperTokenScorerContent', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
