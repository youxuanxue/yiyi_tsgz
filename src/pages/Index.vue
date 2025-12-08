<template>
  <div class="container">
    <!-- 用户形象和当前MBTI类型 -->
    <div class="main-card">
      <div class="avatar-section">
        <div class="avatar-placeholder">{{ avatar }}</div>
      </div>
      
      <div class="mbti-display" :class="{ 'type-switch': typeSwitchClass }">
        <div class="mbti-type" :style="{ color: mbtiColor }">
          {{ currentMBTI }}
        </div>
        <div class="mbti-description">{{ mbtiDescription }}</div>
      </div>
      
      <!-- 八维度展示 - 双向坐标轴 -->
      <div class="dimensions">
        <div class="dimension-item" v-for="dim in dimensions" :key="dim.key">
          <div class="dimension-header">
            <span class="dimension-icon">{{ dim.icon }}</span>
          </div>
          <!-- 双向坐标轴 -->
          <div class="dimension-axis">
            <!-- 左侧标签（I/N/F/P） -->
            <span class="axis-label axis-label-left">{{ dim.leftName }}</span>
            <!-- 左侧进度条 -->
            <div class="axis-left">
              <div class="axis-bar-container">
                <div class="axis-bar-left" :style="{ width: dim.leftPercent + '%', background: dim.leftColor }">
                  <span class="axis-value" v-if="dim.leftPercent > 15">{{ dim.leftValue }}</span>
                </div>
              </div>
            </div>
            <!-- 中间分隔线 -->
            <div class="axis-divider"></div>
            <!-- 右侧进度条 -->
            <div class="axis-right">
              <div class="axis-bar-container">
                <div class="axis-bar-right" :style="{ width: dim.rightPercent + '%', background: dim.rightColor }">
                  <span class="axis-value" v-if="dim.rightPercent > 15">{{ dim.rightValue }}</span>
                </div>
              </div>
            </div>
            <!-- 右侧标签（E/S/T/J） -->
            <span class="axis-label axis-label-right">{{ dim.rightName }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快速入口 -->
    <div class="quick-actions">
      <router-link to="/challenge" class="action-card">
        <span class="action-icon">🎯</span>
        <span class="action-text">今日挑战</span>
      </router-link>
      <router-link to="/statistics" class="action-card">
        <span class="action-icon">📊</span>
        <span class="action-text">性格趋势</span>
      </router-link>
    </div>
    
    <!-- 本周概览 -->
    <div class="card weekly-preview" v-if="weeklyStats.mainType">
      <div class="subtitle">本周主要类型</div>
      <div class="weekly-main-type" :style="{ color: weeklyStats.mainTypeColor }">
        {{ weeklyStats.mainType }}
      </div>
      <div class="weekly-description">{{ weeklyStats.mainTypeDesc }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserData } from '../composables/useUserData'
import { 
  getMBTIDescription, 
  getMBTIColor, 
  getDimensionIcon, 
  getDimensionName 
} from '../utils/mbtiEngine'

const router = useRouter()
const { getUserData, calculateWeeklyStats } = useUserData()

const avatar = ref('👤')
const currentMBTI = ref('INFP')
const mbtiDescription = ref('')
const mbtiColor = ref('#6C5CE7')
const dimensions = ref([])
const typeSwitchClass = ref(false)
const weeklyStats = ref({})

const loadUserData = () => {
  const userData = getUserData()
  if (!userData) {
    router.push('/profile')
    return
  }

  const oldMBTI = currentMBTI.value
  currentMBTI.value = userData.currentMBTI || userData.initialMBTI
  mbtiDescription.value = getMBTIDescription(currentMBTI.value)
  mbtiColor.value = getMBTIColor(currentMBTI.value)
  avatar.value = userData.avatar || '👤'

  // 处理维度数据 - 8个维度，双向坐标轴
  const dimensionPairs = [
    { left: 'I', right: 'E', leftName: '内向', rightName: '外向', icon: '🔋' },
    { left: 'N', right: 'S', leftName: '直觉', rightName: '感觉', icon: '🧭' },
    { left: 'F', right: 'T', leftName: '情感', rightName: '思考', icon: '⚖️' },
    { left: 'P', right: 'J', leftName: '感知', rightName: '判断', icon: '🗓️' }
  ]
  
  dimensions.value = dimensionPairs.map(pair => {
    const leftValue = userData.dimensions[pair.left] || 0
    const rightValue = userData.dimensions[pair.right] || 0
    const total = leftValue + rightValue || 100 // 避免除零
    
    // 计算百分比（基于总和，但显示时各占50%宽度）
    // 左边显示leftValue的百分比，右边显示rightValue的百分比
    const leftPercent = Math.min(50, (leftValue / 100) * 50) // 左边最多50%
    const rightPercent = Math.min(50, (rightValue / 100) * 50) // 右边最多50%
    
    return {
      key: pair.left + pair.right,
      leftKey: pair.left,
      rightKey: pair.right,
      leftName: pair.leftName,
      rightName: pair.rightName,
      icon: pair.icon,
      leftValue: Math.round(leftValue),
      rightValue: Math.round(rightValue),
      leftPercent: Math.round(leftPercent),
      rightPercent: Math.round(rightPercent),
      leftColor: '#FF6B6B',
      rightColor: '#6C5CE7'
    }
  })

  // 计算每周统计
  const stats = calculateWeeklyStats(userData)
  const mainTypeColor = getMBTIColor(stats.mainType)
  const mainTypeDesc = getMBTIDescription(stats.mainType)

  weeklyStats.value = {
    ...stats,
    mainTypeColor,
    mainTypeDesc
  }

  // 检查类型是否变化
  if (oldMBTI && oldMBTI !== currentMBTI.value) {
    typeSwitchClass.value = true
    setTimeout(() => {
      typeSwitchClass.value = false
    }, 600)
  }
}

onMounted(() => {
  loadUserData()
})

// 监听路由变化，返回时刷新数据
watch(() => router.currentRoute.value.path, (newPath) => {
  if (newPath === '/') {
    loadUserData()
  }
})
</script>

<style scoped>
.main-card {
  background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
  border-radius: 30px;
  padding: 60px 40px;
  margin-bottom: 30px;
  color: #FFFFFF;
  text-align: center;
}

.avatar-section {
  margin-bottom: 40px;
}

.avatar-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
  margin: 0 auto;
  border: 6px solid rgba(255, 255, 255, 0.3);
}

