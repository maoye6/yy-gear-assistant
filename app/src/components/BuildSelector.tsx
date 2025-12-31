/**
 * 流派与心法选择器组件
 * BuildSelector - Allows user to select their sub-school and 4 martial art techniques
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '../store/AppContext';
import {
    AffixPools,
    type SchoolType,
    type SubSchoolType,
    type TechniqueInfo,
    getParentSchool,
    getTechniquesForSubSchool,
    getUniversalTechniques,
    getAllSubSchools
} from '../data/loaders';
import {
    getAttributeName,
    isPercentAttribute,
    getBaseAttributeKey
} from '../data/terminology';
import './Modal.css';

// ============================================================
// Types & Constants
// ============================================================

export interface SelectedBuild {
    subSchool: SubSchoolType;
    techniques: (TechniqueInfo | null)[];
}

// 流派图标和颜色配置 - Apple风格浅色系
const SCHOOL_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
    MingJin: { icon: '🗡️', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },      // 金色 - 剑
    LieShi: { icon: '🔪', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)' },        // 红色 - 陌刀
    PoZhu: { icon: '🪢', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },       // 紫色 - 风
    QianSi: { icon: '🪭', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)' },       // 青色 - 扇子
    Universal: { icon: '✨', color: '#6366f1', bgColor: 'rgba(99,102,241,0.12)' },    // 紫蓝 - 通用
};

// ============================================================
// Helper Functions
// ============================================================

// Helper function for checking technique selection status
function getTechniqueStatus(name: string, techniques: (TechniqueInfo | null)[]) {
    const index = techniques.findIndex(t => t?.name === name);
    return {
        selected: index >= 0,
        number: index >= 0 ? index + 1 : null
    };
}

/**
 * 格式化心法加成显示为中文
 * @param bonuses - 心法加成对象
 * @returns 格式化后的加成描述数组
 */
function formatTechniqueBonuses(bonuses: Record<string, number>): string[] {
    // 按属性分组（用于处理 min/max 配对）
    const groupedBonuses: Record<string, { min?: number; max?: number }> = {};

    Object.entries(bonuses).forEach(([key, value]) => {
        const baseKey = getBaseAttributeKey(key);
        const type = key.startsWith('min_') ? 'min' : key.startsWith('max_') ? 'max' : 'flat';

        if (!groupedBonuses[baseKey]) {
            groupedBonuses[baseKey] = { min: undefined, max: undefined };
        }

        if (type === 'min') {
            groupedBonuses[baseKey].min = value;
        } else if (type === 'max') {
            groupedBonuses[baseKey].max = value;
        } else {
            // 非配对属性，min 和 max 都设为相同值
            groupedBonuses[baseKey].min = value;
            groupedBonuses[baseKey].max = value;
        }
    });

    // 格式化输出
    const result: string[] = [];
    Object.entries(groupedBonuses).forEach(([baseKey, values]) => {
        // 至少有一个值才处理
        if (values.min !== undefined || values.max !== undefined) {
            const isPercent = isPercentAttribute(baseKey);

            // 只有一个值的情况（如只有 min_attack 或只有 max_attack）
            if (values.min === undefined) {
                // 只有 max
                const name = getAttributeName(`max_${baseKey}`);
                const value = isPercent ? (values.max! * 100).toFixed(1) + '%' : values.max!.toFixed(1);
                result.push(`${name}+${value}`);
            } else if (values.max === undefined) {
                // 只有 min
                const name = getAttributeName(`min_${baseKey}`);
                const value = isPercent ? (values.min * 100).toFixed(1) + '%' : values.min.toFixed(1);
                result.push(`${name}+${value}`);
            } else if (values.min === values.max) {
                // min 和 max 相同（单一值）
                const name = getAttributeName(baseKey);
                const value = isPercent ? (values.min * 100).toFixed(1) + '%' : values.min.toFixed(1);
                result.push(`${name}+${value}`);
            } else {
                // min 和 max 不同（范围值）
                const name = getAttributeName(baseKey);
                if (isPercent) {
                    result.push(`${name}+${(values.min * 100).toFixed(1)}%~${(values.max * 100).toFixed(1)}%`);
                } else {
                    result.push(`${name}+${values.min.toFixed(1)}~${values.max.toFixed(1)}`);
                }
            }
        }
    });

    return result;
}

