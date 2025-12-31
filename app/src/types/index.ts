/**
 * 核心战斗数值类型定义
 */

// Import school types from loaders to avoid circular dependency
import type { SchoolType, SubSchoolType } from '../data/loaders';

// 1. 白字属性 (Panel Stats)
export interface PanelStats {
  // 基础五维
  constitution: number; // 体
  defense_stat: number; // 御
  agility: number; // 敏
  technique: number; // 势
  strength: number; // 劲

  // 生存属性
  hp: number; // 气血
  defense: number; // 外功防御

  // 攻击属性
  min_attack: number;
  max_attack: number;

  // 判定类 (Panel Stats)
  precision_rate: number; // 精准
  crit_rate: number; // 会心
  intent_rate: number; // 会意
  direct_crit_rate: number; // 直接会心
  direct_intent_rate: number; // 直接会意
  glance_convert_rate: number; // 擦伤转化

  // 增伤类 (百分比)
  damage_bonus_general: number; // A类 (Total)
  damage_bonus_outer: number; // 外功增伤
  damage_bonus_elemental: number; // 属攻增伤
  damage_bonus_all_martial: number; // 全部武学
  damage_bonus_specific_martial: number; // 指定武学
  damage_bonus_boss: number; // 首领增伤
  damage_bonus_skill: number;   // Legacy B
  damage_bonus_target: number;  // Legacy C
  damage_bonus_independent: number; // D类

  // 治疗/减伤
  healing_bonus_outer: number;
  healing_bonus_elemental: number;
  healing_bonus_crit: number; // 会心治疗加成
  resistance_outer: number;
  damage_reduction_outer: number;
  damage_reduction_elemental: number;

  // 奇术/玩家 (New)
  damage_bonus_magic_single: number;
  damage_bonus_magic_group: number;
  damage_bonus_player: number;

  // 暴击/会意伤害加成
  crit_damage_bonus: number;
  intent_damage_bonus: number;

  // 穿透/固伤
  defense_penetration: number; // 外功穿透
  elemental_penetration: number; // 属攻穿透
  fixed_damage: number;

  // 属性攻击 - 四流派 (Min-Max)
  min_mingjin_damage: number;  // 鸣金
  max_mingjin_damage: number;
  min_lieshi_damage: number;   // 裂石
  max_lieshi_damage: number;
  min_qiansi_damage: number;   // 牵丝
  max_qiansi_damage: number;
  min_pozhu_damage: number;    // 破竹
  max_pozhu_damage: number;

  // 无相攻击 (Min-Max) - 可自适应转化为任意属性攻击
  min_wuxiang_damage: number;
  max_wuxiang_damage: number;
}

// 2. 黄字/最终属性 (Effective Stats)
export interface EffectiveStats {
  effective_precision: number; // 黄字精准 (0-1)
  effective_crit: number; // 黄字会心 (经过Cap截断前/后) (0-1)
  effective_intent: number; // 黄字会意 (0-1)

  final_crit: number; // 最终会心 (含直接概率) (0-1)
  final_intent: number; // 最终会意 (含直接概率) (0-1)

  // 辅助状态
  is_crit_capped?: boolean;
  is_intent_capped?: boolean;
}

// 3. 装备系统定义

// 装备部位（8个主装备槽 + 2个套装槽）
export type EquipmentSlot = 'MainWeapon' | 'SubWeapon' | 'Ring' | 'Pendant' | 'Head' | 'Chest' | 'Legs' | 'Wrist';

// 套装装备槽位
export type ArmorSetSlot = 'Bow' | 'Skill';

// 套装类型
export type ArmorSetType = 'YinYu' | 'JingXian' | 'ZhuiYing' | null; // 饮羽/惊弦/追影

// 套装配置
export interface ArmorSetConfig {
  bow: ArmorSetType;
  skill: ArmorSetType;
}

// 套装加成定义
export const ARMOR_SET_BONUSES: Record<Exclude<ArmorSetType, null>, {
  name: string;
  description: string;
  bonus: Partial<PanelStats>;
}> = {
  YinYu: {
    name: '饮羽套',
    description: '精准+4.7%',
    bonus: { precision_rate: 0.047 }
  },
  JingXian: {
    name: '惊弦套',
    description: '会心+5.2%',
    bonus: { crit_rate: 0.052 }
  },
  ZhuiYing: {
    name: '追影套',
    description: '会意+2.6%',
    bonus: { intent_rate: 0.026 }
  }
};

// 词条槽位类型
export type AffixSlotType = 'Gong' | 'Shang' | 'Jue' | 'Zhi' | 'Yu' | 'DingYin';

export type StatType = keyof PanelStats | string;

// 词条定义
export interface Affix {
  name: string;
  type: StatType;
  value: number; // 实际值
  range?: [number, number]; // [Min, Max] 范围
  quality?: 'Common' | 'Rare' | 'Legendary';
}

