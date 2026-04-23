import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

import './style.css'
import './themes.css'

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
  }).catch(console.error)
}

app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

app.mount('#app')
