import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Affix, EquipmentItem, EquipmentSlot as SlotType } from '../types';
import { getInitialPool, getTiaoluPool, getDingyinPool } from '../data/affixes';
import { useAppStore } from '../store/AppContext';
import { AffixInput } from './AffixInput';
import { AffixPools, GameConstants } from '../data/loaders';
import { checkAffixConflict, getConflictMessage } from '../core/affixConflict';
import './Modal.css';

interface Props {
    slot: SlotType;
    isOpen: boolean;
    onClose: () => void;
}

export const EquipmentEditor: React.FC<Props> = ({ slot, isOpen, onClose }) => {
    const { equipments, updateEquipment, selectedSubSchool } = useAppStore();
    const currentItem = equipments[slot];

    // Local State
    const [gongAffixes, setGongAffixes] = useState<Affix[]>([]);
    const [shang, setShang] = useState<Affix | undefined>();
    const [jue, setJue] = useState<Affix | undefined>();
    const [zhi, setZhi] = useState<Affix | undefined>();
    const [yu, setYu] = useState<Affix | undefined>();
    const [dingyin, setDingYin] = useState<Affix | undefined>();

    // 使用辅助函数获取正确的词条池
    const gongPool = getInitialPool(slot);
    const dingyinPool = getDingyinPool(slot);
    const tuningPool = getTiaoluPool(slot);

    // Get school display name
    const schoolInfo = selectedSubSchool ? AffixPools.subSchools[selectedSubSchool] : null;

    // Load from existing item when opening
    useEffect(() => {
        if (isOpen && currentItem) {
            setGongAffixes(currentItem.affix_gong || []);
            setShang(currentItem.affix_shang);
            setJue(currentItem.affix_jue);
            setZhi(currentItem.affix_zhi);
            setYu(currentItem.affix_yu);
            setDingYin(currentItem.affix_dingyin);
        } else if (isOpen && !currentItem) {
            setGongAffixes([]);
            setShang(undefined);
            setJue(undefined);
            setZhi(undefined);
            setYu(undefined);
            setDingYin(undefined);
        }
    }, [isOpen, currentItem]);

    // 收集已选词条类型（用于实时禁用）
    const getSelectedAffixTypes = (): string[] => {
        const types: string[] = [];
        if (shang) types.push(shang.type);
        if (jue) types.push(jue.type);
        if (zhi) types.push(zhi.type);
        if (yu) types.push(yu.type);
        return types;
    };

    const selectedTypes = getSelectedAffixTypes();

    const handleSave = () => {
        const tempItem: EquipmentItem = {
            id: currentItem?.id || `eq_${Date.now()}`,
            slot,
            level: GameConstants.levelCaps.maxCharacterLevel,
            affix_gong: gongAffixes.filter(a => !!a),
            affix_shang: shang,
            affix_jue: jue,
            affix_zhi: zhi,
            affix_yu: yu,
            affix_dingyin: dingyin
        };

        // 检查词条冲突
        const conflictResult = checkAffixConflict(tempItem);
        if (conflictResult.hasConflict) {
            const messages = getConflictMessage(conflictResult);
            alert(`词条冲突检测失败：\n\n${messages.join('\n\n')}\n\n请修改后重新保存。`);
            return;
        }

        // 无冲突，保存装备
        updateEquipment(slot, tempItem);
        onClose();
    };

    const updateGong = (index: number, val: Affix | undefined) => {
        const newArr = [...gongAffixes];
        if (val) newArr[index] = val;
        else newArr.splice(index, 1);
        setGongAffixes(newArr);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-container" style={{ width: '90vw', maxWidth: '720px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">编辑装备: {AffixPools.slots[slot].name}</h2>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <span style={{
                                fontSize: '0.85rem',
                                padding: '4px 12px',
                                background: 'rgba(0, 113, 227, 0.1)',
                                borderRadius: '8px',
                                color: '#0071e3',
                                fontWeight: '500'
                            }}>
                                {schoolInfo?.name || '未选择流派'}
                            </span>
                            <span style={{
                                fontSize: '0.85rem',
                                padding: '4px 12px',
                                background: 'rgba(110, 110, 115, 0.1)',
                                borderRadius: '8px',
                                color: '#6e6e73',
                                fontWeight: '500'
                            }}>
                                Lv.{GameConstants.levelCaps.maxCharacterLevel}
                            </span>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    <div style={{ display: 'flex', gap: '16px', minWidth: 0 }}>
                        {/* Left Column: Gong (Initial) */}
                        <div style={{ flex: '0 0 45%', minWidth: 0, borderRight: '1px solid rgba(0,0,0,0.06)', paddingRight: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>宫 (初始词条)</h3>
                                {gongAffixes.length > 0 && (
                                    <button
                                        onClick={() => setGongAffixes([])}
                                        style={{
                                            fontSize: '0.85rem',
                                            color: '#ef4444',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        清除
                                    </button>
                                )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6e6e73', marginBottom: '16px' }}>
                                装备自带属性 (仅限1条)
                            </div>

                            {gongAffixes.length > 0 ? (
                                <AffixInput
                                    key="gong_0"
                                    label="初始"
                                    affix={gongAffixes[0]}
                                    pool={gongPool}
                                    onChange={(val) => updateGong(0, val)}
                                />
                            ) : (
                                <button
                                    onClick={() => setGongAffixes([{ name: '', type: 'min_attack', value: 0, range: [0, 0], quality: 'Legendary' }])}
                                    style={{
                                        width: '100%',
                                        padding: '20px',
                                        border: '1px dashed rgba(0,0,0,0.15)',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        color: '#6e6e73',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,113,227,0.08)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                                >
                                    + 点击设置宫词条
                                </button>
                            )}
                        </div>

                        {/* Right Column: Tuning & DingYin */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1d1d1f', margin: '0 0 12px 0' }}>商角徵羽 (调律)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <AffixInput
                                    label="商"
                                    affix={shang}
                                    pool={tuningPool}
                                    onChange={setShang}
                                    disabledAffixTypes={selectedTypes.filter(t => t !== shang?.type)}
                                />
                                <AffixInput
                                    label="角"
                                    affix={jue}
                                    pool={tuningPool}
                                    onChange={setJue}
                                    disabledAffixTypes={selectedTypes.filter(t => t !== jue?.type)}
                                />
                                <AffixInput
                                    label="徵"
                                    affix={zhi}
                                    pool={tuningPool}
                                    onChange={setZhi}
                                    disabledAffixTypes={selectedTypes.filter(t => t !== zhi?.type)}
                                />
                                <AffixInput
                                    label="羽"
                                    affix={yu}
                                    pool={tuningPool}
                                    onChange={setYu}
                                    disabledAffixTypes={selectedTypes.filter(t => t !== yu?.type)}
                                />

                                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '8px', paddingTop: '16px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1d1d1f', margin: '0 0 12px 0' }}>定音 (最终)</h3>
                                    <AffixInput label="定音" affix={dingyin} pool={dingyinPool} onChange={setDingYin} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <span style={{ fontSize: '0.85rem', color: '#6e6e73' }}>
                        所有词条范围均为大世界等级18级标准
                    </span>
                    <div className="modal-footer-right">
                        <button className="modal-btn modal-btn-secondary" onClick={onClose}>取消</button>
                        <button className="modal-btn modal-btn-primary" onClick={handleSave}>保存装备</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
