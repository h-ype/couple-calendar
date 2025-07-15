<template>

  <div class="couple-status" v-if="loading">
    <span>상태 확인 중...</span>
  </div>
  <div class="couple-status" v-else>
    <template v-if="couple">
      <span>💞 {{ couple.email }} 님과 연결됨</span>
      <button @click="disconnectCouple">연결 해제</button>
    </template>
    <template v-else>
      <span>커플을 초대하고 일정을 공유해보세요. <button @click="goInvite">초대하기</button></span>
    </template>
  </div>

  <div class="calendar">
    <div class="inner">
      <header>
        <button @click="prevMonth">‹</button>
        <h4>{{ year }}. {{ month + 1 }}.</h4>
        <button @click="nextMonth">›</button>
      </header>
      <div class="weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="dates">
        <div v-for="blank in blanks" :key="'blank-' + blank" class="date blank"></div>
        <div
          v-for="date in daysInMonth"
          :key="date"
          class="date"
          :class="{ today: isToday(date), selected: isSelectedDate(date) }"
          @click="onDateCellClick(date)"
        >
          <div class="date-number">{{ date }}</div>
          <div class="bullets">
            <span
              v-for="n in Math.min(getSchedulesForDate(year, month, date).length, 3)"
              :key="n"
              class="bullet"
            >●</span>
          </div>
        </div>
      </div>
    </div>
    

    <!-- 일정 상세 리스트: 날짜 셀 클릭 시만 노출 -->
    <div v-if="showDetailList" class="schedule-detail-list">
      <h4>
        {{ selectedDate.getFullYear() }}년
        {{ selectedDate.getMonth() + 1 }}월
        {{ selectedDate.getDate() }}일 일정
        <button class="close-detail" @click="closeDetailList">✕</button>
      </h4>
      <ul>
        <li
          v-for="sch in getSchedulesForDate(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          )"
          :key="sch.id"
        >
          <div class="sch-title">{{ sch.title }}</div>
          <div class="sch-time" v-if="sch.time">{{ sch.time }}</div>
          <button class="edit-btn" @click="editSchedule(sch)">수정</button>
          <button class="delete-btn" @click="deleteSchedule(sch)">삭제</button>
        </li>
      </ul>
      <button class="add-btn" @click="addScheduleForSelectedDate">+ 새 일정 추가</button>
    </div>

    <!-- 일정 등록/수정 Modal -->
    <Modal
      v-if="showModal"
      :date="selectedDate"
      :schedule="editingSchedule"
      @save="saveSchedule"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
  getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy
} from 'firebase/firestore'

const router = useRouter()
const auth = getAuth()
const db = getFirestore()
const user = ref(null)
const couple = ref(null)
const loading = ref(true)

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth())
const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const selectedDate = ref(new Date())
const showModal = ref(false)
const editingSchedule = ref(null)
const schedules = ref([])      // 본인 일정
const coupleSchedules = ref([]) // 커플 상대 일정

const showDetailList = ref(false)

// 날짜 계산
const daysInMonth = computed(() =>
  new Date(year.value, month.value + 1, 0).getDate()
)
const firstDayOfMonth = computed(() =>
  new Date(year.value, month.value, 1).getDay()
)
const blanks = computed(() =>
  Array(firstDayOfMonth.value).fill(null)
)

// 인증 및 커플 상태 확인
onMounted(() => {
  onAuthStateChanged(auth, async (u) => {
    user.value = u
    if (!u) {
      alert('로그인이 필요합니다.')
      return
    }
    await checkCouple()
    await fetchSchedules()
    loading.value = false
  })
})

// 커플 연결 여부 확인
async function checkCouple() {
  couple.value = null
  if (!user.value) return
  const q1 = query(collection(db, 'invitations'),
    where('status', '==', 'accepted'),
    where('inviterId', '==', user.value.uid)
  )
  const q2 = query(collection(db, 'invitations'),
    where('status', '==', 'accepted'),
    where('inviteeEmail', '==', user.value.email)
  )
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
  const match = snap1.docs[0] || snap2.docs[0]
  if (match) {
    const data = match.data()
    couple.value = {
      id: match.id,
      email: data.inviterId === user.value.uid ? data.inviteeEmail : data.inviterEmail
    }
  }
}

