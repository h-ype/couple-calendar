<template>
  <div class="calendar">
    <header>
      <button @click="prevMonth">‹</button>
      <h2>{{ year }}년 {{ month + 1 }}월</h2>
      <button @click="nextMonth">›</button>
    </header>
    <div class="weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
    </div>
    <div class="dates">
      <div 
        v-for="blank in blanks" 
        :key="'blank-' + blank" 
        class="date blank"
      ></div>

      <div 
        v-for="date in daysInMonth" 
        :key="date" 
        class="date"
        :class="{ today: isToday(date) }"
        @click="onDateClick(date)"
      >
        <div class="date-number">{{ date }}</div>

        <!-- 일정 표시 -->
        <div 
          v-for="sch in schedules.filter(s => isSameDate(s.date, year, month, date))"
          :key="sch.id"
          class="event"
        >
          • {{ sch.title }}
        </div>
      </div>
    </div>
  </div>

  <Modal v-if="showModal" :date="selectedDate" @save="addSchedule" @close="showModal = false" />
</template>

<script setup>
import { ref, computed } from 'vue'
import Modal from './Modal.vue'

// 상태 정의
const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth())
const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const selectedDate = ref(null)
const showModal = ref(false)
const schedules = ref([])

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

// 이벤트 핸들러
function onDateClick(date) {
  selectedDate.value = new Date(year.value, month.value, date)
  showModal.value = true
}

function addSchedule(schedule) {
  schedules.value.push(schedule)
  showModal.value = false
}

function isToday(date) {
  const now = new Date()
  return (
    date === now.getDate() &&
    month.value === now.getMonth() &&
    year.value === now.getFullYear()
  )
}

function isSameDate(dateObj, y, m, d) {
  const date = new Date(dateObj)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m &&
    date.getDate() === d
  )
}

function prevMonth() {
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else {
    month.value--
  }
}

function nextMonth() {
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else {
    month.value++
  }
}
</script>

<style scoped>
.calendar {
  width: 100%;
  margin: auto;
  font-family: 'Noto Sans KR', sans-serif;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.weekdays, .dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.weekday, .date {
  text-align: center;
  padding: 8px 0;
}
.blank {
  background: #f0f0f0;
}
.today {
  background: #4caf50;
  color: white;
  border-radius: 50%;
}
button {
  cursor: pointer;
  background: none;
  border: none;
  font-size: 20px;
}
.event {
  font-size: 0.7rem;
  color: #4caf50;
  margin-top: 2px;
}
</style>
