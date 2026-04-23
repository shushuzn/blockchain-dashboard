import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { getLogger } from './utils/logger'

import './style.css'
import './themes.css'

const logger = getLogger('main')

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/vue').then(({ init, BrowserTracing }) => {
    init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: router.router,
        }),
      ],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE,
    })
  }).catch(error => logger.error('Failed to initialize Sentry', { error }))
}

app.config.errorHandler = (err, instance, info) => {
  logger.error('Global error', { error: err, component: instance, info })
}

app.mount('#app')
logger.info('App mounted successfully')
