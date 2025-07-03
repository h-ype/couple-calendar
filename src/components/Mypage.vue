<template>
  <div class="mypage">
    <h2>마이페이지</h2>
    <ul class="menu-list">
      <li @click="goTo('myinfo')">내 정보 편집</li>
      <li @click="goTo('invite')">커플 초대</li>
      <li @click="goTo('anniversary')">기념일 확인</li>
    </ul>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goTo(page) {
  router.push(`/mypage/${page}`)
}
</script>

<style scoped>
.mypage {
  padding: 20px;
}
.menu-list {
  list-style: none;
  padding: 0;
}
.menu-list li {
  background: #f4f4f4;
  margin-bottom: 10px;
  padding: 14px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.menu-list li:hover {
  background: #e0f2e9;
}
</style>