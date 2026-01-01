import React from 'react';
import type { EquipmentItem, EquipmentSlot as SlotType } from '../types';
import styles from './EquipmentSlot.module.css';

interface Props {
    slot: SlotType;
    item: EquipmentItem | null;
    onClick: () => void;
}

const SLOT_NAMES: Record<SlotType, string> = {
    MainWeapon: '主武器',
    SubWeapon: '副武器',
    Head: '头甲',
    Chest: '胸甲',
    Legs: '胫甲',
    Wrist: '腕甲',
    Ring: '环',
    Pendant: '佩'
};

// 词条位置配置
const AFFIX_POSITIONS = ['宫', '商', '角', '徵', '羽', '定音'] as const;

// 获取装备的所有词条
function getAffixList(item: EquipmentItem) {
    const affixes: Array<{ name: string; value: number; position: string }> = [];

    // 宫
    item.affix_gong.forEach(a => {
        affixes.push({ name: a.name, value: a.value, position: '宫' });
    });

    // 商角徵羽
    [item.affix_shang, item.affix_jue, item.affix_zhi, item.affix_yu].forEach((affix, idx) => {
        if (affix) {
            affixes.push({ name: affix.name, value: affix.value, position: ['商', '角', '徵', '羽'][idx] });
        }
    });

    // 定音
    if (item.affix_dingyin) {
        affixes.push({ name: item.affix_dingyin.name, value: item.affix_dingyin.value, position: '定音' });
    }

    return affixes;
}

// 格式化词条数值显示
function formatAffixValue(name: string, value: number): string {
    // 百分比属性（外功穿透不是百分比）
    const percentAttrs = ['精准率', '会心率', '会意率', '直接会心', '属攻穿透',
        '属攻增伤', '全武学增效', '指定武学增效', '对首领增伤'];

    if (percentAttrs.some(attr => name.includes(attr))) {
        return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(1);
}

export const EquipmentSlot: React.FC<Props> = ({ slot, item, onClick }) => {
    const affixList = item ? getAffixList(item) : [];

    return (
        <div
            onClick={onClick}
            className={`${styles.slot} ${item ? styles['slot--filled'] : ''}`}
        >
            {/* 装备部位名称 */}
            <div className={styles.slotName}>
                {SLOT_NAMES[slot]}
            </div>

            {item ? (
                <>
                    {/* 词条列表 */}
                    <div className={styles.affixList}>
                        {AFFIX_POSITIONS.map(position => {
                            const affix = affixList.find(a => a.position === position);
                            if (!affix) {
                                return (
                                    <div key={position} className={`${styles.affixRow} ${styles['affixRow--empty']}`}>
                                        <span className={styles.affixLabel}>{position}</span>
                                        <span className={styles.affixValue}>空</span>
                                    </div>
                                );
                            }

                            const isFull = position === '定音';
                            return (
                                <div
                                    key={position}
                                    className={`${styles.affixRow} ${styles['affixRow--filled']} ${isFull ? styles['affixRow--dingyin'] : ''}`}
                                >
                                    <span className={`${styles.affixLabel} ${isFull ? styles['affixLabel--dingyin'] : ''}`}>
                                        {position}
                                    </span>
                                    <span className={styles.affixName}>{affix.name}</span>
                                    <span className={styles.affixValue}>+{formatAffixValue(affix.name, affix.value)}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '100%',
                    marginTop: '8px'
                }}>
                    {AFFIX_POSITIONS.map(position => (
                        <div
                            key={position}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '4px 10px',
                                background: 'rgba(255,255,255,0.4)',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: '#6e6e73',
                                minHeight: '28px',
                                lineHeight: '1.5',
                                boxSizing: 'border-box'
                            }}
                        >
                            <span style={{ fontWeight: '500' }}>{position}</span>
                            <span>空</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
