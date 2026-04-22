import { View, Text, StyleSheet, Switch, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import { useDashboardStore } from '../store/dashboard'
import { useEffect, useState } from 'react'
import { saveConfig } from '../services/api'

export default function SettingsScreen() {
  const { config, fetchConfig } = useDashboardStore()
  const [alertEnabled, setAlertEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [thresholds, setThresholds] = useState({})

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    if (config) {
      setAlertEnabled(config.alertEnabled || false)
      setThresholds(config.thresholds || {})
    }
  }, [config])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveConfig('default', { alertEnabled, thresholds })
      fetchConfig()
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateThreshold = (chain, metric, value) => {
    setThresholds((prev) => ({
      ...prev,
      [chain]: { ...prev[chain], [metric]: parseFloat(value) || 0 },
    }))
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Alerts</Text>
          <Switch value={alertEnabled} onValueChange={setAlertEnabled} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Alert Thresholds</Text>

      {['ethereum', 'base', 'arbitrum', 'optimism'].map((chain) => (
        <View key={chain} style={styles.section}>
          <Text style={styles.chainTitle}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</Text>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Gas (gwei)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(thresholds[chain]?.gas || '')}
              onChangeText={(val) => updateThreshold(chain, 'gas', val)}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Base Fee (gwei)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(thresholds[chain]?.baseFee || '')}
              onChangeText={(val) => updateThreshold(chain, 'baseFee', val)}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Blob Fee (ETH)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(thresholds[chain]?.blobFee || '')}
              onChangeText={(val) => updateThreshold(chain, 'blobFee', val)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  chainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B949E',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B949E',
  },
  input: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 8,
    width: 100,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#0052FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
