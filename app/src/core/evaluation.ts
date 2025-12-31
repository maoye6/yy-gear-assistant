/**
 * 装备毕业度评价模块
 * Based on Docs 燕云调律好坏评价.md
 *
 * 核心评估标准：单次伤害期望 (Expected Damage per Hit)
 * E = P_会意 × D_会意 + P_会心 × D_会心 + P_白字 × D_白字 + P_擦伤 × D_擦伤
 */

import type {
  PanelStats,
  EffectiveStats,
  EvaluationContext,
  GraduationReport,
  StatAnalysisItem,
  ProblemItem,
  SuggestionItem
} from '../types';
import { calculateExpectedDamage } from './damage';
import { CAP_CRIT, CAP_INTENT } from './formulas';
import { GameConstants } from '../data/loaders';

// ==========================
// 常量定义 - 从GameConstants获取
// ==========================

const CRIT_RATE_PER_GOLD_AFFIX = GameConstants.evaluation.goldAffixValues.critRate;
const INTENT_RATE_PER_GOLD_AFFIX = GameConstants.evaluation.goldAffixValues.intentRate;
const MAX_ATTACK_PER_GOLD_AFFIX = GameConstants.evaluation.goldAffixValues.maxAttack;

const GRADE_THRESHOLDS = {
  S: 95,
  A: 85,
  B: 70,
  C: 50
};

// 属性名称映射（用于显示）
const STAT_NAMES: Record<keyof PanelStats, string> = {
  constitution: '体质',
  defense_stat: '御力',
  agility: '敏捷',
  technique: '势',
  strength: '劲',
  hp: '气血',
  defense: '外功防御',
  min_attack: '最小外功',
  max_attack: '最大外功',
  precision_rate: '精准率',
  crit_rate: '会心率',
  intent_rate: '会意率',
  direct_crit_rate: '直接会心',
  direct_intent_rate: '直接会意',
  glance_convert_rate: '擦伤转化率',
  damage_bonus_general: '通用增伤',
  damage_bonus_outer: '外功增伤',
  damage_bonus_elemental: '属攻增伤',
  damage_bonus_all_martial: '全部武学增效',
  damage_bonus_specific_martial: '指定武学增效',
  damage_bonus_boss: '首领增伤',
  damage_bonus_skill: '武学增效',
  damage_bonus_target: '对象增伤',
  damage_bonus_independent: '独立增伤',
  healing_bonus_outer: '外功治疗',
  healing_bonus_elemental: '属攻治疗',
  healing_bonus_crit: '会心治疗',
  resistance_outer: '外功抗性',
  damage_reduction_outer: '外功减伤',
  damage_reduction_elemental: '属攻减伤',
  damage_bonus_magic_single: '单体奇术增伤',
  damage_bonus_magic_group: '群体奇术增伤',
  damage_bonus_player: '对玩家增伤',
  crit_damage_bonus: '会心伤害',
  intent_damage_bonus: '会意伤害',
  defense_penetration: '外功穿透',
  elemental_penetration: '属攻穿透',
  fixed_damage: '固伤',
  min_mingjin_damage: '最小鸣金',
  max_mingjin_damage: '最大鸣金',
  min_lieshi_damage: '最小裂石',
  max_lieshi_damage: '最大裂石',
  min_qiansi_damage: '最小牵丝',
  max_qiansi_damage: '最大牵丝',
  min_pozhu_damage: '最小破竹',
  max_pozhu_damage: '最大破竹',
  min_wuxiang_damage: '最小无相',
  max_wuxiang_damage: '最大无相'
};

// ==========================
// 主入口函数
// ==========================

/**
 * 生成毕业度评价报告
 */
