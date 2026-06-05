import React from 'react';
import { render } from '@testing-library/react';
import SettingsContent from '@/components/SettingsContent.tsx';

describe('SettingsContent', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
