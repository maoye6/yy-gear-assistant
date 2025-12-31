import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { EquipmentSlot } from './EquipmentSlot';
import { ArmorSetSlot } from './ArmorSetSlot';
import { EquipmentEditor } from './EquipmentEditor';
import type { EquipmentSlot as SlotType } from '../types';

// 装备布局：5列 x 2行
// 第1行：主武器 | 副武器 | 头甲 | 胸甲 | 弓
// 第2行：环     | 佩     | 胫甲 | 腕甲 | 诀
const EQUIPMENT_LAYOUT: (SlotType | 'Bow' | 'Skill')[][] = [
    ['MainWeapon', 'SubWeapon', 'Head', 'Chest', 'Bow'],
    ['Ring', 'Pendant', 'Legs', 'Wrist', 'Skill']
];

export const EquipmentGrid: React.FC = () => {
    const { equipments } = useAppStore();
    const [editingSlot, setEditingSlot] = useState<SlotType | null>(null);

    const handleSlotClick = (slot: SlotType) => {
        setEditingSlot(slot);
    };

    const isArmorSetSlot = (slot: string): slot is 'Bow' | 'Skill' => {
        return slot === 'Bow' || slot === 'Skill';
    };

    return (
        <>
            <div className="equipment-grid">
                {EQUIPMENT_LAYOUT.flat().map(slot => (
                    isArmorSetSlot(slot) ? (
                        <ArmorSetSlot
                            key={slot}
                            slot={slot}
                        />
                    ) : (
                        <EquipmentSlot
                            key={slot}
                            slot={slot}
                            item={equipments[slot]}
                            onClick={() => handleSlotClick(slot)}
                        />
                    )
                ))}
            </div>

            {editingSlot && (
                <EquipmentEditor
                    slot={editingSlot}
                    isOpen={!!editingSlot}
                    onClose={() => setEditingSlot(null)}
                />
            )}
        </>
    );
};