// 일정 불러오기
async function fetchSchedules() {
  if (!user.value) return
  // 본인 일정
  const q = query(
    collection(db, 'schedules'),
    where('owner', '==', user.value.uid),
    orderBy('date')
  )
  const snap = await getDocs(q)
  schedules.value = snap.docs.map(docSnap => {
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      date: data.date && data.date.toDate ? data.date.toDate() : new Date(data.date)
    }
  })

  // 커플이면 상대 일정도 불러옴
  if (couple.value) {
    const otherQ = query(
      collection(db, 'schedules'),
      where('ownerEmail', '==', couple.value.email),
      orderBy('date')
    )
    const otherSnap = await getDocs(otherQ)
    coupleSchedules.value = otherSnap.docs.map(docSnap => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        date: data.date && data.date.toDate ? data.date.toDate() : new Date(data.date)
      }
    })
  } else {
    coupleSchedules.value = []
  }
}

// 한 날짜에 표시할 일정(커플이면 합침)
function getSchedulesForDate(y, m, d) {
  const all = [...schedules.value]
  if (couple.value) all.push(...coupleSchedules.value)
  return all.filter(s => isSameDate(s.date, y, m, d))
}

// 날짜 칸 클릭 시
function onDateCellClick(date) {
  selectedDate.value = new Date(year.value, month.value, date)
  showDetailList.value = true
}

// 상세 리스트 닫기
function closeDetailList() {
  showDetailList.value = false
  editingSchedule.value = null
}

// 상세 리스트에서 새 일정 추가
function addScheduleForSelectedDate() {
  editingSchedule.value = null
  showModal.value = true
}

// 일정 등록/수정 Modal 저장
async function saveSchedule(schedule) {
  if (!user.value) return
  const data = {
    ...schedule,
    owner: user.value.uid,
    ownerEmail: user.value.email,
    date: schedule.date,
    time: schedule.time ?? null  // undefined면 null로 처리
  }
  if (editingSchedule.value) {
    // 수정
    const docRef = doc(db, 'schedules', editingSchedule.value.id)
    await updateDoc(docRef, data)
  } else {
    // 등록
    await addDoc(collection(db, 'schedules'), data)
  }
  await fetchSchedules()
  closeModal()
}

// 일정 수정 Modal
function editSchedule(sch) {
  editingSchedule.value = { ...sch }
  selectedDate.value = new Date(sch.date)
  showModal.value = true
}

// 일정 삭제
async function deleteSchedule(sch) {
  const ok = confirm('이 일정을 삭제할까요?')
  if (!ok) return
  await deleteDoc(doc(db, 'schedules', sch.id))
  await fetchSchedules()
  closeDetailList()
}

// Modal 닫기
function closeModal() {
  showModal.value = false
  editingSchedule.value = null
  // 모달 닫아도 상세 리스트는 그대로 남음
}

// 오늘 날짜 체크
function isToday(date) {
  const now = new Date()
  return (
    date === now.getDate() &&
    month.value === now.getMonth() &&
    year.value === now.getFullYear()
  )
}

// 현재 선택된 날짜인지 체크
function isSelectedDate(date) {
  return (
    showDetailList.value &&
    selectedDate.value &&
    date === selectedDate.value.getDate() &&
    month.value === selectedDate.value.getMonth() &&
    year.value === selectedDate.value.getFullYear()
  )
}

// 날짜 비교
function isSameDate(dateObj, y, m, d) {
  const date = new Date(dateObj)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m &&
    date.getDate() === d
  )
}

// 월 이동
function prevMonth() {
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else {
    month.value--
  }
  fetchSchedules()
  closeDetailList()
}
function nextMonth() {
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else {
    month.value++
  }
  fetchSchedules()
  closeDetailList()
}

// 커플 연결 해제
async function disconnectCouple() {
  if (!couple.value) return
  const ok = confirm('정말로 커플 연결을 해제하시겠습니까?')
  if (!ok) return
  await deleteDoc(doc(db, 'invitations', couple.value.id))
  couple.value = null
  coupleSchedules.value = []
  alert('연결이 해제되었습니다.')
  closeDetailList()
}

// 초대하기 클릭 시 페이지 이동
function goInvite() {
  router.push('/mypage/invite')
}
</script>
