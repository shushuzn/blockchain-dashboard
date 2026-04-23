import { config } from '@vue/test-utils';

global.config = config;

vi.mock('axios', () => {
  const mockAxios = {
    create: () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
      defaults: {},
    }),
  };
  return { default: mockAxios, ...mockAxios };
});