// 单件装备定义
export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  level: number;

  // 槽位具体词条
  affix_gong: Affix[];
  affix_shang?: Affix;
  affix_jue?: Affix;
  affix_zhi?: Affix;
  affix_yu?: Affix;
  affix_dingyin?: Affix;
}

// 4. 分析与建议定义

// 评价上下文
export interface EvaluationContext {
  panelStats: PanelStats;
  effectiveStats: EffectiveStats;
  resistance: number;
  combatContext: CombatContext;
  skill: Skill;
  expectedDamage: number; // 期望伤害
}

// 属性分析项
export interface StatAnalysisItem {
  key: keyof PanelStats;
  name: string;
  current: number;      // 白字属性
  effective: number;    // 黄字属性（抗性衰减后）
  cap: number;
  efficiency: number;   // 0-1
  status: 'UnderCap' | 'NearCap' | 'OverCap' | 'Wasted';
  waste_percentage?: number;
}

// 问题检测项
export interface ProblemItem {
  type: 'Overflow' | 'Dilution' | 'Cannibalism' | 'Threshold';
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  affected_stats: string[];
  impact_value: number; // 期望伤害损失百分比
}

// 优化建议项
export interface SuggestionItem {
  priority: number; // 1-10
  category: 'Refine' | 'Replace' | 'Adjust';
  message: string;
  expected_gain: number; // % 期望伤害提升
}

// 毕业度评价报告
export interface GraduationReport {
  overall_score: number;        // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  expected_damage: number;
  stat_analysis: StatAnalysisItem[];
  problems: ProblemItem[];
  suggestions: SuggestionItem[];
  optimization_potential: number; // % 提升潜力
}

// 5. 伤害模拟相关 (New!)
export interface DamageResult {
  hitType: 'Miss' | 'Glancing' | 'Normal' | 'Crit' | 'Intent';
  damage: number;
  isPrecisionHit: boolean; // 是否精准命中
  log?: string; // 详细日志
}

export type DamageModifierType = 'Type' | 'Penetration' | 'General' | 'Skill' | 'Target' | 'Independent';

export interface CombatContext {
  attacker: PanelStats;
  defender: CombatTarget;
  skill: Skill;
  buffs: string[]; // Active buffs
}

export interface Skill {
  name: string;
  hits: number; // 段数
  multiplier_per_hit: number[]; // 每段倍率
  fixed_damage_per_hit?: number[]; // 每段固伤
  type: 'Martial' | 'Magic'; // 武学/奇术
}

export interface CombatTarget {
  level: number;
  defense: number;
  resistance_rate: number; // 判定抗性 (e.g. 0.85)
  is_boss: boolean;
}

// ==================== 6. 优化系统相关类型 ====================

/** 单个词条的优化建议（细粒度） */
export interface AffixOptimization {
  slot: EquipmentSlot;           // 装备部位
  affixSlot: AffixSlotType;      // 词条槽位（商/角/徵/羽/定音）
  currentAffix: Affix | null;    // 当前词条
  targetAffix: Affix;            // 目标词条
  expectedGain: number;          // 预期伤害提升百分比
  priority: number;              // 优先级 1-10
  type: 'Tiaolu' | 'Zhuanlv' | 'Dingyin';
  reason?: string;               // 额外说明
}

/** 装备重调建议 */
export interface EquipmentResetSuggestion {
  slot: EquipmentSlot;
  currentEfficiency: number;     // 相对效率 0-1
  threshold: number;             // 重调阈值
  recommendDirection: string;    // 建议方向
}

/** 完整的优化报告 */
export interface OptimizationReport {
  affixOptimizations: AffixOptimization[];
  resetSuggestions: EquipmentResetSuggestion[];
  totalPotential: number;        // 总体优化潜力
  gapFromOptimal: number;        // 距离理论最优的差距
}

// ==================== 7. 理论最优方案相关类型 ====================

/** 单个槽位的理论最优配置 */
export interface OptimalSlotConfig {
  slot: EquipmentSlot;
  gong: Affix[];
  shang: Affix;
  jue: Affix;
  zhi: Affix;
  yu: Affix;
  dingyin: Affix;
}

/** 理论最优方案（预计算） */
export interface OptimalBuild {
  school: SchoolType;
  subSchool: SubSchoolType;
  name: string;
  description: string;
  slots: Record<EquipmentSlot, OptimalSlotConfig>;
  expectedDamage: number;
  createdAt: string;
  version: string;
}

// ==================== 8. 词条冲突检测相关类型 ====================

/** 词条冲突检测结果 */
export interface AffixConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    slot: EquipmentSlot;
    affixSlot: AffixSlotType;
    affixName: string;
    conflictingWith: AffixSlotType[];
  }>;
}
