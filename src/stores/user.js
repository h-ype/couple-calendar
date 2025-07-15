import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

async function fetchUserData(uid) {
  const db = getFirestore()
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    return { calendarName: '', photoURL: '' }
  }
}

export const useUserStore = defineStore('user', () => {
  const user = ref(null) // 추가
  const nickname = ref('')
  const calendarName = ref(localStorage.getItem('calendarName') || '내 캘린더')
  const photoURL = ref(localStorage.getItem('photoURL') || '')

  async function loadUserData(firebaseUser) {
    user.value = firebaseUser // 로그인/로그아웃 시 user 상태 갱신
    if (!firebaseUser) {
      calendarName.value = ''
      photoURL.value = ''
      localStorage.removeItem('calendarName')
      localStorage.removeItem('photoURL')
      return
    }
    const data = await fetchUserData(firebaseUser.uid)
    calendarName.value = data.calendarName || ''
    photoURL.value = data.photoURL || ''
    localStorage.setItem('calendarName', calendarName.value)
    localStorage.setItem('photoURL', photoURL.value)
  }

  return { user, nickname, calendarName, photoURL, loadUserData }
})
