import { ref, onMounted } from 'vue';
import { getLogger } from '../utils/logger';

const logger = getLogger('preloader');

export interface PreloadOptions {
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
  fetchpriority?: 'high' | 'low' | 'auto';
}

export interface PreloadTask {
  url: string;
  options: PreloadOptions;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  error?: Error;
}

const preloadedResources = new Map<string, PreloadTask>();
const preloadedImages = new Map<string, HTMLImageElement>();

function preloadResource(url: string, options: PreloadOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (preloadedResources.has(url)) {
      resolve();
      return;
    }

    const task: PreloadTask = {
      url,
      options,
      status: 'loading',
    };
    preloadedResources.set(url, task);

    if (options.as === 'image' || isImageUrl(url)) {
      const img = new Image();
      img.onload = () => {
        task.status = 'loaded';
        preloadedImages.set(url, img);
        logger.debug(`Image preloaded: ${url}`);
        resolve();
      };
      img.onerror = (error) => {
        task.status = 'error';
        task.error = new Error(`Failed to preload image: ${url}`);
        logger.warn(`Failed to preload image: ${url}`);
        reject(error);
      };
      img.src = url;
    } else {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = (options.as || 'fetch') as string;

      if (options.crossorigin) {
        link.crossOrigin = options.crossorigin;
      }

      link.onload = () => {
        task.status = 'loaded';
        logger.debug(`Resource preloaded: ${url}`);
        resolve();
      };

      link.onerror = (error) => {
        task.status = 'error';
        task.error = new Error(`Failed to preload resource: ${url}`);
        logger.warn(`Failed to preload resource: ${url}`);
        reject(error);
      };

      document.head.appendChild(link);
    }
  });
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url);
}

function prefetchDns(hostname: string): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `https://${hostname}`;
    document.head.appendChild(link);
    logger.debug(`DNS prefetch: ${hostname}`);
    setTimeout(resolve, 0);
  });
}

function preconnect(url: string): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    logger.debug(`Preconnect: ${url}`);
    setTimeout(resolve, 0);
  });
}

export function usePreloader() {
  const preload = (url: string, options: PreloadOptions = {}): Promise<void> => {
    return preloadResource(url, options);
  };

  const preloadMultiple = async (
    resources: Array<{ url: string; options?: PreloadOptions }>
  ): Promise<void[]> => {
    return Promise.allSettled(
      resources.map(({ url, options }) => preloadResource(url, options))
    ).then((results) => {
      const successes = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results.filter((r) => r.status === 'rejected').length;

      logger.info(`Preloaded ${successes}/${resources.length} resources`, {
        successes,
        failures,
      });

      return results.map((r) =>
        r.status === 'fulfilled' ? r.value : (undefined as unknown as void)
      );
    });
  };

  const prefetchDnsMultiple = async (hostnames: string[]): Promise<void> => {
    return Promise.all(hostnames.map(prefetchDns)).then(() => {});
  };

  const preconnectMultiple = async (urls: string[]): Promise<void> => {
    return Promise.all(urls.map(preconnect)).then(() => {});
  };

  const preloadCriticalResources = async () => {
    const criticalResources: Array<{ url: string; options: PreloadOptions }> = [
      {
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        options: { as: 'style' },
      },
      { url: '/api/health', options: { as: 'fetch' } },
    ];

    await preloadMultiple(criticalResources);
  };

  const preloadImages = async (urls: string[]): Promise<void> => {
    return Promise.all(urls.map((url) => preloadResource(url, { as: 'image' }))).then(() => {});
  };

  const preloadFonts = async (
    fonts: Array<{ family: string; weights?: string[] }>
  ): Promise<void> => {
    const fontUrls = fonts.flatMap(({ family, weights }) => {
      const weightsList = weights || ['400', '500', '600', '700'];
      return weightsList.map(
        (weight) =>
          `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
      );
    });

    const resources = fontUrls.map((url) => ({ url, options: { as: 'style' as const } }));
    await preloadMultiple(resources);
  };

  const getPreloadStatus = (url: string): PreloadTask | undefined => {
    return preloadedResources.get(url);
  };

  const isPreloaded = (url: string): boolean => {
    const task = preloadedResources.get(url);
    return task?.status === 'loaded';
  };

  return {
    preload,
    preloadMultiple,
    prefetchDns,
    prefetchDnsMultiple,
    preconnect,
    preconnectMultiple,
    preloadCriticalResources,
    preloadImages,
    preloadFonts,
    getPreloadStatus,
    isPreloaded,
  };
}

export function initCriticalPreloading() {
  onMounted(() => {
    const { preconnectMultiple, preloadCriticalResources } = usePreloader();

    preconnectMultiple([
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.coingecko.com',
      'https://eth.llamarpc.com',
    ]).then(() => {
      logger.info('Critical connections established');
    });

    if ('requestIdleCallback' in window) {
      (
        window as Window & { requestIdleCallback: (callback: () => void) => void }
      ).requestIdleCallback(() => {
        preloadCriticalResources();
      });
    } else {
      setTimeout(preloadCriticalResources, 1000);
    }
  });
}
