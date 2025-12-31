/**
 * JSON 数据加载器与类型定义
 * Provides typed access to game data configurations
 */

import affixValuesData from './json/affix_values.json';
import affixPoolsData from './json/affix_pools.json';
import constantsData from './json/constants.json';
import martialArtsData from './json/martial_arts.json';
import optimalBuildsData from './json/optimal_builds.json';
import terminologyData from './json/terminology.json';

// ============================================================
// Type Definitions (derived from JSON structure)
// ============================================================

export type SchoolType = 'MingJin' | 'LieShi' | 'QianSi' | 'PoZhu';
export type SubSchoolType =
    | 'MingJin_Hong' | 'MingJin_Ying'
    | 'LieShi_Wei' | 'LieShi_Jun'
    | 'QianSi_Yu' | 'QianSi_Lin'
    | 'PoZhu_Feng' | 'PoZhu_Chen' | 'PoZhu_Yuan';

export type SlotCategory = 'weapon' | 'accessory' | 'armor_top' | 'armor_bottom';

export interface AffixRange {
    min: number;
    max: number;
}

export interface AffixDefinition {
    name: string;
    category: string;
    isPercent?: boolean;
    conversion?: Record<string, number>;
    ranges: Record<string, AffixRange>;
}

export interface SchoolInfo {
    name: string;
    subSchools: string[];
    subNames: string[];
}

export interface SubSchoolInfo {
    id: SubSchoolType;
    name: string;
    parentSchool: SchoolType;
    description: string;
}

export interface SlotInfo {
    category: SlotCategory;
    name: string;
}

export interface RareAffix {
    type: string;
    name: string;
    value: number;
}

export interface DingyinAffix {
    type: string;
    name: string;
    min: number;
    max: number;
}

export interface ResistanceEntry {
    minLevel: number;
    maxLevel: number;
    resistance: number;
    title: string;
}

export interface TechniqueInfo {
    name: string;
    bonuses: Record<string, number>;
}

export interface MartialArtSchool {
    name: string;
    techniques: TechniqueInfo[];
}

// ============================================================
// Loaded Data (with type assertions)
// ============================================================

export const AffixValues = affixValuesData as {
    version: string;
    description: string;
    affixes: Record<string, AffixDefinition>;
};

export const AffixPools = affixPoolsData as {
    version: string;
    description: string;
    slots: Record<string, SlotInfo>;
    schools: Record<SchoolType, SchoolInfo>;
    subSchools: Record<SubSchoolType, SubSchoolInfo>;
    initial: Record<SlotCategory | 'armor_bottom', string[]>;
    tiaolu: {
        description: string;
        weapon: string[];
        accessory: string[];
        armor_top: string[];
        armor_bottom: string[];
    };
    zhunlv: {
        description: string;
    } & Record<SchoolType, {
        weapon: string[];
        accessory: string[];
        armor: string[];
        armor_feng?: string[];
    }>;
    tuning?: {
        _deprecated: string;
    } & Record<SchoolType, Record<string, string[]>>;
    rare: {
        _comment?: string;
        weapon?: RareAffix[];
        accessory?: RareAffix[];
        armor_top?: RareAffix[];
        armor_bottom?: RareAffix[];
    };
    dingyin: {
        general: DingyinAffix[];
        armor: {
            description: string;
            min: number;
            max: number;
            skills: Record<string, string[]>;
        };
    };
    conflictRules?: {
        description: string;
        strict: boolean;
        allowedDuplicates: {
            [key: string]: string[] | string | undefined;
        };
    };
};

export const MartialArtsData = martialArtsData as unknown as {
    version: string;
    description: string;
    schools: Record<SubSchoolType, MartialArtSchool>;
    universal: MartialArtSchool;
    buffs: Record<string, { type: string; value: number }>;
};

