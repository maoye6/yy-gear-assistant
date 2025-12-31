/**
 * 词条冲突检测模块
 * 检测商/角/徵/羽槽位的词条重复冲突
 */

import type { EquipmentItem, AffixSlotType, AffixConflictResult } from '../types';
import { AffixPools } from '../data/loaders';

/**
 * 检查单件装备是否存在词条冲突
 *
 * 规则：同一件装备的商/角/徵/羽四个槽位不能选择相同类型的词条
 * 例外：某些词条对可以重复（如最大外攻和最小外攻）
 *
 * @param equipment - 要检查的装备
 * @returns 冲突检测结果
 */
export function checkAffixConflict(equipment: EquipmentItem): AffixConflictResult {
    const conflicts: AffixConflictResult['conflicts'] = [];

    // 获取商/角/徵/羽的词条（不包括宫和定音）
    const tiaoluSlots: Array<{ slot: AffixSlotType; affix: import('../types').Affix | undefined }> = [
        { slot: 'Shang', affix: equipment.affix_shang },
        { slot: 'Jue', affix: equipment.affix_jue },
        { slot: 'Zhi', affix: equipment.affix_zhi },
        { slot: 'Yu', affix: equipment.affix_yu }
    ];

    // 获取防重复规则配置
    const allowedDuplicates = AffixPools.conflictRules?.allowedDuplicates || {};

    // 检测两两冲突
    for (let i = 0; i < tiaoluSlots.length; i++) {
        for (let j = i + 1; j < tiaoluSlots.length; j++) {
            const slotA = tiaoluSlots[i];
            const slotB = tiaoluSlots[j];

            // 如果有一个槽位为空，跳过
            if (!slotA.affix || !slotB.affix) continue;

            const typeA = slotA.affix.type;
            const typeB = slotB.affix.type;

            // 检查是否冲突（相同类型且不在允许列表中）
            if (typeA === typeB) {
                // 检查是否在允许重复列表中
                const allowedList = allowedDuplicates[typeA] || [];
                if (!allowedList.includes(typeB)) {
                    // 检查是否已经记录过这个冲突（避免重复）
                    const existingConflict = conflicts.find(c =>
                        c.slot === equipment.slot &&
                        c.affixSlot === slotA.slot &&
                        c.affixName === slotA.affix?.name
                    );

                    if (!existingConflict) {
                        conflicts.push({
                            slot: equipment.slot,
                            affixSlot: slotA.slot,
                            affixName: slotA.affix.name,
                            conflictingWith: [slotB.slot]
                        });
                    } else {
                        // 如果已存在，添加到冲突列表
                        if (!existingConflict.conflictingWith.includes(slotB.slot)) {
                            existingConflict.conflictingWith.push(slotB.slot);
                        }
                    }
                }
            }
        }
    }

    return {
        hasConflict: conflicts.length > 0,
        conflicts
    };
}

/**
 * 检查所有装备是否存在词条冲突
 *
 * @param equipments - 装备数组
 * @returns 汇总的冲突检测结果
 */
export function checkAllAffixConflicts(equipments: EquipmentItem[]): AffixConflictResult {
    const allConflicts: AffixConflictResult['conflicts'] = [];

    for (const equipment of equipments) {
        // 跳过空装备
        if (!equipment) continue;

        const result = checkAffixConflict(equipment);
        allConflicts.push(...result.conflicts);
    }

    return {
        hasConflict: allConflicts.length > 0,
        conflicts: allConflicts
    };
}

/**
 * 获取已选词条类型列表（用于UI禁用）
 *
 * @param equipment - 装备对象
 * @returns 已选词条的类型数组
 */
export function getSelectedAffixTypes(equipment: EquipmentItem): string[] {
    const types: string[] = [];

    if (equipment.affix_shang) types.push(equipment.affix_shang.type);
    if (equipment.affix_jue) types.push(equipment.affix_jue.type);
    if (equipment.affix_zhi) types.push(equipment.affix_zhi.type);
    if (equipment.affix_yu) types.push(equipment.affix_yu.type);

    return types;
}

/**
 * 检查某个词条类型是否与已选词条冲突
 *
 * @param affixType - 要检查的词条类型
 * @param selectedTypes - 已选词条类型列表
 * @param _currentSlot - 当前槽位（预留参数，暂未使用）
 * @returns 是否冲突
 */
export function isAffixTypeConflicted(
    affixType: string,
    selectedTypes: string[],
    _currentSlot?: AffixSlotType
): boolean {
    // 获取允许重复的配置
    const allowedDuplicates = AffixPools.conflictRules?.allowedDuplicates || {};

    // 检查是否与任何已选类型冲突
    for (const selectedType of selectedTypes) {
        if (selectedType === affixType) {
            // 类型相同，检查是否在允许列表中
            const allowedList = allowedDuplicates[affixType] || [];
            if (allowedList.length === 0) {
                // 没有允许列表，说明不能重复
                return true;
            }
        }
    }

    return false;
}

/**
 * 获取冲突的提示信息
 *
 * @param conflictResult - 冲突检测结果
 * @returns 格式化的提示信息
 */
export function getConflictMessage(conflictResult: AffixConflictResult): string[] {
    if (!conflictResult.hasConflict) return [];

    const messages: string[] = [];

    for (const conflict of conflictResult.conflicts) {
        const slotNames: Record<string, string> = {
            'MainWeapon': '主武器',
            'SubWeapon': '副武器',
            'Ring': '戒指',
            'Pendant': '佩饰',
            'Head': '头',
            'Chest': '胸',
            'Legs': '胫',
            'Wrist': '腕'
        };

        const affixSlotNames: Record<string, string> = {
            'Shang': '商',
            'Jue': '角',
            'Zhi': '徵',
            'Yu': '羽'
        };

        const equipmentName = slotNames[conflict.slot] || conflict.slot;
        const affixSlotName = affixSlotNames[conflict.affixSlot] || conflict.affixSlot;
        const conflictingSlots = conflict.conflictingWith.map(s => affixSlotNames[s] || s).join('、');

        messages.push(
            `[${equipmentName}] ${affixSlotName}槽位的「${conflict.affixName}」与${conflictingSlots}槽位冲突`
        );
    }

    return messages;
}
