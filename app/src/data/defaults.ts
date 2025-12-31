/**
 * 默认基础属性配置
 * 裸装基础属性
 */
import type { PanelStats } from '../types';
import { EMPTY_STATS } from '../core/stats';

export const DEFAULT_BASE_STATS: PanelStats = {
    ...EMPTY_STATS,

    // 五维属性（裸装基础值）
    constitution: 164,   // 体
    defense_stat: 164,   // 御
    strength: 164,       // 劲
    agility: 164,        // 敏
    technique: 164,      // 势

    // 基础属性
    hp: 169799,          // 气血最大值

    // 属性攻击（范围 360~721）
    min_lieshi_damage: 360,  // 最小属性攻击
    max_lieshi_damage: 721,  // 最大属性攻击

    // 其他流派属性攻击默认为0
    min_mingjin_damage: 0,
    max_mingjin_damage: 0,
    min_qiansi_damage: 0,
    max_qiansi_damage: 0,
    min_pozhu_damage: 0,
    max_pozhu_damage: 0,
    min_wuxiang_damage: 0,
    max_wuxiang_damage: 0,

    // 判定属性
    precision_rate: 0,       // 精准率
    crit_rate: 0,            // 会心率
    intent_rate: 0,          // 会意率
    direct_crit_rate: 0,     // 直接会心率
    direct_intent_rate: 0,   // 直接会意率
    glance_convert_rate: 0,  // 擦伤转化率

    // 增伤效果
    crit_damage_bonus: 0.50,      // 会心伤害加成 50%
    intent_damage_bonus: 0.35,    // 会意伤害加成 35%

    // 判定抗性（85%）
    resistance_outer: 0.85,

    // 其他属性默认为0
    min_attack: 0,
    max_attack: 0,
    defense: 0,
    defense_penetration: 0,
    elemental_penetration: 0,
    damage_bonus_outer: 0,
    damage_bonus_elemental: 0,
    damage_bonus_all_martial: 0,
    damage_bonus_specific_martial: 0,
    damage_bonus_boss: 0,
    damage_bonus_player: 0,
    damage_bonus_magic_single: 0,
    damage_bonus_magic_group: 0,
    damage_bonus_general: 0,
    damage_bonus_skill: 0,
    damage_bonus_independent: 0,
    healing_bonus_outer: 0,
    healing_bonus_elemental: 0,
    healing_bonus_crit: 0,
    damage_reduction_outer: 0,
    damage_reduction_elemental: 0,
    fixed_damage: 0,
};
