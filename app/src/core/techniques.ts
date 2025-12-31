/**
 * 心法属性计算模块
 * 计算心法提供的属性加成
 */

import type { PanelStats } from '../types';
import type { TechniqueInfo } from '../data/loaders';

/**
 * 心法属性加成计算
 * @param techniques - 已选中的心法列表
 * @returns 心法提供的属性加成
 */
export function calculateTechniqueStats(techniques: (TechniqueInfo | null)[]): Partial<PanelStats> {
    const stats: Partial<PanelStats> = {};

    techniques.forEach(technique => {
        if (!technique) return;

        // 遍历心法的所有加成
        Object.entries(technique.bonuses).forEach(([key, value]) => {
            // 将心法加成的属性名映射到 PanelStats 的键
            const statKey = mapTechniqueKeyToStatKey(key);
            if (statKey) {
                stats[statKey] = (stats[statKey] || 0) + value;
            }
        });
    });

    return stats;
}

/**
 * 将心法数据中的属性键映射到 PanelStats 的键
 * @param techniqueKey - 心法数据中的属性键
 * @returns 对应的 PanelStats 键，如果不支持则返回 null
 */
function mapTechniqueKeyToStatKey(techniqueKey: string): keyof PanelStats | null {
    const keyMap: Record<string, keyof PanelStats> = {
        // 基础属性
        'hp': 'hp',
        'defense': 'defense',
        'min_attack': 'min_attack',
        'max_attack': 'max_attack',

        // 判定类属性
        'precision_rate': 'precision_rate',
        'crit_rate': 'crit_rate',
        'intent_rate': 'intent_rate',
        'direct_crit_rate': 'direct_crit_rate',
        'direct_intent_rate': 'direct_intent_rate',

        // 增伤类属性
        'crit_damage_bonus': 'crit_damage_bonus',
        'intent_damage_bonus': 'intent_damage_bonus',
        'defense_penetration': 'defense_penetration',
        'resistance_outer': 'resistance_outer',
        'damage_reduction_outer': 'damage_reduction_outer',

        // 流派属性攻击
        'min_mingjin_damage': 'min_mingjin_damage',
        'max_mingjin_damage': 'max_mingjin_damage',
        'min_lieshi_damage': 'min_lieshi_damage',
        'max_lieshi_damage': 'max_lieshi_damage',
        'min_qiansi_damage': 'min_qiansi_damage',
        'max_qiansi_damage': 'max_qiansi_damage',
        'min_pozhu_damage': 'min_pozhu_damage',
        'max_pozhu_damage': 'max_pozhu_damage',

        // 治疗相关
        'healing_bonus_crit': 'healing_bonus_crit',
    };

    return keyMap[techniqueKey] || null;
}
