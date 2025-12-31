/**
 * 毕业度评价报告展示组件
 *
 * 显示装备配置的评价结果，包括：
 * - 评分卡片（评分 + 等级 + 期望伤害）
 * - 标签切换（概览/详情）
 * - 问题列表、属性分析
 *
 * 注意：优化建议已移至独立的 OptimizationSuggestions 组件
 */

import { useState } from 'react';
import type { GraduationReport } from '../types';
import { getGradeColor, getSeverityColor } from '../core/evaluation';

interface GraduationReportDisplayProps {
  report: GraduationReport;
}

type TabType = 'overview' | 'details';

export const GraduationReportDisplay: React.FC<GraduationReportDisplayProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!report) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>暂无评价数据</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 标题 */}
      <h3 style={styles.panelTitle}>综合评分</h3>

      {/* 评分卡片 */}
      <div style={styles.scoreCard}>
        <div style={styles.scoreHeader}>
          <div style={styles.scoreLeft}>
            <div style={styles.scoreValue}>{Math.round(report.overall_score)}</div>
            <div style={styles.scoreLabel}>综合评分</div>
          </div>
          <div
            style={{
              ...styles.gradeBadge,
              background: getGradeColor(report.grade)
            }}
          >
            {report.grade}
          </div>
        </div>
        <div style={styles.scoreDetails}>
          <div style={styles.scoreDetailItem}>
            <span style={styles.detailLabel}>期望伤害:</span>
            <span style={styles.detailValue}>{report.expected_damage.toFixed(0)}</span>
          </div>
          <div style={styles.scoreDetailItem}>
            <span style={styles.detailLabel}>优化潜力:</span>
            <span style={{ ...styles.detailValue, color: report.optimization_potential > 5 ? '#34C759' : '#8E8E93' }}>
              +{report.optimization_potential.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div style={styles.tabNavigation}>
        <TabButton
          label="概览"
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          label="详情"
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        />
      </div>

      {/* 内容区域 */}
      <div style={styles.contentArea}>
        {activeTab === 'overview' && <OverviewTab report={report} />}
        {activeTab === 'details' && <DetailsTab report={report} />}
      </div>
    </div>
  );
};

// ==========================
// 子组件
// ==========================

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <button
    style={{
      ...styles.tabButton,
      ...(active ? styles.tabButtonActive : {})
    }}
    onClick={onClick}
  >
    {label}
  </button>
);

const OverviewTab: React.FC<{ report: GraduationReport }> = ({ report }) => {
  if (report.problems.length === 0) {
    return (
      <div style={styles.emptyTab}>
        <div style={styles.successIcon}>✓</div>
        <div style={styles.successMessage}>配置优秀，无问题！</div>
      </div>
    );
  }

  return (
    <div style={styles.problemList}>
      <div style={styles.sectionTitle}>核心问题</div>
      {report.problems.map((problem, index) => (
        <div key={index} style={styles.problemItem}>
          <div style={styles.problemHeader}>
            <span
              style={{
                ...styles.severityBadge,
                backgroundColor: getSeverityColor(problem.severity)
              }}
            >
              {getSeverityLabel(problem.severity)}
            </span>
            <span style={styles.problemMessage}>{problem.message}</span>
          </div>
          {problem.impact_value > 0 && (
            <div style={styles.problemImpact}>
              期望伤害损失: -{(problem.impact_value * 100).toFixed(1)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const DetailsTab: React.FC<{ report: GraduationReport }> = ({ report }) => {
  return (
    <div style={styles.detailsContainer}>
      <div style={styles.sectionTitle}>属性效率分析</div>
      {report.stat_analysis.map((stat) => (
        <div key={stat.key} style={styles.statItem}>
          <div style={styles.statHeader}>
            <span style={styles.statName}>{stat.name}</span>
            <span
              style={{
                ...styles.statStatus,
                color: getStatusColor(stat.status)
              }}
            >
              {getStatusLabel(stat.status)}
            </span>
          </div>
          <div style={styles.statBarContainer}>
            <div
              style={{
                ...styles.statBarFill,
                width: `${stat.efficiency * 100}%`,
                backgroundColor: getBarColor(stat.status)
              }}
            />
          </div>
          <div style={styles.statDetails}>
            <span>白字: {(stat.current * 100).toFixed(1)}%</span>
            <span>生效: {(stat.effective * 100).toFixed(1)}%</span>
            {stat.waste_percentage !== undefined && (
              <span style={{ color: '#FF3B30' }}>
                溢出: {stat.waste_percentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================
// 辅助函数
// ==========================

function getSeverityLabel(severity: string): string {
  const labels = {
    Critical: '严重',
    Warning: '警告',
    Info: '提示'
  };
  return labels[severity as keyof typeof labels] || severity;
}

function getStatusLabel(status: string): string {
  const labels = {
    Wasted: '溢出浪费',
    OverCap: '超出上限',
    NearCap: '接近满值',
    UnderCap: '正常'
  };
  return labels[status as keyof typeof labels] || status;
}

function getStatusColor(status: string): string {
  const colors = {
    Wasted: '#FF3B30',
    OverCap: '#FF9500',
    NearCap: '#FFD60A',
    UnderCap: '#34C759'
  };
  return colors[status as keyof typeof colors] || '#8E8E93';
}

function getBarColor(status: string): string {
  const colors = {
    Wasted: '#FF3B30',
    OverCap: '#FF9500',
    NearCap: '#FFD60A',
    UnderCap: '#34C759'
  };
  return colors[status as keyof typeof colors] || '#8E8E93';
}

// ==========================
// 样式定义
// ==========================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#8E8E93'
  },

  panelTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: '0 0 20px 0',
    letterSpacing: '-0.02em'
  },

  // 评分卡片
  scoreCard: {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px'
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  scoreLeft: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1C1C1E',
    lineHeight: '1'
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#8E8E93',
    marginTop: '4px'
  },
  gradeBadge: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '12px',
    minWidth: '60px',
    textAlign: 'center' as const
  },
  scoreDetails: {
    display: 'flex',
    gap: '24px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0,0,0,0.1)'
  },
  scoreDetailItem: {
    display: 'flex',
    gap: '8px'
  },
  detailLabel: {
    fontSize: '14px',
    color: '#8E8E93'
  },
  detailValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1C1C1E'
  },

  // 标签导航
  tabNavigation: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  tabButton: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.05)',
    fontSize: '15px',
    fontWeight: '500',
    color: '#8E8E93',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabButtonActive: {
    background: '#0071E3',
    color: '#fff'
  },

  // 内容区域
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0
  },

  // 问题列表
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: '12px'
  },
  problemList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  problemItem: {
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '10px',
    padding: '12px',
    borderLeft: '4px solid #FF3B30'
  },
  problemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  severityBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  problemMessage: {
    fontSize: '14px',
    color: '#1C1C1E'
  },
  problemImpact: {
    fontSize: '12px',
    color: '#FF3B30',
    marginTop: '4px'
  },

  // 属性详情
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  statItem: {
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '10px',
    padding: '12px'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  statName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1C1C1E'
  },
  statStatus: {
    fontSize: '12px',
    fontWeight: '600'
  },
  statBarContainer: {
    height: '8px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  statBarFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  statDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#8E8E93'
  },

  // 空状态
  emptyTab: {
    textAlign: 'center' as const,
    padding: '40px 20px'
  },
  successIcon: {
    fontSize: '48px',
    color: '#34C759',
    marginBottom: '12px'
  },
  successMessage: {
    fontSize: '16px',
    color: '#1C1C1E',
    fontWeight: '500'
  }
};
