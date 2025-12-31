

/**
 * 核心转化与抗性公式
 * Based on Docs v1.2 Section 2
 */

import { GameConstants } from '../data/loaders';

// 从配置中获取常量
export const BASE_PRECISION = GameConstants.caps.basePrecision;
export const CAP_CRIT = GameConstants.caps.effectiveCritRate;
export const CAP_INTENT = GameConstants.caps.effectiveIntentRate;

// 属性转化系数
const ATTR_CONVERSION = GameConstants.attributeConversion;

/**
 * 计算黄字精准 (Effective Precision)
 * 公式: 65% + (白字 - 65%) / (1 + 抗性)
 * @param whitePrecision 白字精准 (e.g. 1.15)
 * @param resistance 判定抗性 (e.g. 0.85)
 */
export function calculateEffectivePrecision(whitePrecision: number, resistance: number): number {
    if (whitePrecision <= BASE_PRECISION) return whitePrecision;
    const overflow = whitePrecision - BASE_PRECISION;
    const effectiveOverflow = overflow / (1 + resistance);
    return BASE_PRECISION + effectiveOverflow;
}

/**
 * 计算黄字会心 (Effective Crit)
 * 公式: Min(白字 / (1 + 抗性), 80%) + 直接会心(这里暂不处理直接会心，只算黄字基础)
 * @param whiteCrit 白字会心
 * @param resistance 判定抗性
 */
export function calculateEffectiveCrit(whiteCrit: number, resistance: number): number {
    const raw = whiteCrit / (1 + resistance);
    return Math.min(raw, CAP_CRIT);
}

/**
 * 计算黄字会意 (Effective Intent)
 * 公式: Min(白字 / (1 + 抗性), 40%)
 * @param whiteIntent 白字会意
 * @param resistance 判定抗性
 */
export function calculateEffectiveIntent(whiteIntent: number, resistance: number): number {
    const raw = whiteIntent / (1 + resistance);
    return Math.min(raw, CAP_INTENT);
}

/**
 * 五维转化辅助函数 (Docs 5.2)
 * 使用constants.json中的attributeConversion配置
 */
export function convertAttributesToStats(
    vit: number,
    def_stat: number,
    agi: number,
    tech: number,
    str: number
) {
    const constitution = ATTR_CONVERSION.constitution;
    const defConv = ATTR_CONVERSION.defense_stat;
    const agiConv = ATTR_CONVERSION.agility;
    const techConv = ATTR_CONVERSION.technique;
    const strConv = ATTR_CONVERSION.strength;

    return {
        hp: vit * constitution.hp + def_stat * defConv.hp,
        defense: def_stat * defConv.defense,
        min_attack: agi * agiConv.min_attack + str * strConv.min_attack,
        max_attack: tech * techConv.max_attack + str * strConv.max_attack,
        crit_rate_bonus: agi * agiConv.crit_rate,
        intent_rate_bonus: tech * techConv.intent_rate
    };
}

/**
 * 计算完整的生效属性 (Effective Stats)
 * 根据 Docs v1.2: 最终概率 = 黄字属性 + 直接概率
 *
 * @param whitePrecision 白字精准 (e.g. 1.15 = 115%)
 * @param whiteCrit 白字会心 (e.g. 0.722 = 72.2%)
 * @param whiteIntent 白字会意 (e.g. 0.21 = 21%)
 * @param directCrit 直接会心 (来自心法突破，无视抗性)
 * @param directIntent 直接会意 (来自心法突破，无视抗性)
 * @param resistance 判定抗性 (e.g. 0.85 for 100+ level)
 * @returns EffectiveStats 包含黄字属性和最终概率
 */
export function calculateEffectiveStats(
    whitePrecision: number,
    whiteCrit: number,
    whiteIntent: number,
    directCrit: number,
    directIntent: number,
    resistance: number
): import('../types').EffectiveStats {
    // 1. 计算黄字属性 (经过抗性衰减和上限截断)
    const effective_precision = calculateEffectivePrecision(whitePrecision, resistance);
    const effective_crit = calculateEffectiveCrit(whiteCrit, resistance);
    const effective_intent = calculateEffectiveIntent(whiteIntent, resistance);

    // 2. 计算最终概率 = 黄字 + 直接概率
    // 直接概率无视抗性、无视上限，直接叠加
    const final_crit = effective_crit + directCrit;
    const final_intent = effective_intent + directIntent;

    // 3. 检查是否触发上限 (仅黄字部分有上限，最终概率可能超过)
    const is_crit_capped = whiteCrit / (1 + resistance) >= CAP_CRIT;
    const is_intent_capped = whiteIntent / (1 + resistance) >= CAP_INTENT;

    return {
        effective_precision,
        effective_crit,
        effective_intent,
        final_crit,
        final_intent,
        is_crit_capped,
        is_intent_capped
    };
}
