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
import { useUserStore } from '../stores/user'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const auth = getAuth()
const db = getFirestore()
const storage = getStorage()
const userStore = useUserStore()

const isSaving = ref(false)
const file = ref(null)
const nickname = ref('')
const calendarName = ref('')
const previewUrl = ref('')

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    if (u) {
      userStore.user = u
      loadUserInfo()
    }
  })
})

// Firestore에서 내 정보 불러와서 컴포넌트와 store 모두 반영
async function loadUserInfo() {
  if (!userStore.user) return

  const docRef = doc(db, 'users', userStore.user.uid)
  const snap = await getDoc(docRef)
  if (snap.exists()) {
    const data = snap.data()
    // store에도 저장
    userStore.nickname = data.nickname || ''
    userStore.calendarName = data.calendarName || ''
    userStore.photoURL = data.photoURL || ''
    // 컴포넌트에도 저장
    nickname.value = userStore.nickname
    calendarName.value = userStore.calendarName
    previewUrl.value = userStore.photoURL
  }
}

function onFileChange(e) {
  file.value = e.target.files[0]
  if (file.value) {
    previewUrl.value = URL.createObjectURL(file.value)
  }
}

async function saveProfile() {
  if (!userStore.user) return

  let photoURL = userStore.photoURL

  try {
    isSaving.value = true

    // 사진이 새로 선택된 경우 업로드
    if (file.value) {
      const fileRef = storageRef(storage, `profileImages/${userStore.user.uid}`)
      await uploadBytes(fileRef, file.value)
      photoURL = await getDownloadURL(fileRef)
    }

    // Firestore에 저장
    const userDoc = doc(db, 'users', userStore.user.uid)
    await setDoc(userDoc, {
      nickname: nickname.value,
      calendarName: calendarName.value,
      photoURL
    })

    // store 및 미리보기 상태 동기화
    userStore.nickname = nickname.value
    userStore.calendarName = calendarName.value
    userStore.photoURL = photoURL
    previewUrl.value = photoURL

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
