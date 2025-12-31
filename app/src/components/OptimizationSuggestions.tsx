/**
 * OptimizationSuggestions - 优化建议模块
 * 显示细粒度的装备优化建议，包括词条级优化和装备重调建议
 */

import React from 'react';
import type { OptimizationReport } from '../types';
import { useAppStore } from '../store/AppContext';

interface Props {
    optimizationReport: OptimizationReport;
}

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
    'Yu': '羽',
    'DingYin': '定音'
};

export const OptimizationSuggestions: React.FC<Props> = ({ optimizationReport }) => {
    const { updateEquipment, equipments } = useAppStore();

    // 应用优化建议
    const handleApplyOptimization = (optimization: typeof optimizationReport.affixOptimizations[0]) => {
        const equipment = equipments[optimization.slot];
        if (!equipment) return;

        // 根据槽位类型确定属性键名
        const affixKey =
            optimization.affixSlot === 'Shang' ? 'affix_shang' :
            optimization.affixSlot === 'Jue' ? 'affix_jue' :
            optimization.affixSlot === 'Zhi' ? 'affix_zhi' :
            optimization.affixSlot === 'Yu' ? 'affix_yu' : 'affix_dingyin';

        const updatedEquipment = {
            ...equipment,
            [affixKey]: optimization.targetAffix
        };

        updateEquipment(optimization.slot, updatedEquipment);
    };

    return (
        <div style={styles.container}>
            {/* 头部 */}
            <div style={styles.header}>
                <h3 style={styles.title}>优化建议</h3>
                <div style={styles.potentialBadge}>
                    潜力提升 +{optimizationReport.totalPotential.toFixed(1)}%
                </div>
            </div>

            {/* 可滚动内容区域 */}
            <div style={styles.scrollableContent}>
                {/* 装备重调建议 */}
                {optimizationReport.resetSuggestions.length > 0 && (
                    <section style={styles.section}>
                        <div style={styles.sectionTitle}>装备重调建议</div>
                        {optimizationReport.resetSuggestions.map((suggestion, idx) => (
                            <ResetSuggestionCard
                                key={idx}
                                suggestion={suggestion}
                            />
                        ))}
                    </section>
                )}

                {/* 词条级优化建议 */}
                {optimizationReport.affixOptimizations.length > 0 ? (
                    <section style={styles.section}>
                        <div style={styles.sectionTitle}>
                            词条优化建议 (Top-{optimizationReport.affixOptimizations.length})
                        </div>
                        {optimizationReport.affixOptimizations.map((opt, idx) => (
                            <AffixOptimizationCard
                                key={idx}
                                optimization={opt}
                                rank={idx + 1}
                                onApply={() => handleApplyOptimization(opt)}
                            />
                        ))}
                    </section>
                ) : (
                    <section style={styles.section}>
                        <div style={styles.sectionTitle}>词条优化建议</div>
                        <div style={styles.emptySuggestions}>
                            当前装备配置已接近最优，暂无优化建议
                        </div>
                    </section>
                )}

                {/* 与理论最优的差距 */}
                {optimizationReport.gapFromOptimal > 0 && (
                    <section style={styles.section}>
                        <div style={styles.sectionTitle}>理论最优差距</div>
                        <GapIndicator gap={optimizationReport.gapFromOptimal} />
                    </section>
                )}
            </div>
        </div>
    );
};

interface ResetSuggestionCardProps {
    suggestion: {
        slot: string;
        currentEfficiency: number;
        threshold: number;
        recommendDirection: string;
    };
}

const ResetSuggestionCard: React.FC<ResetSuggestionCardProps> = ({ suggestion }) => {
    return (
        <div style={styles.resetCard}>
            <div style={styles.resetHeader}>
                <span style={styles.resetSlot}>{slotNames[suggestion.slot]}</span>
                <span style={styles.resetEfficiency}>
                    效率: {(suggestion.currentEfficiency * 100).toFixed(0)}%
                </span>
            </div>
            <div style={styles.resetMessage}>
                {suggestion.recommendDirection}
            </div>
            <div style={styles.resetThreshold}>
                低于阈值 {(suggestion.threshold * 100).toFixed(0)}%，建议使用装备词条重置功能重新调律
            </div>
        </div>
    );
};

interface AffixOptimizationCardProps {
    optimization: {
        slot: string;
        affixSlot: string;
        currentAffix: { name: string; type: string; value: number } | null;
        targetAffix: { name: string; type: string; value: number };
        expectedGain: number;
        priority: number;
        reason?: string;
    };
    rank: number;
    onApply: () => void;
}

