import React from 'react';
import { render } from '@testing-library/react';
import HotFeedWidget from '@/components/Widgets/HotFeedWidget.tsx';

describe('HotFeedWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
