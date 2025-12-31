/**
 * 圆桌判定逻辑 (Round Table Logic)
 * Based on Docs v1.2 Section 3
 */

import type { EffectiveStats, DamageResult } from '../types';

export interface RoundTableContext {
    effectiveStats: EffectiveStats;
    glanceConversionRate?: number; // 擦伤转化率 (Default 0)
    // Random function dependency injection for deterministic simulation
    random?: () => number;
}

/**
 * 执行一次圆桌判定
 * @param context 上下文包含黄字/最终属性
 * @returns 判定结果 DamageResult (Hit Type ONLY, Damage value is calculated later in pipeline)
 */
export function resolveHitType(context: RoundTableContext): Omit<DamageResult, 'damage'> {
    const { effectiveStats, glanceConversionRate = 0 } = context;
    const rng = context.random || Math.random;

    // --- Step 1: 精准判定 (Precision Check) ---
    // Precision uses "Effective Precision" (Yellow)
    const R1 = rng();
    const isPrecisionHit = R1 <= effectiveStats.effective_precision;

    if (isPrecisionHit) {
        // --- Step 2: 命中判定 (Hit Determination) ---
        // Uses Final Probability (White + Direct)
        // Docs: 若 最终会心 + 最终会意 > 100%，会意优先挤压会心
        let finalIntent = effectiveStats.final_intent;
        let finalCrit = effectiveStats.final_crit;

        // The Squeeze Logic
        if (finalIntent + finalCrit > 1.0) {
            // Intent takes priority, Crit gets squeezed
            finalCrit = Math.max(0, 1.0 - finalIntent);
        }

        const R2 = rng();

        // Ranges:
        // [0, I) -> Intent
        // [I, I+C) -> Crit
        // [I+C, 1] -> Normal

        if (R2 < finalIntent) {
            return { hitType: 'Intent', isPrecisionHit: true, log: 'Step 2: Intent Hit' };
        } else if (R2 < finalIntent + finalCrit) {
            return { hitType: 'Crit', isPrecisionHit: true, log: 'Step 2: Crit Hit' };
        } else {
            return { hitType: 'Normal', isPrecisionHit: true, log: 'Step 2: Normal Hit' };
        }

    } else {
        // --- Step 3: 未命中判定 (Miss Determination) ---
        // Docs: 未精准命中时，无法触发会心，但仍可触发会意

        // 3a. Intent Check
        const R3a = rng();
        if (R3a < effectiveStats.final_intent) {
            return { hitType: 'Intent', isPrecisionHit: false, log: 'Step 3: Miss but Intent Hit' };
        }

        // 3b. Glance Conversion Check
        const R3b = rng();
        const conversionRate = glanceConversionRate; // Usually 0 or specific buff
        if (R3b < conversionRate) {
            // Converted to Normal Hit (White)
            return { hitType: 'Normal', isPrecisionHit: false, log: 'Step 3: Glance Converted to Normal' };
        }

        // 3c. Glancing Hit
        return { hitType: 'Glancing', isPrecisionHit: false, log: 'Step 3: Glancing Hit' };
    }
}
