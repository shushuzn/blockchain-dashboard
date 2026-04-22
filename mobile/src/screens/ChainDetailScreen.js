import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native'
import { useDashboardStore } from '../store/dashboard'
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'

export default function ChainDetailScreen() {
  const { chainId, name } = useLocalSearchParams()
  const { chains, loading, error, fetchHistory } = useDashboardStore()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchHistory(chainId)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchHistory(chainId)
  }, [chainId])

  const data = chains[chainId]

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0052FF" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>{name} Gas Tracker</Text>

      <View style={styles.card}>
        <Text style={styles.metricTitle}>Current Gas Price</Text>
        <Text style={styles.metricValue}>{data?.gas?.toFixed(0) || '--'} gwei</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.metricTitle}>Base Fee</Text>
        <Text style={styles.metricValue}>{data?.baseFee?.toFixed(2) || '--'} gwei</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.metricTitle}>Blob Fee</Text>
        <Text style={styles.metricValue}>{data?.blobFee?.toFixed(4) || '--'} ETH</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.metricTitle}>Network Utilization</Text>
        <Text style={styles.metricValue}>{data?.util?.toFixed(1) || '--'}%</Text>
      </View>

      {data?.history && data.history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.metricTitle}>Recent History</Text>
          {data.history.slice(0, 5).map((point, idx) => (
            <View key={idx} style={styles.historyRow}>
              <Text style={styles.historyTime}>
                {new Date(point.t).toLocaleTimeString()}
              </Text>
              <Text style={styles.historyValue}>{point.gas?.toFixed(0)} gwei</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  historyTime: {
    color: '#8B949E',
  },
  historyValue: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 16,
  },
})
