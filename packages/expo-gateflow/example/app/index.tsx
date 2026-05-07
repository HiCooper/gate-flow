import React, { useCallback } from "react"
import {
  SafeAreaView,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { GateFlowProvider, useGateFlow, useExperiment } from "@gate-flow/expo"

// TODO: Replace with your actual GateFlow API URL and key
const GATEFLOW_API_URL = "http://localhost:8080"
const GATEFLOW_API_KEY = "your-api-key-here"

function AppContent() {
  const { isConfigured, isLoading, configurationError, user, identify, reset } =
    useGateFlow((state) => ({
      isConfigured: state.isConfigured,
      isLoading: state.isLoading,
      configurationError: state.configurationError,
      user: state.user,
      identify: state.identify,
      reset: state.reset,
    }))

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>GateFlow SDK Test</Text>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SDK Status</Text>
          <Text style={styles.status}>
            Configured: {isConfigured ? "Yes" : "No"}
          </Text>
          <Text style={styles.status}>
            Loading: {isLoading ? "Yes" : "No"}
          </Text>
          {configurationError && (
            <Text style={styles.error}>Error: {configurationError}</Text>
          )}
          {user && (
            <Text style={styles.status}>User: {user.userId}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => identify("test_user_123", { tier: "premium" })}
          >
            <Text style={styles.buttonText}>Identify (test_user_123)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => reset()}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Experiment */}
        <ExperimentSection />
      </ScrollView>
    </SafeAreaView>
  )
}

function ExperimentSection() {
  const { evaluate, state } = useExperiment({
    onMatched: (exp) => {
      Alert.alert("Matched!", `Experiment: ${exp.key}, Variant: ${exp.variant.key}`)
    },
    onNoMatch: () => {
      Alert.alert("No Match", "No experiment rules matched for this placement.")
    },
  })

  const handleEvaluate = useCallback(async () => {
    const result = await evaluate({ placementKey: "homepage_test" })
    console.log("Experiment result:", JSON.stringify(result))
  }, [evaluate])

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Experiment: homepage_test</Text>
      <Text style={styles.status}>
        State: {state.status}
      </Text>
      {state.status === "matched" && (
        <View style={styles.variantBox}>
          <Text style={styles.variantText}>
            Key: {state.experiment.variant.key}
          </Text>
          <Text style={styles.variantText}>
            Type: {state.experiment.variant.type}
          </Text>
          <Text style={styles.variantText}>
            Params: {JSON.stringify(state.experiment.variant.params)}
          </Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={handleEvaluate}>
        <Text style={styles.buttonText}>Evaluate Experiment</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function App() {
  return (
    <GateFlowProvider apiUrl={GATEFLOW_API_URL} apiKey={GATEFLOW_API_KEY}>
      <AppContent />
    </GateFlowProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  status: { fontSize: 14, color: "#333", marginBottom: 4 },
  error: { fontSize: 14, color: "#e53e3e", marginBottom: 4 },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  variantBox: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  variantText: { fontSize: 13, fontFamily: "monospace" },
})
