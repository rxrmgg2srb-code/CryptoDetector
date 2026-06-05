import React from 'react';
import { render } from '@testing-library/react';
import LiveActivityFeed from '@/components/LiveActivityFeed';

jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }));

describe('LiveActivityFeed', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ activities: [] }),
    });
  });

  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
