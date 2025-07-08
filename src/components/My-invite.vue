<template>
  <div class="invite-page">
    <h2>커플 초대</h2>

    <!-- ✅ 이미 커플 연결됨 -->
    <div v-if="couple">
      <p>💞 {{ couple.nickname || couple.email }} 님과 연결되어 있습니다.</p>
      <button @click="disconnectCouple">연결 해제</button>
    </div>

    <!-- ❌ 연결 안됨: 초대 UI -->
    <div v-else>
      <form @submit.prevent="sendInvite">
        <input type="email" v-model="inviteEmail" placeholder="이메일 입력" required />
        <button type="submit">초대하기</button>
      </form>

      <div v-if="invitations.length">
        <h4>받은 초대</h4>
        <ul>
          <li v-for="inv in invitations" :key="inv.id">
            {{ inv.inviterNickname }} 님이 초대했습니다.
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
import { ref, onMounted } from 'vue'
import { getAuth } from 'firebase/auth'
import {
  getFirestore, collection, query, where, getDocs,
  addDoc, updateDoc, doc, deleteDoc, getDoc
} from 'firebase/firestore'

const auth = getAuth()
const db = getFirestore()
const user = auth.currentUser

const inviteEmail = ref('')
const invitations = ref([])
const couple = ref(null)

onMounted(async () => {
  if (!user) return

  // 🔍 이미 커플 상태인지 확인
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
    const otherUserId = data.inviterId === user.uid ? null : data.inviterId

    if (otherUserId) {
      const userDoc = await getDoc(doc(db, 'users', otherUserId))
      couple.value = {
        id: match.id,
        nickname: userDoc.exists() ? userDoc.data().nickname : '',
        email: userDoc.exists() ? userDoc.data().email : data.inviterEmail,
      }
    } else {
      couple.value = {
        id: match.id,
        email: data.inviteeEmail
      }
    }
    return
  }

  // ⛔ 연결 안되어 있으면 받은 초대 리스트 조회
  const q = query(collection(db, 'invitations'),
    where('inviteeEmail', '==', user.email),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)

  const result = await Promise.all(snap.docs.map(async (docSnap) => {
    const data = docSnap.data()
    const inviterRef = doc(db, 'users', data.inviterId)
    const inviterSnap = await getDoc(inviterRef)
    const inviterNickname = inviterSnap.exists() ? inviterSnap.data().nickname : '알 수 없음'
    return { id: docSnap.id, ...data, inviterNickname }
  }))
  invitations.value = result
})

async function sendInvite() {
  if (!inviteEmail.value) return
  if (inviteEmail.value === user.email) {
    alert('자기 자신에게는 초대할 수 없습니다.')
    return
  }

  // 🔒 이미 초대한 사람 확인
  const sentQuery = query(collection(db, 'invitations'),
    where('inviterId', '==', user.uid),
    where('status', '==', 'pending')
  )
  const sentSnap = await getDocs(sentQuery)
  if (!sentSnap.empty) {
    alert('이미 초대한 사람이 있습니다.')
    return
  }

  await addDoc(collection(db, 'invitations'), {
    inviterId: user.uid,
    inviterEmail: user.email,
    inviteeEmail: inviteEmail.value,
    status: 'pending',
    createdAt: new Date()
  })

  alert('초대가 전송되었습니다.')
  inviteEmail.value = ''
}

async function acceptInvite(id) {
  const docRef = doc(db, 'invitations', id)
  await updateDoc(docRef, { status: 'accepted' })
  alert('초대를 수락했어요❤')
  invitations.value = invitations.value.filter(i => i.id !== id)
  location.reload()
}

async function rejectInvite(id) {
  const docRef = doc(db, 'invitations', id)
  await updateDoc(docRef, { status: 'rejected' })
  alert('초대를 거절했어요💔')
  invitations.value = invitations.value.filter(i => i.id !== id)
}

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
