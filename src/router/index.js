import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from 'firebase/auth'

import Calendar from '../components/Calendar.vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Mypage from '../components/Mypage.vue'
import MyInfo from '../components/My-info.vue'
import CoupleInvite from '../components/My-invite.vue'
import Anniversary from '../components/My-anniversary.vue' 

const routes = [
  { path: '/', component: Calendar },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/mypage', component: Mypage, meta: { requiresAuth: true } },
  { path: '/mypage/myinfo', component: MyInfo, meta: { requiresAuth: true } },
  { path: '/mypage/invite', component: CoupleInvite, meta: { requiresAuth: true } },
  { path: '/mypage/anniversary', component: Anniversary, meta: { requiresAuth: true } }, 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = getAuth()
  const user = auth.currentUser

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user) {
      alert('로그인을 해주세요');
      next({
        path: '/login',
        query: { redirect: to.fullPath } // ✅ 리디렉션 경로 저장
      })
    } else {
      next() // 로그인돼있으면 정상 접근
    }
  } else {
    next() // 인증 필요 없는 페이지는 그냥 통과
  }
})

export default router