# @gate-flow/expo

Expo SDK for the GateFlow A/B experimentation platform. Provides React Native apps with experiment evaluation, event tracking, and user attribution.

## Installation

```bash
npx expo install @gate-flow/expo
```

## Quick Start

### 1. Wrap your app with GateFlowProvider

```tsx
import { GateFlowProvider } from "@gate-flow/expo"

export default function App() {
  return (
    <GateFlowProvider
      apiUrl="https://api.gateflow.example.com"
      apiKey="your-api-key"
    >
      <YourApp />
    </GateFlowProvider>
  )
}
```

### 2. Evaluate experiments with useExperiment

```tsx
import { useExperiment } from "@gate-flow/expo"

function BookListPage() {
  const { evaluate, state } = useExperiment({
    onMatched: (exp) => console.log("Matched:", exp.key, exp.variant.key),
    onHoldout: () => console.log("In holdout group"),
  })

  // Evaluate the placement
  useEffect(() => {
    evaluate({ placementKey: "book_list_layout" })
  }, [])

  // Use variant params to drive UI
  const layout = state.status === "matched"
    ? state.experiment.variant.params.layout
    : "grid"

  return <View>{/* Render based on layout */}</View>
}
```

### 3. Track events

```tsx
import { useGateFlow } from "@gate-flow/expo"

function BookDetail({ book }) {
  const { trackEvent } = useGateFlow()

  const handleView = () => {
    trackEvent({
      eventType: "book_view",
      properties: { bookId: book.id, category: book.category },
    })
  }

  return <Button onPress={handleView}>View Book</Button>
}
```

### 4. Identify users

```tsx
import { useGateFlow } from "@gate-flow/expo"

function LoginScreen() {
  const { identify } = useGateFlow()

  const handleLogin = async (userId: string) => {
    await identify(userId, {
      plan: "premium",
      registeredAt: new Date().toISOString(),
    })
  }

  return <Button onPress={() => handleLogin("user_123")} />
}
```

## API Reference

### GateFlowProvider

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| apiUrl | string | Yes | GateFlow API base URL |
| apiKey | string | Yes | Your GateFlow API key |
| options | PartialGateFlowOptions | No | SDK configuration overrides |
| onConfigurationError | (error: Error) => void | No | Callback on config failure |

### useGateFlow()

Returns the full store with methods:
- `identify(userId, attrs?)` — Identify the current user
- `trackEvent(event)` — Track a custom event
- `setUserAttributes(attrs)` — Update user attributes
- `getUserAttributes()` — Get current user attributes
- `preloadExperiments(placements)` — Preload experiments
- `getExperiment(key)` — Get a single experiment
- `getAllExperiments()` — Get all active experiments

State properties: `isConfigured`, `isLoading`, `configurationError`, `user`, `activeExperiments`

### useExperiment(callbacks?)

| Callback | Signature | Description |
|----------|-----------|-------------|
| onMatched | `(exp: Experiment) => void` | User matched to an experiment |
| onHoldout | `(exp: Experiment) => void` | User assigned to holdout |
| onNoMatch | `() => void` | No experiment rules matched |
| onError | `(error: string) => void` | Evaluation error |

Returns `{ evaluate, state }` where:
- `evaluate({ placementKey, params? })` — Evaluate the placement
- `state` — Current `ExperimentState` (`idle | matched | holdout | noMatch | error`)

### useGateFlowEvents(callbacks?)

Subscribe to SDK events: `onConfigSuccess`, `onConfigFail`, `onConfigRefresh`, `onUserIdentified`, `onUserReset`, `onExperimentEvaluated`, `onEventTracked`, `onUserAttributesUpdated`.

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| logging.level | "info" | Log verbosity |
| shouldPreload | false | Preload experiments on configure |
| cacheEnabled | true | Enable local experiment caching |
| cacheTTL | 300 | Cache TTL in seconds (5 min) |
| eventBatchSize | 10 | Events per batch |
| eventFlushInterval | 5000 | Flush interval in ms (5 sec) |

## Architecture

Built on the same patterns as expo-superwall:
- **Zustand store** for state management
- **Event bridge** with buffering for race-condition-free event delivery
- **handlerId routing** for multi-component experiment isolation
- **Expo Modules Core** for cross-platform native module registration

## License

MIT
