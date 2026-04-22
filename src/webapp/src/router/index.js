import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: App,
      children: [
        {
          path: '',
          redirect: '/monitor'
        },
        {
          path: 'monitor',
          name: 'monitor',
          component: () => import('../components/ChainMonitor.vue')
        },
        {
          path: 'charts',
          name: 'charts',
          component: () => import('../components/ChartsView.vue')
        },
        {
          path: 'meme',
          name: 'meme',
          component: () => import('../components/MemeView.vue')
        }
      ]
    }
  ]
})

export default router