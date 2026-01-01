/**
 * 流派选择器组件
 * SchoolSelector - Allows user to select their martial arts school
 */

import React from 'react';
import { useAppStore } from '../store/AppContext';
import { AffixPools, type SchoolType } from '../data/loaders';
import styles from './SchoolSelector.module.css';

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
                className={styles.compactSelect}
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
        <div className={styles.container}>
            <h4 className={styles.title}>选择流派</h4>
            <div className={styles.schoolGrid}>
                {schools.map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedSchool(key)}
                        className={`${styles.schoolButton} ${selectedSchool === key ? styles['schoolButton--active'] : ''}`}
                    >
                        <div className={styles.schoolButtonName}>
                            {info.name}
                            <span className={styles.schoolButtonSubs}>
                                {info.subNames.join(' / ')}
                            </span>
                        </div>
                        <div className={styles.schoolButtonDesc}>
                            {SCHOOL_DESCRIPTIONS[key]}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
