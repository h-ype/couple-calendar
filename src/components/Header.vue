<template>
  <header class="header">
    <button class="menu-btn" @click="onMenuClick">☰</button>

    <div class="logo">서린계피 커플캘린더</div>

     <div>
    <button v-if="!user" @click="goLogin">로그인</button>
    <div v-else class="mypage" @click="goMyPage">
      <img :src="user.photoURL || defaultPhoto" alt="My Page" class="mypage-img" />
    </div>
  </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { user } from '../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const defaultPhoto = '/default-profile.png' 

function goLogin() {
  router.push('/login')
}

function goMyPage() {
  router.push('/mypage')
}

// 버튼 클릭 이벤트 핸들러 (필요에 따라 구현)
function onMenuClick() {
  alert('메뉴 버튼 클릭됨')
}
 

</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
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