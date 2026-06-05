# Custom React Hooks

This directory contains reusable React hooks that encapsulate complex business logic and state management for the DegenScore application.

## Available Hooks

### 🎴 `useDegenCard`

Manages the complete lifecycle of trading card generation and customization.

**Features:**

- Wallet connection validation
- Card analysis and generation
- Payment processing for premium features
- Profile customization
- Achievement tracking and celebrations

**Usage:**

```typescript
import { useDegenCard } from '@/hooks/useDegenCard';

function MyComponent() {
  const {
    cardImage,
    loading,
    error,
    generateCard,
    handleUpgrade
  } = useDegenCard();

  return (
    <button onClick={generateCard} disabled={loading}>
      Generate Card
    </button>
  );
}
```

---

### 📊 `useTokenAnalysis`

Provides comprehensive token scoring and analysis capabilities.

**Features:**

- Liquidity analysis
- Holder distribution
- Trading patterns
- Risk assessment
- Market metrics
- Progress tracking

**Usage:**

```typescript
import { useTokenAnalysis } from '@/hooks/useTokenAnalysis';

function TokenScorer() {
  const {
    tokenAddress,
    setTokenAddress,
    analyzeToken,
    result,
    loading,
    progress
  } = useTokenAnalysis();

  return (
    <div>
      <input
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <button onClick={analyzeToken}>Analyze</button>
      {loading && <progress value={progress} max={100} />}
      {result && <div>Score: {result.totalScore}</div>}
    </div>
  );
}
```

---

### 🔒 `useTokenSecurity`

Performs security scanning of Solana tokens.

**Features:**

- Authority analysis (mint, freeze capabilities)
- Holder concentration detection
- Liquidity depth and lock status
- Trading pattern anomalies
- Red flag detection
- Risk scoring (0-100)

**Usage:**

```typescript
import { useTokenSecurity } from '@/hooks/useTokenSecurity';

function SecurityScanner() {
  const {
    tokenAddress,
    setTokenAddress,
    analyzeToken,
    report,
    loading
  } = useTokenSecurity();

  return (
    <div>
      <input
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <button onClick={analyzeToken}>Scan</button>
      {report && (
        <div>
          Security Score: {report.securityScore}/100
          Risk Level: {report.riskLevel}
        </div>
      )}
    </div>
  );
}
```

---

### 🐋 `useWhaleRadar`

Enables whale wallet tracking and real-time trade alerts.

**Features:**

- Top whales leaderboard
- Follow/unfollow whale wallets
- Real-time trade alerts
- Notification management
- Wallet-authenticated sessions

**Usage:**

```typescript
import { useWhaleRadar } from '@/hooks/useWhaleRadar';

function WhaleTracker() {
  const {
    activeTab,
    topWhales,
    followedWhales,
    alerts,
    handleFollow,
    toggleNotifications,
    loading
  } = useWhaleRadar();

  return (
    <div>
      <button onClick={() => handleFollow(whaleAddress)}>
        Follow Whale
      </button>
      {topWhales.map(whale => (
        <div key={whale.id}>
          {whale.nickname || whale.walletAddress}
          - Volume: {whale.totalVolume} SOL
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. **Error Handling**

All hooks include error state management. Always check for errors:

```typescript
const { error, loading, result } = useTokenAnalysis();

if (error) {
  return <ErrorMessage message={error} />;
}

if (loading) {
  return <LoadingSpinner />;
}

return <ResultDisplay data={result} />;
```

### 2. **Loading States**

Hooks provide `loading` and `progress` states for better UX:

```typescript
{loading && (
  <div>
    <ProgressBar value={progress} />
    <p>{progressMessage}</p>
  </div>
)}
```

### 3. **Cleanup**

Hooks automatically clean up side effects. No manual cleanup needed.

### 4. **TypeScript Support**

All hooks are fully typed with TypeScript. Import types as needed:

```typescript
import { useTokenSecurity, TokenSecurityReport } from '@/hooks/useTokenSecurity';

const report: TokenSecurityReport | null = ...;
```

---

## Architecture

### State Management Pattern

All hooks follow a consistent pattern:

```typescript
export function useCustomHook() {
  // 1. State declarations
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. Effect hooks for initialization
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // 3. Action methods
  const performAction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Return API
  return {
    data,
    loading,
    error,
    performAction,
  };
}
```

### Benefits

- **Separation of Concerns**: Business logic separated from UI
- **Reusability**: Use across multiple components
- **Testability**: Easy to unit test
- **Type Safety**: Full TypeScript support
- **Consistency**: Standard patterns across the app

---

## Contributing

When adding a new hook:

1. Add comprehensive JSDoc documentation
2. Include usage examples
3. Export all relevant types
4. Follow the established naming conventions
5. Update this README

---

## Related Documentation

- [React Hooks Documentation](https://react.dev/reference/react)
- [Testing Guide](../docs/development/TESTING_GUIDE.md)
- [API Documentation](../docs/API.md)
