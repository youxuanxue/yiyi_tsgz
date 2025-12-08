// 每日挑战题目管理

/**
 * 获取每日挑战题目
 * 根据日期生成固定题目，确保同一天所有用户看到相同题目
 */
export function getDailyChallenges() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  
  // 题目库（可以根据dayOfYear循环使用）
  const challengePool = [
    {
      id: 1,
      title: 'AI法案热点讨论',
      description: '关于新的AI监管法案，你更关注什么？',
      options: [
        {
          text: '我关注技术是否高效实现，逻辑是否严密。',
          dimension: 'T',  // 直接指定维度
          weight: 20
        },
        {
          text: '我关注法案对社区和个人的影响，是否人性化。',
          dimension: 'F',  // 直接指定维度
          weight: 20
        }
      ]
    },
    {
      id: 2,
      title: '周末计划',
      description: '你如何安排周末？',
      options: [
        {
          text: '提前制定详细的旅行日程，包括每个时间点。',
          dimension: 'J',
          weight: 15
        },
        {
          text: '只确定大方向，到时随机应变，享受未知。',
          dimension: 'P',
          weight: 15
        }
      ]
    },
    {
      id: 3,
      title: '家庭聚会',
      description: '在家庭聚会上，你更倾向于？',
      options: [
        {
          text: '积极参与讨论，主动分享想法，享受热闹氛围。',
          dimension: 'E',
          weight: 18
        },
        {
          text: '安静观察，深度思考，更喜欢一对一深入交流。',
          dimension: 'I',
          weight: 18
        }
      ]
    },
    {
      id: 4,
      title: '工作决策',
      description: '面对重要工作决策时，你更依赖？',
      options: [
        {
          text: '具体的数据、经验和可验证的事实。',
          dimension: 'S',
          weight: 20
        },
        {
          text: '直觉、可能性和未来的潜力。',
          dimension: 'N',
          weight: 20
        }
      ]
    },
    {
      id: 5,
      title: '团队冲突',
      description: '团队出现意见分歧时，你更倾向于？',
      options: [
        {
          text: '客观分析对错，基于逻辑和原则做决定。',
          dimension: 'T',
          weight: 15
        },
        {
          text: '考虑每个人的感受，寻求和谐与共识。',
          dimension: 'F',
          weight: 15
        }
      ]
    },
    {
      id: 6,
      title: '学习新技能',
      description: '学习新技能时，你更偏好？',
      options: [
        {
          text: '通过实践和动手操作来学习。',
          dimension: 'S',
          weight: 18
        },
        {
          text: '先理解理论框架，探索概念和可能性。',
          dimension: 'N',
          weight: 18
        }
      ]
    },
    {
      id: 7,
      title: '社交活动',
      description: '参加大型社交活动时，你感觉？',
      options: [
        {
          text: '充满能量，喜欢与多人互动交流。',
          dimension: 'E',
          weight: 20
        },
        {
          text: '容易疲惫，更喜欢小范围深度交流。',
          dimension: 'I',
          weight: 20
        }
      ]
    },
    {
      id: 8,
      title: '项目规划',
      description: '开始新项目时，你更倾向于？',
      options: [
        {
          text: '制定详细计划，按步骤执行，保持有序。',
          dimension: 'J',
          weight: 20
        },
        {
          text: '保持灵活性，根据情况调整，享受过程。',
          dimension: 'P',
          weight: 20
        }
      ]
    }
  ];
  
  // 根据日期选择3-5个题目
  const selectedChallenges = [];
  const numChallenges = 4; // 每天4个挑战
  
  for (let i = 0; i < numChallenges; i++) {
    const index = (dayOfYear * numChallenges + i) % challengePool.length;
    selectedChallenges.push(challengePool[index]);
  }
  
  return selectedChallenges;
}

/**
 * 获取维度标签
 */
export function getDimensionTag(option) {
  const dimNames = {
    'E': '外向倾向',
    'I': '内向倾向',
    'S': '感觉倾向',
    'N': '直觉倾向',
    'T': '思考倾向',
    'F': '情感倾向',
    'J': '判断倾向',
    'P': '感知倾向'
  };
  return dimNames[option.dimension] || '';
}

/**
 * 检查用户今天是否已完成挑战
 */
export function hasCompletedToday(userData) {
  if (!userData || !userData.challengeHistory) return false;
  
  const today = new Date().toDateString();
  const todayChallenges = userData.challengeHistory.filter(
    record => new Date(record.date).toDateString() === today
  );
  
  return todayChallenges.length > 0;
}

/**
 * 记录挑战选择
 */
export function recordChallenge(userData, challengeId, optionIndex) {
  if (!userData) return;
  
  if (!userData.challengeHistory) {
    userData.challengeHistory = [];
  }
  
  userData.challengeHistory.push({
    challengeId,
    optionIndex,
    date: new Date().toISOString()
  });
}

