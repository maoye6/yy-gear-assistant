/**
 * 术语表工具模块
 * 提供属性名的中文显示和格式化功能
 */

import terminologyData from './json/terminology.json';

// ============================================================
// Type Definitions
// ============================================================

export type AttributeKey = string;

interface TerminologyData {
    version: string;
    description: string;
    attributes: {
        [category: string]: {
            [key: string]: string;
        };
    };
    percent_attributes: string[];
    min_max_pairs: [string, string, string][];
}

// ============================================================
// Data Loading
// ============================================================

const terminology = terminologyData as unknown as TerminologyData;

// 展平的属性名映射表
const attributeNameMap: Record<string, string> = {};

// 构建扁平映射表
Object.values(terminology.attributes).forEach(category => {
    Object.entries(category).forEach(([key, name]) => {
        attributeNameMap[key] = name;
    });
});

// 百分比属性集合
const percentAttributeSet = new Set(terminology.percent_attributes);

// min/max 配对表
const minMaxPairMap = new Map<string, { maxKey: string; displayName: string }>();
terminology.min_max_pairs.forEach(([minKey, maxKey, displayName]) => {
    minMaxPairMap.set(minKey, { maxKey, displayName });
});

// ============================================================
// Helper Functions
// ============================================================

/**
 * 获取属性的中文名称
 * @param key - 属性变量名
 * @returns 中文名称，如果未找到则返回原变量名
 */
export function getAttributeName(key: string): string {
    return attributeNameMap[key] || key;
}

/**
 * 判断属性是否为百分比属性
 * @param key - 属性变量名
 * @returns 是否为百分比属性
 */
export function isPercentAttribute(key: string): boolean {
    return percentAttributeSet.has(key);
}

/**
 * 判断属性是否为 min/max 配对中的最小值属性
 * @param key - 属性变量名
 * @returns 配对信息，如果不是 min 属性则返回 null
 */
export function getMinMaxPairInfo(key: string): { maxKey: string; displayName: string } | null {
    if (key.startsWith('min_')) {
        const pair = minMaxPairMap.get(key);
        if (pair) return pair;
    }
    return null;
}

/**
 * 提取属性的 base key（去掉 min_/max_ 前缀）
 * @param key - 属性变量名
 * @returns base key
 */
export function getBaseAttributeKey(key: string): string {
    return key.replace(/^min_/, '').replace(/^max_/, '');
}

/**
 * 格式化属性值显示
 * @param key - 属性变量名
 * @param value - 属性值
 * @returns 格式化后的字符串
 */
export function formatAttributeValue(key: string, value: number): string {
    const name = getAttributeName(key);
    const isPercent = isPercentAttribute(getBaseAttributeKey(key));

    if (isPercent) {
        return `${name}+${(value * 100).toFixed(1)}%`;
    } else {
        return `${name}+${value.toFixed(1)}`;
    }
}

/**
 * 格式化 min/max 范围值显示
 * @param minKey - 最小值属性变量名
 * @param minValue - 最小值
 * @param maxValue - 最大值
 * @returns 格式化后的字符串
 */
export function formatMinMaxValue(
    minKey: string,
    minValue: number,
    maxValue: number
): string {
    const pairInfo = getMinMaxPairInfo(minKey);
    const baseKey = getBaseAttributeKey(minKey);
    const displayName = pairInfo?.displayName || getAttributeName(baseKey);
    const isPercent = isPercentAttribute(baseKey);

    if (minValue === maxValue) {
        // 单一值
        const value = isPercent ? (minValue * 100).toFixed(1) + '%' : minValue.toFixed(1);
        return `${displayName}+${value}`;
    } else {
        // 范围值
        if (isPercent) {
            return `${displayName}+${(minValue * 100).toFixed(1)}%~${(maxValue * 100).toFixed(1)}%`;
        } else {
            return `${displayName}+${minValue.toFixed(1)}~${maxValue.toFixed(1)}`;
        }
    }
}

/**
 * 获取所有属性的完整分类列表
 * @returns 按分类的属性映射表
 */
export function getAllAttributes() {
    return terminology.attributes;
}

/**
 * 获取所有百分比属性列表
 * @returns 百分比属性变量名数组
 */
export function getPercentAttributes(): string[] {
    return terminology.percent_attributes;
}

/**
 * 获取所有 min/max 配对列表
 * @returns 配对信息数组
 */
export function getMinMaxPairs(): [string, string, string][] {
    return terminology.min_max_pairs;
}
