<template>
  <div class="invite-page">
    <h2>커플 초대</h2>

    <!-- 이미 커플 연결됨 -->
    <div v-if="couple">
      <p>💞 {{ couple.nickname || couple.email }} 님과 연결되어 있습니다.</p>
      <button @click="disconnectCouple">연결 해제</button>
    </div>

    <!-- 초대 대기 중 -->
    <div v-else-if="pendingInvite">
      <p>
        {{ pendingInvite.inviteeEmail }}님에게 초대를 했어요,
        <span>
          {{ formatTime(remainingTime) }} 후에 다시 다른 사람에게 초대가 가능해요.
        </span>
      </p>
    </div>

    <!-- 초대 가능 -->
    <div v-else>
      <form @submit.prevent="sendInvite">
        <input type="email" v-model="inviteEmail" placeholder="이메일 입력" required />
        <button type="submit">초대하기</button>
      </form>

      <div v-if="invitations.length">
        <h4>받은 초대</h4>
        <ul>
          <li v-for="inv in invitations" :key="inv.id">
            {{ inv.inviterEmail }} 님이 초대했습니다.
            <button @click="acceptInvite(inv.id)">수락</button>
            <button @click="rejectInvite(inv.id)">거절</button>
          </li>
        </ul>
      </div>
      <p v-else>받은 초대가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getAuth } from 'firebase/auth'
import {
  getFirestore, collection, query, where, getDocs,
  addDoc, updateDoc, doc, deleteDoc
} from 'firebase/firestore'

const auth = getAuth()
const db = getFirestore()
const user = auth.currentUser

const inviteEmail = ref('')
const invitations = ref([])
const couple = ref(null)
const pendingInvite = ref(null)
const remainingTime = ref(0)
let timer = null

onMounted(async () => {
  if (!user) return

  // 1. 커플 연결 여부 확인
  const q1 = query(collection(db, 'invitations'),
    where('status', '==', 'accepted'),
    where('inviterId', '==', user.uid)
  )
  const q2 = query(collection(db, 'invitations'),
    where('status', '==', 'accepted'),
    where('inviteeEmail', '==', user.email)
  )

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
  const match = snap1.docs[0] || snap2.docs[0]

  if (match) {
    const data = match.data()
    // 상대방 정보를 users에서 불러오는 부분은 삭제 (규칙 위반 방지)
    couple.value = {
      id: match.id,
      email: data.inviterId === user.uid ? data.inviteeEmail : data.inviterEmail
    }
    return
  }

  // 2. 내가 보낸 pending 초대(24시간 제한) 확인
  const sentQuery = query(collection(db, 'invitations'),
    where('inviterId', '==', user.uid),
    where('status', '==', 'pending')
  )
  const sentSnap = await getDocs(sentQuery)
  if (!sentSnap.empty) {
    const docSnap = sentSnap.docs[0]
    const data = docSnap.data()
    pendingInvite.value = {
      id: docSnap.id,
      inviteeEmail: data.inviteeEmail,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate()
    }
    startTimer()
  }

  // 3. 받은 초대 리스트 조회
  const q = query(collection(db, 'invitations'),
    where('inviteeEmail', '==', user.email),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)

  // inviterNickname 대신 inviterEmail만 표시(규칙 위반 방지)
  const result = snap.docs.map(docSnap => {
    const data = docSnap.data()
    return { id: docSnap.id, ...data }
  })
  invitations.value = result
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

// 24시간 타이머
function startTimer() {
  updateRemainingTime()
  timer = setInterval(updateRemainingTime, 1000)
}

function updateRemainingTime() {
  if (!pendingInvite.value) return
  const now = new Date()
  const created = pendingInvite.value.createdAt
  const diff = 24 * 60 * 60 * 1000 - (now - created)
  remainingTime.value = diff > 0 ? diff : 0
  if (diff <= 0) {
    pendingInvite.value = null
    clearInterval(timer)
  }
}

// 남은 시간 hh:mm 포맷
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000)
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 초대 보내기(회원 여부 확인 없이 무조건 초대장 등록, 비회원이면 이메일 발송만 트리거)
async function sendInvite() {
  if (!inviteEmail.value) return
  if (inviteEmail.value === user.email) {
    alert('자기 자신에게는 초대할 수 없습니다.')
    return
  }

  // 이미 보낸 pending 초대가 있으면 제한
  const sentQuery = query(collection(db, 'invitations'),
    where('inviterId', '==', user.uid),
    where('status', '==', 'pending')
  )
  const sentSnap = await getDocs(sentQuery)
  if (!sentSnap.empty) {
    alert('이미 초대한 사람이 있습니다. 24시간 후에 다시 초대할 수 있습니다.')
    return
  }

  // 초대 문서 추가 (회원 여부 확인 없이 무조건 등록)
  await addDoc(collection(db, 'invitations'), {
    inviterId: user.uid,
    inviterEmail: user.email,
    inviteeEmail: inviteEmail.value,
    status: 'pending',
    createdAt: new Date()
  })

  // 비회원이면 이메일 발송 트리거 (Cloud Functions 등, 항상 시도)
  try {
    await fetch('https://YOUR_CLOUD_FUNCTION_URL/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: inviteEmail.value,
        inviter: user.email,
      })
    })
    // 실패해도 무관, 성공해도 무관
  } catch (e) {
    // 이메일 발송 실패해도 초대장 등록에는 영향 없음
  }

  // 새로 보낸 초대에 대해 24시간 제한 적용
  pendingInvite.value = {
    inviteeEmail: inviteEmail.value,
    createdAt: new Date()
  }
  alert('초대가 전송되었습니다.')
  inviteEmail.value = ''
  startTimer()
}

// 초대 수락
async function acceptInvite(id) {
  const docRef = doc(db, 'invitations', id)
  await updateDoc(docRef, { status: 'accepted' })
  alert('초대를 수락했어요❤')
  invitations.value = invitations.value.filter(i => i.id !== id)
  location.reload()
}

// 초대 거절
async function rejectInvite(id) {
  const docRef = doc(db, 'invitations', id)
  await updateDoc(docRef, { status: 'rejected' })
  alert('초대를 거절했어요💔')
  invitations.value = invitations.value.filter(i => i.id !== id)
}

// 커플 연결 해제
async function disconnectCouple() {
  if (!couple.value) return
  const ok = confirm('정말로 커플 연결을 해제하시겠습니까?')
  if (!ok) return

  await deleteDoc(doc(db, 'invitations', couple.value.id))
  couple.value = null
  alert('연결이 해제되었습니다.')
  location.reload()
}
</script>
