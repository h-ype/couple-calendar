<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({ date: Date })
const emit = defineEmits(['save', 'close'])

const title = ref('')
const time = ref('12:00') 

const formattedDate = computed(() => {
  const d = new Date(props.date) // ← 무조건 감싸기
  if (isNaN(d)) return '날짜 오류' // 예외 처리
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

function save() {
  if (!title.value) return alert('일정 제목을 입력하세요')

  const [hour, minute] = time.value.split(':')
  const scheduleDate = new Date(props.date)
  scheduleDate.setHours(parseInt(hour))
  scheduleDate.setMinutes(parseInt(minute))

  emit('save', {
    id: Date.now(),
    date: scheduleDate, // 시간까지 포함된 Date 객체
    title: title.value,
  })

  title.value = ''
  time.value = '12:00'
}

console.log('props.date:', props.date)
console.log('formatted:', formattedDate.value)
</script>

<template>
  <div class="modal">
    <h3>{{ formattedDate }} 일정 추가</h3> 
    <input v-model="title" placeholder="" />

        <label>
      시간 선택:
      <input type="time" v-model="time" />
    </label>

    <button @click="save">저장</button>
    <button @click="$emit('close')">취소</button>
  </div>
</template>