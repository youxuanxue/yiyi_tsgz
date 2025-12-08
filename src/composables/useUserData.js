import { getInitialDimensions, calculateMBTI, recordTypeChange as recordTypeChangeUtil } from '../utils/mbtiEngine'

// 用户数据存储键
const STORAGE_KEY = 'yiyi_mbti_userData'

// 默认数据
const defaultData = {
  avatar: '👤',
  initialMBTI: 'INFP',
  currentMBTI: 'INFP',
  dimensions: {
    E: 20,   // 外向 0-100
    I: 80,   // 内向 0-100
    S: 20,   // 感觉 0-100
    N: 80,   // 直觉 0-100
    T: 20,   // 思考 0-100
    F: 80,   // 情感 0-100
    J: 20,   // 判断 0-100
    P: 80    // 感知 0-100
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
    } else {
      // 迁移旧数据格式（如果有）
      if (userData.dimensions.EI !== undefined) {
        // 旧格式：EI, SN, TF, JP (-100到+100)
        // 转换为新格式：E, I, S, N, T, F, J, P (0-100)
        const oldDims = userData.dimensions
        userData.dimensions = {
          E: oldDims.EI >= 0 ? 50 + oldDims.EI : 50,
          I: oldDims.EI < 0 ? 50 + Math.abs(oldDims.EI) : 50,
          S: oldDims.SN >= 0 ? 50 + oldDims.SN : 50,
          N: oldDims.SN < 0 ? 50 + Math.abs(oldDims.SN) : 50,
          T: oldDims.TF >= 0 ? 50 + oldDims.TF : 50,
          F: oldDims.TF < 0 ? 50 + Math.abs(oldDims.TF) : 50,
          J: oldDims.JP >= 0 ? 50 + oldDims.JP : 50,
          P: oldDims.JP < 0 ? 50 + Math.abs(oldDims.JP) : 50
        }
        // 归一化，确保总和合理
        const normalizePair = (left, right) => {
          const total = userData.dimensions[left] + userData.dimensions[right]
          if (total > 100) {
            const ratio = 100 / total
            userData.dimensions[left] = Math.round(userData.dimensions[left] * ratio)
            userData.dimensions[right] = Math.round(userData.dimensions[right] * ratio)
          }
        }
        normalizePair('E', 'I')
        normalizePair('S', 'N')
        normalizePair('T', 'F')
        normalizePair('J', 'P')
        saveUserData(userData)
      }
      
      // 确保所有8个维度都存在
      const allDimensions = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']
      let needsSave = false
      allDimensions.forEach(dim => {
        if (userData.dimensions[dim] === undefined) {
          userData.dimensions[dim] = 50 // 默认中间值
          needsSave = true
        }
      })
      if (needsSave) {
        saveUserData(userData)
      }
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

  // 执行每周回归调整（回归8%到初始值）
  const performWeeklyRegression = (userData) => {
    const initialDims = getInitialDimensions(userData.initialMBTI)
    const regressionRate = 0.08 // 8%回归率

    Object.keys(userData.dimensions).forEach(key => {
      const current = userData.dimensions[key] || 0
      const initial = initialDims[key] || 50
      const diff = current - initial
      userData.dimensions[key] = Math.max(0, Math.min(100, current - (diff * regressionRate)))
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
    
    // 确保所有8个维度都存在
    const allDimensions = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']
    allDimensions.forEach(dim => {
      if (resetData.dimensions[dim] === undefined) {
        resetData.dimensions[dim] = 50 // 默认中间值
      }
    })
    
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

