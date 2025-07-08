<template>
  <div class="my-info">
    <h2>내 정보 편집</h2>
    <form @submit.prevent="saveProfile">
      <label>닉네임</label>
      <input v-model="nickname" type="text" required />

      <label>캘린더 이름</label>
      <input v-model="calendarName" type="text" />

      <label>프로필 사진</label>
      <input type="file" @change="onFileChange" />
      <img v-if="previewUrl" :src="previewUrl" alt="미리보기" class="preview" />

      <button type="submit" :disabled="isSaving">
        {{ isSaving ? '저장 중...' : '저장하기' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { user, calendarName as calendarStore } from '../stores/user'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const auth = getAuth()
const db = getFirestore()
const storage = getStorage()

const nickname = ref('')
const isSaving = ref(false) 
const calendarName = ref('')
const file = ref(null)
const previewUrl = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    if (u) {
      user.value = u
      loadUserInfo()
    }
  })
})

async function loadUserInfo() {
  const docRef = doc(db, 'users', user.value.uid)
  const snap = await getDoc(docRef)
  if (snap.exists()) {
    const data = snap.data()
    nickname.value = data.nickname || ''
    calendarName.value = data.calendarName || ''
    previewUrl.value = data.photoURL || null
  }
}

function onFileChange(e) {
  file.value = e.target.files[0]
  previewUrl.value = URL.createObjectURL(file.value)
}

async function saveProfile() {
  if (!user.value) return

  let photoURL = previewUrl.value

  try {
    isSaving.value = true

    if (file.value) {
      const fileRef = storageRef(storage, `profileImages/${user.value.uid}`)
      await uploadBytes(fileRef, file.value)
      photoURL = await getDownloadURL(fileRef)
    }

    const userDoc = doc(db, 'users', user.value.uid)
    await setDoc(userDoc, {
      nickname: nickname.value,
      calendarName: calendarName.value,
      photoURL
    })

    // 🔄 header 이미지 갱신을 위해 store 업데이트
    user.value.photoURL = photoURL
    calendarStore.value = calendarName.value

    alert('저장 완료!')
  } catch (error) {
    console.error('프로필 저장 실패:', error)
    alert('저장 실패!')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}
.preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: 8px;
}
</style>
