# 哟哟MBTI - 动态性格测试H5应用

一款创新的H5 Web应用，通过模拟社交互动，实时、动态地展示和分析用户的MBTI性格倾向。

## 🎯 核心特性

- **实时动态MBTI**：性格不再是静态标签，而是根据行为实时变化
- **每日社交挑战**：通过热点新闻和生活情境的选择来探索性格倾向
- **四维度可视化**：E/I、S/N、T/F、J/P 四个维度的实时展示和历史趋势
- **每周统计报告**：自动统计本周主要类型和类型分布
- **性格雷达图**：直观展示当前性格特征
- **每周回归调整**：防止得分无限累积，体现长期变化

## 🛠️ 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器
- **Canvas API** - 图表绘制
- **LocalStorage** - 本地数据存储

## 📦 项目结构

```
yiyi_tsgz/
├── index.html              # HTML入口
├── vite.config.js          # Vite配置
├── package.json            # 项目配置
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件
│   ├── style.css           # 全局样式
│   ├── pages/              # 页面组件
│   │   ├── Index.vue       # 主页
│   │   ├── Challenge.vue   # 挑战页面
│   │   ├── Statistics.vue  # 统计页面
│   │   └── Profile.vue     # 个人设置
│   ├── utils/              # 工具函数
│   │   ├── mbtiEngine.js   # MBTI核心引擎
│   │   └── challenges.js   # 挑战题目管理
│   └── composables/        # 组合式函数
│       └── useUserData.js  # 用户数据管理
└── dist/                   # 构建输出目录
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 3. 构建生产版本

```bash
npm run build
```

构建文件将输出到 `dist/` 目录

### 4. 预览生产版本

```bash
npm run preview
```

## 📱 功能模块

### 1. 主页（Index）
- 展示用户形象和当前MBTI类型
- 四维度得分可视化
- 本周主要类型预览
- 快速入口

### 2. 每日挑战（Challenge）
- 每日4个热点情境挑战
- A/B选项选择
- 实时更新维度得分
- 类型切换动画提示

### 3. 统计中心（Statistics）
- 本周主要类型和分布
- 四维度历史趋势图表
- 性格雷达图
- 分享功能

### 4. 个人设置（Profile）
- 形象选择
- 初始MBTI类型设置
- 数据重置功能

## 🛠️ 核心机制

### 维度计分模型
- 四大轴线：E/I、S/N、T/F、J/P
- 分值范围：-100 到 +100
- I、N、F、P 对应负值
- E、S、T、J 对应正值

### 选择权重分配
每个挑战选项都有明确的维度倾向和权重：
- 维度：影响哪个轴线（EI/SN/TF/JP）
- 权重：影响程度（15-20分）
- 方向：正向（+1）或负向（-1）

### 类型切换规则
- 实时切换：任意轴线跨越中轴线（0点）时立即切换
- 每周回归：每周自动微调8%回归初始值

## 📝 数据存储

使用浏览器 LocalStorage 保存用户数据：

```javascript
{
  avatar: '👤',
  initialMBTI: 'INFP',
  currentMBTI: 'INFP',
  dimensions: {
    EI: -50,
    SN: -50,
    TF: -50,
    JP: -50
  },
  typeHistory: [],
  challengeHistory: [],
  lastRegressionDate: '2024-01-01',
  weeklyStats: {}
}
```

## 🎨 设计风格

- 清新简约的扁平化设计
- 渐变色彩体系
- 流畅的动画效果
- 响应式布局（支持移动端和桌面端）

## 🌐 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 📄 许可证

MIT License
