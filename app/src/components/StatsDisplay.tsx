import React from 'react';
import { useAppStore } from '../store/AppContext';
import type { PanelStats } from '../types';
import { BaseStatsEditor } from './BaseStatsEditor';
import { calculateEffectivePrecision, calculateEffectiveCrit, calculateEffectiveIntent } from '../core/formulas';
import './StatsDisplay.css';

export const StatsDisplay: React.FC = () => {
    const { panelStats } = useAppStore();
    const [isEditorOpen, setEditorOpen] = React.useState(false);
    const [activeCard, setActiveCard] = React.useState<'primary' | 'secondary'>('primary');

    // Default Resistance for Display (Level 18/19 = 85%)
    const RESISTANCE = 0.85;

    // Helper to format rate with effective value
    const renderRate = (key: keyof PanelStats, label: string) => {
        const val = panelStats[key];
        const text = `${(val * 100).toFixed(1)}%`;

        // Calculate Effective
        let effectiveText = '';
        if (key === 'precision_rate') {
            const eff = calculateEffectivePrecision(val, RESISTANCE);
            effectiveText = `(${(eff * 100).toFixed(1)}%)`;
        } else if (key === 'crit_rate') {
            const eff = calculateEffectiveCrit(val, RESISTANCE);
            effectiveText = `(${(eff * 100).toFixed(1)}%)`;
        } else if (key === 'intent_rate') {
            const eff = calculateEffectiveIntent(val, RESISTANCE);
            effectiveText = `(${(eff * 100).toFixed(1)}%)`;
        }

        return (
            <div className="stat-row">
                <span className="stat-label">{label}</span>
                <span className="stat-value">
                    {text}
                    {effectiveText && <span className="stat-effective">{effectiveText}</span>}
                </span>
            </div>
        );
    };

    const renderStat = (key: keyof PanelStats, label: string) => {
        const val = panelStats[key];
        const isPercent = (key.includes('rate') || key.includes('bonus') || key.includes('reduction')) && !key.includes('penetration') && !key.includes('resistance_outer');
        const displayVal = isPercent ? `${(val * 100).toFixed(1)}%` : (Math.round(val * 10) / 10).toString();

        return (
            <div className="stat-row">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{displayVal}</span>
            </div>
        );
    };

    // 合并攻击范围显示
    const renderAttackRange = (minKey: keyof PanelStats, maxKey: keyof PanelStats, label: string) => {
        const minVal = Math.round(panelStats[minKey]);
        const maxVal = Math.round(panelStats[maxKey]);
        return (
            <div className="stat-row">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{minVal} - {maxVal}</span>
            </div>
        );
    };

    // 合并属性攻击（四流派 + 无相）
    const renderElementalAttackRange = () => {
        // 四流派属性攻击
        const minElemental = panelStats.min_mingjin_damage + panelStats.min_lieshi_damage +
            panelStats.min_qiansi_damage + panelStats.min_pozhu_damage;
        const maxElemental = panelStats.max_mingjin_damage + panelStats.max_lieshi_damage +
            panelStats.max_qiansi_damage + panelStats.max_pozhu_damage;
        // 无相攻击（可自适应转化为任意属性攻击）
        const minWuxiang = panelStats.min_wuxiang_damage;
        const maxWuxiang = panelStats.max_wuxiang_damage;

        const minTotal = Math.round(minElemental + minWuxiang);
        const maxTotal = Math.round(maxElemental + maxWuxiang);

        return (
            <div className="stat-row">
                <span className="stat-label">属性攻击</span>
                <span className="stat-value">{minTotal} - {maxTotal}</span>
            </div>
        );
    };


    return (
        <div className="stats-display-container">
            {/* Header */}
            <div className="stats-header">
                <h3>属性面板</h3>
                <div className="header-actions">
                    <button
                        className={`card-toggle-btn ${activeCard === 'primary' ? 'active' : ''}`}
                        onClick={() => setActiveCard('primary')}
                        title="核心属性"
                    >
                        ⚔
                    </button>
                    <button
                        className={`card-toggle-btn ${activeCard === 'secondary' ? 'active' : ''}`}
                        onClick={() => setActiveCard('secondary')}
                        title="详细属性"
                    >
                        🛡
                    </button>
                    <button
                        onClick={() => setEditorOpen(true)}
                        className="settings-btn"
                        title="配置基础属性"
                    >
                        ⚙
                    </button>
                </div>
            </div>

            {/* Cards Container */}
            <div className="cards-container">
                {/* Primary Card - 核心属性 */}
                <div className={`stats-card ${activeCard === 'primary' ? 'active' : 'hidden'}`}>
                    {/* 1. 五维属性 */}
                    <div className="stats-section">
                        <h4 className="section-title">五维属性</h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '4px',
                            padding: '8px 0'
                        }}>
                            {[
                                { name: '体', value: panelStats.constitution },
                                { name: '御', value: panelStats.defense_stat },
                                { name: '敏', value: panelStats.agility },
                                { name: '势', value: panelStats.technique },
                                { name: '劲', value: panelStats.strength }
                            ].map((stat) => (
                                <div key={stat.name} style={{
                                    textAlign: 'center',
                                    padding: '8px 4px',
                                    background: 'rgba(255,255,255,0.5)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0,0,0,0.04)',
                                    minWidth: 0
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#6e6e73', marginBottom: '4px' }}>{stat.name}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1d1d1f' }}>{stat.value.toFixed(1)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. 基础属性（简化版） */}
                    <div className="stats-section">
                        <h4 className="section-title">基础属性</h4>
                        {renderAttackRange('min_attack', 'max_attack', '外功攻击')}
                        {renderElementalAttackRange()}
                    </div>

                    {/* 3. 判定属性（简化版） */}
                    <div className="stats-section">
                        <h4 className="section-title">判定属性 <span className="section-subtitle">(抗性85%)</span></h4>
                        {renderRate('precision_rate', '精准率')}
                        {renderRate('crit_rate', '会心率')}
                        {renderRate('intent_rate', '会意率')}
                        {renderStat('direct_crit_rate', '直接会心率')}
                        {renderStat('direct_intent_rate', '直接会意率')}
                    </div>

                    {/* 4. 增伤效果（简化版） */}
                    <div className="stats-section">
                        <h4 className="section-title">增伤效果</h4>
                        {renderStat('defense_penetration', '外功穿透')}
                        {renderStat('elemental_penetration', '属攻穿透')}
                        {renderStat('damage_bonus_outer', '外功伤害加成')}
                        {renderStat('damage_bonus_elemental', '属攻伤害加成')}
                        {renderStat('damage_bonus_all_martial', '全部武学增效')}
                        {renderStat('damage_bonus_specific_martial', '指定武学增效')}
                        {renderStat('damage_bonus_boss', '对首领单位增伤')}
                        {renderStat('damage_bonus_player', '对玩家单位增效')}
                        {renderStat('damage_bonus_magic_single', '单体类奇术增伤')}
                        {renderStat('damage_bonus_magic_group', '群体类奇术增伤')}
                    </div>
                </div>

                {/* Secondary Card - 详细属性 */}
                <div className={`stats-card ${activeCard === 'secondary' ? 'active' : 'hidden'}`}>
                    {/* 补充基础属性 */}
                    <div className="stats-section">
                        <h4 className="section-title">生存属性</h4>
                        {renderStat('hp', '气血最大值')}
                        {renderStat('defense', '外功防御')}
                        {renderStat('resistance_outer', '外功抗性')}
                    </div>

                    {/* 补充判定属性 */}
                    <div className="stats-section">
                        <h4 className="section-title">判定补充</h4>
                        {renderStat('glance_convert_rate', '擦伤转化率')}
                    </div>

                    {/* 补充增伤效果 */}
                    <div className="stats-section">
                        <h4 className="section-title">暴击效果</h4>
                        {renderStat('crit_damage_bonus', '会心伤害加成')}
                        {renderStat('intent_damage_bonus', '会意伤害加成')}
                    </div>

                    {/* 治疗与减伤 */}
                    <div className="stats-section">
                        <h4 className="section-title">治疗加成</h4>
                        {renderStat('healing_bonus_outer', '外功治疗加成')}
                        {renderStat('healing_bonus_elemental', '属攻治疗加成')}
                        {renderStat('healing_bonus_crit', '会心治疗加成')}
                    </div>

                    {/* 伤害减免 */}
                    <div className="stats-section">
                        <h4 className="section-title">伤害减免</h4>
                        {renderStat('damage_reduction_outer', '外功伤害减免')}
                        {renderStat('damage_reduction_elemental', '属攻伤害减免')}
                    </div>
                </div>
            </div>

            <BaseStatsEditor isOpen={isEditorOpen} onClose={() => setEditorOpen(false)} />
        </div>
    );
};
