// MBTI核心引擎

/**
 * 根据选择更新维度得分
 * @param {Object} choice - 选择对象 {dimension: 'E', weight: 20} 或 {dimension: 'EI', weight: 20, direction: 1} (兼容旧格式)
 * @param {Object} userData - 用户数据对象
 */
export function updateDimensions(choice, userData) {
  if (!userData) return null;

  const { dimension, weight, direction } = choice;
  
  // 兼容旧格式：如果是EI/SN/TF/JP格式，转换为新的8维度格式
  let targetDimension = dimension;
  let oppositeDimension = null;
  
  if (dimension === 'EI') {
    targetDimension = direction > 0 ? 'E' : 'I';
    oppositeDimension = direction > 0 ? 'I' : 'E';
  } else if (dimension === 'SN') {
    targetDimension = direction > 0 ? 'S' : 'N';
    oppositeDimension = direction > 0 ? 'N' : 'S';
  } else if (dimension === 'TF') {
    targetDimension = direction > 0 ? 'T' : 'F';
    oppositeDimension = direction > 0 ? 'F' : 'T';
  } else if (dimension === 'JP') {
    targetDimension = direction > 0 ? 'J' : 'P';
    oppositeDimension = direction > 0 ? 'P' : 'J';
  }
  
  // 更新目标维度（0-100）
  const oldTargetValue = userData.dimensions[targetDimension] || 0;
  const newTargetValue = Math.max(0, Math.min(100, oldTargetValue + weight));
  userData.dimensions[targetDimension] = newTargetValue;
  
  // 如果是对立维度，减少对立维度的值（保持总和不超过100）
  if (oppositeDimension) {
    const oldOppositeValue = userData.dimensions[oppositeDimension] || 0;
    const decreaseAmount = Math.min(weight, oldOppositeValue);
    userData.dimensions[oppositeDimension] = Math.max(0, oldOppositeValue - decreaseAmount);
  }
  
  // 重新计算MBTI类型
  const oldType = userData.currentMBTI;
  const newType = calculateMBTI(userData.dimensions);
  
  // 检查是否跨越中轴线（50点）
  const oldTargetPercent = oldTargetValue / 100;
  const newTargetPercent = newTargetValue / 100;
  const crossedAxis = (oldTargetPercent < 0.5 && newTargetPercent >= 0.5) || (oldTargetPercent >= 0.5 && newTargetPercent < 0.5);
  
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
 * 8个维度：E, I, S, N, T, F, J, P，每个0-100
 */
export function calculateMBTI(dimensions) {
  let type = '';
  
  // E/I: 比较E和I的得分
  const eScore = dimensions.E || 0;
  const iScore = dimensions.I || 0;
  type += eScore > iScore ? 'E' : 'I';
  
  // S/N: 比较S和N的得分
  const sScore = dimensions.S || 0;
  const nScore = dimensions.N || 0;
  type += sScore > nScore ? 'S' : 'N';
  
  // T/F: 比较T和F的得分
  const tScore = dimensions.T || 0;
  const fScore = dimensions.F || 0;
  type += tScore > fScore ? 'T' : 'F';
  
  // J/P: 比较J和P的得分
  const jScore = dimensions.J || 0;
  const pScore = dimensions.P || 0;
  type += jScore > pScore ? 'J' : 'P';
  
  return type;
}

/**
 * 根据初始MBTI类型获取初始维度值
 * 8个维度，每个0-100，初始值设为50（中间值）
 */
export function getInitialDimensions(mbti) {
  const dims = { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 };
  const type = mbti.toUpperCase();
  
  // 根据MBTI类型设置初始值
  // E/I
  if (type[0] === 'E') {
    dims.E = 80;
    dims.I = 20;
  } else {
    dims.E = 20;
    dims.I = 80;
  }
  
  // S/N
  if (type[1] === 'S') {
    dims.S = 80;
    dims.N = 20;
  } else {
    dims.S = 20;
    dims.N = 80;
  }
  
  // T/F
  if (type[2] === 'T') {
    dims.T = 80;
    dims.F = 20;
  } else {
    dims.T = 20;
    dims.F = 80;
  }
  
  // J/P
  if (type[3] === 'J') {
    dims.J = 80;
    dims.P = 20;
  } else {
    dims.J = 20;
    dims.P = 80;
  }
  
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
    'E': '🔋',
    'I': '🔋',
    'S': '🧭',
    'N': '🧭',
    'T': '⚖️',
    'F': '⚖️',
    'J': '🗓️',
    'P': '🗓️'
  };
  return icons[dimension] || '📊';
}

/**
 * 获取维度名称
 */
export function getDimensionName(dimension) {
  const names = {
    'E': '外向',
    'I': '内向',
    'S': '感觉',
    'N': '直觉',
    'T': '思考',
    'F': '情感',
    'J': '判断',
    'P': '感知'
  };
  return names[dimension] || dimension;
}

/**
 * 获取维度对信息
 */
export function getDimensionPair(dimension) {
  const pairs = {
    'E': { left: 'I', right: 'E', leftName: '内向', rightName: '外向', icon: '🔋' },
    'I': { left: 'I', right: 'E', leftName: '内向', rightName: '外向', icon: '🔋' },
    'S': { left: 'N', right: 'S', leftName: '直觉', rightName: '感觉', icon: '🧭' },
    'N': { left: 'N', right: 'S', leftName: '直觉', rightName: '感觉', icon: '🧭' },
    'T': { left: 'F', right: 'T', leftName: '情感', rightName: '思考', icon: '⚖️' },
    'F': { left: 'F', right: 'T', leftName: '情感', rightName: '思考', icon: '⚖️' },
    'J': { left: 'P', right: 'J', leftName: '感知', rightName: '判断', icon: '🗓️' },
    'P': { left: 'P', right: 'J', leftName: '感知', rightName: '判断', icon: '🗓️' }
  };
  return pairs[dimension] || null;
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
  // 为16种MBTI类型分配更丰富的颜色，每种类型都有独特颜色
  const colors = {
    // Analysts (NT) - 紫色/蓝色系
    'INTJ': '#6C5CE7', // 深紫色
    'INTP': '#A29BFE', // 淡紫色
    'ENTJ': '#5F3DC4', // 深紫蓝色
    'ENTP': '#845EF7', // 亮紫色
    
    // Diplomats (NF) - 绿色/青色系
    'INFJ': '#00B894', // 翠绿色
    'INFP': '#00CEC9', // 青绿色
    'ENFJ': '#00D2D3', // 青色
    'ENFP': '#55EFC4', // 薄荷绿
    
    // Sentinels (SJ) - 蓝色/灰色系
    'ISTJ': '#0984E3', // 深蓝色
    'ISFJ': '#74B9FF', // 天蓝色
    'ESTJ': '#2D3436', // 深灰色
    'ESFJ': '#636E72', // 中灰色
    
    // Explorers (SP) - 暖色系
    'ISTP': '#FDCB6E', // 金黄色
    'ISFP': '#FF6B6B', // 红色
    'ESTP': '#F39C12', // 橙色
    'ESFP': '#FD79A8'  // 粉色
  };
  return colors[type] || '#636E72';
}