// ============================================================
// Technique Selection Modal (Multi-select)
// ============================================================

interface TechniqueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (techniques: (TechniqueInfo | null)[]) => void;
    subSchool: SubSchoolType;
    currentTechniques: (TechniqueInfo | null)[];
}

const TechniqueModal: React.FC<TechniqueModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    subSchool,
    currentTechniques
}) => {
    if (!isOpen) return null;

    const parentSchool = getParentSchool(subSchool);
    const schoolTechs = getTechniquesForSubSchool(subSchool);
    const universalTechs = getUniversalTechniques();

    // 获取其他细分流派的心法（包括同一父流派下的其他细分流派）
    const allSubSchools = getAllSubSchools();
    const otherSubSchools = allSubSchools.filter(sub => sub !== subSchool);

    // 临时状态用于弹窗内的选择
    const [tempTechniques, setTempTechniques] = useState<(TechniqueInfo | null)[]>(currentTechniques);

    // 初始化临时状态
    React.useEffect(() => {
        setTempTechniques(currentTechniques);
    }, [currentTechniques, isOpen]);

    const actualHandleClick = (tech: TechniqueInfo) => {
        const newSelected = [...tempTechniques];
        const existingIndex = newSelected.findIndex(t => t?.name === tech.name);

        if (existingIndex >= 0) {
            newSelected[existingIndex] = null;
        } else {
            const emptyIndex = newSelected.findIndex(t => t === null);
            if (emptyIndex >= 0) {
                newSelected[emptyIndex] = tech;
            }
        }
        setTempTechniques(newSelected);
    };

    const handleConfirm = () => {
        onConfirm(tempTechniques);
        onClose();
    };

    const handleClearAll = () => {
        setTempTechniques([null, null, null, null]);
    };

    const selectedCount = tempTechniques.filter(t => t !== null).length;
    const config = SCHOOL_CONFIG[parentSchool];

    // 渲染心法卡片
    const renderTechniqueCard = (
        tech: TechniqueInfo,
        isSchoolTech: boolean,
        overrideSchool?: SchoolType
    ) => {
        const status = getTechniqueStatus(tech.name, tempTechniques);
        const formattedBonuses = formatTechniqueBonuses(tech.bonuses);
        const hasBonuses = formattedBonuses.length > 0;

        // 确定卡片颜色
        let cardColor: string;
        let cardBgColor: string;

        if (overrideSchool) {
            cardColor = SCHOOL_CONFIG[overrideSchool].color;
            cardBgColor = SCHOOL_CONFIG[overrideSchool].bgColor;
        } else if (isSchoolTech) {
            cardColor = config.color;
            cardBgColor = config.bgColor;
        } else {
            cardColor = SCHOOL_CONFIG.Universal.color;
            cardBgColor = SCHOOL_CONFIG.Universal.bgColor;
        }

        return (
            <button
                key={tech.name}
                onClick={() => actualHandleClick(tech)}
                style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: status.selected
                        ? `2px solid ${cardColor}`
                        : '1px solid rgba(0,0,0,0.08)',
                    background: status.selected
                        ? cardBgColor
                        : 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    opacity: status.selected ? 1 : 0.85,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: status.selected ? `0 4px 16px ${cardColor}30` : '0 2px 8px rgba(0,0,0,0.04)'
                }}
            >
                {status.selected && status.number && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: cardColor,
                        color: '#fff',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.7em',
                        fontWeight: 'bold'
                    }}>
                        {status.number}
                    </div>
                )}
                <div style={{
                    fontWeight: '600',
                    color: '#1d1d1f',
                    marginBottom: '4px',
                    fontSize: '0.9em'
                }}>
                    {tech.name}
                </div>
                <div style={{
                    fontSize: '0.75em',
                    color: hasBonuses ? '#34c759' : '#6e6e73',
                    lineHeight: '1.4'
                }}>
                    {hasBonuses
                        ? formattedBonuses.join('；')
                        : '无被动加成'}
                </div>
            </button>
        );
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-container" style={{ width: '90vw', maxWidth: '600px' }}>
                {/* 固定头部 */}
                <div className="modal-header">
                    <h3 className="modal-title">配置心法 ({selectedCount}/4)</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                {/* 可滚动内容区域 */}
                <div className="modal-content">
                    {/* 流派专属心法 */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: config.color,
                            marginBottom: '12px',
                            fontWeight: '600'
                        }}>
                            <span style={{
                                fontSize: '1.2em',
                                background: config.bgColor,
                                padding: '4px 8px',
                                borderRadius: '6px'
                            }}>{config.icon}</span>
                            流派专属心法
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '10px'
                        }}>
                            {schoolTechs.map((tech) => renderTechniqueCard(tech, true))}
                        </div>
                    </div>

                    {/* 通用心法 */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: SCHOOL_CONFIG.Universal.color,
                            marginBottom: '12px',
                            fontWeight: '600'
                        }}>
                            <span style={{
                                fontSize: '1.2em',
                                background: SCHOOL_CONFIG.Universal.bgColor,
                                padding: '4px 8px',
                                borderRadius: '6px'
                            }}>{SCHOOL_CONFIG.Universal.icon}</span>
                            通用心法
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '10px'
                        }}>
                            {universalTechs.map((tech) => renderTechniqueCard(tech, false))}
                        </div>
                    </div>

                    {/* 其他流派心法 */}
                    {otherSubSchools.map((otherSub) => {
                        const techs = getTechniquesForSubSchool(otherSub);
                        if (techs.length === 0) return null;

                        const otherParentSchool = getParentSchool(otherSub);
                        const otherParentConfig = SCHOOL_CONFIG[otherParentSchool];
                        const subSchoolInfo = AffixPools.subSchools[otherSub];

                        return (
                            <div key={otherSub} style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.85rem',
                                    color: otherParentConfig.color,
                                    marginBottom: '12px',
                                    fontWeight: '600'
                                }}>
                                    <span style={{
                                        fontSize: '1.2em',
                                        background: otherParentConfig.bgColor,
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}>{otherParentConfig.icon}</span>
                                    {subSchoolInfo.name}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '10px'
                                }}>
                                    {techs.map((tech) => renderTechniqueCard(tech, false, otherParentSchool))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 固定底部按钮 */}
                <div className="modal-footer">
                    <button
                        onClick={handleClearAll}
                        className="modal-btn modal-btn-secondary"
                        style={{ color: '#ef4444' }}
                    >
                        清空
                    </button>
                    <div className="modal-footer-right">
                        <button className="modal-btn modal-btn-secondary" onClick={onClose}>取消</button>
                        <button className="modal-btn modal-btn-primary" onClick={handleConfirm}>确定选择</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ============================================================
// Main BuildSelector Component
// ============================================================

export const BuildSelector: React.FC = () => {
    const { selectedSubSchool, setSelectedSubSchool, selectedTechniques, setSelectedTechniques } = useAppStore();

    const [modalOpen, setModalOpen] = useState(false);

    const subSchools = Object.entries(AffixPools.subSchools) as [SubSchoolType, typeof AffixPools.subSchools[SubSchoolType]][];

    // Get current sub-school info (may be null)
    const currentSubSchoolInfo = selectedSubSchool ? AffixPools.subSchools[selectedSubSchool] : null;
    const parentSchool = selectedSubSchool ? getParentSchool(selectedSubSchool) : null;
    const config = parentSchool ? SCHOOL_CONFIG[parentSchool] : null;

    const handleSubSchoolChange = (subSchool: SubSchoolType) => {
        setSelectedSubSchool(subSchool);
        // Reset techniques when changing sub-school
        setSelectedTechniques([null, null, null, null]);
    };

    const handleTechniqueConfirm = (techniques: (TechniqueInfo | null)[]) => {
        setSelectedTechniques(techniques);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 标题行 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2em', color: '#1d1d1f' }}>
                    流派选择
                </h2>
                <div style={{ fontSize: '0.85em', color: '#888' }}>
                    选择武学流派及心法
                </div>
            </div>

            {/* Sub-School Selection */}
            <div style={{ marginBottom: '20px', flexShrink: 0 }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px 12px'
                }}>
                    {subSchools.map(([key, info]) => {
                        const keyParent = getParentSchool(key);
                        const keyConfig = SCHOOL_CONFIG[keyParent];
                        return (
                            <button
                                key={key}
                                onClick={() => handleSubSchoolChange(key)}
                                style={{
                                    minHeight: '60px',
                                    padding: '12px 10px',
                                    borderRadius: '12px',
                                    border: selectedSubSchool === key
                                        ? `2px solid ${keyConfig.color}`
                                        : '1px solid rgba(0,0,0,0.08)',
                                    background: selectedSubSchool === key
                                        ? keyConfig.bgColor
                                        : 'rgba(255,255,255,0.5)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    color: '#1d1d1f',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div style={{ fontWeight: '600', fontSize: '0.85em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                    <span>{keyConfig.icon}</span>
                                    <span>{info.name}</span>
                                </div>
                                <div style={{
                                    fontSize: '0.65em',
                                    color: '#6e6e73',
                                    marginTop: '2px'
                                }}>
                                    {info.description.split(' - ')[1] || info.description}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Current Selection Display - only show when a school is selected */}
            {selectedSubSchool && config && currentSubSchoolInfo && (
                <div style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    flexShrink: 0
                }}>
                    <span style={{
                        fontSize: '1.3em',
                        background: config.bgColor,
                        padding: '6px 10px',
                        borderRadius: '8px'
                    }}>{config.icon}</span>
                    <div>
                        <div style={{ color: config.color, fontWeight: '600', fontSize: '0.9em' }}>
                            {currentSubSchoolInfo.name}
                        </div>
                        <div style={{ fontSize: '0.75em', color: '#6e6e73' }}>
                            {currentSubSchoolInfo.description}
                        </div>
                    </div>
                </div>
            )}

            {/* Technique Slots */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingBottom: '8px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexShrink: 0
                }}>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#6e6e73'
                    }}>
                        心法配置 (4 槽位)
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        style={{
                            padding: '5px 12px',
                            background: 'rgba(0, 113, 227, 0.1)',
                            border: '1px solid #0071e3',
                            color: '#0071e3',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#0071e3';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 113, 227, 0.1)';
                            e.currentTarget.style.color = '#0071e3';
                        }}
                    >
                        配置心法
                    </button>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px'
                }}>
                    {[0, 1, 2, 3].map((idx) => {
                        const technique = selectedTechniques[idx];
                        const isSchoolTech = technique && selectedSubSchool && schoolHasTechnique(selectedSubSchool, technique.name);

                        return (
                            <div
                                key={idx}
                                style={{
                                    position: 'relative',
                                    aspectRatio: '1 / 1',
                                    padding: '10px 8px',
                                    borderRadius: '10px',
                                    border: technique
                                        ? `1px solid ${config?.color || '#0071e3'}40`
                                        : '1px dashed rgba(0,0,0,0.12)',
                                    background: technique
                                        ? (isSchoolTech && config ? config.bgColor : 'rgba(0,113,227,0.1)')
                                        : 'rgba(255,255,255,0.4)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                {technique ? (
                                    <>
                                        <div style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: '3px',
                                            background: isSchoolTech && config ? config.color : '#0071e3',
                                            color: '#fff',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontSize: '0.6em',
                                            fontWeight: '600'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{
                                            fontWeight: '600',
                                            color: isSchoolTech && config ? config.color : '#0071e3',
                                            fontSize: '0.8em'
                                        }}>
                                            {technique.name}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            fontSize: '1em',
                                            color: 'rgba(0,0,0,0.15)',
                                            marginBottom: '2px'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7em',
                                            color: '#6e6e73'
                                        }}>
                                            空
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Technique Selection Modal - only render when a school is selected */}
            {selectedSubSchool && (
                <TechniqueModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onConfirm={handleTechniqueConfirm}
                    subSchool={selectedSubSchool}
                    currentTechniques={selectedTechniques}
                />
            )}
        </div>
    );
};

// Helper: Check if a technique belongs to the current sub-school
function schoolHasTechnique(subSchool: SubSchoolType, techniqueName: string): boolean {
    const schoolTechs = getTechniquesForSubSchool(subSchool);
    return schoolTechs.some(t => t.name === techniqueName);
}
