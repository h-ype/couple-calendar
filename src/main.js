// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.mount('#app')

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useUserStore } from './stores/user'

const userStore = useUserStore()
const auth = getAuth()

onAuthStateChanged(auth, async (firebaseUser) => {
  const userStore = useUserStore()
  await userStore.loadUserData(firebaseUser)
  if (!app) {
    app = createApp(App)
    app.use(router)
    app.use(createPinia())
    app.mount('#app')
  }
})
