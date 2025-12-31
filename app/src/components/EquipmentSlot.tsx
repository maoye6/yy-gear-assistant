import React from 'react';
import type { EquipmentItem, EquipmentSlot as SlotType } from '../types';

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
            style={{
                border: item ? '1px solid rgba(0,113,227,0.3)' : '1px dashed rgba(0,0,0,0.15)',
                borderRadius: '16px',
                padding: '14px',
                minHeight: '160px',
                cursor: 'pointer',
                background: item
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                boxShadow: item ? '0 2px 12px rgba(0,113,227,0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item ? '#0071e3' : 'rgba(0,0,0,0.3)';
                e.currentTarget.style.background = item ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = item ? 'rgba(0,113,227,0.3)' : '1px dashed rgba(0,0,0,0.15)';
                e.currentTarget.style.background = item ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)';
            }}
        >
            {/* 装备部位名称 */}
            <div style={{
                fontWeight: '600',
                marginBottom: '10px',
                color: '#1d1d1f',
                fontSize: '0.9rem',
                textAlign: 'center',
                padding: '4px 8px',
                background: 'rgba(0,113,227,0.08)',
                borderRadius: '8px'
            }}>
                {SLOT_NAMES[slot]}
            </div>

            {item ? (
                <>
                    {/* 词条列表 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {AFFIX_POSITIONS.map(position => {
                            const affix = affixList.find(a => a.position === position);
                            if (!affix) {
                                return (
                                    <div
                                        key={position}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(0,0,0,0.02)',
                                            opacity: 0.5
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: '#999',
                                            fontWeight: '500',
                                            minWidth: '28px',
                                            textAlign: 'center'
                                        }}>
                                            {position}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#999',
                                            flex: 1
                                        }}>
                                            空
                                        </span>
                                    </div>
                                );
                            }

                            const isFull = position === '定音';
                            return (
                                <div
                                    key={position}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '3px 8px',
                                        borderRadius: '8px',
                                        background: isFull
                                            ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))'
                                            : 'rgba(0,113,227,0.06)',
                                        border: isFull
                                            ? '1px solid rgba(255,215,0,0.3)'
                                            : '1px solid rgba(0,113,227,0.15)'
                                    }}
                                >
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: isFull ? '#d97706' : '#0071e3',
                                        fontWeight: '600',
                                        minWidth: '28px',
                                        textAlign: 'center'
                                    }}>
                                        {position}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: '#1d1d1f',
                                        flex: 1,
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {affix.name}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: '#0071e3',
                                        fontWeight: '600',
                                        minWidth: '60px',
                                        textAlign: 'right',
                                        flexShrink: 0
                                    }}>
                                        +{formatAffixValue(affix.name, affix.value)}
                                    </span>
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
                                boxSizing: 'border-box',
                                fontWeight: '400',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
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
