import { getInitialDimensions, calculateMBTI, recordTypeChange as recordTypeChangeUtil } from '../utils/mbtiEngine'

// 用户数据存储键
const STORAGE_KEY = 'yiyi_mbti_userData'

// 默认数据
const defaultData = {
  avatar: '👤',
  initialMBTI: 'INFP',
  currentMBTI: 'INFP',
  dimensions: {
    EI: -50,  // I倾向
    SN: -50,  // N倾向
    TF: -50,  // F倾向
    JP: -50   // P倾向
  },
  typeHistory: [],
  challengeHistory: [],
  lastRegressionDate: new Date().toDateString(),
  weeklyStats: {
    mainType: null,
    typeDistribution: {},
    startDate: null
  }
}

/**
 * 用户数据管理 Composable
 */
export function useUserData() {
  // 从 localStorage 读取数据
  const loadUserData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('读取用户数据失败:', error)
    }
    return null
  }

  // 保存数据到 localStorage
  const saveUserData = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('保存用户数据失败:', error)
      return false
    }
  }

  // 初始化用户数据
  const initUserData = () => {
    let userData = loadUserData()
    if (!userData) {
      userData = { ...defaultData }
      userData.dimensions = getInitialDimensions(userData.initialMBTI)
      saveUserData(userData)
    }
    return userData
  }

  // 检查并执行每周回归调整
  const checkWeeklyRegression = () => {
    const userData = loadUserData()
    if (!userData) return

    const lastDate = new Date(userData.lastRegressionDate)
    const now = new Date()
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))

    // 如果超过7天，执行回归调整
    if (daysDiff >= 7) {
      performWeeklyRegression(userData)
      userData.lastRegressionDate = now.toDateString()
      saveUserData(userData)
    }
  }

  // 执行每周回归调整（回归5-10%到初始值）
  const performWeeklyRegression = (userData) => {
    const initialDims = getInitialDimensions(userData.initialMBTI)
    const regressionRate = 0.08 // 8%回归率

    Object.keys(userData.dimensions).forEach(key => {
      const current = userData.dimensions[key]
      const initial = initialDims[key]
      const diff = current - initial
      userData.dimensions[key] = current - (diff * regressionRate)
    })

    // 重新计算MBTI类型
    const newType = calculateMBTI(userData.dimensions)
    if (newType !== userData.currentMBTI) {
      recordTypeChangeLocal(userData, newType)
      userData.currentMBTI = newType
    }
  }

  // 记录类型变化（使用工具函数）
  const recordTypeChangeLocal = (userData, newType) => {
    recordTypeChangeUtil(userData, newType)
  }

  // 计算每周统计
  const calculateWeeklyStats = (userData) => {
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    
    // 筛选最近7天的记录
    const recentRecords = userData.typeHistory.filter(record => record.timestamp >= sevenDaysAgo)
    
    if (recentRecords.length === 0) {
      return {
        mainType: userData.currentMBTI,
        typeDistribution: { [userData.currentMBTI]: 100 },
        startDate: new Date(sevenDaysAgo).toLocaleDateString()
      }
    }
    
    // 计算每个类型的总停留时间
    const typeDurations = {}
    let totalDuration = 0
    
    recentRecords.forEach(record => {
      const duration = record.duration || (now - record.startTime)
      if (!typeDurations[record.type]) {
        typeDurations[record.type] = 0
      }
      typeDurations[record.type] += duration
      totalDuration += duration
    })
    
    // 找到停留时间最长的类型
    let mainType = userData.currentMBTI
    let maxDuration = 0
    Object.keys(typeDurations).forEach(type => {
      if (typeDurations[type] > maxDuration) {
        maxDuration = typeDurations[type]
        mainType = type
      }
    })
    
    // 计算百分比分布
    const typeDistribution = {}
    Object.keys(typeDurations).forEach(type => {
      typeDistribution[type] = Math.round((typeDurations[type] / totalDuration) * 100)
    })
    
    return {
      mainType,
      typeDistribution,
      startDate: new Date(sevenDaysAgo).toLocaleDateString()
    }
  }

  // 获取用户数据
  const getUserData = () => {
    return loadUserData() || initUserData()
  }

  // 更新用户数据
  const updateUserData = (updates) => {
    const userData = getUserData()
    Object.assign(userData, updates)
    saveUserData(userData)
    return userData
  }

  // 重置数据
  const resetUserData = () => {
    const userData = getUserData()
    const initialMBTI = userData.initialMBTI || 'INFP'
    const avatar = userData.avatar || '👤'
    
    const resetData = {
      avatar,
      initialMBTI,
      currentMBTI: initialMBTI,
      dimensions: getInitialDimensions(initialMBTI),
      typeHistory: [],
      challengeHistory: [],
      lastRegressionDate: new Date().toDateString(),
      weeklyStats: {
        mainType: null,
        typeDistribution: {},
        startDate: null
      }
    }
    
    saveUserData(resetData)
    return resetData
  }

  return {
    getUserData,
    updateUserData,
    initUserData,
    checkWeeklyRegression,
    calculateWeeklyStats,
    resetUserData,
    saveUserData
  }
}

