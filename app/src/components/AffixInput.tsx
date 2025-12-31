import React, { useEffect, useState } from 'react';
import type { Affix } from '../types';

interface Props {
    label: string;
    affix: Affix | undefined;
    pool: Affix[];
    onChange: (newAffix: Affix | undefined) => void;
    // 新增：已选词条类型列表（用于防重复）
    disabledAffixTypes?: string[];
    // 新增：是否禁用（因为被其他槽位选中了相同类型）
    isDisabled?: boolean;
}

export const AffixInput: React.FC<Props> = ({
    label,
    affix,
    pool,
    onChange,
    disabledAffixTypes = [],
    isDisabled = false
}) => {
    const [selectedName, setSelectedName] = useState<string>(affix?.name || '');

    useEffect(() => {
        setSelectedName(affix?.name || '');
    }, [affix]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        if (!name) {
            onChange(undefined);
            return;
        }
        const template = pool.find(p => p.name === name);
        if (template) {
            // 选择词条后自动填入最大值
            onChange({ ...template, value: template.value });
        }
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (affix && !isNaN(val)) {
            onChange({ ...affix, value: val });
        }
    };

    const currentTemplate = pool.find(p => p.name === selectedName);
    const range = currentTemplate?.range;

    // 检查当前选中词条是否与其他槽位冲突
    const isCurrentConflicted = affix && disabledAffixTypes.includes(affix.type);

    return (
        <div style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '12px',
            marginBottom: '8px',
            border: isCurrentConflicted ? '1px solid rgba(255, 149, 0, 0.5)' : '1px solid rgba(0,0,0,0.06)',
            opacity: isDisabled ? 0.5 : 1
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1d1d1f' }}>
                    {label}
                    {isCurrentConflicted && (
                        <span style={{ color: '#FF9500', marginLeft: '6px', fontWeight: '500' }}>
                            (与已有词条冲突)
                        </span>
                    )}
                </span>
                {range && (
                    <span style={{ fontSize: '0.8rem', color: '#6e6e73' }}>
                        {range[0] === range[1]
                            ? `满值${range[1]}`
                            : `+${range[0]}~${range[1]}`}
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <select
                    value={selectedName}
                    onChange={handleTypeChange}
                    disabled={isDisabled}
                    style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.8)',
                        fontSize: '0.85rem',
                        color: '#1d1d1f',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1
                    }}
                >
                    <option value="">-- 未选择 --</option>
                    {pool.map((p, i) => {
                        // 检查该选项是否被禁用
                        const isOptionDisabled = disabledAffixTypes.includes(p.type) &&
                            p.type !== affix?.type; // 不禁用当前已选的词条
                        const isConflicted = isOptionDisabled && p.type !== affix?.type;

                        return (
                            <option
                                key={`${p.name}_${i}`}
                                value={p.name}
                                disabled={isOptionDisabled}
                                style={{ color: isConflicted ? '#999' : undefined }}
                            >
                                {p.name}
                                {isConflicted && ' (已选择)'}
                            </option>
                        );
                    })}
                </select>

                <input
                    type="number"
                    value={affix && affix.value !== 0 ? affix.value : ''}
                    onChange={handleValueChange}
                    step={0.1}
                    placeholder={range ? `范围: ${range[0]}~${range[1]}` : ''}
                    disabled={!affix || isDisabled}
                    style={{
                        width: '65px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: (affix && !isDisabled) ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.03)',
                        fontSize: '0.85rem',
                        color: '#1d1d1f'
                    }}
                />
            </div>
            {affix && range && (affix.value < range[0] || affix.value > range[1]) && (
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '4px' }}>
                    ⚠ 数值超出正常范围
                </div>
            )}
        </div>
    );
};
