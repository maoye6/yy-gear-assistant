/**
 * 优化建议生成模块
 * 通过虚拟替换算法计算最优词条组合建议
 */

import type {
    EquipmentItem,
    EvaluationContext,
    OptimizationReport,
    AffixOptimization,
    EquipmentResetSuggestion,
    Affix,
    EquipmentSlot,
    AffixSlotType
} from '../types';
import { calculateExpectedDamage } from './damage';
import { calculatePanelStats } from './stats';
import { getZhunlvPoolBySubSchool } from '../data/affixes';
import { getOptimalBuildForSubSchool, type SubSchoolType, GameConstants } from '../data/loaders';

// ==================== 常量定义 - 从GameConstants获取 ====================

const RESET_THRESHOLD = GameConstants.optimization.resetThreshold;
const TOP_K_SUGGESTIONS = GameConstants.optimization.maxSuggestions;
const MIN_GAIN_THRESHOLD = GameConstants.optimization.minGainThreshold;

// ==================== 主入口函数 ====================

/**
 * 生成优化报告
 *
 * @param ctx - 评价上下文
 * @param equipments - 当前装备列表
 * @param subSchool - 当前流派
 * @returns 完整的优化报告
 */
export function generateOptimizationReport(
    ctx: EvaluationContext,
    equipments: EquipmentItem[],
    subSchool: SubSchoolType
): OptimizationReport {
    // 1. 生成词条级优化建议
    const affixOptimizations = generateAffixOptimizations(ctx, equipments, subSchool);

    // 2. 生成装备重调建议
    const resetSuggestions = generateResetSuggestions(equipments, subSchool);

    // 3. 计算总体优化潜力
    const totalPotential = calculateTotalPotential(affixOptimizations);

    // 4. 计算与理论最优的差距
    const gapFromOptimal = calculateGapFromOptimal(ctx, subSchool);

    return {
        affixOptimizations: affixOptimizations.slice(0, TOP_K_SUGGESTIONS),
        resetSuggestions,
        totalPotential,
        gapFromOptimal
    };
}

// ==================== 词条级优化建议生成 ====================

/**
 * 生成词条级优化建议
 * 核心算法：虚拟替换 + 收益计算
 */
function generateAffixOptimizations(
    ctx: EvaluationContext,
    equipments: EquipmentItem[],
    subSchool: SubSchoolType
): AffixOptimization[] {
    const optimizations: AffixOptimization[] = [];

    // 过滤出有效装备
    const activeEquipments = equipments.filter((e): e is EquipmentItem => e !== null);

    // 当前期望伤害（基准）
    const baseDamage = ctx.expectedDamage || 0;

    // 遍历每个装备的每个调律槽位
    for (const equipment of activeEquipments) {
        const slots: Array<{ key: keyof EquipmentItem; slotType: AffixSlotType }> = [
            { key: 'affix_shang', slotType: 'Shang' },
            { key: 'affix_jue', slotType: 'Jue' },
            { key: 'affix_zhi', slotType: 'Zhi' },
            { key: 'affix_yu', slotType: 'Yu' },
            { key: 'affix_dingyin', slotType: 'DingYin' }
        ];

        for (const { key, slotType } of slots) {
            const currentAffix = equipment[key] as Affix | undefined;

            // 获取该槽位的候选词条池
            const candidatePool = getCandidatePool(equipment.slot, slotType, subSchool, currentAffix);

            // 遍历候选词条，计算收益
            for (const candidate of candidatePool) {
                // 跳过当前词条（完全相同）
                if (currentAffix && currentAffix.type === candidate.type && currentAffix.value === candidate.value) {
                    continue;
                }

                // 虚拟替换：计算替换后的期望伤害
                const newDamage = simulateAffixReplacement(
                    ctx,
                    activeEquipments,
                    equipment,
                    key,
                    candidate
                );

                // 计算收益百分比
                const gain = baseDamage > 0 ? ((newDamage - baseDamage) / baseDamage) * 100 : 0;

                // 只记录有正向收益且超过阈值的建议
                if (gain > MIN_GAIN_THRESHOLD) {
                    optimizations.push({
                        slot: equipment.slot,
                        affixSlot: slotType,
                        currentAffix: currentAffix || null,
                        targetAffix: candidate,
                        expectedGain: gain,
                        priority: calculatePriority(gain, slotType),
                        type: slotType === 'DingYin' ? 'Dingyin' : 'Tiaolu',
                        reason: generateReason(currentAffix, candidate, gain)
                    });
                }
            }
        }
    }

    // 按收益降序排序
    return optimizations.sort((a, b) => b.expectedGain - a.expectedGain);
}

/**
 * 获取候选词条池
 */
function getCandidatePool(
    slot: EquipmentSlot,
    slotType: AffixSlotType,
    subSchool: SubSchoolType,
    currentAffix?: Affix
): Affix[] {
    if (slotType === 'DingYin') {
        // 定音使用定音池（暂时返回空数组，定音池需要单独实现）
        return [];
    }

    // 商/角/徵/羽使用转律池（更精准）
    const pool = getZhunlvPoolBySubSchool(slot, subSchool);

    // 如果没有当前词条，返回整个池子
    // 如果有当前词条，返回池子中不同的词条
    return pool.filter(a => {
        if (!currentAffix) return true;
        return a.type !== currentAffix.type || a.value !== currentAffix.value;
    });
}

/**
 * 模拟词条替换后的期望伤害
 */
