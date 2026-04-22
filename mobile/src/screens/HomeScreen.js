import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useDashboardStore } from '../store/dashboard'
import { useEffect, useState } from 'react'

const CHAIN_COLORS = {
  ethereum: '#627EEA',
  base: '#0052FF',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
}

export default function HomeScreen({ navigation }) {
  const { chains, loading, error, refreshAll, fetchMemeCoins } = useDashboardStore()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  const chainData = Object.entries(chains).map(([id, data]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    color: CHAIN_COLORS[id] || '#666',
    ...data,
  }))

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Blockchain Dashboard</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={chainData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChainCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#0052FF" style={styles.loader} /> : null
        }
      />
    </View>
  )
}

function ChainCard({ item }) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color }]}
      onPress={() => navigation.navigate('chain', { chainId: item.id, name: item.name })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.chainName}>{item.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.color }]} />
      </View>

      <View style={styles.metrics}>
        <Metric label="Gas" value={item.gas?.toFixed(0) || '--'} unit="gwei" />
        <Metric label="Base Fee" value={item.baseFee?.toFixed(2) || '--'} unit="gwei" />
        <Metric label="Blob Fee" value={item.blobFee?.toFixed(4) || '--'} unit="ETH" />
        <Metric label="Utilization" value={item.util?.toFixed(1) || '--'} unit="%" />
      </View>
    </TouchableOpacity>
  )
}

function Metric({ label, value, unit }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 16,
    paddingTop: 60,
  },
  error: {
    color: '#FF6B6B',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chainName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 12,
    color: '#8B949E',
  },
})
