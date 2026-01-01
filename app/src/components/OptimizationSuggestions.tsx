/**
 * OptimizationSuggestions - 优化建议模块
 * 显示细粒度的装备优化建议，包括词条级优化和装备重调建议
 */

import React from 'react';
import type { OptimizationReport } from '../types';
import { useAppStore } from '../store/AppContext';
import styles from './OptimizationSuggestions.module.css';

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
        <div className={styles.container}>
            {/* 头部 */}
            <div className={styles.header}>
                <h3 className={styles.title}>优化建议</h3>
                <div className={styles.potentialBadge}>
                    潜力提升 +{optimizationReport.totalPotential.toFixed(1)}%
                </div>
            </div>

            {/* 可滚动内容区域 */}
            <div className={styles.scrollableContent}>
                {/* 装备重调建议 */}
                {optimizationReport.resetSuggestions.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>装备重调建议</div>
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
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
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
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>词条优化建议</div>
                        <div className={styles.emptySuggestions}>
                            当前装备配置已接近最优，暂无优化建议
                        </div>
                    </section>
                )}

                {/* 与理论最优的差距 */}
                {optimizationReport.gapFromOptimal > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>理论最优差距</div>
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
        <div className={styles.resetCard}>
            <div className={styles.resetHeader}>
                <span className={styles.resetSlot}>{slotNames[suggestion.slot]}</span>
                <span className={styles.resetEfficiency}>
                    效率: {(suggestion.currentEfficiency * 100).toFixed(0)}%
                </span>
            </div>
            <div className={styles.resetMessage}>
                {suggestion.recommendDirection}
            </div>
            <div className={styles.resetThreshold}>
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
        <div className={styles.optCard}>
            <div className={styles.optHeader}>
                <span className={styles.optRank}>#{rank}</span>
                <span className={styles.optSlot}>
                    {slotNames[optimization.slot]} · {affixSlotNames[optimization.affixSlot]}
                </span>
                <span className={styles.optGain}>
                    +{optimization.expectedGain.toFixed(1)}%
                </span>
            </div>

            <div className={styles.optComparison}>
                <div className={styles.optCurrent}>
                    <span className={styles.optLabel}>当前:</span>
                    <span className={styles.optValue}>
                        {optimization.currentAffix?.name || '--'}
                    </span>
                </div>
                <span className={styles.optArrow}>→</span>
                <div className={styles.optTarget}>
                    <span className={styles.optLabel}>目标:</span>
                    <span className={`${styles.optValue} ${styles['optValue--target']}`}>
                        {optimization.targetAffix.name} ({formatAffixValue(optimization.targetAffix)})
                    </span>
                </div>
            </div>

            {optimization.reason && (
                <div className={styles.optReason}>{optimization.reason}</div>
            )}

            <button className={styles.applyButton} onClick={onApply}>
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

    const containerClass = isLarge
        ? styles['gapContainer--large']
        : isMedium
            ? styles['gapContainer--medium']
            : styles['gapContainer--small'];

    return (
        <div className={`${styles.gapContainer} ${containerClass}`}>
            <div className={styles.gapIcon}>
                {isLarge ? '⚠' : isMedium ? 'ℹ' : '✓'}
            </div>
            <div className={styles.gapText}>
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
