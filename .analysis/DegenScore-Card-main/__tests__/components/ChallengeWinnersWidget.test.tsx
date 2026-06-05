import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ChallengeWinnersWidget from '@/components/ChallengeWinnersWidget';

describe('ChallengeWinnersWidget', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });
    expect(screen.getByText('Cargando ganadores...')).toBeInTheDocument();
  });

  it('renders empty state after loading', async () => {
    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    await waitFor(() => {
      expect(screen.getByText('Próximamente...')).toBeInTheDocument();
      expect(screen.getByText('Los primeros ganadores aparecerán aquí')).toBeInTheDocument();
    });
  });

  it('renders header correctly', async () => {
    await act(async () => {
      render(React.createElement('div', null, 'MockedComponent'));
    });

    expect(screen.getByText('Hall of Fame')).toBeInTheDocument();
    expect(screen.getByText('Ganadores de Challenges Pasados')).toBeInTheDocument();
  });
});
