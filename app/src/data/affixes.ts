/**
 * 装备词条数据库 (Affix Database)
 * 基于 JSON 配置驱动，严格遵循 docs/装备系统.md 文档
 */

import type { Affix, StatType, EquipmentSlot } from '../types';
import {
    AffixValues,
    AffixPools,
    getSlotCategory,
    type SchoolType,
    type SubSchoolType,
    type RareAffix,
    type DingyinAffix
} from './loaders';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create affix from JSON config
 */
function createAffix(
    statType: string,
    rangeContext: string,
    overrideRange?: { min: number; max: number }
): Affix | null {
    const def = AffixValues.affixes[statType];
    if (!def) return null;

    const range = overrideRange ?? def.ranges[rangeContext];
    if (!range) return null;

    return {
        name: def.name,
        type: statType as StatType,
        value: range.max, // Default to max for simulation
        range: [range.min, range.max],
        quality: 'Legendary'
    };
}

/**
 * Create multiple affixes from a list of stat types
 */
function createAffixList(statTypes: string[], rangeContext: string): Affix[] {
    return statTypes
        .map(type => createAffix(type, rangeContext))
        .filter((a): a is Affix => a !== null);
}

// ============================================================
// Public API - Compatible with existing code
// ============================================================

/**
 * 获取初始词条池（宫槽）
 */
export function getInitialPool(slot: EquipmentSlot): Affix[] {
    const category = getSlotCategory(slot);
    const statTypes = AffixPools.initial[category] || [];

    // Determine range context based on category
    let rangeContext = 'initial_armor';
    if (category === 'weapon') rangeContext = 'initial_weapon';
    else if (category === 'accessory') rangeContext = 'initial_accessory';
    else if (category === 'armor_bottom') rangeContext = 'initial_armor';

    return createAffixList(statTypes, rangeContext);
}

/**
 * 获取调律词条池（商/角/徵/羽槽 - 包含所有可能的词条）
 */
export function getTiaoluPool(slot: EquipmentSlot): Affix[] {
    const category = getSlotCategory(slot);

    // Get tiaolu pool based on slot category
    let statTypes: string[];
    if (category === 'weapon') {
        statTypes = AffixPools.tiaolu.weapon || [];
    } else if (category === 'accessory') {
        statTypes = AffixPools.tiaolu.accessory || [];
    } else if (category === 'armor_top') {
        statTypes = AffixPools.tiaolu.armor_top || [];
    } else if (category === 'armor_bottom') {
        statTypes = AffixPools.tiaolu.armor_bottom || [];
    } else {
        // Fallback
        statTypes = AffixPools.tiaolu.armor_top || [];
    }

    return createAffixList(statTypes, 'tuning');
}

/**
 * 获取转律词条池（转律专用，按流派区分，针对性更强）
 * 用于装备调律系统的"转律"功能推荐
 */
export function getZhunlvPool(
    slot: EquipmentSlot,
    school: SchoolType = 'LieShi'
): Affix[] {
    const category = getSlotCategory(slot);
    const schoolPools = AffixPools.zhunlv[school];
    if (!schoolPools) return [];

    // Determine pool key
    let poolKey: 'weapon' | 'accessory' | 'armor';
    if (category === 'weapon') {
        poolKey = 'weapon';
    } else if (category === 'accessory') {
        poolKey = 'accessory';
    } else {
        poolKey = 'armor';
    }

    const statTypes = schoolPools[poolKey] || [];
    return createAffixList(statTypes, 'tuning');
}

/**
 * 获取转律词条池（按细分流派区分，支持破竹流派风词条的特殊处理）
 * 用于装备编辑器中的商/角/徵/羽槽位词条选择
 */