.mbti-display {
  margin-bottom: 50px;
}

.mbti-type {
  font-size: 120px;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: 8px;
}

.mbti-description {
  font-size: 18px;
  opacity: 0.9;
  line-height: 1.6;
}

.dimensions {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 30px;
  margin-top: 40px;
}

.dimension-item {
  margin-bottom: 30px;
}

.dimension-item:last-child {
  margin-bottom: 0;
}

.dimension-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 18px;
}

.dimension-icon {
  font-size: 24px;
}

.dimension-axis {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  gap: 8px;
}

.axis-label {
  font-size: 12px;
  opacity: 0.95;
  white-space: nowrap;
  font-weight: 500;
  flex-shrink: 0;
}

.axis-label-left {
  color: #FF6B6B;
  margin-right: 4px;
}

.axis-label-right {
  color: #6C5CE7;
  margin-left: 4px;
}

.axis-left,
.axis-right {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  min-width: 0;
}

.axis-left {
  justify-content: flex-end;
}

.axis-right {
  justify-content: flex-start;
}

.axis-bar-container {
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  position: relative;
  min-width: 0;
}

.axis-left .axis-bar-container {
  justify-content: flex-end;
}

.axis-right .axis-bar-container {
  justify-content: flex-start;
}

.axis-bar-left,
.axis-bar-right {
  height: 34px;
  border-radius: 17px;
  transition: width 0.3s ease;
  min-width: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.axis-bar-left {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  justify-content: flex-end;
  padding-right: 8px;
}

.axis-bar-right {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  justify-content: flex-start;
  padding-left: 8px;
}

.axis-value {
  font-size: 11px;
  opacity: 1;
  font-weight: 700;
  text-align: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.axis-divider {
  width: 3px;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  position: relative;
  margin: 0 4px;
}

.axis-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 1);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.quick-actions {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-4px);
}

.action-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.action-text {
  font-size: 18px;
  color: #2D3436;
  font-weight: 500;
}

.weekly-preview {
  text-align: center;
}

.weekly-main-type {
  font-size: 64px;
  font-weight: 700;
  margin: 20px 0;
  letter-spacing: 6px;
}

.weekly-description {
  font-size: 16px;
  color: #636E72;
  line-height: 1.6;
}

@media (max-width: 480px) {
  .main-card {
    padding: 40px 20px;
  }
  
  .mbti-type {
    font-size: 80px;
  }
  
  .avatar-placeholder {
    width: 150px;
    height: 150px;
    font-size: 80px;
  }
}
</style>

