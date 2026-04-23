import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChainStore } from '../stores/chain';

vi.mock('../api', () => ({
  historyApi: {
    getHistory: vi.fn().mockResolvedValue([]),
    addHistoryPoint: vi.fn().mockResolvedValue({ success: true }),
  },
}));

global.fetch = vi.fn();

describe('useChainStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('has default chains', () => {
      const store = useChainStore();
      expect(store.chains).toBeDefined();
      expect(store.chains.length).toBeGreaterThan(0);
      expect(store.chains.find((c) => c.id === 'ethereum')).toBeDefined();
    });

    it('has default ethPrice', () => {
      const store = useChainStore();
      expect(store.ethPrice).toBe('$--');
    });

    it('has default activeChain', () => {
      const store = useChainStore();
      expect(store.activeChain).toBe('ethereum');
    });
  });

  describe('fetchPrice', () => {
    it('fetches price data from CoinGecko', async () => {
      const mockResponse = {
        ethereum: { usd: 3500, usd_24h_change: 2.5 },
        bitcoin: { usd: 67000 },
      };
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const store = useChainStore();
      await store.fetchPrice();

      expect(store.ethPrice).toBe('$3,500');
      expect(store.ethChange).toBe(2.5);
      expect(store.btcPrice).toBe('$67,000');
    });

    it('handles fetch error gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const store = useChainStore();
      await store.fetchPrice();

      expect(store.ethPrice).toBe('$--');
    });
  });

  describe('refresh', () => {
    it('updates lastUpdated timestamp', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            ethereum: { usd: 3500, usd_24h_change: 0 },
            bitcoin: { usd: 67000 },
          }),
      });

      const store = useChainStore();
      await store.refresh();

      expect(store.lastUpdated).not.toBe('--');
    });
  });

  describe('startRefresh and stopRefresh', () => {
    it('starts refresh interval', () => {
      vi.useFakeTimers();
      const store = useChainStore();

      global.fetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            ethereum: { usd: 3500, usd_24h_change: 0 },
            bitcoin: { usd: 67000 },
          }),
      });

      store.startRefresh();
      expect(store.alertTimer).not.toBeNull();

      vi.runOnlyPendingTimers();
      store.stopRefresh();
      vi.useRealTimers();
    });

    it('clears refresh interval', () => {
      vi.useFakeTimers();
      const store = useChainStore();

      global.fetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            ethereum: { usd: 3500, usd_24h_change: 0 },
            bitcoin: { usd: 67000 },
          }),
      });

      store.startRefresh();
      store.stopRefresh();

      expect(store.alertTimer).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('rpcCall', () => {
    it('makes RPC call successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ result: '0x123' }),
      });

      const store = useChainStore();
      const result = await store.rpcCall('https://example.com', 'eth_blockNumber');

      expect(result).toBe('0x123');
    });

    it('returns null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('RPC error'));

      const store = useChainStore();
      const result = await store.rpcCall('https://example.com', 'eth_blockNumber');

      expect(result).toBeNull();
    });
  });
});
