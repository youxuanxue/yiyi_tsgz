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
      
      <!-- 性格维度柱状图 -->
      <div class="bar-chart-section">
        <div class="section-title">性格维度</div>
        <div class="bar-chart">
          <canvas ref="barChart" class="chart-canvas"></canvas>
        </div>
      </div>
    </div>

    <!-- 类型分布散点图 -->
    <div class="card scatter-card">
      <h2 class="section-title">类型分布</h2>
      <div class="scatter-chart" v-if="weeklyStats.typeDistribution">
        <canvas ref="scatterChart" class="chart-canvas"></canvas>
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
import { getMBTIDescription, getMBTIColor, calculateMBTI } from '../utils/mbtiEngine'

const { getUserData, calculateWeeklyStats } = useUserData()

const weeklyStats = ref({})
const distributionList = ref([])
const scatterChart = ref(null)
const barChart = ref(null)

const dimensionPairs = [
  { key: 'EI', name: 'E/I', icon: '🔋', left: 'I', right: 'E', leftName: '内向', rightName: '外向', color: '#6C5CE7' },
  { key: 'SN', name: 'S/N', icon: '🧭', left: 'N', right: 'S', leftName: '直觉', rightName: '感觉', color: '#00B894' },
  { key: 'TF', name: 'T/F', icon: '⚖️', left: 'F', right: 'T', leftName: '情感', rightName: '思考', color: '#0984E3' },
  { key: 'JP', name: 'J/P', icon: '🗓️', left: 'P', right: 'J', leftName: '感知', rightName: '判断', color: '#FDCB6E' }
]

onMounted(() => {
  loadStatistics()
  nextTick(() => {
    drawScatterChart()
    drawBarChart()
  })
})

const loadStatistics = () => {
  const userData = getUserData()
  if (!userData) return

  // 根据当前维度计算当前MBTI类型
  const currentType = calculateMBTI(userData.dimensions)
  
  // 计算每周统计
  const stats = calculateWeeklyStats(userData)
  
  // 使用当前维度计算出的类型作为主要类型（确保一致性）
  const mainType = currentType || stats.mainType || userData.currentMBTI
  const mainTypeColor = getMBTIColor(mainType)
  const mainTypeDesc = getMBTIDescription(mainType)

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
    mainType, // 使用当前维度计算出的类型
    mainTypeColor,
    mainTypeDesc
  }
  distributionList.value = distribution
}

// 调整颜色亮度（用于渐变效果）
const adjustColorBrightness = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// 绘制类型分布散点图
const drawScatterChart = () => {
  if (!scatterChart.value) return

  const canvas = scatterChart.value
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  
  const canvasWidth = rect.width
  const canvasHeight = rect.height
  const padding = { top: 20, right: 20, bottom: 20, left: 20 }
  const chartWidth = canvasWidth - padding.left - padding.right
  const chartHeight = canvasHeight - padding.top - padding.bottom

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 16种MBTI类型
  const allMBTITypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ]

  // 获取分布数据
  const distribution = weeklyStats.value.typeDistribution || {}
  
  // 计算每个类型的占比和位置
  const maxPercentage = Math.max(...Object.values(distribution), 1)
  const minRadius = 8 // 最小半径
  const maxRadius = 40 // 最大半径
  
  // 计算散点位置（4x4网格）
  const cols = 4
  const rows = 4
  const cellWidth = chartWidth / cols
  const cellHeight = chartHeight / rows
  
  allMBTITypes.forEach((type, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    
    const x = padding.left + col * cellWidth + cellWidth / 2
    const y = padding.top + row * cellHeight + cellHeight / 2
    
    const percentage = distribution[type] || 0
    const radius = percentage > 0 
      ? minRadius + (percentage / maxPercentage) * (maxRadius - minRadius)
      : minRadius
    
    const color = getMBTIColor(type)
    
    // 绘制散点（使用渐变效果让颜色更丰富）
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, adjustColorBrightness(color, -20))
    
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2.5
    ctx.stroke()
    
    // 绘制类型标签（白色，更清晰）
    ctx.fillStyle = '#FFFFFF'
    ctx.font = percentage > 0 ? 'bold 13px sans-serif' : '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(type, x, y)
    
    // 绘制占比标签（如果占比大于0）
    if (percentage > 0) {
      ctx.fillStyle = color
      ctx.font = 'bold 11px sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillText(`${percentage}%`, x, y + radius + 6)
    }
  })
}

