<template>
  <div class="container">
    <!-- 每周统计 -->
    <div class="card weekly-stats">
      <h2 class="section-title">本周统计</h2>
      <div class="weekly-main" v-if="weeklyStats.mainType">
        <div class="main-type-label">主要类型</div>
        <div class="main-type-value" :style="{ color: weeklyStats.mainTypeColor }">
          {{ weeklyStats.mainType }}
        </div>
        <div class="main-type-desc">{{ weeklyStats.mainTypeDesc }}</div>
      </div>
      
      <!-- 类型分布 -->
      <div class="type-distribution" v-if="weeklyStats.typeDistribution">
        <div class="distribution-title">类型分布</div>
        <div class="distribution-list">
          <div 
            class="distribution-item" 
            v-for="item in distributionList" 
            :key="item.type"
          >
            <div class="distribution-type">{{ item.type }}</div>
            <div class="distribution-bar">
              <div 
                class="distribution-fill" 
                :style="{ width: item.percentage + '%', background: item.color }"
              ></div>
            </div>
            <div class="distribution-percentage">{{ item.percentage }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 性格趋势 -->
    <div class="card trend-card">
      <h2 class="section-title">性格趋势</h2>
      <div class="trend-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="trend-tab"
          :class="{ active: currentTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.icon }} {{ tab.name }}
        </div>
      </div>
      
      <!-- 趋势图表区域 -->
      <div class="trend-chart">
        <canvas ref="trendChart" class="chart-canvas"></canvas>
      </div>
      
      <div class="trend-info">
        <div class="trend-current">
          <span class="trend-label">当前值：</span>
          <span class="trend-value" :style="{ color: currentTrendColor }">
            {{ currentTrendValue > 0 ? '+' : '' }}{{ currentTrendValue }}
          </span>
        </div>
      </div>
    </div>

    <!-- 性格雷达图 -->
    <div class="card radar-card">
      <h2 class="section-title">性格雷达图</h2>
      <div class="radar-chart">
        <canvas ref="radarChart" class="chart-canvas"></canvas>
      </div>
    </div>

    <!-- 分享按钮 -->
    <div class="share-section">
      <button class="btn btn-primary" @click="shareWeeklyReport">分享本周报告</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useUserData } from '../composables/useUserData'
import { getMBTIDescription, getMBTIColor } from '../utils/mbtiEngine'

const { getUserData, calculateWeeklyStats } = useUserData()

const weeklyStats = ref({})
const distributionList = ref([])
const currentTab = ref('EI')
const currentTrendValue = ref(0)
const currentTrendColor = ref('#6C5CE7')
const trendHistory = ref([])
const trendChart = ref(null)
const radarChart = ref(null)

const tabs = [
  { key: 'EI', name: 'E/I', icon: '🔋' },
  { key: 'SN', name: 'S/N', icon: '🧭' },
  { key: 'TF', name: 'T/F', icon: '⚖️' },
  { key: 'JP', name: 'J/P', icon: '🗓️' }
]

onMounted(() => {
  loadStatistics()
  nextTick(() => {
    drawTrendChart()
    drawRadarChart()
  })
})

watch(currentTab, () => {
  loadTrendData()
  nextTick(() => {
    drawTrendChart()
  })
})

const loadStatistics = () => {
  const userData = getUserData()
  if (!userData) return

  // 计算每周统计
  const stats = calculateWeeklyStats(userData)
  const mainTypeColor = getMBTIColor(stats.mainType)
  const mainTypeDesc = getMBTIDescription(stats.mainType)

  // 处理类型分布列表
  const distribution = Object.keys(stats.typeDistribution || {})
    .map(type => ({
      type,
      percentage: stats.typeDistribution[type],
      color: getMBTIColor(type)
    }))
    .sort((a, b) => b.percentage - a.percentage)

  weeklyStats.value = {
    ...stats,
    mainTypeColor,
    mainTypeDesc
  }
  distributionList.value = distribution

  // 加载趋势数据
  loadTrendData()
}

const switchTab = (tab) => {
  currentTab.value = tab
}

const loadTrendData = () => {
  const userData = getUserData()
  if (!userData) return

  const currentValue = userData.dimensions[currentTab.value] || 0
  const color = currentValue >= 0 ? '#6C5CE7' : '#FF6B6B'

  // 生成模拟历史数据（实际应该从typeHistory中计算）
  const history = []
  const now = Date.now()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    // 这里使用当前值加上一些随机变化作为示例
    const value = currentValue + (Math.random() - 0.5) * 20
    history.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      value: Math.max(-100, Math.min(100, value))
    })
  }

  currentTrendValue.value = Math.round(currentValue)
  currentTrendColor.value = color
  trendHistory.value = history
}

const drawTrendChart = () => {
  if (!trendChart.value || trendHistory.value.length === 0) return

  const canvas = trendChart.value
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  
  const canvasWidth = rect.width
  const canvasHeight = rect.height
  const padding = 40
  const chartWidth = canvasWidth - padding * 2
  const chartHeight = canvasHeight - padding * 2

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制背景网格
  ctx.strokeStyle = '#E9ECEF'
  ctx.lineWidth = 1
  
  // 水平线（0轴）
  const zeroY = padding + chartHeight / 2
  ctx.beginPath()
  ctx.moveTo(padding, zeroY)
  ctx.lineTo(canvasWidth - padding, zeroY)
  ctx.stroke()

  // 绘制数据点
  const pointRadius = 6
  const points = trendHistory.value.map((item, index) => {
    const x = padding + (index / (trendHistory.value.length - 1)) * chartWidth
    const y = padding + chartHeight / 2 - (item.value / 100) * (chartHeight / 2)
    return { x, y, value: item.value }
  })

  // 绘制连线
  ctx.strokeStyle = currentTrendColor.value
  ctx.lineWidth = 3
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  ctx.stroke()

  // 绘制数据点
  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI)
    ctx.fillStyle = currentTrendColor.value
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // 绘制标签
  ctx.fillStyle = '#636E72'
  ctx.font = '12px sans-serif'
  trendHistory.value.forEach((item, index) => {
    const x = padding + (index / (trendHistory.value.length - 1)) * chartWidth
    ctx.textAlign = 'center'
    ctx.fillText(item.date, x, canvasHeight - 10)
  })
}

