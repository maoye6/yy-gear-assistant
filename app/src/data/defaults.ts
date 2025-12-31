/**
 * 默认基础属性配置
 * 大世界单人等级-十八（100级）裸装属性
 * 基于 docs/战斗属性.md 文档
 */
import type { PanelStats } from '../types';
import { EMPTY_STATS } from '../core/stats';

export const DEFAULT_BASE_STATS: PanelStats = {
    ...EMPTY_STATS,

    // 五维属性（大世界等级-十八）
    constitution: 187,   // 体
    defense_stat: 187,    // 御
    agility: 340,        // 敏
    technique: 236,      // 势
    strength: 439,       // 劲

    // 基础属性
    hp: 169799,          // 气血最大值（无气竭）
    defense: 653,         // 外功防御
    min_attack: 1735,     // 最小外功攻击
    max_attack: 3319,     // 最大外功攻击

    // 属性攻击（裂石流派示例，其他流派可通过装备词条获得）
    min_lieshi_damage: 443,  // 最小裂石攻击
    max_lieshi_damage: 947,  // 最大裂石攻击

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
    precision_rate: 1.15,    // 精准率 115.0%
    crit_rate: 1.322,        // 会心率 132.2%
    intent_rate: 0.21,       // 会意率 21.0%
    direct_crit_rate: 0.092, // 直接会心率 9.2%
    direct_intent_rate: 0,   // 直接会意率 0.0%
    glance_convert_rate: 0,  // 擦伤转化率 0.0%

    // 增伤效果
    crit_damage_bonus: 0.50,      // 会心伤害加成 50.0%
    intent_damage_bonus: 0.35,    // 会意伤害加成 35.0%
    defense_penetration: 46,      // 外功穿透 46.0
    elemental_penetration: 29.6,  // 属攻穿透 29.6
    damage_bonus_outer: 0,        // 外功伤害加成 0.0%
    damage_bonus_elemental: 0.118,// 属攻伤害加成 11.8%
    damage_bonus_all_martial: 0.032,  // 全部武学增效 3.2%
    damage_bonus_specific_martial: 0.074, // 指定武学增效 7.4%
    damage_bonus_boss: 0.061,     // 对首领单位增伤 6.1%
    damage_bonus_magic_group: 0.092, // 群体类奇术增伤 9.2%

    // 其他属性默认为0
    damage_bonus_magic_single: 0,
    damage_bonus_player: 0,
    damage_bonus_general: 0,
    damage_bonus_skill: 0,
    damage_bonus_independent: 0,
    healing_bonus_outer: 0,
    healing_bonus_elemental: 0,
    healing_bonus_crit: 0,
    resistance_outer: 0,
    damage_reduction_outer: 0,
    damage_reduction_elemental: 0,
};
