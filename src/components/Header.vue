<template>
  <header class="header">

    <div class="logo" @click="goMain">{{ calendarName }}</div>

     <div>
    <button v-if="!user" @click="goLogin">로그인</button>
    <div v-else class="mypage" @click="goMyPage">
      <img :src="photoURL || defaultPhoto" alt="My Page" class="mypage-img" />
    </div>
  </div>
  </header>
</template>

<script setup>
import { ref, onMounted  } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { user, calendarName, photoURL, loadUserData } from '../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const defaultPhoto = '/default-profile.png' 


onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    await loadUserData(firebaseUser)
  })
})

function goMain() {
  router.push('/')
}

function goLogin() {
  router.push('/login')
}

function goMyPage() {
  router.push('/mypage')
}

</script>

<style scoped>
.header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  background-color: #f8f8f8;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}

.menu-btn {
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

.logo {
  font-weight: bold;
  font-size: 1.2rem;
}

.mypage {
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.mypage-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>