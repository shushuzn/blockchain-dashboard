import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import { getLogger } from './utils/logger';

import './style.css';
import './themes.css';

const logger = getLogger('main');

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.use(router);

if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/vue')
    .then(({ init, BrowserTracing, captureMessage, setUser }) => {
      init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
          new BrowserTracing({
            routingInstrumentation: router.router,
          }),
        ],
        tracesSampleRate: 0.1,
        environment: import.meta.env.MODE,
        beforeSend(event) {
          logger.error('[Sentry] Error captured', {
            errorId: event.event_id,
            message: event.message,
            level: event.level,
          });
          return event;
        },
      });

      captureMessage('App initialized', 'info');

      if (localStorage.getItem('user_id')) {
        setUser({
          id: localStorage.getItem('user_id'),
          username: localStorage.getItem('username'),
        });
      }

      logger.info('[Sentry] Monitoring enabled');
    })
    .catch((error) => logger.error('Failed to initialize Sentry', { error: error.message }));
}

app.config.errorHandler = (err, instance, info) => {
  const errorInfo = {
    message: err?.message || String(err),
    stack: err?.stack,
    component: instance?.$options?.name,
    info,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };

  logger.error('Global error', errorInfo);

  if (import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/vue')
      .then(({ captureException }) => {
        captureException(err, { extra: errorInfo });
      })
      .catch(() => {});
  }
};

app.config.warnHandler = (msg, instance, trace) => {
  logger.warn('[Vue Warn]', { message: msg, component: instance, trace });
};

window.addEventListener('unhandledrejection', (event) => {
  logger.error('[Unhandled Promise Rejection]', {
    reason: event.reason,
    timestamp: new Date().toISOString(),
  });

  if (import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/vue')
      .then(({ captureException }) => {
        captureException(event.reason, { type: 'unhandledrejection' });
      })
      .catch(() => {});
  }
});

window.addEventListener('error', (event) => {
  logger.error('[Global Error]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString(),
  });
});

app.mount('#app');
logger.info('App mounted successfully', {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
});
