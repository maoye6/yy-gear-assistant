import React, { createContext, useContext, useMemo, useState } from 'react';
import type {
    PanelStats,
    EquipmentItem,
    EquipmentSlot,
    GraduationReport,
    EvaluationContext,
    OptimizationReport,
    ArmorSetConfig,
    ArmorSetType,
    ArmorSetSlot
} from '../types';
import { ARMOR_SET_BONUSES } from '../types';
import { calculatePanelStats } from '../core/stats';
import { calculateEffectiveStats } from '../core/formulas';
import { calculateExpectedDamage } from '../core/damage';
import { evaluateGraduation } from '../core/evaluation';
import { generateOptimizationReport } from '../core/optimization';
import { type SchoolType, type SubSchoolType, type TechniqueInfo, getParentSchool, GameConstants } from '../data/loaders';
import { DEFAULT_BASE_STATS } from '../data/defaults';

interface AppState {
    baseStats: PanelStats;
    equipments: Record<EquipmentSlot, EquipmentItem | null>;
    armorSets: ArmorSetConfig; // 弓和诀套装
    panelStats: PanelStats; // Computed
    selectedSchool: SchoolType | null; // Parent school (derived from subSchool)
    selectedSubSchool: SubSchoolType | null; // Current sub-school selection
    selectedTechniques: (TechniqueInfo | null)[]; // 4 technique slots
    graduationReport: GraduationReport | null; // 评价报告
    evaluationContext: EvaluationContext | null; // 评价上下文
    optimizationReport: OptimizationReport | null; // 优化建议报告
}

interface AppActions {
    setBaseStats: (stats: PanelStats) => void;
    updateEquipment: (slot: EquipmentSlot, item: EquipmentItem | null) => void;
    setArmorSet: (slot: ArmorSetSlot, setType: ArmorSetType) => void;
    setSelectedSchool: (school: SchoolType) => void;
    setSelectedSubSchool: (subSchool: SubSchoolType) => void;
    setSelectedTechniques: (techniques: (TechniqueInfo | null)[]) => void;
    refreshEvaluation: () => void; // 手动触发重新评价
}

