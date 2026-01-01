/**
 * OptimalBuildDisplay - 理论最优方案展示组件
 * 默认显示统计概览，点击可展开查看详情
 */

import React, { useState, useMemo } from 'react';
import { getOptimalBuildForSubSchool, getAttributeName } from '../data/loaders';
import { useAppStore } from '../store/AppContext';
import styles from './OptimalBuildDisplay.module.css';

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
            <div className={styles.container}>
                <div className={styles.emptyState}>
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
        <div className={styles.container}>
            {/* 标题 */}
            <h3 className={styles.panelTitle}>理论最优</h3>

            {/* 头部 - 点击切换 */}
            <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>{optimalBuildData.name}</h3>
                    <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                </div>
                <div className={styles.subtitle}>{optimalBuildData.description}</div>
            </div>

            {/* 伤害对比 - 紧凑版 */}
            <div className={styles.damageCompact}>
                <div className={styles.damageItem}>
                    <span className={styles.damageLabel}>当前</span>
                    <span className={styles.damageNum}>{currentDamage.toFixed(0)}</span>
                </div>
                <div className={styles.vs}>VS</div>
                <div className={styles.damageItem}>
                    <span className={styles.damageLabel}>最优</span>
                    <span className={`${styles.damageNum} ${styles['damageNum--gold']}`}>{optimalDamage.toFixed(0)}</span>
                </div>
                <div className={`${styles.gapBadge} ${isLargeGap ? styles['gapBadge--large'] : styles['gapBadge--small']}`}>
                    {gapPercent > 0 ? '+' : ''}{gapPercent.toFixed(0)}%
                </div>
            </div>

            {/* 内容区域 */}
            {!isExpanded ? (
                // 统计概览模式
                <div className={styles.summarySection}>
                    <div className={styles.summaryTitle}>词条统计</div>
                    <div className={styles.statsGrid}>
                        {Object.entries(affixStats)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => {
                                const displayName = getAttributeName(type) || type;
                                return (
                                    <div key={type} className={styles.statItem}>
                                        <span className={styles.statLabel}>{displayName}</span>
                                        <span className={styles.statCount}>×{count}</span>
                                    </div>
                                );
                            })}
                    </div>
                    <div className={styles.clickHint}>
                        点击查看详情 ↓
                    </div>
                </div>
            ) : (
                // 详情模式
                <div className={styles.detailsSection}>
                    <div className={styles.detailsTitle}>装备详情</div>
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
        <div className={styles.slotCard}>
            <div className={styles.slotName}>{slotNames[slotConfig.slot] || slotConfig.slot}</div>
            <div className={styles.affixList}>
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
        <div className={styles.affixItem}>
            <span className={styles.affixLabel}>{label}</span>
            <span className={styles.affixName}>{affix.name}</span>
            <span className={styles.affixValue}>{displayValue}</span>
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
