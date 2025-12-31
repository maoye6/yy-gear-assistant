/**
 * 属性汇总逻辑
 * Aggregates Base Stats + Equipment Affixes + Techniques + Buffs -> Final Panel Stats
 */

import type { PanelStats, EquipmentItem, Affix } from '../types';
import type { TechniqueInfo } from '../data/loaders';
import { convertAttributesToStats } from './formulas';
import { calculateTechniqueStats } from './techniques';

export const EMPTY_STATS: PanelStats = {
    constitution: 0, defense_stat: 0, agility: 0, technique: 0, strength: 0,
    hp: 0, defense: 0,
    min_attack: 0, max_attack: 0,
    precision_rate: 0, crit_rate: 0, intent_rate: 0,
    direct_crit_rate: 0, direct_intent_rate: 0, glance_convert_rate: 0,
    damage_bonus_general: 0, damage_bonus_outer: 0, damage_bonus_elemental: 0,
    damage_bonus_all_martial: 0, damage_bonus_specific_martial: 0, damage_bonus_boss: 0,
    damage_bonus_skill: 0, damage_bonus_target: 0, damage_bonus_independent: 0,
    healing_bonus_outer: 0, healing_bonus_elemental: 0, healing_bonus_crit: 0, resistance_outer: 0,
    damage_reduction_outer: 0, damage_reduction_elemental: 0,
    damage_bonus_magic_single: 0, damage_bonus_magic_group: 0, damage_bonus_player: 0,
    crit_damage_bonus: 0, intent_damage_bonus: 0,
    defense_penetration: 0, elemental_penetration: 0, fixed_damage: 0,
    // 四流派属性攻击
    min_mingjin_damage: 0, max_mingjin_damage: 0,
    min_lieshi_damage: 0, max_lieshi_damage: 0,
    min_qiansi_damage: 0, max_qiansi_damage: 0,
    min_pozhu_damage: 0, max_pozhu_damage: 0,
    // 无相攻击
    min_wuxiang_damage: 0, max_wuxiang_damage: 0
};


/**
 * 将单个词条的值加到统计对象上
 */
function addAffixToStats(stats: PanelStats, affix: Affix) {
    const key = affix.type as keyof PanelStats;
    if (typeof stats[key] === 'number') {
        stats[key] += affix.value;
    }
}

/**
 * 计算面板属性
 * Flow:
 * 1. Sum Attributes (Min/Jin/Shi/etc) from Base + Equip
 * 2. Convert Attributes to Combat Stats (Atk/Crit/etc)
 * 3. Sum Combat Stats from Equip (Direct Atk/Crit lines)
 * 4. Sum Stats from Techniques (心法加成)
 * 5. Apply Percentage Multipliers if any (e.g. "MinAtk +10%") - For now assuming flat stacking mostly?
 *    Ref Docs: "人物升级...每级2攻击", "1敏=0.9小攻..."
 *    Actually, Affixes give "Min Attack +45". This is flat add.
 */
export function calculatePanelStats(
    baseStats: PanelStats,
    equipments: EquipmentItem[],
    techniques?: (TechniqueInfo | null)[]
): PanelStats {
    // 1. Initialize with Base
    const final: PanelStats = { ...baseStats };

    // 2. Aggregate Equipment Affixes
    equipments.forEach(eq => {
        // Helper to process all slots
        const process = (affix?: Affix | Affix[]) => {
            if (!affix) return;
            if (Array.isArray(affix)) {
                affix.forEach(a => addAffixToStats(final, a));
            } else {
                addAffixToStats(final, affix);
            }
        };

        process(eq.affix_gong);
        process(eq.affix_shang);
        process(eq.affix_jue);
        process(eq.affix_zhi);
        process(eq.affix_yu);
        process(eq.affix_dingyin);
    });

    // 3. Aggregate Technique Stats (心法加成)
    if (techniques) {
        const techniqueStats = calculateTechniqueStats(techniques);
        Object.entries(techniqueStats).forEach(([key, value]) => {
            const statKey = key as keyof PanelStats;
            if (typeof final[statKey] === 'number') {
                final[statKey] += value;
            }
        });
    }

    // 4. Perform Attribute -> Stat Conversion
    // Note: The `final` object now contains Total Constitution, Total Agility etc.
    // We need to calculate the *Derived* stats from these Totals.
    // AND add them to the existing flat stats (e.g. `final.min_attack`).

    // BUT wait: Base Stats input might already include the derived values if user inputs "Total Panel"?
    // In our App, user likely inputs "Base Attributes" (naked) OR "Final Panel" directly for simulation.
    // For "Equipment Simulator", we likely start with "Naked Character Stats" + "Equipments".

    // Let's assume `baseStats` contains the Naked Attributes and Naked Combat Stats.
    // We calculate the *Added* dervied stats from the *Total* attributes?
    // No, standard RPG logic:
    // Total Attr = Base Attr + Equip Attr
    // Derived Stats = Function(Total Attr)
    // Total Stats = Base Flat Stats + Equip Flat Stats + Derived Stats

    // Since `final` already has (Base Attr + Equip Attr) and (Base Flat + Equip Flat),
    // We just need to add the Derived Stats to `final`.
    // BUT we must differentiate "Base Flat" from "Derived from Base Attr".
    // If `baseStats` input already has `min_attack` calculated from `base.agility`, we prevent double counting.

    // DECISION: `calculatePanelStats` assumes `baseStats` input has correctly separated "Flat" vs "Attributes".
    // OR, we recalculate derived stats from scratch using the Totals in `final`.
    // Yes, recalculate derived is safer.

    const derived = convertAttributesToStats(
        final.constitution,
        final.defense_stat,
        final.agility,
        final.technique,
        final.strength
    );

    // Add derived to final
    // Note: final.hp and final.defense might already have base flat values (from defaults), so we ADD derived.
    final.hp += derived.hp;
    final.defense += derived.defense;

    final.min_attack += derived.min_attack;
    final.max_attack += derived.max_attack;

    // Crit/Intent Rates from Attributes are added to the Rate
    final.crit_rate += derived.crit_rate_bonus;
    final.intent_rate += derived.intent_rate_bonus;

    return final;
}
