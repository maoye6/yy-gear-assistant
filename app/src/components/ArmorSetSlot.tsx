import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { ArmorSetType, ArmorSetSlot as SlotType } from '../types';
import { ARMOR_SET_BONUSES } from '../types';
import { useAppStore } from '../store/AppContext';
import styles from './ArmorSetSlot.module.css';
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
                        className={`${styles.setOption} ${currentSet === null ? styles['setOption--selected'] : ''}`}
                    >
                        <div className={styles.setOptionHeader}>
                            <span className={styles.setOptionName}>无套装</span>
                            {currentSet === null && <span className={styles.selectedBadge}>已选择</span>}
                        </div>
                        <div className={styles.setOptionDesc}>
                            不使用任何套装效果
                        </div>
                    </button>

                    {/* 套装选项 */}
                    {armorSets.map(({ type, info }) => (
                        <button
                            key={type}
                            onClick={() => { onSelect(type); onClose(); }}
                            className={`${styles.setOption} ${currentSet === type ? styles['setOption--selected'] : ''}`}
                        >
                            <div className={styles.setOptionHeader}>
                                <span className={styles.setOptionName}>{info.name}</span>
                                {currentSet === type && <span className={styles.selectedBadge}>已选择</span>}
                            </div>
                            <div className={styles.setOptionDesc}>
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
                className={`${styles.slotCard} ${setInfo ? styles['slotCard--hasSet'] : ''}`}
            >
                {/* 槽位名称 */}
                <div className={styles.slotTitle}>
                    <span>{SLOT_ICONS[slot]}</span>
                    <span>{SLOT_NAMES[slot]}</span>
                </div>

                {/* 内容区域 */}
                <div className={styles.content}>
                    {setInfo ? (
                        <>
                            <div className={styles.setName}>
                                {setInfo.name}
                            </div>
                            <div className={styles.setDescription}>
                                {setInfo.description}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.emptyIcon}>
                                {SLOT_ICONS[slot]}
                            </div>
                            <div className={styles.emptyText}>
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
