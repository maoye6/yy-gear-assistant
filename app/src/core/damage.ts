/**
 * 伤害计算总线 (Damage Pipeline)
 * Based on Docs v1.2 & Development Spec v1.0
 */

import type { CombatContext, DamageResult, PanelStats } from '../types';
import { DAMAGE_MULTIPLIERS } from '../data/constants';

/**
 * 获取攻击力数值 based on hit type
 */
function getAttackValue(stats: PanelStats, hitType: DamageResult['hitType'], random: () => number = Math.random): number {
    const { min_attack, max_attack } = stats;

    switch (hitType) {
        case 'Intent': // 会意: Max Atk
            return max_attack;
        case 'Glancing': // 擦伤: Min Atk
            return min_attack;
        case 'Crit':
        case 'Normal':
        default:
            // Random [Min, Max]
            return min_attack + random() * (max_attack - min_attack);
    }
}

/**
 * 计算穿透修正
 * Currently using generic linear scaling from dev docs: 1 + Pen / Constant
 * TODO: Verify the constant 100/200 or if it's flat defense reduction.
 * As per `开发文档.md`: Pen * ... implies multiplier.
 * As per `战斗属性.md`: Value is around 46.
 * Assuming 100 coefficient for now (1 + 0.46) for Player vs Monster
 */
function getPenetrationMultiplier(penetration: number): number {
    // Placeholder implementation
    const COEFFICIENT = 100; // or 200?
    return 1 + (penetration / COEFFICIENT);
}

/**
 * 计算增伤乘区 (Bonuses)
 * 根据 Docs v1.2 Section 4.3
 */
function getBonusMultiplier(stats: PanelStats, context: CombatContext): number {
    // 1. A类: 通用/状态增伤 (Additive Group 1)
    // 气竭(10%)、易水歌、威猛歌等状态类增伤
    const bonusA = 1 + stats.damage_bonus_general;

    // 2. B类: 武学增效 (Additive Group 2)
    // 全部武学增效 + 指定武器增效 (取最大值)
    // 注意：此乘区对奇术、心法无效！
    // 参考 Docs 机制.md: "全武增能加成天工和易水歌" (天工是奇术)
    const isMartialSkill = context.skill.type === 'Martial';
    const bonusB = isMartialSkill ? (1 + stats.damage_bonus_skill) : 1;

    // 3. C类: 对象增伤 (Target Bonus)
    // 首领增伤 (6.1%)
    const bonusC = context.defender.is_boss ? (1 + stats.damage_bonus_target) : 1;

    // 4. D类: 独立增伤 (Independent)
    // 鼠鼠Q、防具定音等明确说明独立的词条
    // 参考 Docs 机制.md: "鼠鼠Q的增伤是独立"
    const bonusD = 1 + stats.damage_bonus_independent;

    return bonusA * bonusB * bonusC * bonusD;
}

/**
 * 计算单次判定后的最终伤害
 */
