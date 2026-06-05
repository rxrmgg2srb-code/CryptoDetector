import { renderHook, act, waitFor } from '@testing-library/react';
import { useTokenAnalysis } from '@/hooks/useTokenAnalysis';

// Mock fetch globally
global.fetch = jest.fn();

describe('useTokenAnalysis Hook 🎣', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTokenAnalysis());
    expect(result.current.tokenAddress).toBe('');
    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('');
  });

  it('should update token address', () => {
    const { result } = renderHook(() => useTokenAnalysis());
    act(() => {
      result.current.setTokenAddress('So111...');
    });
    expect(result.current.tokenAddress).toBe('So111...');
  });

  it('should show error if token address is empty', async () => {
    const { result } = renderHook(() => useTokenAnalysis());
    await act(async () => {
      await result.current.analyzeToken();
    });
    expect(result.current.error).toBe('Por favor ingresa una dirección de token');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle successful analysis', async () => {
    const mockData = {
      data: {
        score: 85,
        risk: 'LOW',
        // other fields can be added as needed
      },
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useTokenAnalysis());
    act(() => {
      result.current.setTokenAddress('So111...');
    });

    // Start analysis without awaiting to capture loading state
    let analysisPromise: Promise<void>;
    act(() => {
      analysisPromise = result.current.analyzeToken();
    });

    // Loading should be true immediately
    expect(result.current.loading).toBe(true);
    expect(result.current.progressMessage).toBe('Iniciando análisis...');

    // Fast-forward timers to simulate progress updates
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the analysis to finish
    await act(async () => {
      await analysisPromise;
    });

    // Final assertions
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toEqual(mockData.data);
    expect(result.current.progress).toBe(100);
    expect(result.current.error).toBe('');
  });

  it('should handle API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });
    const { result } = renderHook(() => useTokenAnalysis());
    act(() => {
      result.current.setTokenAddress('So111...');
    });
    await act(async () => {
      await result.current.analyzeToken();
    });
    expect(result.current.error).toBe('API Error');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Fail'));
    const { result } = renderHook(() => useTokenAnalysis());
    act(() => {
      result.current.setTokenAddress('So111...');
    });
    await act(async () => {
      await result.current.analyzeToken();
    });
    expect(result.current.error).toBe('Network Fail');
    expect(result.current.loading).toBe(false);
  });
});