export const GameConstants = constantsData as {
    version: string;
    description: string;
    levelCaps: { maxWorldLevel: number; maxCharacterLevel: number };
    resistanceTable: ResistanceEntry[];
    maxLevelResistance: number;
    damageMultipliers: {
        intent: number;
        crit: number;
        normal: number;
        glancing: number;
    };
    caps: {
        effectiveCritRate: number;
        effectiveIntentRate: number;
        basePrecision: number;
    };
    attributeConversion: Record<string, Record<string, number>>;
    equipmentSlots: {
        total: number;
        affixSlotsPerEquipment: number;
        list: string[];
    };
    affixSlotNames: Record<string, string>;
    combat: {
        standardBoss: {
            level: number;
            defense: number;
            resistance: number;
            isBoss: boolean;
        };
        referenceSkill: {
            name: string;
            hits: number;
            multiplierPerHit: number[];
            type: string;
        };
    };
    evaluation: {
        thresholds: {
            resetEfficiency: number;
            minGain: number;
            nearCap: number;
            mediumCap: number;
        };
        goldAffixValues: {
            critRate: number;
            intentRate: number;
            maxAttack: number;
        };
        warningThresholds: {
            highAttackLowBonus: {
                attackThreshold: number;
                bonusThreshold: number;
            };
            intentVsCritDamage: {
                totalRateThreshold: number;
                damageRatio: number;
            };
            precisionRange: {
                min: number;
                max: number;
            };
        };
        efficiencyDefaults: {
            base: number;
        };
    };
    optimization: {
        resetThreshold: number;
        minGainThreshold: number;
        maxSuggestions: number;
    };
};

// Optimal builds data is imported with types from ../types/index.ts
// The actual OptimalBuild type is defined there to avoid circular dependencies
export const OptimalBuildsData = optimalBuildsData as unknown as {
    version: string;
    description: string;
    builds: Record<string, {
        school: SchoolType;
        subSchool: SubSchoolType;
        name: string;
        description: string;
        expectedDamage: number;
        createdAt: string;
        version: string;
        slots: Record<string, {
            slot: string;
            gong: Array<{
                name: string;
                type: string;
                value: number;
                range?: number[];
                quality?: string;
            }>;
            shang: {
                name: string;
                type: string;
                value: number;
                range?: number[];
                quality?: string;
            };
            jue: {
                name: string;
                type: string;
                value: number;
                range?: number[];
                quality?: string;
            };
            zhi: {
                name: string;
                type: string;
                value: number;
                range?: number[];
                quality?: string;
            };
            yu: {
                name: string;
                type: string;
                value: number;
                range?: number[];
                quality?: string;
            };
            dingyin: {
                name: string;
                type: string;
                value: number;
                range?: number[];
                quality?: string;
            };
        }>;
    }>;
};

// Terminology data for displaying Chinese attribute names
export const TerminologyData = terminologyData as unknown as {
    version: string;
    description: string;
    attributes: {
        [category: string]: {
            [key: string]: string;
        };
    };
    percent_attributes: string[];
    min_max_pairs: Array<[string, string, string]>;
};

/**
 * Get Chinese display name for an attribute type
 * Searches through all categories in the terminology data
 */
