<template>
  <div class="container">
    <div class="header">
      <h1 class="title">个人设置</h1>
    </div>

    <!-- 形象选择 -->
    <div class="card">
      <h2 class="section-title">选择形象</h2>
      <div class="avatar-grid">
        <div 
          v-for="avatar in avatarList" 
          :key="avatar"
          class="avatar-item"
          :class="{ selected: currentAvatar === avatar }"
          @click="selectAvatar(avatar)"
        >
          <div class="avatar-preview">{{ avatar }}</div>
          <div class="avatar-check" v-if="currentAvatar === avatar">✓</div>
        </div>
      </div>
    </div>

    <!-- 初始MBTI类型选择 -->
    <div class="card">
      <h2 class="section-title">初始MBTI类型</h2>
      <div class="mbti-info" v-if="initialMBTI">
        <div class="current-mbti" :style="{ color: mbtiColor }">
          {{ initialMBTI }}
        </div>
        <div class="mbti-desc">{{ mbtiDescription }}</div>
      </div>
      
      <div class="mbti-grid">
        <div 
          v-for="mbti in mbtiTypes" 
          :key="mbti"
          class="mbti-item"
          :class="{ selected: initialMBTI === mbti }"
          @click="selectMBTI(mbti)"
          :style="{ borderColor: initialMBTI === mbti ? mbtiColor : '#E9ECEF' }"
        >
          <span class="mbti-text">{{ mbti }}</span>
        </div>
      </div>
    </div>

    <!-- 当前状态 -->
    <div class="card">
      <h2 class="section-title">当前状态</h2>
      <div class="status-item">
        <span class="status-label">当前类型：</span>
        <span class="status-value" :style="{ color: currentMBTIColor }">{{ currentMBTI }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">初始类型：</span>
        <span class="status-value">{{ initialMBTI }}</span>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="action-section">
      <button class="btn btn-secondary" @click="resetData">重置数据</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserData } from '../composables/useUserData'
import { getInitialDimensions } from '../utils/mbtiEngine'
import { getMBTIDescription, getMBTIColor } from '../utils/mbtiEngine'

const router = useRouter()
const { getUserData, updateUserData, resetUserData: resetDataFunc } = useUserData()

const currentAvatar = ref('👤')
const initialMBTI = ref('INFP')
const currentMBTI = ref('INFP')
const mbtiDescription = ref('')
const mbtiColor = ref('#6C5CE7')
const currentMBTIColor = ref('#6C5CE7')

const avatarList = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🎨', '👩‍🎨', '🧑‍🔬', '👨‍🚀', '👩‍🚀']
const mbtiTypes = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
]

onMounted(() => {
  loadUserData()
})

const loadUserData = () => {
  const userData = getUserData()
  if (!userData) {
    initDefaultData()
    return
  }

  initialMBTI.value = userData.initialMBTI || 'INFP'
  currentMBTI.value = userData.currentMBTI || initialMBTI.value
  currentAvatar.value = userData.avatar || '👤'
  mbtiDescription.value = getMBTIDescription(initialMBTI.value)
  mbtiColor.value = getMBTIColor(initialMBTI.value)
  currentMBTIColor.value = getMBTIColor(currentMBTI.value)
}

const initDefaultData = () => {
  const defaultData = {
    avatar: '👤',
    initialMBTI: 'INFP',
    currentMBTI: 'INFP',
    dimensions: getInitialDimensions('INFP'),
    typeHistory: [],
    challengeHistory: [],
    lastRegressionDate: new Date().toDateString(),
    weeklyStats: {
      mainType: null,
      typeDistribution: {},
      startDate: null
    }
  }
  updateUserData(defaultData)
  loadUserData()
}

const selectAvatar = (avatar) => {
  currentAvatar.value = avatar
  updateUserData({ avatar })
}

const selectMBTI = (mbti) => {
  const userData = getUserData()
  
  // 更新初始类型和维度
  const newData = {
    initialMBTI: mbti,
    dimensions: getInitialDimensions(mbti),
    currentMBTI: mbti,
    typeHistory: [],
    challengeHistory: []
  }
  
  updateUserData(newData)

  mbtiDescription.value = getMBTIDescription(mbti)
  mbtiColor.value = getMBTIColor(mbti)
  currentMBTIColor.value = mbtiColor.value
  initialMBTI.value = mbti
  currentMBTI.value = mbti

  alert('已更新初始类型')
}

const resetData = () => {
  if (confirm('重置后将清除所有数据，包括挑战记录和类型历史，是否继续？')) {
    resetDataFunc()
    loadUserData()
    alert('数据已重置')
  }
}
</script>

<style scoped>
.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #2D3436;
  margin-bottom: 20px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.avatar-item {
  position: relative;
  aspect-ratio: 1;
  background: #F8F9FA;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #E9ECEF;
  transition: all 0.3s;
  cursor: pointer;
}

.avatar-item:hover {
  border-color: #6C5CE7;
  background: #F8F9FF;
}

.avatar-item.selected {
  border-color: #6C5CE7;
  background: #F8F9FF;
}

.avatar-preview {
  font-size: 48px;
}

.avatar-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #6C5CE7;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.mbti-info {
  text-align: center;
  padding: 30px 0;
  margin-bottom: 30px;
  border-bottom: 2px solid #F8F9FA;
}

.current-mbti {
  font-size: 64px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: 6px;
}

.mbti-desc {
  font-size: 16px;
  color: #636E72;
  line-height: 1.6;
}

.mbti-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.mbti-item {
  aspect-ratio: 1;
  background: #FFFFFF;
  border: 3px solid #E9ECEF;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: pointer;
}

.mbti-item:hover {
  transform: scale(1.05);
}

.mbti-item.selected {
  background: #F8F9FF;
  transform: scale(1.05);
}

.mbti-text {
  font-size: 18px;
  font-weight: 600;
  color: #2D3436;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 2px solid #F8F9FA;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 18px;
  color: #636E72;
}

.status-value {
  font-size: 20px;
  font-weight: 600;
  color: #2D3436;
}

.action-section {
  padding: 40px 0;
}
</style>

