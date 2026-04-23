import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChainStore } from '../../src/stores/chain';

describe('Chain Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useChainStore();

    expect(store.chains.length).toBeGreaterThan(0);
    expect(store.activeChain).toBe('ethereum');
    expect(store.ethPrice).toBe('$--');
    expect(store.btcPrice).toBe('$--');
    expect(store.history).toEqual({});
    expect(store.historyFromApi).toBe(false);
    expect(store.refreshInterval).toBe(15000);
    expect(store.sampleInterval).toBe(15);
  });

  it('should have correct chain definitions', () => {
    const store = useChainStore();

    const ethereum = store.chains.find((c) => c.id === 'ethereum');
    expect(ethereum).toBeDefined();
    expect(ethereum.color).toBe('#627eea');
    expect(ethereum.hasBlob).toBe(true);
    expect(ethereum.hasMEV).toBe(true);

    const base = store.chains.find((c) => c.id === 'base');
    expect(base).toBeDefined();
    expect(base.hasBlob).toBe(true);
    expect(base.hasMEV).toBe(false);

    const solana = store.chains.find((c) => c.id === 'solana');
    expect(solana).toBeDefined();
    expect(solana.isSolana).toBe(true);
    expect(solana.decimals).toBe(0);
  });

  it('should update activeChain', () => {
    const store = useChainStore();
    store.activeChain = 'base';
    expect(store.activeChain).toBe('base');
  });

  it('should initialize history as empty object', () => {
    const store = useChainStore();
    expect(Object.keys(store.history)).toHaveLength(0);
  });

  it('should load history from localStorage when available', () => {
    const store = useChainStore();
    const mockHistory = { ethereum: [{ t: 123, gas: 10 }] };
    localStorage.setItem('mcm_history_v2', JSON.stringify(mockHistory));

    store.loadHistoryFromLocal();

    expect(store.history).toEqual(mockHistory);
    localStorage.removeItem('mcm_history_v2');
  });

  it('should handle empty localStorage gracefully', () => {
    const store = useChainStore();
    localStorage.removeItem('mcm_history_v2');

    store.loadHistoryFromLocal();

    expect(store.history).toEqual({});
  });
});
