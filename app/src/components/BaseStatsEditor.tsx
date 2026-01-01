import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { PanelStats } from '../types';
import { useAppStore } from '../store/AppContext';
import { DEFAULT_BASE_STATS } from '../data/defaults';
import styles from './BaseStatsEditor.module.css';
import './Modal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const BaseStatsEditor: React.FC<Props> = ({ isOpen, onClose }) => {
    const { baseStats, setBaseStats } = useAppStore();
    const [localStats, setLocalStats] = useState<PanelStats>(baseStats);

    useEffect(() => {
        if (isOpen) {
            setLocalStats(baseStats);
        }
    }, [isOpen, baseStats]);

    const handleChange = (key: keyof PanelStats, val: string) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setLocalStats(prev => ({ ...prev, [key]: num }));
        }
    };

    const handleSave = () => {
        setBaseStats(localStats);
        onClose();
    };

    const handleReset = () => {
        setLocalStats(DEFAULT_BASE_STATS);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-container" style={{ width: '90vw', maxWidth: '700px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">基础属性设置</h2>
                        <button className={styles.resetButton} onClick={handleReset}>
                            重置为默认（大世界等级-十八）
                        </button>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    <div className={styles.statsEditorGrid}>
                        {/* 第一列：五维属性 */}
                        <div>
                            <h4 className={styles.groupTitle}>五维属性</h4>
                            {[
                                { k: 'constitution', label: '体' },
                                { k: 'defense_stat', label: '御' },
                                { k: 'agility', label: '敏' },
                                { k: 'technique', label: '势' },
                                { k: 'strength', label: '劲' },
                            ].map(item => (
                                <div key={item.k} className={styles.formRow}>
                                    <label className={styles.formLabel}>{item.label}</label>
                                    <input
                                        type="number"
                                        value={localStats[item.k as keyof PanelStats]}
                                        onChange={e => handleChange(item.k as keyof PanelStats, e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* 第二列：基础属性 */}
                        <div>
                            <h4 className={styles.groupTitle}>基础属性</h4>
                            {[
                                { k: 'hp', label: '气血', step: 1 },
                                { k: 'defense', label: '外防', step: 1 },
                                { k: 'min_attack', label: '最小外攻', step: 1 },
                                { k: 'max_attack', label: '最大外攻', step: 1 },
                            ].map(item => (
                                <div key={item.k} className={styles.formRow}>
                                    <label className={styles.formLabel}>{item.label}</label>
                                    <input
                                        type="number"
                                        step={item.step}
                                        value={localStats[item.k as keyof PanelStats]}
                                        onChange={e => handleChange(item.k as keyof PanelStats, e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            ))}

                            <h4 className={`${styles.groupTitle} ${styles['groupTitle--withMargin']}`}>判定属性</h4>
                            {[
                                { k: 'precision_rate', label: '精准率', step: 0.001 },
                                { k: 'crit_rate', label: '会心率', step: 0.001 },
                                { k: 'intent_rate', label: '会意率', step: 0.001 },
                                { k: 'direct_crit_rate', label: '直接会心', step: 0.001 },
                            ].map(item => (
                                <div key={item.k} className={styles.formRow}>
                                    <label className={styles.formLabel}>{item.label}</label>
                                    <input
                                        type="number"
                                        step={item.step}
                                        value={localStats[item.k as keyof PanelStats]}
                                        onChange={e => handleChange(item.k as keyof PanelStats, e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* 第三列：增伤与属攻 */}
                        <div>
                            <h4 className={styles.groupTitle}>增伤效果</h4>
                            {[
                                { k: 'defense_penetration', label: '外功穿透', step: 0.1 },
                                { k: 'elemental_penetration', label: '属攻穿透', step: 0.1 },
                                { k: 'damage_bonus_elemental', label: '属攻增伤', step: 0.001 },
                                { k: 'damage_bonus_all_martial', label: '全武学增效', step: 0.001 },
                                { k: 'damage_bonus_specific_martial', label: '指定武学增效', step: 0.001 },
                                { k: 'damage_bonus_boss', label: '对首领增伤', step: 0.001 },
                            ].map(item => (
                                <div key={item.k} className={styles.formRow}>
                                    <label className={styles.formLabel}>{item.label}</label>
                                    <input
                                        type="number"
                                        step={item.step}
                                        value={localStats[item.k as keyof PanelStats]}
                                        onChange={e => handleChange(item.k as keyof PanelStats, e.target.value)}
                                        className={styles['input--compact']}
                                    />
                                </div>
                            ))}

                            <h4 className={`${styles.groupTitle} ${styles['groupTitle--withMargin']}`}>本系属攻</h4>
                            {[
                                { k: 'min_lieshi_damage', label: '最小', step: 1 },
                                { k: 'max_lieshi_damage', label: '最大', step: 1 },
                                { k: 'min_wuxiang_damage', label: '无相最小', step: 1 },
                                { k: 'max_wuxiang_damage', label: '无相最大', step: 1 },
                            ].map(item => (
                                <div key={item.k} className={styles.formRow}>
                                    <label className={styles.formLabel}>{item.label}</label>
                                    <input
                                        type="number"
                                        step={item.step}
                                        value={localStats[item.k as keyof PanelStats]}
                                        onChange={e => handleChange(item.k as keyof PanelStats, e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <p className={styles.footerNote}>
                        注：此处仅设置"裸装"的基础数值。百分比属性请输入小数（如 50% 输入 0.5）。
                    </p>
                    <div className="modal-footer-right">
                        <button className="modal-btn modal-btn-secondary" onClick={onClose}>取消</button>
                        <button className="modal-btn modal-btn-primary" onClick={handleSave}>保存设定</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
