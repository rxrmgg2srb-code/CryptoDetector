import React from 'react';
import { render, screen } from '@testing-library/react';
import ExternalData from '@/components/SuperTokenScorer/ExternalData';

const mockResult = {
  dexScreenerData: {
    priceUSD: 1.23,
    liquidity: 100000,
    volume24h: 50000,
    dex: 'Raydium',
  },
  birdeyeData: {
    price: 1.23,
    marketCap: 1000000,
    holder: 500,
    trade24h: 1200,
  },
  rugCheckData: {
    score: 85,
    rugged: false,
    risks: [{ name: 'Mint Authority', level: 'High' }],
  },
  // Add other required properties of SuperTokenScore if necessary for the component to render without crashing
  // Based on the component code, it only accesses these three properties.
} as any;

describe('ExternalData', () => {
  it('renders external data sections correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    expect(screen.getByText('DexScreener')).toBeInTheDocument();
    expect(screen.getByText(/\$1.23000000/)).toBeInTheDocument(); // Price
    expect(screen.getByText('Raydium')).toBeInTheDocument();

    expect(screen.getByText('Birdeye')).toBeInTheDocument();
    expect(screen.getByText(/\$1,000,000/)).toBeInTheDocument(); // Market Cap

    expect(screen.getByText('RugCheck')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText(/✅ NO/)).toBeInTheDocument();
  });

  it('renders nothing if no data is present', () => {
    const emptyResult = {} as any;
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeEmptyDOMElement();
  });
});
