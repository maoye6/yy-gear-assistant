# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个用于《燕云十六声》游戏的**装备调律计算器与毕业度分析工具**（PWA 应用），使用 React + TypeScript + Vite 构建。

**核心目标**：帮助玩家计算装备搭配的毕业度，提供最优词条组合建议和伤害模拟。

---

## 常用开发命令

项目根目录为 `D:\Code\yy`，前端应用代码在 `app/` 子目录。

```bash
# 进入前端应用目录
cd app

# 安装依赖
npm install

# 启动开发服务器（HMR）
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

**注意**：所有命令都应在 `app/` 目录下执行。

---

## 项目架构

### 技术栈
- **前端框架**：React 19.2 + TypeScript 5.9
- **构建工具**：Vite 7.2
- **代码规范**：ESLint + TypeScript ESLint

### 目录结构

```
app/
├── src/
│   ├── components/          # React 组件（UI 层）
│   │   ├── AffixInput.tsx           # 词条选择/输入组件
│   │   ├── EquipmentGrid.tsx        # 装备网格展示
│   │   ├── EquipmentSlot.tsx        # 单个装备槽位
│   │   ├── StatsDisplay.tsx         # 属性展示面板
│   │   ├── BaseStatsEditor.tsx      # 基础属性编辑器
│   │   ├── SchoolSelector.tsx       # 流派选择器
│   │   ├── EquipmentEditor.tsx      # 装备编辑器
│   │   └── BuildSelector.tsx        # 配装方案选择
│   │
│   ├── core/                # 核心计算逻辑（业务层）
│   │   ├── roundTable.ts            # 圆桌判定逻辑（精准/会心/会意）
│   │   ├── formulas.ts              # 属性转化与抗性公式
│   │   ├── stats.ts                 # 属性计算与汇总
│   │   └── damage.ts                # 伤害计算管线
│   │
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts                 # 核心类型：PanelStats, EquipmentItem, DamageResult 等
│   │
│   ├── data/                # 游戏数据配置
│   │   ├── json/                    # JSON 数据文件
│   │   │   ├── affix_values.json    # 词条数值范围定义
│   │   │   ├── affix_pools.json     # 词条池（流派/部位对应关系）
│   │   │   ├── constants.json       # 游戏常量（抗性表、倍率等）
│   │   │   └── martial_arts.json    # 心法/技能数据
│   │   ├── loaders.ts               # JSON 数据加载器与类型定义
│   │   ├── affixes.ts               # 词条处理工具函数
│   │   ├── defaults.ts              # 默认配置
│   │   └── constants.ts             # 常量导出
│   │
│   ├── store/               # 状态管理
│   │   └── AppContext.tsx           # React Context（全局状态）
│   │
│   ├── main.tsx             # 应用入口
│   └── App.tsx              # 根组件
│
├── docs/                    # 游戏机制文档（知识库）
│   ├── 机制.md                      # 游戏核心机制（气竭、耐力、定音等）
│   ├── 心法系统.md                  # 心法与流派数据
│   ├── 战斗属性.md                  # 属性系统详解
│   ├── 伤害计算系统.md              # 伤害公式与圆桌判定
│   ├── 装备系统.md                  # 调律系统说明
│   ├── 技能表.md                    # 武学/奇术倍率数据
│   └── 助手开发.md                  # 原始开发方案文档
│
└── public/                   # 静态资源

```

---

## 核心概念与数据流

### 1. 属性系统（三层结构）

项目遵循游戏文档定义的三层属性体系：

**白字属性（PanelStats）**：
- 从装备、词条、心法等汇总的"面板属性"
- 定义在 `src/types/index.ts` 的 `PanelStats` 接口
- 包含：五维（体/劲/御/敏/势）、攻击、防御、精准/会心/会意、各类增伤等

**黄字属性（EffectiveStats）**：
- 经过判定抗性衰减和上限截断后的"生效属性"
- 计算公式在 `src/core/formulas.ts`：
  - 精准：`65% + (白字 - 65%) / (1 + 抗性)`
  - 会心：`Min(白字 / (1 + 抗性), 80%)`
  - 会意：`Min(白字 / (1 + 抗性), 40%)`

**最终概率**：
- 用于圆桌判定的最终数值
- 公式：`最终概率 = 黄字属性 + 直接概率`（直接概率来自心法突破）

### 2. 圆桌判定流程（`src/core/roundTable.ts`）

攻击判定的严格顺序：
1. **精准判定**：随机数 ≤ 黄字精准 → 命中，否则未命中
2. **命中判定**：挤压规则下，会意优先，会心其次
3. **未命中判定**：仍可触发会意，否则判定擦伤转化

### 3. 伤害计算管线（`src/core/damage.ts`）

最终伤害公式：
```
最终伤害 = 基底伤害 × 类型修正 × 穿透修正 × 通用增伤 × 独立增伤 × 特定增伤
```

关键函数：
- `calculateFinalDamage()`：单次判定的最终伤害
- `calculateExpectedDamage()`：期望伤害（用于优化算法，无需模拟）

### 4. 装备系统（`src/types/index.ts`）

装备槽位：8 个部位（主手、副手、戒指、佩饰、头、胸、胫、腕）

词条槽位：每件装备 5 个槽（宫/商/角/徵/羽 + 定音）

流派系统：
- 四大流派：鸣金、裂石、牵丝、破竹
- 细分流派：虹/影、威/钧、霖/玉、风/尘/鸢

### 5. 数据驱动设计

所有游戏数据存储在 `src/data/json/` 中：
- **词条池**：`affix_pools.json` 定义哪些部位的装备可以有哪些词条
- **数值范围**：`affix_values.json` 定义每个词条的数值范围
- **常量**：`constants.json` 定义抗性表、倍率、上限等

数据通过 `src/data/loaders.ts` 的类型安全函数访问。

---

## 开发注意事项

### 添加新功能时

1. **类型优先**：新功能涉及的数据结构应在 `src/types/index.ts` 中定义类型
2. **数据驱动**：如果涉及游戏数据，优先考虑在 `src/data/json/` 中添加配置
3. **核心逻辑**：计算逻辑放在 `src/core/`，UI 放在 `src/components/`

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
- 使用 CSS Modules 或 Tailwind（当前项目未指定样式方案，可自由选择）

---

## 游戏文档参考

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

## 测试与调试

当前项目未配置测试框架。

调试建议：
1. 使用浏览器开发工具的 React DevTools 检查组件状态
2. 在 `src/core/` 的计算函数中添加 `console.log` 验证中间结果
3. 使用 `calculateExpectedDamage()` 验证伤害期望值的正确性（对比游戏内实测数据）

---

## 部署计划

根据 `docs/助手开发.md`，项目计划：
1. **PWA 化**：添加 Service Worker 支持离线使用
2. **GitHub Pages 部署**：静态托管
3. **全平台打包**：
   - 桌面：使用 PakePlus
   - 移动：使用 WebView 包装（如"一门APP"）

---

## 其他

- 项目使用 Vite 的 React 插件，支持 Fast Refresh
- ESLint 配置在 `app/eslint.config.js`
- TypeScript 配置在 `app/tsconfig.json` 和 `app/tsconfig.app.json`
- 当前未配置 React Compiler（可考虑添加以优化性能）
