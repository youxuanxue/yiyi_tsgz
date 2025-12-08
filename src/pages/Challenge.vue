<template>
  <div class="container">
    <div class="header">
      <h1 class="title">每日挑战</h1>
      <p class="subtitle">通过选择来探索你的性格倾向</p>
    </div>

    <!-- 挑战列表 -->
    <div class="challenge-list" v-if="challenges.length > 0">
      <div class="challenge-card" v-for="(challenge, idx) in challenges" :key="challenge.id">
        <div class="challenge-header">
          <span class="challenge-number">挑战 {{ idx + 1 }}</span>
          <span class="challenge-title">{{ challenge.title }}</span>
        </div>
        <div class="challenge-description">{{ challenge.description }}</div>
        
        <div class="options">
          <div 
            v-for="(option, optIdx) in challenge.options" 
            :key="optIdx"
            class="option"
            :class="{ selected: selectedOptions[idx] === optIdx }"
            @click="selectOption(idx, optIdx)"
          >
            <div class="option-content">
              <span class="option-text">{{ option.text }}</span>
              <span class="option-tag" v-if="option.dimensionTag">
                {{ option.dimensionTag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section" v-if="challenges.length > 0">
      <button 
        class="btn btn-primary" 
        @click="submitChallenges"
        :disabled="!allSelected"
      >
        提交挑战
      </button>
    </div>

    <!-- 已完成提示 -->
    <div class="completed-card" v-if="completed">
      <span class="completed-icon">✅</span>
      <span class="completed-text">今日挑战已完成！</span>
      <span class="completed-hint">明天再来探索新的挑战吧~</span>
    </div>

    <!-- 结果弹窗 -->
    <div class="result-modal" v-if="showResult" @click="closeResult">
      <div class="result-content" @click.stop>
        <div class="result-icon" v-if="resultTypeChanged">🎉</div>
        <div class="result-title" v-if="resultTypeChanged">
          你的性格类型发生了变化！
        </div>
        <div class="result-title" v-else>
          选择已记录
        </div>
        <div class="result-mbti" v-if="resultTypeChanged">
          <span class="result-old-type">{{ resultOldType }}</span>
          <span class="result-arrow">→</span>
          <span class="result-new-type" :style="{ color: resultNewTypeColor }">
            {{ resultNewType }}
          </span>
        </div>
        <button class="btn btn-primary" @click="closeResult">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDailyChallenges, getDimensionTag, hasCompletedToday, recordChallenge } from '../utils/challenges'
import { updateDimensions } from '../utils/mbtiEngine'
import { getMBTIColor } from '../utils/mbtiEngine'
import { useUserData } from '../composables/useUserData'

const { getUserData, updateUserData, saveUserData } = useUserData()

const challenges = ref([])
const selectedOptions = ref({})
const completed = ref(false)
const showResult = ref(false)
const resultTypeChanged = ref(false)
const resultOldType = ref('')
const resultNewType = ref('')
const resultNewTypeColor = ref('')

const allSelected = computed(() => {
  return challenges.value.every((challenge, index) => selectedOptions.value[index] !== undefined)
})

onMounted(() => {
  loadChallenges()
  checkCompleted()
})

const loadChallenges = () => {
  const dailyChallenges = getDailyChallenges()
  // 为每个选项添加维度标签
  const challengesWithTags = dailyChallenges.map(challenge => ({
    ...challenge,
    options: challenge.options.map(option => ({
      ...option,
      dimensionTag: getDimensionTag(option)
    }))
  }))
  challenges.value = challengesWithTags
  selectedOptions.value = {}
}

const checkCompleted = () => {
  const userData = getUserData()
  completed.value = hasCompletedToday(userData)
}

const selectOption = (challengeIndex, optionIndex) => {
  selectedOptions.value[challengeIndex] = optionIndex
}

const submitChallenges = () => {
  if (!allSelected.value) {
    alert('请完成所有挑战')
    return
  }

  const userData = getUserData()
  let typeChanged = false
  let oldType = ''
  let newType = ''
  let newTypeColor = ''

  // 处理每个选择
  challenges.value.forEach((challenge, index) => {
    const optionIndex = selectedOptions.value[index]
    const option = challenge.options[optionIndex]
    
    // 记录挑战
    recordChallenge(userData, challenge.id, optionIndex)
    
      // 更新维度（新格式：直接指定维度，如 'E', 'I', 'S', 'N' 等）
      const result = updateDimensions({
        dimension: option.dimension,
        weight: option.weight
      }, userData)
    
    if (result && result.typeChanged) {
      typeChanged = true
      oldType = result.oldType
      newType = result.newType
      newTypeColor = getMBTIColor(newType)
    }
  })

  // 保存数据
  saveUserData(userData)

  // 标记为已完成
  completed.value = true

  // 显示结果
  if (typeChanged) {
    resultTypeChanged.value = true
    resultOldType.value = oldType
    resultNewType.value = newType
    resultNewTypeColor.value = newTypeColor
  } else {
    resultTypeChanged.value = false
  }
  
  showResult.value = true
}

const closeResult = () => {
  showResult.value = false
}
</script>

<style scoped>
.header {
  margin-bottom: 40px;
}

.challenge-list {
  margin-bottom: 40px;
}

.challenge-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.challenge-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.challenge-number {
  background: #6C5CE7;
  color: #FFFFFF;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  margin-right: 20px;
}

.challenge-title {
  font-size: 24px;
  font-weight: 600;
  color: #2D3436;
}

.challenge-description {
  font-size: 18px;
  color: #636E72;
  margin-bottom: 30px;
  line-height: 1.6;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option {
  border: 3px solid #E9ECEF;
  border-radius: 16px;
  padding: 30px;
  transition: all 0.3s;
  background: #FFFFFF;
  cursor: pointer;
}

.option:hover {
  border-color: #6C5CE7;
  background: #F8F9FF;
}

.option.selected {
  border-color: #6C5CE7;
  background: #F8F9FF;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-text {
  font-size: 18px;
  color: #2D3436;
  line-height: 1.6;
}

.option-tag {
  display: inline-block;
  background: #E9ECEF;
  color: #6C5CE7;
  padding: 6px 16px;
  border-radius: 12px;
  font-size: 14px;
  align-self: flex-start;
}

.option.selected .option-tag {
  background: #6C5CE7;
  color: #FFFFFF;
}

.submit-section {
  position: sticky;
  bottom: 80px;
  padding: 20px 0;
  background: #FFFFFF;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.completed-card {
  text-align: center;
  padding: 100px 40px;
}

.completed-icon {
  font-size: 80px;
  display: block;
  margin-bottom: 30px;
}

.completed-text {
  font-size: 24px;
  font-weight: 600;
  color: #2D3436;
  display: block;
  margin-bottom: 20px;
}

.completed-hint {
  font-size: 18px;
  color: #636E72;
  display: block;
}

.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.result-content {
  background: #FFFFFF;
  border-radius: 30px;
  padding: 60px 40px;
  margin: 40px;
  text-align: center;
  max-width: 500px;
}

.result-icon {
  font-size: 80px;
  margin-bottom: 30px;
}

.result-title {
  font-size: 24px;
  font-weight: 600;
  color: #2D3436;
  margin-bottom: 30px;
}

.result-mbti {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  font-size: 36px;
  font-weight: 700;
}

.result-old-type {
  color: #636E72;
}

.result-arrow {
  color: #6C5CE7;
}

.result-new-type {
  color: #6C5CE7;
}
</style>

