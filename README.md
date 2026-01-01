# 燕云十六声装备助手

<div align="center">

**一款专业的《燕云十六声》装备调律计算器与毕业度分析工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)](https://vite.dev/)

[在线体验](https://yourusername.github.io/yy-gear-assistant/) • [功能特性](#功能特性) • [快速开始](#快速开始) • [开发指南](#开发指南)

</div>

---

## 📖 项目简介

这是一个为《燕云十六声》游戏玩家设计的**装备调律计算器与毕业度分析工具**（PWA 应用），帮助玩家：

- 🔢 **精确计算**装备搭配的毕业度评分（S/A/B/C/D 等级）
- 🎯 **优化建议**基于词条虚拟替换算法，提供最优词条组合推荐
- 📊 **伤害模拟**完整的圆桌判定与伤害计算管线
- 🏹 **流派支持**九大细分流派（鸣金/裂石/牵丝/破竹及其子流派）

### 核心特色

- ✅ **数据驱动架构**：所有游戏数据存储在 JSON 配置文件中，版本更新无需改代码
- ✅ **三层属性体系**：精确还原游戏的白字/黄字/最终概率机制
- ✅ **智能优化算法**：基于解析式期望伤害计算的虚拟替换算法
- ✅ **精美 UI 设计**：Apple 风格玻璃拟态 + 流派专属色主题
- ✅ **全平台部署**：Web（GitHub Pages）+ 桌面（PakePlus）+ 移动（WebView）

---

## 🎯 功能特性

### 1. 装备管理系统

#### 8 个装备槽位
- 主手、副手、戒指、佩饰
- 头、胸、胫、腕

#### 6 个词条槽位（每件装备）
- 宫、商、角、徵、羽 + 定音
- 支持词条冲突检测
- 流派专属词条池自动加载

#### 心法配置
- 4 个心法槽位
- 支持流派专属心法 + 通用心法
- 自动计算心法加成属性

#### 套装系统
- 饮羽套装（弓）
- 惊弦套装（诀）
- 追影套装
- 自动同步弓/诀套装选择

### 2. 属性计算系统

#### 五维属性转化
- **体** → 气血（1 体 = 60 气血）
- **御** → 防御（1 御 = 20 防御）
- **敏** → 会心（1 敏 = 0.2% 会心）
- **势** → 会意（1 势 = 0.2% 会意）
- **劲** → 攻击（1 劲 = 0.8 攻击）

#### 三层属性体系
```
白字属性（面板属性）
    ↓ 抗性衰减 + 上限截断
黄字属性（生效属性）
    ↓ + 直接概率（心法突破）
最终概率（圆桌判定）
```

**核心公式**：
- **精准**：`65% + (白字精准 - 65%) / (1 + 抗性)`（基数保留机制）
- **会心**：`Min(白字会心 / (1 + 抗性), 80%)`（全额衰减 + 上限）
- **会意**：`Min(白字会意 / (1 + 抗性), 40%)`（全额衰减 + 上限）

### 3. 伤害计算管线

#### 圆桌判定流程
```
Step 1: 精准判定
  ├─ R1 ≤ 黄字精准 → 命中 → Step 2
  └─ R1 > 黄字精准 → 未命中 → Step 3

Step 2: 命中判定（挤压规则：会意优先）
  ├─ R2 < 最终会意 → 会意命中
  ├─ R2 < 最终会意 + 最终会心 → 会心命中
  └─ 否则 → 白字命中

Step 3: 未命中判定
  ├─ R3a < 最终会意 → 会意命中（无视精准）
  ├─ R3b < 擦伤转化率 → 白字命中（转化）
  └─ 否则 → 擦伤
```

#### 最终伤害公式
```
最终伤害 = 基底伤害 × 类型修正 × 穿透修正 × 通用增伤 × 独立增伤 × 特定增伤
```

**类型修正**：
- 会意：1.35 + 会意伤害加成
- 会心：1.50 + 会心伤害加成
- 擦伤：0.5
- 白字：1.0

#### 期望伤害计算
解析式计算，无需蒙特卡洛模拟：
```
E = P(会意)×D(会意) + P(会心)×D(会心) + P(白字)×D(白字) + P(擦伤)×D(擦伤)
```

### 4. 毕业度评价系统

#### 四维度检测
1. **溢出检测**：会心 > 80% 或 会意 > 40%
2. **稀释效应**：攻击力过高但增伤过低
3. **圆桌反噬**：会意挤压会心导致负收益
4. **阈值机会**：穿透接近阈值、精准接近满值

#### 评分等级
- **S**：≥95 分（完美毕业）
- **A**：≥85 分（优秀）
- **B**：≥70 分（良好）
- **C**：≥50 分（及格）
- **D**：<50 分（需优化）

### 5. 优化建议系统

#### 虚拟替换算法
1. 遍历每个装备的每个槽位
2. 从流派专属的转律词条池中筛选候选
3. 虚拟替换并重新计算面板属性
4. 计算期望伤害变化
5. 按收益排序返回 Top-K 建议

#### 输出格式
```typescript
{
  槽位: "主手",
  当前词条: "最大外攻 +45.3",
  目标词条: "最大外攻 +90.6",
  预期收益: "+3.2%",
  优先级: 8
}
```

### 6. 理论最优方案展示
- 预计算的流派最优配装（来自 `optimal_builds.json`）
- 对比当前配置与理论最优方案
- 计算效率评分（当前期望伤害 / 理论最优期望伤害）

---

## 🛠️ 技术栈

### 前端框架
- **React 19.2**：UI 框架
- **TypeScript 5.9**：类型安全
- **Vite 7.2**：构建工具（极速 HMR）

### 状态管理
- **React Context API**：全局状态管理
- **自动计算派生状态**：状态变化自动触发面板重算

### 样式方案
- **CSS Modules**：模块化样式
- **CSS Variables**：设计系统（颜色、间距、字体）
- **玻璃拟态设计**：backdrop-filter 毛玻璃效果

### 数据可视化
- **Recharts 3.6**：图表库（属性对比、伤害分析）

### 代码规范
- **ESLint** + **TypeScript ESLint**：代码检查
- **严格模式**：`noUnusedLocals`、`noUnusedParameters` 启用

### 部署方案
- **GitHub Pages**：静态托管（免费）
- **gh-pages**：自动部署
- **PWA 计划中**：Service Worker + Manifest

---

## 📦 快速开始

### 环境要求

- **Node.js**：≥ 18.0.0
- **npm**：≥ 9.0.0
- **操作系统**：Windows / macOS / Linux

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/yy-gear-assistant.git
cd yy-gear-assistant

# 2. 进入前端应用目录
cd app

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器访问
# 通常为 http://localhost:5173
```

### 其他命令

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 部署到 GitHub Pages
npm run deploy
```

---

## 📁 项目结构

```
yy-gear-assistant/
├── app/                          # 前端应用（React + Vite）
│   ├── src/
│   │   ├── components/           # UI 组件层（15 个组件）
│   │   │   ├── BuildSelector.tsx         # 流派与心法选择器
│   │   │   ├── EquipmentEditor.tsx       # 装备编辑器（弹窗）
│   │   │   ├── EquipmentGrid.tsx         # 装备网格展示
│   │   │   ├── EquipmentSlot.tsx         # 单个装备槽位
│   │   │   ├── AffixInput.tsx            # 词条选择器
│   │   │   ├── StatsDisplay.tsx          # 属性面板
│   │   │   ├── BaseStatsEditor.tsx       # 基础属性编辑器
│   │   │   ├── GraduationReport.tsx      # 毕业度评价报告
│   │   │   ├── OptimizationSuggestions.tsx # 优化建议
│   │   │   ├── OptimalBuildDisplay.tsx   # 理论最优方案展示
│   │   │   └── ...
│   │   │
│   │   ├── core/                 # 核心计算逻辑（7 个模块）
│   │   │   ├── stats.ts              # 属性汇总（五维转化+装备+心法）
│   │   │   ├── formulas.ts           # 核心转化与抗性公式
│   │   │   ├── roundTable.ts         # 圆桌判定逻辑
│   │   │   ├── damage.ts             # 伤害计算管线
│   │   │   ├── evaluation.ts         # 毕业度评价算法
│   │   │   ├── optimization.ts       # 优化建议生成
│   │   │   ├── techniques.ts         # 心法属性计算
│   │   │   └── affixConflict.ts      # 词条冲突检测
│   │   │
│   │   ├── data/                 # 数据驱动层
│   │   │   ├── loaders.ts            # JSON 数据加载器（类型安全）
│   │   │   ├── affixes.ts            # 词条数据库（基于 JSON）
│   │   │   ├── constants.ts          # 常量导出
│   │   │   ├── defaults.ts           # 默认配置（裸装属性）
│   │   │   ├── terminology.ts        # 中文属性名称映射
│   │   │   └── json/
│   │   │       ├── affix_values.json       # 词条数值范围
│   │   │       ├── affix_pools.json        # 词条池配置
│   │   │       ├── constants.json          # 游戏常量
│   │   │       ├── martial_arts.json       # 心法数据
│   │   │       ├── optimal_builds.json     # 理论最优方案
│   │   │       └── terminology.json        # 属性术语
│   │   │
│   │   ├── types/                # TypeScript 类型定义
│   │   │   └── index.ts             # 核心类型（300+ 行）
│   │   │
│   │   ├── store/                # 全局状态管理
│   │   │   └── AppContext.tsx       # React Context
│   │   │
│   │   ├── styles/               # 设计系统
│   │   │   ├── variables.css         # CSS 变量（颜色/间距/字体）
│   │   │   └── utilities.css         # 工具类
│   │   │
│   │   ├── App.tsx               # 根组件（Grid 布局）
│   │   └── main.tsx              # 应用入口
│   │
│   ├── docs/                    # 游戏机制文档（知识库）
│   │   ├── 机制.md                     # 游戏核心机制
│   │   ├── 心法系统.md                 # 心法与流派数据
│   │   ├── 战斗属性.md                 # 属性系统详解
│   │   ├── 伤害计算系统.md             # 伤害公式与圆桌判定
│   │   ├── 装备系统.md                 # 调律系统说明
│   │   ├── 技能表.md                   # 武学/奇术倍率数据
│   │   └── 助手开发.md                 # 原始开发方案文档
│   │
│   ├── public/                  # 静态资源
│   ├── index.html              # HTML 入口
│   ├── vite.config.ts          # Vite 配置
│   ├── tsconfig.json           # TypeScript 配置
│   └── package.json            # 依赖管理
│
└── README.md                   # 项目说明
```

---

## 🚀 开发指南

### 添加新功能时

#### 1. 类型优先
新功能涉及的数据结构应在 `src/types/index.ts` 中定义类型：

```typescript
// 示例：新增属性类型
export interface NewAttribute {
  id: string;
  name: string;
  value: number;
}
```

#### 2. 数据驱动
如果涉及游戏数据，优先考虑在 `src/data/json/` 中添加配置：

```json
// 示例：在 affix_values.json 中添加新词条
{
  "new_affix": {
    "name": "新词条",
    "category": "attack",
    "ranges": {
      "tuning": { "min": 10, "max": 20 }
    }
  }
}
```

#### 3. 核心逻辑
计算逻辑放在 `src/core/`，UI 放在 `src/components/`：

```
src/
├── core/
│   └── newCalculation.ts      # 新的计算逻辑
└── components/
    └── NewFeature.tsx          # 新的 UI 组件
```

### 修改伤害计算时

1. 参考 `docs/伤害计算系统.md` 确保公式准确
2. 同时更新 `calculateFinalDamage()` 和 `calculateExpectedDamage()` 保持一致
3. 在 `src/core/formulas.ts` 中添加新的转化公式

### 添加新词条时

1. 在 `src/data/json/affix_values.json` 中添加词条定义（名称、分类、数值范围）
2. 在 `src/data/json/affix_pools.json` 中将词条分配到对应池（初始/调律/转律/稀有/定音）
3. 如需特殊处理，在 `src/data/affixes.ts` 中添加工具函数

### UI 开发时

- 使用 React Context (`src/store/AppContext.tsx`) 管理全局状态
- 组件应接收类型明确的 props（参考现有组件的写法）
- 使用 CSS Modules（已配置）避免样式冲突
- 遵循设计系统（`src/styles/variables.css`）

### 游戏文档参考

实现功能时，务必参考 `docs/` 目录下的游戏机制文档：

| 文档 | 内容 |
|------|------|
| `机制.md` | 游戏核心机制（气竭、耐力、定音、DOT 等） |
| `心法系统.md` | 各流派心法与属性增益 |
| `战斗属性.md` | 属性系统定义与抗性表 |
| `伤害计算系统.md` | 伤害公式与圆桌判定流程 |
| `装备系统.md` | 调律系统与词条池 |
| `技能表.md` | 武学/奇术倍率数据 |

**重要**：实现涉及伤害计算的功能时，必须阅读 `伤害计算系统.md` 确保理解三层属性结构和圆桌判定逻辑。

---

## 📊 核心算法详解

### 1. 三层属性体系

```typescript
// 白字属性（面板属性）
interface PanelStats {
  precision: number;      // 精准（%）
  critRate: number;       // 会心（%）
  lethalRate: number;     // 会意（%）
  // ... 其他属性
}

// 黄字属性（生效属性）
interface EffectiveStats {
  precision: number;      // 经过抗性衰减
  critRate: number;       // 经过抗性衰减 + 上限截断
  lethalRate: number;     // 经过抗性衰减 + 上限截断
}

// 最终概率（圆桌判定）
interface FinalStats {
  precision: number;      // 黄字精准 + 直接概率
  critRate: number;       // 黄字会心 + 直接概率
  lethalRate: number;     // 黄字会意 + 直接概率
}
```

### 2. 圆桌判定实现

```typescript
// src/core/roundTable.ts
export function rollTable(finalStats: FinalStats): HitType {
  const r1 = random(); // 精准判定
  if (r1 <= finalStats.precision) {
    // 命中判定（会意挤压会心）
    const r2 = random();
    if (r2 < finalStats.lethalRate) return HitType.LETHAL;
    if (r2 < finalStats.lethalRate + finalStats.critRate) return HitType.CRIT;
    return HitType.NORMAL;
  } else {
    // 未命中判定（会意无视精准）
    const r3a = random();
    if (r3a < finalStats.lethalRate) return HitType.LETHAL;

    const r3b = random();
    if (r3b < glancingRate) return HitType.NORMAL; // 擦伤转化
    return HitType.GLANCING;
  }
}
```

### 3. 期望伤害计算

```typescript
// src/core/damage.ts
export function calculateExpectedDamage(
  panelStats: PanelStats,
  effectiveStats: EffectiveStats,
  finalStats: FinalStats
): number {
  // 计算各判定分支的概率
  const P_lethal = calculateP_Lethal(finalStats);
  const P_crit = calculateP_Crit(finalStats);
  const P_normal = calculateP_Normal(finalStats);
  const P_glancing = calculateP_Glancing(finalStats);

  // 计算各判定分支的伤害
  const D_lethal = calculateDamageByType(panelStats, HitType.LETHAL);
  const D_crit = calculateDamageByType(panelStats, HitType.CRIT);
  const D_normal = calculateDamageByType(panelStats, HitType.NORMAL);
  const D_glancing = calculateDamageByType(panelStats, HitType.GLANCING);

  // 期望伤害 = Σ(概率 × 伤害)
  return (
    P_lethal * D_lethal +
    P_crit * D_crit +
    P_normal * D_normal +
    P_glancing * D_glancing
  );
}
```

### 4. 优化建议算法

```typescript
// src/core/optimization.ts
export function generateOptimizationSuggestions(
  currentEquipment: EquipmentItem[],
  subSchool: SubSchoolType
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // 遍历每个装备的每个槽位
  currentEquipment.forEach((equip, equipIndex) => {
    Object.keys(equip.affixes).forEach((slot) => {
      // 获取当前词条
      const currentAffix = equip.affixes[slot];
      if (!currentAffix) return;

      // 从流派专属词条池筛选候选
      const candidates = getAffixPoolForSlot(
        equip.slot,
        slot,
        subSchool,
        'transposition'
      );

      // 虚拟替换并计算收益
      candidates.forEach((candidate) => {
        const virtualEquipment = virtualReplaceAffix(
          currentEquipment,
          equipIndex,
          slot,
          candidate
        );

        const currentDamage = calculateExpectedDamage(/* 当前配置 */);
        const newDamage = calculateExpectedDamage(/* 虚拟配置 */);
        const improvement = (newDamage - currentDamage) / currentDamage;

        if (improvement > 0.01) { // 收益 > 1%
          suggestions.push({
            equipmentSlot: equip.slot,
            affixSlot: slot,
            currentAffix: currentAffix.name,
            targetAffix: candidate.name,
            expectedImprovement: improvement,
            priority: Math.floor(improvement * 1000),
          });
        }
      });
    });
  });

  // 按收益排序，返回 Top-K
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);
}
```

---

## 🎨 设计系统

### 颜色系统

```css
/* 主色调（Apple 风格）*/
--color-primary: #0071e3;

/* 流派色 */
--color-mingjin: #f59e0b;  /* 鸣金 - 金色 */
--color-lieshi: #ef4444;    /* 裂石 - 红色 */
--color-qiansi: #06b6d4;    /* 牵丝 - 青色 */
--color-pozhu: #8b5cf6;     /* 破竹 - 紫色 */

/* 评分等级色 */
--color-grade-s: linear-gradient(135deg, #f59e0b, #ef4444);
--color-grade-a: linear-gradient(135deg, #f59e0b, #f97316);
--color-grade-b: linear-gradient(135deg, #10b981, #84cc16);
--color-grade-c: linear-gradient(135deg, #3b82f6, #06b6d4);
--color-grade-d: linear-gradient(135deg, #6b7280, #9ca3af);

/* 玻璃拟态 */
--bg-glass: rgba(255, 255, 255, 0.65);
--blur-md: blur(20px);
```

### 间距与圆角

```css
/* 间距 */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;

/* 圆角 */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
```

### 字体系统

```css
--font-size-xs: 0.7rem;   /* 标签、徽章 */
--font-size-sm: 0.8rem;   /* 次要内容 */
--font-size-md: 0.85rem;  /* 正文 */
--font-size-lg: 0.9rem;   /* 主要内容 */
--font-size-xl: 1.1rem;   /* 小标题 */
--font-size-2xl: 1.2rem;  /* 标题 */
--font-size-3xl: 1.3rem;  /* 主标题 */
```

---

## 📦 部署方案

### GitHub Pages 部署

项目已配置 `gh-pages` 自动部署：

```bash
# 1. 构建并部署到 GitHub Pages
npm run deploy

# 2. 访问 https://yourusername.github.io/yy-gear-assistant/
```

**配置说明**：
- `vite.config.ts` 中的 `base: '/yy-gear-assistant/'` 适配 GitHub Pages 路径
- `package.json` 中的 `deploy` 脚本自动运行 `gh-pages -d app/dist`

### PWA 化（计划中）

添加 Service Worker 支持离线使用：

```typescript
// main.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

添加 `manifest.json` 支持添加到主屏幕：

```json
{
  "name": "燕云十六声装备助手",
  "short_name": "燕云装备助手",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0071e3",
  "icons": [...]
}
```

### 桌面应用打包（计划中）

使用 [PakePlus](https://github.com/tw93/PakePlus) 打包：

```bash
# 安装 PakePlus
npm install -g pakeplus

# 打包为桌面应用（Windows/Mac/Linux）
pakeplus https://yourusername.github.io/yy-gear-assistant/
```

**优势**：
- 5MB 轻量应用（基于 Rust + Tauri）
- 自动更新（推送后用户下次启动自动更新）
- 跨平台（Windows/Mac/Linux）

### 移动应用打包（计划中）

使用 WebView 包装（如"一门APP"）：

1. 打开"一门APP"网站
2. 输入 PWA URL
3. 配置应用名称、图标、启动页
4. 生成 APK / IPA 文件

---

## 🧪 测试与调试

### 当前测试覆盖

- ⚠️ **单元测试**：未配置
- ⚠️ **集成测试**：未配置
- ⚠️ **E2E 测试**：未配置

### 调试建议

1. **使用浏览器开发工具**
   - React DevTools 检查组件状态
   - Console 查看计算日志

2. **在核心函数中添加日志**
   ```typescript
   // src/core/damage.ts
   export function calculateExpectedDamage(...) {
     console.log('面板属性:', panelStats);
     console.log('生效属性:', effectiveStats);
     console.log('最终概率:', finalStats);
     // ...
   }
   ```

3. **验证核心公式**
   - 使用 `calculateExpectedDamage()` 计算期望伤害
   - 对比游戏内实测数据
   - 检查三层属性转换是否正确

### 计划添加测试框架

推荐使用 [Vitest](https://vitest.dev/)（Vite 原生支持）：

```bash
# 安装 Vitest
npm install -D vitest

# 添加测试脚本
# package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

示例测试用例：

```typescript
// src/core/__tests__/damage.test.ts
import { describe, it, expect } from 'vitest';
import { calculateExpectedDamage } from '../damage';

describe('伤害计算', () => {
  it('应该正确计算期望伤害', () => {
    const panelStats = {
      attack: 1000,
      precision: 75,
      critRate: 50,
      lethalRate: 20,
      // ...
    };

    const expectedDamage = calculateExpectedDamage(panelStats, /* ... */);

    expect(expectedDamage).toBeGreaterThan(0);
    expect(expectedDamage).toBeLessThan(10000);
  });
});
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 提交 Pull Request

### 代码规范

- 遵循 ESLint 配置（`npm run lint` 检查）
- 使用 TypeScript 类型定义
- 添加必要的注释（特别是核心算法）
- 遵循现有代码风格

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 添加新功能
fix: 修复 Bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
perf: 性能优化
test: 添加测试
chore: 构建/工具链更新
```

---

## 📝 待办事项

- [ ] 完善定音词条池（`getDingyinPool` 完整实现）
- [ ] 添加 PWA 特性（Service Worker + Manifest）
- [ ] 数据持久化（LocalStorage 保存配置）
- [ ] 自动化最优方案生成（遗传算法/模拟退火）
- [ ] 性能优化（增量计算、Web Worker）
- [ ] 添加单元测试（Vitest）
- [ ] 国际化支持（i18next）
- [ ] 配装分享功能
- [ ] 方案对比功能
- [ ] 移动端适配测试

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

- 《燕云十六声》游戏开发团队
- React / TypeScript / Vite 开发团队
- 所有贡献者和使用者

---

## 📮 联系方式

- **GitHub Issues**：[提交问题](https://github.com/yourusername/yy-gear-assistant/issues)
- **邮箱**：your@email.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [Your Name]

</div>