const drawRadarChart = () => {
  if (!radarChart.value) return

  const userData = getUserData()
  if (!userData) return

  const canvas = radarChart.value
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  
  const rect = canvas.getBoundingClientRect()
  const canvasSize = Math.min(rect.width, 500)
  canvas.width = canvasSize * dpr
  canvas.height = canvasSize * dpr
  ctx.scale(dpr, dpr)
  
  const dimensions = userData.dimensions
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const radius = Math.min(canvasSize / 2 - 50, 180)

  // 清空画布
  ctx.clearRect(0, 0, canvasSize, canvasSize)

  // 绘制网格
  ctx.strokeStyle = '#E9ECEF'
  ctx.lineWidth = 1
  for (let i = 1; i <= 4; i++) {
    const r = (radius / 4) * i
    ctx.beginPath()
    ctx.arc(centerX, centerY, r, 0, 2 * Math.PI)
    ctx.stroke()
  }

  // 绘制轴线
  const dimKeys = ['EI', 'SN', 'TF', 'JP']
  const angles = [Math.PI / 2, 0, -Math.PI / 2, Math.PI]
  
  dimKeys.forEach((key, index) => {
    const angle = angles[index]
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(x, y)
    ctx.stroke()

    // 标签
    const labelX = centerX + Math.cos(angle) * (radius + 30)
    const labelY = centerY + Math.sin(angle) * (radius + 30)
    ctx.fillStyle = '#636E72'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(key, labelX, labelY)
  })

  // 绘制数据区域
  const points = dimKeys.map((key, index) => {
    const value = dimensions[key] || 0
    const normalizedValue = (value + 100) / 200 // 0-1
    const angle = angles[index]
    const r = radius * normalizedValue
    return {
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r
    }
  })

  // 填充区域
  ctx.fillStyle = 'rgba(108, 92, 231, 0.3)'
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  ctx.closePath()
  ctx.fill()

  // 绘制边框
  ctx.strokeStyle = '#6C5CE7'
  ctx.lineWidth = 2
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  ctx.closePath()
  ctx.stroke()

  // 绘制数据点
  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
    ctx.fillStyle = '#6C5CE7'
    ctx.fill()
  })
}

const shareWeeklyReport = () => {
  const { weeklyStats: stats } = weeklyStats.value
  const shareContent = `我的本周MBTI类型是${stats.mainType}！\n快来测试你的动态性格吧~`
  
  if (navigator.share) {
    navigator.share({
      title: `我的本周MBTI类型是${stats.mainType}！`,
      text: shareContent,
      url: window.location.href
    }).catch(() => {
      // 分享失败，使用复制到剪贴板
      copyToClipboard(shareContent)
    })
  } else {
    // 不支持分享API，使用复制到剪贴板
    copyToClipboard(shareContent)
  }
}

const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板！')
    })
  } else {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板！')
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

.weekly-stats {
  margin-bottom: 30px;
}

.weekly-main {
  text-align: center;
  padding: 30px 0;
  border-bottom: 2px solid #F8F9FA;
  margin-bottom: 30px;
}

.main-type-label {
  font-size: 14px;
  color: #636E72;
  margin-bottom: 16px;
}

.main-type-value {
  font-size: 64px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: 6px;
}

.main-type-desc {
  font-size: 16px;
  color: #636E72;
  line-height: 1.6;
}

.type-distribution {
  margin-top: 30px;
}

.distribution-title {
  font-size: 18px;
  font-weight: 500;
  color: #2D3436;
  margin-bottom: 24px;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.distribution-type {
  width: 80px;
  font-size: 18px;
  font-weight: 600;
  color: #2D3436;
}

.distribution-bar {
  flex: 1;
  height: 24px;
  background: #E9ECEF;
  border-radius: 12px;
  overflow: hidden;
}

.distribution-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.distribution-percentage {
  width: 60px;
  text-align: right;
  font-size: 14px;
  color: #636E72;
}

.trend-card {
  margin-bottom: 30px;
}

.trend-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.trend-tab {
  flex: 1;
  min-width: 100px;
  padding: 12px 16px;
  background: #F8F9FA;
  border-radius: 12px;
  text-align: center;
  font-size: 16px;
  color: #636E72;
  transition: all 0.3s;
  cursor: pointer;
}

.trend-tab:hover {
  background: #E9ECEF;
}

.trend-tab.active {
  background: #6C5CE7;
  color: #FFFFFF;
}

.trend-chart {
  margin: 30px 0;
}

.chart-canvas {
  width: 100%;
  height: 300px;
  display: block;
}

.trend-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #F8F9FA;
}

.trend-current {
  text-align: center;
}

.trend-label {
  font-size: 16px;
  color: #636E72;
}

.trend-value {
  font-size: 20px;
  font-weight: 600;
}

.radar-card {
  margin-bottom: 30px;
}

.radar-chart {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.share-section {
  padding: 30px 0;
}
</style>