export function evaluateGraduation(ctx: EvaluationContext): GraduationReport {
  // 1. 计算期望伤害
  const expectedDamage = calculateExpectedDamage(ctx.combatContext, ctx.effectiveStats);

  // 2. 检测各类问题
  const overflowProblems = detectOverflowProblems(ctx.panelStats, ctx.effectiveStats, ctx.resistance);
  const dilutionProblems = detectDilutionProblems(ctx);
  const cannibalismProblems = detectCannibalismProblems(ctx.effectiveStats, ctx.panelStats);
  const thresholdOpportunities = detectBreakpointOpportunities(ctx);

  const problems = [...overflowProblems, ...dilutionProblems, ...cannibalismProblems];

  // 3. 生成优化建议
  const suggestions = generateOptimizationSuggestions(problems, thresholdOpportunities, ctx);

  // 4. 计算综合评分
  const overallScore = calculateOverallScore(expectedDamage, problems, suggestions);

  // 5. 计算优化潜力
  const optimizationPotential = calculateOptimizationPotential(ctx);

  // 6. 属性效率分析
  const statAnalysis = analyzeAllStats(ctx);

  return {
    overall_score: overallScore,
    grade: scoreToGrade(overallScore),
    expected_damage: expectedDamage,
    stat_analysis: statAnalysis,
    problems: problems.sort((a, b) => {
      const severityOrder = { Critical: 0, Warning: 1, Info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    suggestions: suggestions.sort((a, b) => b.priority - a.priority),
    optimization_potential: optimizationPotential
  };
}

// ==========================
// 问题检测函数
// ==========================

/**
 * 检测溢出问题
 * A. 溢出浪费: 会心 > 80% 或 会意 > 40%
 */
export function detectOverflowProblems(
  panelStats: PanelStats,
  _effectiveStats: EffectiveStats,
  resistance: number
): ProblemItem[] {
  const problems: ProblemItem[] = [];

  // 会心溢出检测
  const rawCrit = panelStats.crit_rate / (1 + resistance);
  if (rawCrit > CAP_CRIT) {
    const wasted = rawCrit - CAP_CRIT;
    const wastedSlots = wasted / CRIT_RATE_PER_GOLD_AFFIX;
    problems.push({
      type: 'Overflow',
      severity: 'Critical',
      message: `会心溢出 ${(wasted * 100).toFixed(1)}%，约浪费 ${wastedSlots.toFixed(1)} 个金色词条`,
      affected_stats: ['crit_rate'],
      impact_value: wasted * 0.5 // 估算损失
    });
  }

  // 会意溢出检测
  const rawIntent = panelStats.intent_rate / (1 + resistance);
  if (rawIntent > CAP_INTENT) {
    const wasted = rawIntent - CAP_INTENT;
    const wastedSlots = wasted / INTENT_RATE_PER_GOLD_AFFIX;
    problems.push({
      type: 'Overflow',
      severity: 'Critical',
      message: `会意溢出 ${(wasted * 100).toFixed(1)}%，约浪费 ${wastedSlots.toFixed(1)} 个金色词条`,
      affected_stats: ['intent_rate'],
      impact_value: wasted * 0.5
    });
  }

  return problems;
}

/**
 * 检测稀释效应
 * B. 攻击力过高但增伤过低
 */
export function detectDilutionProblems(ctx: EvaluationContext): ProblemItem[] {
  const { panelStats } = ctx;
  const problems: ProblemItem[] = [];

  const avgAtk = (panelStats.min_attack + panelStats.max_attack) / 2;
  const totalBonusRate =
    panelStats.damage_bonus_outer +
    panelStats.damage_bonus_elemental +
    panelStats.damage_bonus_all_martial +
    panelStats.damage_bonus_independent;

  // 攻击力过高但增伤过低
  if (avgAtk > 3000 && totalBonusRate < 0.3) {
    problems.push({
      type: 'Dilution',
      severity: 'Warning',
      message: '攻击力过高但增伤不足，边际收益递减',
      affected_stats: ['min_attack', 'max_attack', 'damage_bonus_outer'],
      impact_value: 0.05 // 估算5%损失
    });
  }

  return problems;
}

/**
 * 检测圆桌反噬
 * C. 会意挤压会心导致负收益
 */
export function detectCannibalismProblems(
  effectiveStats: EffectiveStats,
  panelStats: PanelStats
): ProblemItem[] {
  const problems: ProblemItem[] = [];
  const { final_crit, final_intent } = effectiveStats;

  const critDmg = 1.5 + panelStats.crit_damage_bonus;
  const intentDmg = 1.35 + panelStats.intent_damage_bonus;

  // 会意挤压会心检测
  if (final_intent + final_crit > 1.0 && intentDmg < critDmg * 0.9) {
    const squeezedCrit = Math.max(0, final_intent + final_crit - 1.0);
    const loss = squeezedCrit * (critDmg - intentDmg);

    problems.push({
      type: 'Cannibalism',
      severity: 'Critical',
      message: `会意挤压会心导致 ${(loss * 100).toFixed(1)}% 负收益`,
      affected_stats: ['crit_rate', 'intent_rate'],
      impact_value: Math.abs(loss)
    });
  }

  return problems;
}

/**
 * 检测阈值突破机会
 */
export function detectBreakpointOpportunities(ctx: EvaluationContext): ProblemItem[] {
  const opportunities: ProblemItem[] = [];
  const { panelStats } = ctx;

  // 穿透接近阈值（假设阈值 50）
  if (panelStats.defense_penetration > 30 && panelStats.defense_penetration < 50) {
    const needed = 50 - panelStats.defense_penetration;
    opportunities.push({
      type: 'Threshold',
      severity: 'Info',
      message: `外功穿透接近阈值，再加 ${needed.toFixed(0)} 点可突破收益翻倍`,
      affected_stats: ['defense_penetration'],
      impact_value: 0.1 // 预期收益10%
    });
  }

  // 精准接近满值
  if (panelStats.precision_rate < 1.0 && panelStats.precision_rate > 0.9) {
    opportunities.push({
      type: 'Threshold',
      severity: 'Info',
      message: '精准接近满值，提升精准可消除擦伤',
      affected_stats: ['precision_rate'],
      impact_value: 0.05
    });
  }

  return opportunities;
}

// ==========================
// 建议生成函数
// ==========================

/**
 * 生成优化建议
 */
export function generateOptimizationSuggestions(
  problems: ProblemItem[],
  opportunities: ProblemItem[],
  _ctx: EvaluationContext
): SuggestionItem[] {
  const suggestions: SuggestionItem[] = [];

  // 根据问题生成建议
  for (const problem of problems) {
    if (problem.type === 'Overflow') {
      if (problem.affected_stats.includes('crit_rate')) {
        suggestions.push({
          priority: 9,
          category: 'Refine',
          message: '调律: 将溢出的会心词条换成最大外攻或穿透',
          expected_gain: problem.impact_value * 100
        });
      } else if (problem.affected_stats.includes('intent_rate')) {
        suggestions.push({
          priority: 8,
          category: 'Refine',
          message: '调律: 将溢出的会意词条换成会心或外功',
          expected_gain: problem.impact_value * 100
        });
      }
    } else if (problem.type === 'Dilution') {
      suggestions.push({
        priority: 7,
        category: 'Replace',
        message: '替换: 考虑将部分攻击力词条换成增伤词条',
        expected_gain: 5
      });
    } else if (problem.type === 'Cannibalism') {
      suggestions.push({
        priority: 9,
        category: 'Adjust',
        message: '调整: 降低会意或提高会心伤害，避免负收益',
        expected_gain: problem.impact_value * 100
      });
    }
  }

  // 根据机会生成建议
  for (const opp of opportunities) {
    if (opp.affected_stats.includes('defense_penetration')) {
      suggestions.push({
        priority: 6,
        category: 'Refine',
        message: '调律: 追求外功穿透阈值，收益翻倍',
        expected_gain: opp.impact_value * 100
      });
    }
  }

  return suggestions;
}

// ==========================
// 评分计算函数
// ==========================

/**
 * 计算综合评分
 */
export function calculateOverallScore(
  expectedDamage: number,
  problems: ProblemItem[],
  _suggestions: SuggestionItem[]
): number {
  // 基准分：基于期望伤害的相对强度
  // 假设 10000 为基准伤害
  const baseScore = Math.min(100, (expectedDamage / 10000) * 100);

  let score = baseScore;

  // 问题扣分
  for (const problem of problems) {
    if (problem.severity === 'Critical') {
      score -= problem.impact_value * 100;
    } else if (problem.severity === 'Warning') {
      score -= problem.impact_value * 50;
    } else if (problem.severity === 'Info') {
      score -= problem.impact_value * 20;
    }
  }

  // 完成度加分：如果无严重问题
  const hasCriticalProblem = problems.some((p) => p.severity === 'Critical');
  if (!hasCriticalProblem && score > 70) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 评分等级转换
 */
export function scoreToGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= GRADE_THRESHOLDS.S) return 'S';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
}

/**
 * 计算优化潜力（虚拟替换算法）
 */
export function calculateOptimizationPotential(ctx: EvaluationContext): number {
  const baseDamage = calculateExpectedDamage(ctx.combatContext, ctx.effectiveStats);
  let maxGain = 0;

  // 虚拟替换场景：假设将 1 个敏词条换成最大外攻
  // 这里简化处理，实际可以遍历所有可能的替换
  const testContext = cloneEvaluationContext(ctx);

  // 模拟：增加 100 点最大外功
  testContext.panelStats.max_attack += MAX_ATTACK_PER_GOLD_AFFIX;
  // 重新计算生效属性（需要 EffectiveStats，这里简化假设不变）
  // 实际应该重新调用 calculateEffectiveStats

  const newDamage = calculateExpectedDamage(testContext.combatContext, ctx.effectiveStats);
  const gain = ((newDamage - baseDamage) / baseDamage) * 100;

  maxGain = Math.max(maxGain, gain);

  return Math.round(maxGain * 10) / 10; // 保留1位小数
}

/**
 * 克隆评价上下文
 */
function cloneEvaluationContext(ctx: EvaluationContext): EvaluationContext {
  return {
    ...ctx,
    panelStats: { ...ctx.panelStats },
    combatContext: {
      ...ctx.combatContext,
      attacker: { ...ctx.combatContext.attacker },
      defender: { ...ctx.combatContext.defender }
    }
  };
}

// ==========================
// 属性分析函数
// ==========================

/**
 * 分析所有关键属性
 */
function analyzeAllStats(ctx: EvaluationContext): StatAnalysisItem[] {
  const items: StatAnalysisItem[] = [];
  const { panelStats, effectiveStats, resistance } = ctx;

  // 分析关键属性：精准、会心、会意
  const keysToAnalyze: Array<keyof PanelStats> = [
    'precision_rate',
    'crit_rate',
    'intent_rate'
  ];

  for (const key of keysToAnalyze) {
    items.push(
      analyzeStatEfficiency(
        key,
        panelStats[key],
        effectiveStats,
        resistance
      )
    );
  }

  return items;
}

/**
 * 分析单个属性的效率
 */
export function analyzeStatEfficiency(
  key: keyof PanelStats,
  current: number,
  effectiveStats: EffectiveStats,
  resistance: number
): StatAnalysisItem {
  let effective: number;
  let cap: number;
  let status: StatAnalysisItem['status'];
  let efficiency: number;
  let wastePercentage: number | undefined;

  switch (key) {
    case 'precision_rate':
      effective = effectiveStats.effective_precision;
      cap = 1.0; // 精准理论上限 100%
      efficiency = effective / cap;
      if (effective >= 0.95) {
        status = 'OverCap';
      } else if (effective >= 0.85) {
        status = 'NearCap';
      } else if (effective >= 0.7) {
        status = 'UnderCap';
      } else {
        status = 'UnderCap';
      }
      break;

    case 'crit_rate':
      effective = effectiveStats.effective_crit;
      cap = CAP_CRIT;
      efficiency = effective / cap;
      const rawCrit = current / (1 + resistance);
      if (rawCrit > cap) {
        status = 'Wasted';
        wastePercentage = ((rawCrit - cap) / rawCrit) * 100;
      } else if (effective >= cap * 0.95) {
        status = 'NearCap';
      } else if (effective >= cap * 0.7) {
        status = 'UnderCap';
      } else {
        status = 'UnderCap';
      }
      break;

    case 'intent_rate':
      effective = effectiveStats.effective_intent;
      cap = CAP_INTENT;
      efficiency = effective / cap;
      const rawIntent = current / (1 + resistance);
      if (rawIntent > cap) {
        status = 'Wasted';
        wastePercentage = ((rawIntent - cap) / rawIntent) * 100;
      } else if (effective >= cap * 0.95) {
        status = 'NearCap';
      } else if (effective >= cap * 0.7) {
        status = 'UnderCap';
      } else {
        status = 'UnderCap';
      }
      break;

    default:
      effective = current;
      cap = current * 1.2; // 假设上限
      efficiency = 0.8;
      status = 'UnderCap';
  }

  return {
    key,
    name: STAT_NAMES[key] || key,
    current,
    effective,
    cap,
    efficiency: Math.min(1, Math.max(0, efficiency)),
    status,
    waste_percentage: wastePercentage
  };
}

// ==========================
// 辅助函数
// ==========================

/**
 * 获取属性显示名称
 */
export function getStatName(key: keyof PanelStats): string {
  return STAT_NAMES[key] || key;
}

/**
 * 获取等级颜色
 */
export function getGradeColor(grade: GraduationReport['grade']): string {
  const colors = {
    S: 'linear-gradient(135deg, #FFD700, #FFA500)',
    A: 'linear-gradient(135deg, #5AC8FA, #0071E3)',
    B: 'linear-gradient(135deg, #34C759, #30B0C7)',
    C: 'linear-gradient(135deg, #FF9500, #FF6B00)',
    D: 'linear-gradient(135deg, #FF3B30, #C80000)'
  };
  return colors[grade];
}

/**
 * 获取严重性颜色
 */
export function getSeverityColor(severity: ProblemItem['severity']): string {
  const colors = {
    Critical: '#FF3B30',
    Warning: '#FF9500',
    Info: '#0071E3'
  };
  return colors[severity];
}