const AffixOptimizationCard: React.FC<AffixOptimizationCardProps> = ({ optimization, rank, onApply }) => {
    return (
        <div style={styles.optCard}>
            <div style={styles.optHeader}>
                <span style={styles.optRank}>#{rank}</span>
                <span style={styles.optSlot}>
                    {slotNames[optimization.slot]} · {affixSlotNames[optimization.affixSlot]}
                </span>
                <span style={styles.optGain}>
                    +{optimization.expectedGain.toFixed(1)}%
                </span>
            </div>

            <div style={styles.optComparison}>
                <div style={styles.optCurrent}>
                    <span style={styles.optLabel}>当前:</span>
                    <span style={styles.optValue}>
                        {optimization.currentAffix?.name || '--'}
                    </span>
                </div>
                <span style={styles.optArrow}>→</span>
                <div style={styles.optTarget}>
                    <span style={styles.optLabel}>目标:</span>
                    <span style={{ ...styles.optValue, color: '#34C759', fontWeight: '600' }}>
                        {optimization.targetAffix.name} ({formatAffixValue(optimization.targetAffix)})
                    </span>
                </div>
            </div>

            {optimization.reason && (
                <div style={styles.optReason}>{optimization.reason}</div>
            )}

            <button
                style={styles.applyButton}
                onClick={onApply}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2DB157';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#34C759';
                }}
            >
                应用建议
            </button>
        </div>
    );
};

interface GapIndicatorProps {
    gap: number;
}

const GapIndicator: React.FC<GapIndicatorProps> = ({ gap }) => {
    const isLarge = gap > 15;
    const isMedium = gap > 5;

    return (
        <div style={{
            ...styles.gapContainer,
            background: isLarge
                ? 'rgba(255, 59, 48, 0.1)'
                : isMedium
                    ? 'rgba(255, 149, 0, 0.1)'
                    : 'rgba(52, 199, 89, 0.1)'
        }}>
            <div style={styles.gapIcon}>
                {isLarge ? '⚠' : isMedium ? 'ℹ' : '✓'}
            </div>
            <div style={styles.gapText}>
                当前方案距离理论最优还有 <strong>{gap.toFixed(1)}%</strong> 的提升空间
                {isLarge && '，建议重新规划装备搭配'}
            </div>
        </div>
    );
};

function formatAffixValue(affix: { type: string; value: number }): string {
    if (affix.type.includes('rate') || affix.type.includes('bonus')) {
        return `${(affix.value * 100).toFixed(1)}%`;
    }
    return affix.value.toFixed(1);
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    title: {
        fontSize: '1.3rem',
        fontWeight: '700',
        color: '#1d1d1f',
        margin: 0,
        letterSpacing: '-0.02em'
    },
    potentialBadge: {
        padding: '6px 14px',
        background: 'linear-gradient(135deg, #34C759, #30B0C7)',
        color: '#fff',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '600'
    },
    scrollableContent: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0
    },
    section: {
        marginBottom: '24px'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#1d1d1f',
        marginBottom: '12px'
    },
    emptySuggestions: {
        padding: '20px',
        textAlign: 'center',
        color: '#6e6e73',
        fontSize: '0.9rem',
        background: 'rgba(52, 199, 89, 0.08)',
        borderRadius: '12px'
    },
    // 重调建议卡片
    resetCard: {
        padding: '16px',
        background: 'rgba(255, 149, 0, 0.08)',
        borderRadius: '12px',
        marginBottom: '12px',
        borderLeft: '4px solid #FF9500'
    },
    resetHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px'
    },
    resetSlot: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1d1d1f'
    },
    resetEfficiency: {
        fontSize: '0.9rem',
        color: '#FF9500',
        fontWeight: '600'
    },
    resetMessage: {
        fontSize: '0.9rem',
        color: '#1d1d1f',
        marginBottom: '4px'
    },
    resetThreshold: {
        fontSize: '0.8rem',
        color: '#6e6e73'
    },
    // 优化建议卡片
    optCard: {
        padding: '16px',
        background: 'rgba(52, 199, 89, 0.06)',
        borderRadius: '12px',
        marginBottom: '12px',
        borderLeft: '4px solid #34C759',
        transition: 'box-shadow 0.2s ease'
    },
    optHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
    },
    optRank: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#34C759',
        background: 'rgba(52, 199, 89, 0.15)',
        padding: '3px 8px',
        borderRadius: '6px'
    },
    optSlot: {
        fontSize: '0.9rem',
        fontWeight: '500',
        color: '#1d1d1f'
    },
    optGain: {
        marginLeft: 'auto',
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#34C759'
    },
    optComparison: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px',
        flexWrap: 'wrap'
    },
    optCurrent: {
        flex: '1',
        minWidth: '120px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    optTarget: {
        flex: '1',
        minWidth: '120px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    optLabel: {
        fontSize: '0.8rem',
        color: '#6e6e73',
        fontWeight: '500'
    },
    optValue: {
        fontSize: '0.9rem',
        color: '#1d1d1f'
    },
    optArrow: {
        fontSize: '1rem',
        color: '#6e6e73',
        fontWeight: '600'
    },
    optReason: {
        fontSize: '0.8rem',
        color: '#6e6e73',
        marginBottom: '12px'
    },
    applyButton: {
        padding: '8px 18px',
        background: '#34C759',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    // 差距指示器
    gapContainer: {
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
    },
    gapIcon: {
        fontSize: '1.5rem',
        lineHeight: 1
    },
    gapText: {
        fontSize: '0.9rem',
        color: '#1d1d1f',
        lineHeight: '1.5'
    }
};
