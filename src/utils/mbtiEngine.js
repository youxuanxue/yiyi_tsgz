// MBTI核心引擎

/**
 * 根据选择更新维度得分
 * @param {Object} choice - 选择对象 {dimension: 'EI', weight: 20, direction: 1}
 * @param {Object} userData - 用户数据对象
 */
export function updateDimensions(choice, userData) {
  if (!userData) return null;

  const { dimension, weight, direction } = choice;
  
  // 更新维度得分（限制在-100到100之间）
  const oldValue = userData.dimensions[dimension];
  const newValue = Math.max(-100, Math.min(100, oldValue + (weight * direction)));
  
  userData.dimensions[dimension] = newValue;
  
  // 检查是否跨越中轴线（0点）
  const crossedAxis = (oldValue < 0 && newValue >= 0) || (oldValue >= 0 && newValue < 0);
  
  // 重新计算MBTI类型
  const oldType = userData.currentMBTI;
  const newType = calculateMBTI(userData.dimensions);
  
  if (newType !== oldType) {
    // 类型发生变化
    updateTypeDuration(userData, oldType);
    recordTypeChange(userData, newType);
    userData.currentMBTI = newType;
    
    return {
      typeChanged: true,
      oldType,
      newType,
      crossedAxis,
      dimensions: userData.dimensions
    };
  }
  
  return {
    typeChanged: false,
    oldType,
    newType,
    crossedAxis,
    dimensions: userData.dimensions
  };
}

/**
 * 根据维度得分计算MBTI类型
 */
export function calculateMBTI(dimensions) {
  let type = '';
  
  // E/I
  type += dimensions.EI >= 0 ? 'E' : 'I';
  // S/N
  type += dimensions.SN >= 0 ? 'S' : 'N';
  // T/F
  type += dimensions.TF >= 0 ? 'T' : 'F';
  // J/P
  type += dimensions.JP >= 0 ? 'J' : 'P';
  
  return type;
}

/**
 * 根据初始MBTI类型获取初始维度值
 */
export function getInitialDimensions(mbti) {
  const dims = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const type = mbti.toUpperCase();
  
  // E/I
  dims.EI = type[0] === 'E' ? 50 : -50;
  // S/N
  dims.SN = type[1] === 'S' ? 50 : -50;
  // T/F
  dims.TF = type[2] === 'T' ? 50 : -50;
  // J/P
  dims.JP = type[3] === 'P' ? 50 : -50;
  
  return dims;
}

/**
 * 记录类型变化
 */
export function recordTypeChange(userData, newType) {
  const now = Date.now();
  
  // 如果有上一个记录，计算持续时间
  if (userData.typeHistory.length > 0) {
    const lastRecord = userData.typeHistory[userData.typeHistory.length - 1];
    if (lastRecord.endTime) {
      lastRecord.duration = now - lastRecord.endTime;
    }
  }
  
  // 添加新记录
  userData.typeHistory.push({
    type: newType,
    timestamp: now,
    startTime: now,
    endTime: null,
    duration: 0
  });
  
  // 只保留最近30天的记录
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  userData.typeHistory = userData.typeHistory.filter(record => record.timestamp >= thirtyDaysAgo);
}

/**
 * 更新类型持续时间
 */
export function updateTypeDuration(userData, newType) {
  if (userData.typeHistory.length > 0) {
    const lastRecord = userData.typeHistory[userData.typeHistory.length - 1];
    if (lastRecord.type === newType && !lastRecord.endTime) {
      // 同一类型，更新结束时间
      lastRecord.endTime = Date.now();
      lastRecord.duration = lastRecord.endTime - lastRecord.startTime;
    } else if (lastRecord.type !== newType) {
      // 类型变化，记录新类型
      recordTypeChange(userData, newType);
    }
  } else {
    recordTypeChange(userData, newType);
  }
}

/**
 * 获取维度图标
 */
export function getDimensionIcon(dimension) {
  const icons = {
    'EI': '🔋',
    'SN': '🧭',
    'TF': '⚖️',
    'JP': '🗓️'
  };
  return icons[dimension] || '📊';
}

/**
 * 获取维度名称
 */
export function getDimensionName(dimension) {
  const names = {
    'EI': '外向/内向',
    'SN': '感觉/直觉',
    'TF': '思考/情感',
    'JP': '判断/感知'
  };
  return names[dimension] || dimension;
}

/**
 * 获取MBTI类型描述
 */
export function getMBTIDescription(type) {
  const descriptions = {
    'INTJ': '建筑师 - 富有想象力和战略性的思想家',
    'INTP': '逻辑学家 - 具有创新精神的思想家',
    'ENTJ': '指挥官 - 大胆、富有想象力和意志坚强的领导者',
    'ENTP': '辩论家 - 聪明好奇的思想家',
    'INFJ': '提倡者 - 具有创造力和洞察力的理想主义者',
    'INFP': '调停者 - 诗意善良的利他主义者',
    'ENFJ': '主人公 - 富有魅力且鼓舞人心的领导者',
    'ENFP': '竞选者 - 热情、有创造力且自由奔放的人',
    'ISTJ': '物流师 - 实用且注重事实的人',
    'ISFJ': '守护者 - 非常专注而温暖的保护者',
    'ESTJ': '总经理 - 出色的管理者',
    'ESFJ': '执政官 - 极有同情心、受欢迎且尽责的人',
    'ISTP': '鉴赏家 - 大胆而实用的实验家',
    'ISFP': '探险家 - 灵活而迷人的艺术家',
    'ESTP': '企业家 - 聪明、精力充沛且善于感知的人',
    'ESFP': '表演者 - 自发的、精力充沛且热情的人'
  };
  return descriptions[type] || '未知类型';
}

/**
 * 获取MBTI类型颜色
 */
export function getMBTIColor(type) {
  const colors = {
    // Analysts (NT)
    'INTJ': '#4ECDC4',
    'INTP': '#4ECDC4',
    'ENTJ': '#4ECDC4',
    'ENTP': '#4ECDC4',
    // Diplomats (NF)
    'INFJ': '#FF6B6B',
    'INFP': '#FF6B6B',
    'ENFJ': '#FF6B6B',
    'ENFP': '#FF6B6B',
    // Sentinels (SJ)
    'ISTJ': '#95E1D3',
    'ISFJ': '#95E1D3',
    'ESTJ': '#95E1D3',
    'ESFJ': '#95E1D3',
    // Explorers (SP)
    'ISTP': '#F38181',
    'ISFP': '#F38181',
    'ESTP': '#F38181',
    'ESFP': '#F38181'
  };
  return colors[type] || '#6C5CE7';
}

