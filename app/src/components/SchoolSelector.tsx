/**
 * 流派选择器组件
 * SchoolSelector - Allows user to select their martial arts school
 */

import React from 'react';
import { useAppStore } from '../store/AppContext';
import { AffixPools, type SchoolType } from '../data/loaders';

const SCHOOL_DESCRIPTIONS: Record<SchoolType, string> = {
    MingJin: '会意流派 - 追求会意率',
    LieShi: '会心流派 - 平衡输出',
    QianSi: '会心流派 - 玉(输出)/霖(治疗)',
    PoZhu: '会心流派 - 多样化输出'
};

interface SchoolSelectorProps {
    compact?: boolean;
}

export const SchoolSelector: React.FC<SchoolSelectorProps> = ({ compact = false }) => {
    const { selectedSchool, setSelectedSchool } = useAppStore();

    const schools = Object.entries(AffixPools.schools) as [SchoolType, typeof AffixPools.schools[SchoolType]][];

    if (compact) {
        return (
            <select
                value={selectedSchool ?? ''}
                onChange={(e) => setSelectedSchool(e.target.value as SchoolType)}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #ddd)',
                    background: 'var(--bg-secondary, #f9f9f9)',
                    fontSize: '0.9em',
                    cursor: 'pointer'
                }}
            >
                <option value="" disabled>选择流派...</option>
                {schools.map(([key, info]) => (
                    <option key={key} value={key}>
                        {info.name} ({info.subNames.join('/')})
                    </option>
                ))}
            </select>
        );
    }

    return (
        <div className="school-selector">
            <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>选择流派</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {schools.map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedSchool(key)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: selectedSchool === key ? '2px solid #4a90d9' : '1px solid #ddd',
                            background: selectedSchool === key ? 'linear-gradient(135deg, #e8f4fd, #d1e9fc)' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {info.name}
                            <span style={{
                                fontSize: '0.8em',
                                color: '#888',
                                marginLeft: '8px'
                            }}>
                                {info.subNames.join(' / ')}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.75em', color: '#666' }}>
                            {SCHOOL_DESCRIPTIONS[key]}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