export function calculateFinalDamage(
    hitResult: Omit<DamageResult, 'damage'>,
    context: CombatContext,
    random: () => number = Math.random
): DamageResult {
    const { attacker, defender, skill } = context;
    const { hitType } = hitResult;

    // 1. Determine Attack Value
    const attack = getAttackValue(attacker, hitType, random);

    // 2. Base Damage Calculation
    // Formula: [(Atk - Def) * SkillMultiplier] + Fixed + Ele
    // Note: Skill multiplier is per hit.
    // context.skill might be the specific hit info or the whole skill?
    // Let's assume context passes the multiplier for *this specific hit* if simulating multi-hit.
    // However, usually we simplify or calculate generic expectation.
    // For specific simulation, we need the specific hit multiplier.
    // Let's assume context.skill has a `current_hit_multiplier` or we pass it.
    // For now, let's assume we are calculating for a generic 100% multiplier hit or sum.
    // Docs 4.1: `基底 = [(攻击力 - 防御) * 技能倍率] + 固伤 + 属伤`

    // We'll use a standardized 100% check or provided multiplier
    // Let's use the first hit of the skill or average? 
    // Ideally the "DamagePipeline" handles ONE Hit.
    // The Skill object in Types has `multiplier_per_hit`.
    // We should probably iterate outside.
    // For this function, let's treat it as "Calculate for a specific motion value".
    // I'll add `motionValue` (multiplier) to arguments or Context.

    // TEMPORARY: Use first hit or specific logical arg.
    // Let's just use 1.0 (100%) if not specified, meant to be scaled by caller?
    // No, better to extract Attack - Def first.

    const defense = Math.max(0, defender.defense); // Def cannot make dmg negative?
    // Docs don't specify if Def can reduce below 0, usually Atk-Def >= 0 or min 1.
    const effectiveAtk = Math.max(1, attack - defense);

    // Let's use an arbitrary motion value from skill if valid, or 1.0
    const motionValue = skill.multiplier_per_hit[0] || 1.0;
    const fixedValue = skill.fixed_damage_per_hit?.[0] || 0;

    // 计算属性伤害（四流派 + 无相）
    const getElementalDamage = (stats: PanelStats, useMax: boolean) => {
        if (useMax) {
            return stats.max_mingjin_damage + stats.max_lieshi_damage +
                stats.max_qiansi_damage + stats.max_pozhu_damage + stats.max_wuxiang_damage;
        }
        return stats.min_mingjin_damage + stats.min_lieshi_damage +
            stats.min_qiansi_damage + stats.min_pozhu_damage + stats.min_wuxiang_damage;
    };

    // 使用平均属性伤害
    const avgEleDmg = (getElementalDamage(attacker, false) + getElementalDamage(attacker, true)) / 2;
    let baseDamage = (effectiveAtk * motionValue) + fixedValue + avgEleDmg;

    // 3. Type Multiplier (Crit/Intent/Glance)
    let typeModifier = 1.0;
    switch (hitType) {
        case 'Intent':
            // 1.35 + Intent Bonus
            typeModifier = DAMAGE_MULTIPLIERS.INTENT + attacker.intent_damage_bonus;
            break;
        case 'Crit':
            // 1.50 + Crit Bonus
            typeModifier = DAMAGE_MULTIPLIERS.CRIT + attacker.crit_damage_bonus;
            break;
        case 'Glancing':
            typeModifier = DAMAGE_MULTIPLIERS.GLANCING; // 0.5
            break;
        case 'Normal':
        default:
            typeModifier = DAMAGE_MULTIPLIERS.NORMAL; // 1.0
    }

    // 4. Penetration Multiplier
    const penModifier = getPenetrationMultiplier(attacker.defense_penetration);

    // 5. Bonus Multipliers (A/B/C/D)
    const bonusModifier = getBonusMultiplier(attacker, context);

    // Final Calculation
    const finalDamage = baseDamage * typeModifier * penModifier * bonusModifier;

    return {
        ...hitResult,
        damage: Math.round(finalDamage),
        log: `Atk:${attack.toFixed(0)} Def:${defense} Base:${baseDamage.toFixed(0)} TypeMod:${typeModifier} PenMod:${penModifier} Bonus:${bonusModifier.toFixed(2)}`
    };
}

/**
 * 计算期望伤害 (Analytical Expected Damage)
 * 用于优化算法快速评估，无需蒙特卡洛模拟
 */
