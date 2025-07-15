<template>
  <header class="header">

    <div class="logo" @click="goMain">{{ userStore.calendarName || "내 캘린더" }}</div>

     <div>
    <button v-if="!userStore.user" @click="goLogin">로그인</button>
    <div v-else class="mypage" @click="goMyPage">
      <img :src="userStore.photoURL || defaultPhoto" alt="My Page" class="mypage-img" />
    </div>
  </div>
  </header>
</template>

<script setup>
import { ref, onMounted  } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const defaultPhoto = '/default-profile.png' 
const userStore = useUserStore()


onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    await userStore.loadUserData(firebaseUser)
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
</style>