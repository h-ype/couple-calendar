import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'


const app = createApp(App)
app.use(router)
app.mount('#app')


import { getAuth, onAuthStateChanged } from "firebase/auth";
import { user } from './stores/user'

const auth = getAuth();
onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;  // 로그인되면 객체, 아니면 null
});