export function calculateExpectedDamage(
    context: CombatContext,
    effectiveStats: import('../types').EffectiveStats
): number {
    const { attacker, defender, skill } = context;

    // 1. Probabilities
    const { effective_precision, final_crit, final_intent } = effectiveStats;

    // The Squeeze
    let pIntent = final_intent;
    let pCrit = final_crit;
    if (pIntent + pCrit > 1.0) {
        pCrit = Math.max(0, 1.0 - pIntent);
    }


    // Precision Check
    // Prob Hit = effective_precision
    // Prob Miss = 1 - effective_precision

    // 2. Damage Values (approximate for Expectation)
    // We use Average Atk for Normal/Crit, Max for Intent, Min for Glancing?
    const avgAtk = (attacker.min_attack + attacker.max_attack) / 2;
    const maxAtk = attacker.max_attack;
    const minAtk = attacker.min_attack;
    const defense = Math.max(0, defender.defense);
    const motionValue = skill.multiplier_per_hit[0] || 1.0;
    const fixedValue = skill.fixed_damage_per_hit?.[0] || 0;
    // 计算平均属性伤害
    const avgEleDmg = (
        (attacker.min_mingjin_damage + attacker.max_mingjin_damage) / 2 +
        (attacker.min_lieshi_damage + attacker.max_lieshi_damage) / 2 +
        (attacker.min_qiansi_damage + attacker.max_qiansi_damage) / 2 +
        (attacker.min_pozhu_damage + attacker.max_pozhu_damage) / 2 +
        (attacker.min_wuxiang_damage + attacker.max_wuxiang_damage) / 2
    );

    const calcBase = (atk: number) => Math.max(1, atk - defense) * motionValue + fixedValue + avgEleDmg;

    const dmgIntent = calcBase(maxAtk) * (DAMAGE_MULTIPLIERS.INTENT + attacker.intent_damage_bonus);
    const dmgCrit = calcBase(avgAtk) * (DAMAGE_MULTIPLIERS.CRIT + attacker.crit_damage_bonus);
    const dmgNormal = calcBase(avgAtk) * DAMAGE_MULTIPLIERS.NORMAL;
    const dmgGlance = calcBase(minAtk) * DAMAGE_MULTIPLIERS.GLANCING;

    // 3. Multipliers
    const penMod = getPenetrationMultiplier(attacker.defense_penetration);
    const bonusMod = getBonusMultiplier(attacker, context);
    const globalMod = penMod * bonusMod;

    // 4. Weighted Sum
    // Hit Branch


    // Miss Branch
    // Checks Intent again? (Docs Step 3a: Miss -> Intent Check)
    // The RoundTable logic says: if Miss -> check Intent (Final Intent Prob).
    // So even if Precision fails, we have `final_intent` chance to Intent Hit.
    // However, does the first "Intent" check (in Hit Branch) and second (in Miss Branch) overlap?
    // Docs: Step 1 Precision. If Pass -> Step 2. If Fail -> Step 3.
    // Step 3: Check Intent.
    // So `pIntent` applies to BOTH branches?
    // Actually, `resolveHitType` implementation:
    // P(Precision Hit) = eff_precision.
    //    Inside Hit: P(Intent) = final_intent.
    // P(Precision Miss) = 1 - eff_precision.
    //    Inside Miss: P(Intent) = final_intent.
    // So Total P(Intent) = eff_precision * final_intent + (1 - eff_precision) * final_intent = final_intent.
    // Yes! Intent ignores Precision.

    // So we can assume:
    // Total Intent = final_intent (Damage: dmgIntent)
    // Remainder 1 = 1 - final_intent.
    // Inside Remainder 1:
    //    We need to check if it was a Precision Hit or Miss to decide Crit vs Glance?
    //    Actually:
    //    If Intent, we don't care about Precision.
    //    If NOT Intent:
    //       Was it Precision Hit?
    //       Prob = P(Hit | Not Intent) ... complex.

    // approach B: Sum of disjoint events
    // Event Intent: Prob = final_intent. Dmg = dmgIntent.
    // Event Non-Intent: Prob = 1 - final_intent.
    //    Sub-event Hit (Precision Pass): 
    //       Prob = eff_precision * (1 - final_intent) ? No, independence is key.
    //       Let's trace logic:
    //       R1 < Prec: Hits. Then R2 < Intent -> Intent. Else R2 < Intent+Crit -> Crit. Else Normal.
    //       R1 > Prec: Miss. Then R3 < Intent -> Intent. Else Glance.
    //       
    //       P(Intent) = P(Hit)*P(Intent) + P(Miss)*P(Intent) = P(Intent). OK.
    //       P(Crit) = P(Hit) * P(Crit | Not Intent). 
    //                 In Squeeze logic: P(Crit) is simply the defined `final_crit` (if not squeezed).
    //                 In implementation `resolveHitType`: `else if (R2 < finalIntent + finalCrit)`.
    //                 So yes, P(Crit) is exactly `final_crit` (after squeeze).
    //                 BUT only if Precision Hit.
    //                 So Total P(Crit) = eff_precision * final_crit.
    //       P(Normal) = P(Hit) * (1 - final_intent - final_crit).
    //                 Total P(Normal) = eff_precision * (1 - final_intent - final_crit).
    //       P(Glance) = P(Miss) * (1 - final_intent).
    //                 Total P(Glance) = (1 - eff_precision) * (1 - final_intent).

    // Verification: Sum probs.
    // I + P*C + P*(1-I-C) + (1-P)*(1-I)
    // = I + P*C + P - P*I - P*C + 1 - I - P + P*I
    // = 1. Correct.

    const pTotalIntent = final_intent;
    const pTotalCrit = effective_precision * final_crit;
    const pTotalNormal = effective_precision * (1.0 - final_intent - final_crit);
    const pTotalGlance = (1.0 - effective_precision) * (1.0 - final_intent);

    const expectedValue = (
        (pTotalIntent * dmgIntent) +
        (pTotalCrit * dmgCrit) +
        (pTotalNormal * dmgNormal) +
        (pTotalGlance * dmgGlance)
    ) * globalMod;

    return expectedValue;
}
