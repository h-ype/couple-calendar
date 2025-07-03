import { createRouter, createWebHistory } from 'vue-router'
import Calendar from '../components/Calendar.vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Mypage from '../components/Mypage.vue'
import MyInfo from '../components/My-info.vue'
import CoupleInvite from '../components/My-invite.vue'
import Anniversary from '../components/My-anniversary.vue'
// 필요한 다른 페이지 import

const routes = [
  { path: '/', component: Calendar },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/mypage', component: Mypage },
  { path: '/mypage/myinfo', component: MyInfo },
  { path: '/mypage/invite', component: CoupleInvite },
  { path: '/mypage/anniversary', component: Anniversary },
  // 다른 라우트들...
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