const AppContext = createContext<(AppState & AppActions) | null>(null);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default Base Stats (Level 18 World Level)
    const [baseStats, setBaseStats] = useState<PanelStats>(DEFAULT_BASE_STATS);

    // Default Sub-School (no selection initially)
    const [selectedSubSchool, setSelectedSubSchool] = useState<SubSchoolType | null>(null);

    // Default Techniques (4 empty slots)
    const [selectedTechniques, setSelectedTechniques] = useState<(TechniqueInfo | null)[]>([null, null, null, null]);

    // 用于手动触发重新评价
    const [, setRefreshCounter] = useState(0);

    // Derive parent school from sub-school
    const selectedSchool = useMemo(() => {
        if (!selectedSubSchool) return null;
        return getParentSchool(selectedSubSchool);
    }, [selectedSubSchool]);

    // Legacy setter for backward compatibility
    const setSelectedSchool = (school: SchoolType) => {
        // When setting parent school, default to first sub-school of that parent
        const subSchoolMap: Record<SchoolType, SubSchoolType> = {
            'MingJin': 'MingJin_Hong',
            'LieShi': 'LieShi_Jun',
            'QianSi': 'QianSi_Yu',
            'PoZhu': 'PoZhu_Feng'
        };
        setSelectedSubSchool(subSchoolMap[school]);
    };

    // Default Equipments (Empty)
    const [equipments, setEquipments] = useState<Record<EquipmentSlot, EquipmentItem | null>>({
        MainWeapon: null, SubWeapon: null,
        Ring: null, Pendant: null,
        Head: null, Chest: null, Legs: null, Wrist: null
    });

    // 弓和诀套装状态
    const [armorSets, setArmorSets] = useState<ArmorSetConfig>({
        bow: null,
        skill: null
    });

    // Compute derived panel stats (including equipment, techniques, and armor sets)
    const panelStats = useMemo(() => {
        const activeItems = Object.values(equipments).filter((i): i is EquipmentItem => i !== null);
        let stats = calculatePanelStats(baseStats, activeItems, selectedTechniques);

        // 应用套装加成
        const applyArmorSetBonus = (setType: ArmorSetType) => {
            if (!setType) return;
            const bonus = ARMOR_SET_BONUSES[setType].bonus;
            Object.entries(bonus).forEach(([key, value]) => {
                if (key in stats && typeof value === 'number') {
                    (stats as unknown as Record<string, number>)[key] += value;
                }
            });
        };

        applyArmorSetBonus(armorSets.bow);
        applyArmorSetBonus(armorSets.skill);

        return stats;
    }, [baseStats, equipments, selectedTechniques, armorSets]);

    // 自动计算评价上下文（使用标准战斗场景：满级BOSS）
    const evaluationContext = useMemo((): EvaluationContext | null => {
        if (!panelStats) return null;

        // 从配置获取满级抗性
        const resistance = GameConstants.combat.standardBoss.resistance;

        // 计算生效属性
        const effectiveStats = calculateEffectiveStats(
            panelStats.precision_rate,
            panelStats.crit_rate,
            panelStats.intent_rate,
            panelStats.direct_crit_rate,
            panelStats.direct_intent_rate,
            resistance
        );

        // 构建标准战斗上下文（从配置读取BOSS参数）
        const bossConfig = GameConstants.combat.standardBoss;
        const skillConfig = GameConstants.combat.referenceSkill;

        const combatContext = {
            attacker: panelStats,
            defender: {
                level: bossConfig.level,
                defense: bossConfig.defense,
                resistance_rate: bossConfig.resistance,
                is_boss: bossConfig.isBoss
            },
            skill: {
                name: skillConfig.name,
                hits: skillConfig.hits,
                multiplier_per_hit: skillConfig.multiplierPerHit,
                type: skillConfig.type as 'Martial'
            },
            buffs: []
        };

        // 计算期望伤害
        const expectedDamage = calculateExpectedDamage(combatContext, effectiveStats);

        return {
            panelStats,
            effectiveStats,
            resistance,
            combatContext,
            skill: combatContext.skill,
            expectedDamage
        };
    }, [panelStats]);

    // 自动计算评价报告
    const graduationReport = useMemo((): GraduationReport | null => {
        if (!evaluationContext) return null;
        return evaluateGraduation(evaluationContext);
    }, [evaluationContext]);

    // 自动计算优化建议报告
    const optimizationReport = useMemo((): OptimizationReport | null => {
        if (!evaluationContext || !selectedSubSchool) return null;

        const activeItems = Object.values(equipments).filter((i): i is EquipmentItem => i !== null);
        return generateOptimizationReport(evaluationContext, activeItems, selectedSubSchool);
    }, [evaluationContext, equipments, selectedSubSchool]);

    const updateEquipment = (slot: EquipmentSlot, item: EquipmentItem | null) => {
        setEquipments(prev => ({ ...prev, [slot]: item }));
    };

    // 设置弓/诀套装 - 套装需要弓诀一致才生效，所以同步设置
    const setArmorSet = (_slot: ArmorSetSlot, setType: ArmorSetType) => {
        // 无论选择的是弓还是诀，都同时设置两个槽位为相同套装
        setArmorSets({
            bow: setType,
            skill: setType
        });
    };

    // 手动触发重新评价
    const refreshEvaluation = () => {
        setRefreshCounter(prev => prev + 1);
    };

    return (
        <AppContext.Provider value={{
            baseStats, equipments, armorSets, panelStats,
            selectedSchool, selectedSubSchool, selectedTechniques,
            graduationReport, evaluationContext, optimizationReport,
            setBaseStats, updateEquipment, setArmorSet,
            setSelectedSchool, setSelectedSubSchool, setSelectedTechniques,
            refreshEvaluation
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppStore = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppStore must be used within AppProvider');
    return context;
};
