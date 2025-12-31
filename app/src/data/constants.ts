/**
 * 游戏常量定义
 * 基于 JSON 配置驱动
 */

import { GameConstants } from './loaders';

// Re-export from JSON config for backward compatibility
export const RESISTANCE_TABLE = GameConstants.resistanceTable;
export const MAX_LEVEL_RESISTANCE = GameConstants.maxLevelResistance;
export const DAMAGE_MULTIPLIERS = {
    INTENT: GameConstants.damageMultipliers.intent,
    CRIT: GameConstants.damageMultipliers.crit,
    NORMAL: GameConstants.damageMultipliers.normal,
    GLANCING: GameConstants.damageMultipliers.glancing
};

// New exports from JSON
export const CAPS = GameConstants.caps;
export const ATTRIBUTE_CONVERSION = GameConstants.attributeConversion;
export const EQUIPMENT_SLOTS = GameConstants.equipmentSlots;
export const AFFIX_SLOT_NAMES = GameConstants.affixSlotNames;
