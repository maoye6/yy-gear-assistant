import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { ArmorSetType, ArmorSetSlot as SlotType } from '../types';
import { ARMOR_SET_BONUSES } from '../types';
import { useAppStore } from '../store/AppContext';
import './Modal.css';

interface Props {
    slot: SlotType;
    onClick?: () => void;
}

const SLOT_NAMES: Record<SlotType, string> = {
    Bow: '弓',
    Skill: '诀'
};

const SLOT_ICONS: Record<SlotType, string> = {
    Bow: '🏹',
    Skill: '📜'
};

// 套装选择弹窗
interface ArmorSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: SlotType;
    currentSet: ArmorSetType;
    onSelect: (setType: ArmorSetType) => void;
}

const ArmorSetModal: React.FC<ArmorSetModalProps> = ({
    isOpen,
    onClose,
    slot,
    currentSet,
    onSelect
}) => {
    if (!isOpen) return null;

    const armorSets: Array<{ type: ArmorSetType; info: typeof ARMOR_SET_BONUSES.YinYu }> = [
        { type: 'YinYu', info: ARMOR_SET_BONUSES.YinYu },
        { type: 'JingXian', info: ARMOR_SET_BONUSES.JingXian },
        { type: 'ZhuiYing', info: ARMOR_SET_BONUSES.ZhuiYing }
    ];

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-container" style={{ width: '90vw', maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        {SLOT_ICONS[slot]} 选择{SLOT_NAMES[slot]}套装
                    </h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content" style={{ padding: '16px' }}>
                    {/* 无套装选项 */}
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            marginBottom: '12px',
                            borderRadius: '12px',
                            border: currentSet === null
                                ? '2px solid #0071e3'
                                : '1px solid rgba(0,0,0,0.08)',
                            background: currentSet === null
                                ? 'rgba(0,113,227,0.1)'
                                : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontWeight: '600', color: '#1d1d1f' }}>
                            无套装
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#6e6e73', marginTop: '4px' }}>
                            不使用任何套装效果
                        </div>
                    </button>

                    {/* 套装选项 */}
                    {armorSets.map(({ type, info }) => (
                        <button
                            key={type}
                            onClick={() => { onSelect(type); onClose(); }}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                marginBottom: '12px',
                                borderRadius: '12px',
                                border: currentSet === type
                                    ? '2px solid #0071e3'
                                    : '1px solid rgba(0,0,0,0.08)',
                                background: currentSet === type
                                    ? 'rgba(0,113,227,0.1)'
                                    : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '600', color: '#1d1d1f' }}>
                                    {info.name}
                                </span>
                                {currentSet === type && (
                                    <span style={{
                                        background: '#0071e3',
                                        color: '#fff',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75em'
                                    }}>
                                        已选择
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '0.85em',
                                color: '#34c759',
                                marginTop: '6px',
                                fontWeight: '500'
                            }}>
                                {info.description}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="modal-footer">
                    <button className="modal-btn modal-btn-secondary" onClick={onClose}>
                        取消
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const ArmorSetSlot: React.FC<Props> = ({ slot }) => {
    const { armorSets, setArmorSet } = useAppStore();
    const [modalOpen, setModalOpen] = useState(false);

    const currentSet = slot === 'Bow' ? armorSets.bow : armorSets.skill;
    const setInfo = currentSet ? ARMOR_SET_BONUSES[currentSet] : null;

    return (
        <>
            <div
                onClick={() => setModalOpen(true)}
                style={{
                    border: currentSet
                        ? '1px solid rgba(0,113,227,0.3)'
                        : '1px dashed rgba(0,0,0,0.15)',
                    borderRadius: '16px',
                    padding: '14px',
                    minHeight: '160px',
                    cursor: 'pointer',
                    background: currentSet
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    boxShadow: currentSet ? '0 2px 12px rgba(0,113,227,0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = currentSet ? '#0071e3' : 'rgba(0,0,0,0.3)';
                    e.currentTarget.style.background = currentSet
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = currentSet
                        ? 'rgba(0,113,227,0.3)'
                        : 'rgba(0,0,0,0.15)';
                    e.currentTarget.style.background = currentSet
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.4)';
                }}
            >
                {/* 槽位名称 */}
                <div style={{
                    fontWeight: '600',
                    marginBottom: '10px',
                    color: '#1d1d1f',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    padding: '4px 8px',
                    background: 'rgba(139,92,246,0.12)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}>
                    <span>{SLOT_ICONS[slot]}</span>
                    <span>{SLOT_NAMES[slot]}</span>
                </div>

                {/* 内容区域 */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {setInfo ? (
                        <>
                            <div style={{
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: '#1d1d1f',
                                marginBottom: '8px'
                            }}>
                                {setInfo.name}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#34c759',
                                fontWeight: '500',
                                padding: '4px 12px',
                                background: 'rgba(52,199,89,0.1)',
                                borderRadius: '6px'
                            }}>
                                {setInfo.description}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{
                                fontSize: '2rem',
                                marginBottom: '8px',
                                opacity: 0.4
                            }}>
                                {SLOT_ICONS[slot]}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#6e6e73'
                            }}>
                                点击选择套装
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ArmorSetModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                slot={slot}
                currentSet={currentSet}
                onSelect={(setType) => setArmorSet(slot, setType)}
            />
        </>
    );
};
