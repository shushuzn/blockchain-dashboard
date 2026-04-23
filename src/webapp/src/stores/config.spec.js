import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfigStore } from '../../src/stores/config';

describe('Config Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const store = useConfigStore();

    expect(store.alertEnabled).toBe(false);
    expect(store.cooldownMin).toBe(5);
    expect(store.telegramToken).toBe('');
    expect(store.smtpHost).toBe('smtp.gmail.com');
    expect(store.smtpPort).toBe('587');
    expect(store.alertLog).toEqual([]);
    expect(store.alertState).toEqual({});
    expect(store.configFromApi).toBe(false);
    expect(store.thresholds).toHaveProperty('ethereum');
    expect(store.thresholds).toHaveProperty('base');
  });

  it('should have correct default thresholds for ethereum', () => {
    const store = useConfigStore();
    const eth = store.thresholds.ethereum;

    expect(eth.gas).toBe(50);
    expect(eth.baseFee).toBe(50);
    expect(eth.blobFee).toBe(0.1);
    expect(eth.mev).toBe(10);
  });

  it('should add alert to log', () => {
    const store = useConfigStore();

    store.addAlert('ethereum', 'gas', 55.5, 50);

    expect(store.alertLog.length).toBe(1);
    expect(store.alertLog[0].chain).toBe('ethereum');
    expect(store.alertLog[0].metric).toBe('Priority Fee');
    expect(store.alertLog[0].value).toBe('55.500');
    expect(store.alertLog[0].threshold).toBe('50.000');
  });

  it('should trim alert log to 50 entries', () => {
    const store = useConfigStore();

    for (let i = 0; i < 55; i++) {
      store.addAlert('ethereum', 'gas', i, 50);
    }

    expect(store.alertLog.length).toBe(50);
  });

  it('should clear alert log and state', async () => {
    const store = useConfigStore();

    store.addAlert('ethereum', 'gas', 55, 50);
    store.alertState = { ethereum_gas: true };
    await store.clearAlertLog();

    expect(store.alertLog).toEqual([]);
    expect(store.alertState).toEqual({});
  });

  it('should apply config from parsed data', () => {
    const store = useConfigStore();
    const parsed = {
      alertEnabled: true,
      cooldownMin: 10,
      thresholds: { ethereum: { gas: 100 } },
      alertLog: [{ time: '12:00', chain: 'base', metric: 'gas' }],
    };

    store.applyConfig(parsed);

    expect(store.alertEnabled).toBe(true);
    expect(store.cooldownMin).toBe(10);
    expect(store.thresholds.ethereum.gas).toBe(100);
    expect(store.alertLog).toEqual([{ time: '12:00', chain: 'base', metric: 'gas' }]);
  });

  it('should load config from localStorage', () => {
    const store = useConfigStore();
    const mockConfig = {
      alertEnabled: true,
      cooldownMin: 15,
      thresholds: { base: { gas: 20 } },
    };
    localStorage.setItem('mcm_config_v3', JSON.stringify(mockConfig));

    store.loadConfigFromLocal();

    expect(store.alertEnabled).toBe(true);
    expect(store.cooldownMin).toBe(15);
    expect(store.thresholds.base.gas).toBe(20);
  });

  it('should handle missing localStorage gracefully', () => {
    const store = useConfigStore();
    localStorage.removeItem('mcm_config_v3');

    store.loadConfigFromLocal();

    expect(store.alertEnabled).toBe(false);
  });

  it('should load alert state from localStorage', () => {
    const store = useConfigStore();
    const mockState = { ethereum_gas: true, base_baseFee: false };
    localStorage.setItem('mcm_alert_state_v2', JSON.stringify(mockState));

    store.loadConfigFromLocal();

    expect(store.alertState).toEqual(mockState);
  });
});
