/**
 * OptimalBuildDisplay - 理论最优方案展示组件
 * 默认显示统计概览，点击可展开查看详情
 */

import React, { useState, useMemo } from 'react';
import { getOptimalBuildForSubSchool, getAttributeName } from '../data/loaders';
import { useAppStore } from '../store/AppContext';

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

interface Props {
    subSchool: string;
}

export const OptimalBuildDisplay: React.FC<Props> = ({ subSchool }) => {
    const { evaluationContext } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const optimalBuildData = getOptimalBuildForSubSchool(subSchool as any);

    // 统计词条类型出现次数（不包含定音词条）
    const affixStats = useMemo(() => {
        if (!optimalBuildData) return {};

        const stats: Record<string, number> = {};
        Object.values(optimalBuildData.slots).forEach((slotConfig: any) => {
            // 统计宫词条
            slotConfig.gong?.forEach((affix: any) => {
                stats[affix.type] = (stats[affix.type] || 0) + 1;
            });
            // 统计调律词条（商角徵羽）
            ['shang', 'jue', 'zhi', 'yu'].forEach((key) => {
                const affix = (slotConfig as any)[key];
                if (affix) {
                    stats[affix.type] = (stats[affix.type] || 0) + 1;
                }
            });
            // 定音词条不计入统计
        });
        return stats;
    }, [optimalBuildData]);

    if (!optimalBuildData) {
        return (
            <div style={styles.container}>
                <div style={styles.emptyState}>
                    该流派暂无理论最优方案配置
                </div>
            </div>
        );
    }

    // 计算当前配置与最优的差距
    const currentDamage = evaluationContext?.expectedDamage || 0;
    const optimalDamage = optimalBuildData.expectedDamage || 0;
    const gap = optimalDamage - currentDamage;
    const gapPercent = optimalDamage > 0 ? (gap / optimalDamage) * 100 : 0;
    const isLargeGap = gapPercent > 15;

    return (
        <div style={styles.container}>
            {/* 标题 */}
            <h3 style={styles.panelTitle}>理论最优</h3>

            {/* 头部 - 点击切换 */}
            <div style={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <div style={styles.titleRow}>
                    <h3 style={styles.title}>{optimalBuildData.name}</h3>
                    <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                </div>
                <div style={styles.subtitle}>{optimalBuildData.description}</div>
            </div>

            {/* 伤害对比 - 紧凑版 */}
            <div style={styles.damageCompact}>
                <div style={styles.damageItem}>
                    <span style={styles.damageLabel}>当前</span>
                    <span style={styles.damageNum}>{currentDamage.toFixed(0)}</span>
                </div>
                <div style={styles.vs}>VS</div>
                <div style={styles.damageItem}>
                    <span style={styles.damageLabel}>最优</span>
                    <span style={{ ...styles.damageNum, color: '#FFD700' }}>{optimalDamage.toFixed(0)}</span>
                </div>
                <div style={{
                    ...styles.gapBadge,
                    background: isLargeGap ? 'rgba(255, 59, 48, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                    color: isLargeGap ? '#FF3B30' : '#34C759'
                }}>
                    {gapPercent > 0 ? '+' : ''}{gapPercent.toFixed(0)}%
                </div>
            </div>

            {/* 内容区域 */}
            {!isExpanded ? (
                // 统计概览模式
                <div style={styles.summarySection}>
                    <div style={styles.summaryTitle}>词条统计</div>
                    <div style={styles.statsGrid}>
                        {Object.entries(affixStats)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => {
                                const displayName = getAttributeName(type) || type;
                                return (
                                    <div key={type} style={styles.statItem}>
                                        <span style={styles.statLabel}>{displayName}</span>
                                        <span style={styles.statCount}>×{count}</span>
                                    </div>
                                );
                            })}
                    </div>
                    <div style={styles.clickHint}>
                        点击查看详情 ↓
                    </div>
                </div>
            ) : (
                // 详情模式
                <div style={styles.detailsSection}>
                    <div style={styles.detailsTitle}>装备详情</div>
                    {Object.entries(optimalBuildData.slots).map(([slotKey, slotConfig]) => (
                        <OptimalSlotCard
                            key={slotKey}
                            slotConfig={slotConfig as any}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface OptimalSlotCardProps {
    slotConfig: {
        slot: string;
        gong: Array<{ name: string; type: string; value: number }>;
        shang: { name: string; type: string; value: number };
        jue: { name: string; type: string; value: number };
        zhi: { name: string; type: string; value: number };
        yu: { name: string; type: string; value: number };
        dingyin: { name: string; type: string; value: number };
    };
}

const OptimalSlotCard: React.FC<OptimalSlotCardProps> = ({ slotConfig }) => {
    return (
        <div style={styles.slotCard}>
            <div style={styles.slotName}>{slotNames[slotConfig.slot] || slotConfig.slot}</div>
            <div style={styles.affixList}>
                {slotConfig.gong.map((affix, idx) => (
                    <AffixItem key={`gong_${idx}`} label="宫" affix={affix} />
                ))}
                <AffixItem label="商" affix={slotConfig.shang} />
                <AffixItem label="角" affix={slotConfig.jue} />
                <AffixItem label="徵" affix={slotConfig.zhi} />
                <AffixItem label="羽" affix={slotConfig.yu} />
                <AffixItem label="定音" affix={slotConfig.dingyin} />
            </div>
        </div>
    );
};

interface AffixItemProps {
    label: string;
    affix: { name: string; type: string; value: number };
}

const AffixItem: React.FC<AffixItemProps> = ({ label, affix }) => {
    const displayValue = formatAffixValue(affix.type, affix.value);

    return (
        <div style={styles.affixItem}>
            <span style={styles.affixLabel}>{label}</span>
            <span style={styles.affixName}>{affix.name}</span>
            <span style={styles.affixValue}>{displayValue}</span>
        </div>
    );
};

function formatAffixValue(type: string, value: number): string {
    const percentAttrs = ['rate', 'bonus'];
    if (percentAttrs.some(attr => type.includes(attr))) {
        return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(1);
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    panelTitle: {
        fontSize: '1.3rem',
        fontWeight: '700',
        color: '#1d1d1f',
        margin: '0 0 16px 0',
        letterSpacing: '-0.02em'
    },
    emptyState: {
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8E8E93',
        fontSize: '0.85rem'
    },
    header: {
        cursor: 'pointer',
        marginBottom: '12px',
        userSelect: 'none'
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1d1d1f',
        margin: 0,
        letterSpacing: '-0.02em'
    },
    expandIcon: {
        fontSize: '0.75rem',
        color: '#0071e3',
        transition: 'transform 0.2s'
    },
    subtitle: {
        fontSize: '0.75rem',
        color: '#6e6e73',
        marginTop: '2px'
    },
    damageCompact: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        background: 'linear-gradient(135deg, rgba(240, 242, 246, 0.8), rgba(232, 236, 241, 0.8))',
        borderRadius: '10px',
        marginBottom: '12px',
        fontSize: '0.8rem'
    },
    damageItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        flex: 1
    },
    damageLabel: {
        fontSize: '0.7rem',
        color: '#6e6e73'
    },
    damageNum: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#0071e3'
    },
    vs: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#8E8E93'
    },
    gapBadge: {
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
    },
    summarySection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const
    },
    summaryTitle: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#1d1d1f',
        marginBottom: '8px'
    },
    statsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px'
    },
    statItem: {
        display: 'flex',
        gap: '4px',
        padding: '4px 8px',
        background: 'rgba(0, 113, 227, 0.08)',
        borderRadius: '6px',
        fontSize: '0.75rem'
    },
    statLabel: {
        color: '#1d1d1f',
        fontWeight: '500'
    },
    statCount: {
        color: '#0071e3',
        fontWeight: '600'
    },
    clickHint: {
        marginTop: 'auto',
        paddingTop: '10px',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: '#8E8E93'
    },
    detailsSection: {
        maxHeight: '300px',
        overflowY: 'auto'
    },
    detailsTitle: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#1d1d1f',
        marginBottom: '10px'
    },
    slotCard: {
        padding: '10px 12px',
        background: 'rgba(0, 0, 0, 0.03)',
        borderRadius: '10px',
        marginBottom: '8px'
    },
    slotName: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#1d1d1f',
        marginBottom: '8px'
    },
    affixList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px'
    },
    affixItem: {
        display: 'flex',
        gap: '4px',
        fontSize: '0.7rem',
        padding: '4px 8px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '6px',
        border: '1px solid rgba(0, 113, 227, 0.15)'
    },
    affixLabel: {
        color: '#0071e3',
        fontWeight: '600',
        minWidth: '24px'
    },
    affixName: {
        color: '#1d1d1f',
        fontWeight: '500'
    },
    affixValue: {
        color: '#0071e3',
        fontWeight: '600'
    }
};
