import { ref } from 'vue'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

// 로그인 상태 저장
export const user = ref(null)

// 캘린더 이름 초기값
export const nickname = ref('')
export const calendarName = ref('내 캘린더')
export const photoURL = ref('')

// 로그인 후 사용자 정보 가져와 calendarName 설정
export async function loadUserData(firebaseUser) {
  user.value = firebaseUser

  if (!firebaseUser) {
    nickname.value = ''
    calendarName.value = '내 캘린더'
    photoURL.value = ''
    return
  }

  const db = getFirestore()
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

  if (userDoc.exists()) {
    const data = userDoc.data()
    nickname.value = data.nickname || ''
    calendarName.value = data.calendarName || '내 캘린더'
    photoURL.value = data.photoURL || ''
  } else {
    nickname.value = ''
    calendarName.value = '내 캘린더'
    photoURL.value = ''
  }
}
