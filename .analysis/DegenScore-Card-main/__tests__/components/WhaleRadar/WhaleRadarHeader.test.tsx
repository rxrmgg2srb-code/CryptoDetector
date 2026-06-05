import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WhaleRadarHeader from '@/components/WhaleRadar/WhaleRadarHeader';

describe('WhaleRadarHeader', () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial props', () => {
    render(
      <WhaleRadarHeader
        activeTab="top"
        setActiveTab={mockSetActiveTab}
        followingCount={5}
        alertsCount={3}
      />
    );

    expect(screen.getByText('Whale Tracking Radar')).toBeInTheDocument();
    expect(screen.getByText('🏆 Top Whales')).toBeInTheDocument();
    expect(screen.getByText('💙 Following (5)')).toBeInTheDocument();
    expect(screen.getByText('🔔 Alerts (3)')).toBeInTheDocument();
  });

  it('calls setActiveTab when tabs are clicked', () => {
    render(
      <WhaleRadarHeader
        activeTab="top"
        setActiveTab={mockSetActiveTab}
        followingCount={0}
        alertsCount={0}
      />
    );

    fireEvent.click(screen.getByText(/Following/));
    expect(mockSetActiveTab).toHaveBeenCalledWith('following');

    fireEvent.click(screen.getByText(/Alerts/));
    expect(mockSetActiveTab).toHaveBeenCalledWith('alerts');
  });

  it('highlights active tab', () => {
    render(
      <WhaleRadarHeader
        activeTab="alerts"
        setActiveTab={mockSetActiveTab}
        followingCount={0}
        alertsCount={0}
      />
    );

    const alertsTab = screen.getByText(/Alerts/).closest('button');
    expect(alertsTab).toHaveClass('bg-blue-600');
  });
});