const drawBarChart = () => {
  if (!barChart.value) return

  const userData = getUserData()
  if (!userData) return

  const canvas = barChart.value
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  
  const canvasWidth = rect.width
  const canvasHeight = rect.height
  const padding = { top: 30, right: 20, bottom: 80, left: 45 }
  const chartWidth = canvasWidth - padding.left - padding.right
  const chartHeight = canvasHeight - padding.top - padding.bottom
  
  const dimensions = userData.dimensions

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 4组维度对配置（使用统一的颜色）
  const dimensionPairs = [
    {
      name: 'E/I',
      icon: '🔋',
      color: '#6C5CE7',
      dim1: { key: 'E', name: '外向' },
      dim2: { key: 'I', name: '内向' }
    },
    {
      name: 'S/N',
      icon: '🧭',
      color: '#00B894',
      dim1: { key: 'S', name: '感觉' },
      dim2: { key: 'N', name: '直觉' }
    },
    {
      name: 'T/F',
      icon: '⚖️',
      color: '#0984E3',
      dim1: { key: 'T', name: '思考' },
      dim2: { key: 'F', name: '情感' }
    },
    {
      name: 'J/P',
      icon: '🗓️',
      color: '#FDCB6E',
      dim1: { key: 'J', name: '判断' },
      dim2: { key: 'P', name: '感知' }
    }
  ]

  // 计算每组的位置和宽度
  const groupCount = dimensionPairs.length
  const groupWidth = chartWidth / groupCount
  const barWidth = groupWidth * 0.22 // 每个柱子宽度（进一步减小）
  const barGap = groupWidth * 0.18 // 两个柱子之间的间距（进一步增加）
  const maxValue = 100 // 最大值

  // 绘制背景网格
  ctx.strokeStyle = '#E9ECEF'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
    
    // Y轴标签
    if (i < 4) {
      ctx.fillStyle = '#95A5A6'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText((100 - i * 25).toString(), padding.left - 8, y)
    }
  }

  // 绘制每组维度对的柱子
  dimensionPairs.forEach((pair, groupIndex) => {
    const groupCenterX = padding.left + groupIndex * groupWidth + groupWidth / 2
    
    // 获取两个维度的值
    const dim1Value = dimensions[pair.dim1.key] || 0
    const dim2Value = dimensions[pair.dim2.key] || 0
    
    // 计算柱子高度
    const dim1Height = (dim1Value / maxValue) * chartHeight
    const dim2Height = (dim2Value / maxValue) * chartHeight
    
    // 柱子底部Y坐标（从下往上）
    const baseY = padding.top + chartHeight
    
    // 绘制第一个柱子（dim1，左侧）- 使用组颜色
    const dim1X = groupCenterX - barWidth / 2 - barGap / 2
    const dim1Y = baseY - dim1Height
    
    ctx.fillStyle = pair.color
    ctx.fillRect(dim1X, dim1Y, barWidth, dim1Height)
    
    // 绘制第一个柱子的边框
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(dim1X, dim1Y, barWidth, dim1Height)
    
    // 第一个柱子的数值标签（在柱子顶部上方，确保有足够空间）
    if (dim1Height > 20) {
      ctx.fillStyle = pair.color
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(dim1Value.toString(), dim1X + barWidth / 2, dim1Y - 10)
    }
    
    // 第一个柱子的字母标签（在柱子顶部内部，根据高度调整）
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 11px sans-serif'
    ctx.textBaseline = 'middle'
    const dim1LabelY = dim1Y + Math.max(12, Math.min(18, dim1Height / 2))
    if (dim1Height > 15) {
      ctx.fillText(pair.dim1.key, dim1X + barWidth / 2, dim1LabelY)
    }
    
    // 绘制第二个柱子（dim2，右侧）- 使用组颜色
    const dim2X = groupCenterX + barGap / 2
    const dim2Y = baseY - dim2Height
    
    ctx.fillStyle = pair.color
    ctx.fillRect(dim2X, dim2Y, barWidth, dim2Height)
    
    // 绘制第二个柱子的边框
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(dim2X, dim2Y, barWidth, dim2Height)
    
    // 第二个柱子的数值标签（在柱子顶部上方，确保有足够空间）
    if (dim2Height > 20) {
      ctx.fillStyle = pair.color
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(dim2Value.toString(), dim2X + barWidth / 2, dim2Y - 10)
    }
    
    // 第二个柱子的字母标签（在柱子顶部内部，根据高度调整）
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 11px sans-serif'
    ctx.textBaseline = 'middle'
    const dim2LabelY = dim2Y + Math.max(12, Math.min(18, dim2Height / 2))
    if (dim2Height > 15) {
      ctx.fillText(pair.dim2.key, dim2X + barWidth / 2, dim2LabelY)
    }
    
    // 组名标签（在底部）
    ctx.fillStyle = '#2D3436'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(pair.icon + ' ' + pair.name, groupCenterX, baseY + 15)
    
    // 维度名称（在组名下方，分别显示，增加间距）
    ctx.fillStyle = '#636E72'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(pair.dim1.name, dim1X + barWidth / 2, baseY + 35)
    ctx.fillText(pair.dim2.name, dim2X + barWidth / 2, baseY + 35)
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
  height: 350px;
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

.trend-dimensions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
}

.trend-dim-label {
  font-weight: 500;
}

.trend-dim-separator {
  color: #636E72;
  opacity: 0.5;
}

.trend-diff {
  text-align: center;
}

.bar-chart-section {
  margin-top: 30px;
}

.bar-chart {
  margin: 20px 0;
}

.scatter-card {
  margin-bottom: 30px;
}

.scatter-chart {
  margin: 20px 0;
}

.share-section {
  padding: 30px 0;
}
</style>