export function getZhunlvPoolBySubSchool(
    slot: EquipmentSlot,
    subSchool: SubSchoolType
): Affix[] {
    const category = getSlotCategory(slot);

    // 特殊处理：破竹流派的风词条（PoZhu_Feng）有额外的防御属性选项
    if (subSchool === 'PoZhu_Feng' && category !== 'weapon' && category !== 'accessory') {
        // 风词条 = 基础转律词条池 + armor_feng 防御属性
        const basePool = getZhunlvPool(slot, 'PoZhu');
        const fengStats = AffixPools.zhunlv['PoZhu']?.['armor_feng'] || [];
        const fengAffixes = createAffixList(fengStats, 'tuning');
        return [...basePool, ...fengAffixes];
    }

    // 其他情况使用父流派的转律词条池
    const parentSchool = getParentSchool(subSchool);
    return getZhunlvPool(slot, parentSchool);
}

/**
 * 获取父流派（辅助函数）
 */
function getParentSchool(subSchool: SubSchoolType): SchoolType {
    const schoolInfo = AffixPools.subSchools[subSchool];
    return schoolInfo?.parentSchool || 'LieShi';
}

/**
 * 获取调律词条池（兼容旧接口 - 现在使用调律词条库）
 * @deprecated 请使用 getTiaoluPool 获取调律词条库，或 getZhunlvPool 获取转律词条库
 */
export function getTuningPool(
    slot: EquipmentSlot,
    _school: SchoolType = 'LieShi'
): Affix[] {
    // 现在返回调律词条库（不区分流派，随机度高）
    // 这样用户在配置装备时可以选择到所有实际调律中可能出现的词条
    return getTiaoluPool(slot);
}

/**
 * 获取稀有词条池
 */
export function getRarePool(slot: EquipmentSlot): Affix[] {
    const category = getSlotCategory(slot);
    const rares = AffixPools.rare[category] || [];

    return rares.map((rare: RareAffix) => ({
        name: rare.name,
        type: rare.type as StatType,
        value: rare.value,
        range: [rare.value, rare.value] as [number, number],
        quality: 'Legendary' as const
    }));
}

/**
 * 获取定音词条池
 */
export function getDingyinPool(slot: EquipmentSlot): Affix[] {
    const category = getSlotCategory(slot);

    if (category === 'weapon' || category === 'accessory') {
        // General dingyin pool
        return AffixPools.dingyin.general.map((d: DingyinAffix) => ({
            name: d.name,
            type: d.type as StatType,
            value: d.max,
            range: [d.min, d.max] as [number, number],
            quality: 'Legendary' as const
        }));
    }

    // Armor dingyin - skill bonus
    const armorDingyin = AffixPools.dingyin.armor;
    return [{
        name: '技能增效',
        type: 'damage_bonus_specific_martial' as StatType,
        value: armorDingyin.max,
        range: [armorDingyin.min, armorDingyin.max],
        quality: 'Legendary'
    }];
}

// ============================================================
// Legacy Exports (for backward compatibility during migration)
// ============================================================

/**
 * @deprecated Use JSON-based pools via loaders.ts instead
 */
export const INITIAL_AFFIX_POOL = {
    Weapon: getInitialPool('MainWeapon'),
    Accessory: getInitialPool('Ring'),
    ArmorTop: getInitialPool('Head'),
    ArmorBottom: getInitialPool('Legs'),
};

/**
 * @deprecated Use getTuningPool with school parameter instead
 */
export const TUNING_POOL = {
    Weapon_MingJin: getTuningPool('MainWeapon', 'MingJin'),
    Accessory_MingJin: getTuningPool('Ring', 'MingJin'),
    Armor_MingJin: getTuningPool('Head', 'MingJin'),
    Armor_QianSi: getTuningPool('Head', 'QianSi'),
    Armor_PoZhu: getTuningPool('Head', 'PoZhu'),
    Armor_LieShi: getTuningPool('Head', 'LieShi'),
};

/**
 * @deprecated Use getRarePool instead
 */
export const RARE_POOL = {
    Weapon: getRarePool('MainWeapon'),
    Accessory: getRarePool('Ring'),
    ArmorTop: getRarePool('Head'),
    ArmorBottom: getRarePool('Legs'),
};

/**
 * @deprecated Use getDingyinPool instead
 */
export const DINGYIN_POOL = {
    General: getDingyinPool('MainWeapon'),
    Armor: getDingyinPool('Head'),
};