function simulateAffixReplacement(
    ctx: EvaluationContext,
    allEquipments: EquipmentItem[],
    targetEquipment: EquipmentItem,
    affixKey: keyof EquipmentItem,
    newAffix: Affix
): number {
    // 克隆装备列表并替换目标词条
    const modifiedEquipments = allEquipments.map(eq => {
        if (eq.slot === targetEquipment.slot) {
            return {
                ...eq,
                [affixKey]: newAffix
            };
        }
        return eq;
    });

    // 获取基础属性（从面板属性中减去装备贡献）
    // 这里简化处理：直接使用当前面板属性作为基准
    // 实际上应该有更精确的基础属性提取逻辑
    const baseStats = { ...ctx.panelStats };

    // 重新计算面板属性（简化版本：只计算词条差异）
    // 更精确的实现需要完整的装备-属性映射
    const newPanelStats = calculatePanelStats(
        baseStats,
        modifiedEquipments,
        [] // 心法暂时不变
    );

    // 重新构建战斗上下文
    const newCombatContext = {
        ...ctx.combatContext,
        attacker: newPanelStats
    };

    // 重新计算生效属性（简化：假设抗性不变）
    // 实际应该重新计算
    return calculateExpectedDamage(newCombatContext, ctx.effectiveStats);
}

/**
 * 计算优先级
 */
function calculatePriority(gain: number, slotType: AffixSlotType): number {
    // 基础优先级：收益越大，优先级越高
    let priority = Math.min(10, Math.round(gain * 2));

    // 槽位权重：定音 > 商/角 > 徵/羽
    if (slotType === 'DingYin') {
        priority = Math.min(10, priority + 2);
    } else if (slotType === 'Shang' || slotType === 'Jue') {
        priority = Math.min(10, priority + 1);
    }

    return Math.max(1, priority);
}

/**
 * 生成建议说明
 */
function generateReason(current: Affix | undefined, target: Affix, gain: number): string {
    if (!current) {
        return `添加${target.name}，伤害提升 +${gain.toFixed(1)}%`;
    }
    return `${current.name} → ${target.name}，伤害提升 +${gain.toFixed(1)}%`;
}

// ==================== 装备重调建议生成 ====================

/**
 * 生成装备重调建议
 */
function generateResetSuggestions(
    equipments: EquipmentItem[],
    subSchool: SubSchoolType
): EquipmentResetSuggestion[] {
    const suggestions: EquipmentResetSuggestion[] = [];

    // 获取理论最优方案
    const optimalBuildData = getOptimalBuildForSubSchool(subSchool);
    if (!optimalBuildData) return suggestions;

    for (const equipment of equipments) {
        if (!equipment) continue;

        const optimalSlot = optimalBuildData.slots[equipment.slot];
        if (!optimalSlot) continue;

        // 计算当前装备相对于最优的效率
        const efficiency = calculateEquipmentEfficiency(equipment, optimalSlot);

        if (efficiency < (1 - RESET_THRESHOLD)) {
            suggestions.push({
                slot: equipment.slot,
                currentEfficiency: efficiency,
                threshold: RESET_THRESHOLD,
                recommendDirection: `建议朝${optimalBuildData.name}方向调律`
            });
        }
    }

    return suggestions;
}

/**
 * 计算装备效率
 */
function calculateEquipmentEfficiency(
    current: EquipmentItem,
    optimal: {
        gong: any[];
        shang: any;
        jue: any;
        zhi: any;
        yu: any;
        dingyin: any;
    }
): number {
    let matchCount = 0;
    let totalSlots = 0;

    const slots: Array<{ key: keyof EquipmentItem; optimalKey: string }> = [
        { key: 'affix_shang', optimalKey: 'shang' },
        { key: 'affix_jue', optimalKey: 'jue' },
        { key: 'affix_zhi', optimalKey: 'zhi' },
        { key: 'affix_yu', optimalKey: 'yu' },
        { key: 'affix_dingyin', optimalKey: 'dingyin' }
    ];

    for (const { key, optimalKey } of slots) {
        const currentAffix = current[key] as Affix | undefined;
        const optimalAffix = (optimal as any)[optimalKey];

        if (optimalAffix) {
            totalSlots++;
            if (currentAffix && currentAffix.type === optimalAffix.type) {
                // 进一步检查数值效率
                const currentValue = currentAffix.value;
                const optimalValue = optimalAffix.value || 0;
                const valueEfficiency = optimalValue > 0 ? currentValue / optimalValue : 1;
                matchCount += Math.min(1, valueEfficiency);
            }
        }
    }

    return totalSlots > 0 ? matchCount / totalSlots : 1;
}

// ==================== 辅助计算函数 ====================

/**
 * 计算总体优化潜力
 */
function calculateTotalPotential(optimizations: AffixOptimization[]): number {
    // 取Top-5建议的平均收益作为总体潜力
    const top5 = optimizations.slice(0, 5);
    if (top5.length === 0) return 0;

    const totalGain = top5.reduce((sum, opt) => sum + opt.expectedGain, 0);
    return totalGain / top5.length;
}

/**
 * 计算与理论最优的差距
 */
function calculateGapFromOptimal(
    ctx: EvaluationContext,
    subSchool: SubSchoolType
): number {
    const optimalBuildData = getOptimalBuildForSubSchool(subSchool);
    if (!optimalBuildData) return 0;

    const currentDamage = ctx.expectedDamage || 0;
    const optimalDamage = optimalBuildData.expectedDamage || 0;

    if (optimalDamage === 0) return 0;

    return ((optimalDamage - currentDamage) / optimalDamage) * 100;
}
