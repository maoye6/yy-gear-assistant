# UI 重构指南

## 问题总结

当前代码存在的主要问题：

1. **内联样式无法被响应式覆盖** - `style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}` 在移动端无法通过 `@media` 修改
2. **缺少统一的布局约束** - 每个组件都要重复写 `overflow: hidden; min-width: 0`
3. **样式散落各处** - 相同的磨砂玻璃效果在多个文件中重复定义
4. **z-index 混乱** - 组件层级没有统一管理

## 解决方案

### 1. 使用 CSS 变量替代硬编码值

**之前：**
```tsx
<div style={{
  background: 'rgba(255, 255, 255, 0.65)',
  borderRadius: '16px',
  padding: '20px'
}}>
```

**之后：**
```tsx
<div className="glass-card" style={{
  padding: 'var(--spacing-xl)'
}}>
```

### 2. 使用工具类替代常见布局

**之前：**
```tsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minHeight: 0
}}>
  <div style={{
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0
  }}>
```

**之后：**
```tsx
<div className="scroll-container">
  <div className="scroll-content">
```

### 3. 响应式使用 CSS 而非内联

**之前：**
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',  // ❌ 移动端无法覆盖
  gap: '4px'
}}>
```

**之后：**
```tsx
// 组件文件
<div className="five-dim-grid">

// CSS 文件
.five-dim-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-xs);
}

@media (max-width: 767px) {
  .five-dim-grid {
    grid-template-columns: repeat(2, 1fr);  // ✅ 可以覆盖
  }
}
```

### 4. 组件重构模板

每个组件应该有对应的 CSS Module：

```tsx
// EquipmentSlot.tsx
import styles from './EquipmentSlot.module.css';

export const EquipmentSlot: React.FC<Props> = ({ slot, item, onClick }) => {
  return (
    <div className={styles.slot} onClick={onClick}>
      <div className={styles.slotName}>{SLOT_NAMES[slot]}</div>
      {item ? (
        <div className={styles.affixList}>
          {/* ... */}
        </div>
      ) : (
        <div className={styles.emptyState}>{/* ... */}</div>
      )}
    </div>
  );
};
```

```css
/* EquipmentSlot.module.css */
.slot {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  min-height: 160px;
  cursor: pointer;
  background: var(--bg-glass-light);
  backdrop-filter: var(--blur-sm);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  overflow: hidden;
  min-width: 0;
}

.slot:hover {
  border-color: var(--color-primary);
  background: var(--bg-glass);
}

.slotName {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  text-align: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.affixList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow: hidden;
}

.affixRow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  overflow: hidden;
  min-width: 0;
}

.affixPosition {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  min-width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.affixName {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  flex: 1;
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.affixValue {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
  text-align: right;
}
```

## 迁移优先级

### 高优先级（立即执行）
1. ✅ 创建全局变量和工具类（已完成）
2. 重构 `EquipmentSlot.tsx` - 最多溢出问题
3. 重构 `StatsDisplay.tsx` - 五维属性响应式
4. 重构 `BuildSelector.tsx` - 心法槽位布局

### 中优先级
5. 重构 `GraduationReport.tsx` - 评分展示
6. 重构 `OptimizationSuggestions.tsx` - 优化建议
7. 重构 `OptimalBuildDisplay.tsx` - 理论最优

### 低优先级
8. 重构弹窗组件（Modal.css 已有部分）
9. 统一 z-index 层级管理
10. 添加过渡动画

## 设计原则

### 布局三要素
所有容器必须同时满足：
1. `overflow: hidden` - 防止内容溢出
2. `min-height: 0` / `min-width: 0` - 允许 flex/grid 收缩
3. `flex: 1` + `overflow-y: auto` - 内容区可滚动

### 响应式断点
```css
/* 手机 */
@media (max-width: 767px) { }

/* 平板 */
@media (min-width: 768px) and (max-width: 1199px) { }

/* 桌面 */
@media (min-width: 1200px) { }
```

### 命名规范
- 工具类：`.scroll-container`, `.flex-1`
- 组件类：`.equipment-slot`, `.affix-row`
- 修饰类：`.affix-row--full`, `.card--compact`

## 预期收益

| 指标 | 当前 | 重构后 |
|------|------|--------|
| 代码行数 | ~3000 行 | ~2000 行 (-33%) |
| 样式重复率 | ~40% | <5% |
| 响应式问题 | 频繁 | 罕见 |
| 维护成本 | 高 | 低 |
| 新增组件时间 | 2-3 小时 | 30-60 分钟 |
