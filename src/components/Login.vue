<template>
  <div class="login">
    <h2>로그인</h2>
    <form @submit.prevent="login">
      <label>
        이메일:
        <input type="email" v-model="email" required />
      </label>
      <label>
        비밀번호:
        <input type="password" v-model="password" required />
      </label>
      <button type="submit" :disabled="loading">
        {{ loading ? '로그인 중...' : '로그인' }}
      </button>
        <button   @click="goReg">회원가입</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { user as userStore } from '../stores/user'


const store = userStore()
const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function login() {
  error.value = null
  loading.value = true
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)

    
store.setUser(result.user)
// Firestore에서 calendarName 가져오기
const userDocRef = doc(db, 'users', result.user.uid)
const snap = await getDoc(userDocRef)
if (snap.exists()) {
  const data = snap.data()
  if (data.calendarName) {
    store.setCalendarName(data.calendarName)
  }
}
    
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath) // ✅ 로그인 성공 후 이전 경로로 이동
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function goReg() {
  router.push('/Register')
}

</script>

<style scoped>
/* 회원가입 페이지 스타일과 비슷하게 작성 */
.login {
  max-width: 320px;
  margin: auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
label {
  display: block;
  margin-bottom: 1rem;
}
input {
  width: 100%;
  padding: 0.4rem;
  margin-top: 0.2rem;
}
button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>