export function getAttributeName(attributeType: string): string | null {
    // Flatten all attribute categories into a single lookup
    const allAttributes: Record<string, string> = {};
    Object.values(TerminologyData.attributes).forEach(category => {
        Object.entries(category).forEach(([key, value]) => {
            allAttributes[key] = value;
        });
    });
    return allAttributes[attributeType] ?? null;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get affix definition by stat type
 */
export function getAffixDefinition(statType: string): AffixDefinition | undefined {
    return AffixValues.affixes[statType];
}

/**
 * Get affix display name
 */
export function getAffixName(statType: string): string {
    return AffixValues.affixes[statType]?.name ?? statType;
}

/**
 * Get affix range for a specific context
 */
export function getAffixRange(statType: string, context: string): AffixRange | undefined {
    const affix = AffixValues.affixes[statType];
    if (!affix) return undefined;
    return affix.ranges[context];
}

/**
 * Get tuning pool for a slot and school
 */
export function getTuningPoolFromConfig(
    slotCategory: SlotCategory,
    school: SchoolType
): string[] {
    if (!AffixPools.tuning) return [];
    const schoolPools = AffixPools.tuning[school];
    if (!schoolPools) return [];

    // Map slot category to pool key
    if (slotCategory === 'weapon') {
        return schoolPools.weapon || [];
    }
    if (slotCategory === 'accessory') {
        return schoolPools.accessory || [];
    }
    // armor_top and armor_bottom both use 'armor'
    return schoolPools.armor || [];
}

/**
 * Get initial affix pool for a slot
 */
export function getInitialPoolFromConfig(slotCategory: SlotCategory): string[] {
    return AffixPools.initial[slotCategory] || [];
}

/**
 * Get rare affix pool for a slot category
 */
export function getRarePoolFromConfig(slotCategory: SlotCategory): RareAffix[] {
    return AffixPools.rare[slotCategory] || [];
}

/**
 * Get dingyin pool for a slot
 */
export function getDingyinPoolFromConfig(slotCategory: SlotCategory): DingyinAffix[] | { min: number; max: number } {
    if (slotCategory === 'weapon' || slotCategory === 'accessory') {
        return AffixPools.dingyin.general;
    }
    return {
        min: AffixPools.dingyin.armor.min,
        max: AffixPools.dingyin.armor.max
    };
}

/**
 * Get resistance for a given level
 */
export function getResistanceForLevel(level: number): number {
    const entry = GameConstants.resistanceTable.find(
        e => level >= e.minLevel && level <= e.maxLevel
    );
    return entry?.resistance ?? 0;
}

/**
 * Get slot category from slot name
 */
export function getSlotCategory(slot: string): SlotCategory {
    const info = AffixPools.slots[slot];
    return info?.category ?? 'weapon';
}

/**
 * Get school display name
 */
export function getSchoolName(school: SchoolType): string {
    return AffixPools.schools[school]?.name ?? school;
}

/**
 * Get all schools
 */
export function getAllSchools(): SchoolType[] {
    return Object.keys(AffixPools.schools) as SchoolType[];
}

/**
 * Get all sub-schools
 */
export function getAllSubSchools(): SubSchoolType[] {
    return Object.keys(AffixPools.subSchools) as SubSchoolType[];
}

/**
 * Get sub-school info
 */
export function getSubSchoolInfo(subSchool: SubSchoolType): SubSchoolInfo {
    return AffixPools.subSchools[subSchool];
}

/**
 * Get sub-school display name
 */
export function getSubSchoolName(subSchool: SubSchoolType): string {
    return AffixPools.subSchools[subSchool]?.name ?? subSchool;
}

/**
 * Get parent school from sub-school
 */
export function getParentSchool(subSchool: SubSchoolType): SchoolType {
    return AffixPools.subSchools[subSchool]?.parentSchool ?? 'LieShi';
}

/**
 * Get 调律词条库 (Tiaolu - Initial Tuning Pool)
 * This pool is used for first-time tuning, has high randomness, not school-specific
 */
export function getTiaoluPoolFromConfig(slotCategory: SlotCategory): string[] {
    if (slotCategory === 'weapon') {
        return AffixPools.tiaolu.weapon || [];
    }
    if (slotCategory === 'accessory') {
        return AffixPools.tiaolu.accessory || [];
    }
    if (slotCategory === 'armor_top') {
        return AffixPools.tiaolu.armor_top || [];
    }
    if (slotCategory === 'armor_bottom') {
        return AffixPools.tiaolu.armor_bottom || [];
    }
    return [];
}

/**
 * Get 转律词条库 (Zhunlv - Conversion Pool)
 * This pool is used for re-tuning, school-specific, more targeted
 */
export function getZhunlvPoolFromConfig(
    slotCategory: SlotCategory,
    school: SchoolType
): string[] {
    const schoolPools = AffixPools.zhunlv[school];
    if (!schoolPools) return [];

    // Map slot category to pool key
    if (slotCategory === 'weapon') {
        return schoolPools.weapon || [];
    }
    if (slotCategory === 'accessory') {
        return schoolPools.accessory || [];
    }
    // armor_top and armor_bottom both use 'armor'
    return schoolPools.armor || [];
}

/**
 * Get techniques for a sub-school
 */
export function getTechniquesForSubSchool(subSchool: SubSchoolType): TechniqueInfo[] {
    return MartialArtsData.schools[subSchool]?.techniques || [];
}

/**
 * Get universal techniques (available to all schools)
 */
export function getUniversalTechniques(): TechniqueInfo[] {
    return MartialArtsData.universal?.techniques || [];
}

/**
 * Get all available techniques for a sub-school (including universal)
 */
export function getAllTechniquesForSubSchool(subSchool: SubSchoolType): TechniqueInfo[] {
    const schoolTechniques = getTechniquesForSubSchool(subSchool);
    const universalTechniques = getUniversalTechniques();
    return [...schoolTechniques, ...universalTechniques];
}

/**
 * Get optimal build for a specific sub-school
 * Returns the raw data structure - convert to OptimalBuild type in types/index.ts if needed
 */
export function getOptimalBuildForSubSchool(subSchool: SubSchoolType) {
    return OptimalBuildsData.builds[subSchool] ?? null;
}

/**
 * Get all optimal builds
 */
export function getAllOptimalBuilds() {
    return OptimalBuildsData.builds;
}
