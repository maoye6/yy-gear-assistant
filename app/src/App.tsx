import React from 'react';
import { AppProvider, useAppStore } from './store/AppContext';
import { EquipmentGrid } from './components/EquipmentGrid';
import { StatsDisplay } from './components/StatsDisplay';
import { BuildSelector } from './components/BuildSelector';
import { GraduationReportDisplay } from './components/GraduationReport';
import { OptimizationSuggestions } from './components/OptimizationSuggestions';
import { OptimalBuildDisplay } from './components/OptimalBuildDisplay';

// --- Main App ---

import './App.css';

// 统一的卡片容器样式 - 使用百分比和弹性布局
const cardContainerStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderRadius: 'clamp(12px, 2vw, 20px)',
  padding: 'clamp(16px, 2vw, 24px)',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02), 0 8px 16px rgba(0, 0, 0, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.7)',
  minHeight: '250px',
  maxHeight: '35vh',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <header style={{ textAlign: 'center', marginBottom: 'clamp(12px, 2vw, 20px)' }}>
          <h1 style={{ fontWeight: 'bold', margin: 0 }}>燕云十六声 培养助手</h1>
          <p className="subtitle">Equipment Simulator & Damage Calculator</p>
        </header>

        <main className="main-layout">
          {/* Left Sidebar (Stats) */}
          <aside className="stats-sidebar">
            <StatsDisplay />
          </aside>

          <section className="content-area">
            {/* Row 1: 流派心法 + 装备配置 */}
            <div className="row-1">
              {/* 左侧列：流派心法 */}
              <div className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px',
                overflow: 'hidden'
              }}>
                <BuildSelector />
              </div>

              {/* 右侧列：装备配置 */}
              <div className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <h2 style={{ margin: 0 }}>装备配置</h2>
                  <div style={{ fontSize: 'clamp(0.7em, 1.5vw, 0.85em)', color: '#888' }}>
                    点击卡片添加/编辑装备
                  </div>
                </div>

                {/* 装备网格容器 */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  minHeight: 0,
                  padding: '2px'
                }}>
                  <EquipmentGrid />
                </div>
              </div>
            </div>

            {/* Row 2: 装备评分 + 优化建议 + 理论最优 */}
            <div className="row-2">
              {/* 装备评分模块 */}
              <div style={cardContainerStyle}>
                <GraduationReportWrapper />
              </div>

              {/* 优化建议模块 */}
              <div style={cardContainerStyle}>
                <OptimizationSuggestionsWrapper />
              </div>

              {/* 理论最优方案 */}
              <div style={cardContainerStyle}>
                <OptimalBuildWrapper />
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppProvider>
  );
}

// 评价报告包装组件：需要用户点击按钮才会显示评分
const GraduationReportWrapper: React.FC = () => {
  const { graduationReport, selectedSubSchool, equipments } = useAppStore();
  const [showReport, setShowReport] = React.useState(false);

  // 检查是否有配置装备
  const hasEquipment = Object.values(equipments).some(item => item !== null);
  const canEvaluate = selectedSubSchool && hasEquipment;

  const handleEvaluate = () => {
    if (canEvaluate) {
      setShowReport(true);
    }
  };

  // 如果用户还没点击评分按钮，显示初始界面
  if (!showReport) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#1d1d1f',
          margin: '0 0 20px 0',
          letterSpacing: '-0.02em'
        }}>综合评分</h3>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.5 }}>📊</div>
          <div style={{ fontSize: '0.9em', color: '#888', textAlign: 'center' }}>
            {canEvaluate ? '配置完成，点击下方按钮开始评分' : '请先选择流派并配置装备'}
          </div>
          <button
            onClick={handleEvaluate}
            disabled={!canEvaluate}
            style={{
              padding: '10px 24px',
              background: canEvaluate ? '#0071e3' : 'rgba(0,0,0,0.1)',
              color: canEvaluate ? '#fff' : '#888',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: canEvaluate ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              marginTop: '8px'
            }}
          >
            开始评分
          </button>
        </div>
      </div>
    );
  }

  if (!graduationReport) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontSize: '0.9em',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px'
      }}>
        评分计算中...
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0
      }}>
        <GraduationReportDisplay report={graduationReport} />
      </div>
    </div>
  );
};

// 优化建议包装组件
const OptimizationSuggestionsWrapper: React.FC = () => {
  const { optimizationReport } = useAppStore();

  if (!optimizationReport) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#1d1d1f',
          margin: '0 0 20px 0',
          letterSpacing: '-0.02em'
        }}>优化建议</h3>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: '0.9em',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '12px' }}>💡</div>
          配置装备后查看优化建议
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0
      }}>
        <OptimizationSuggestions optimizationReport={optimizationReport} />
      </div>
    </div>
  );
};

// 理论最优方案包装组件
const OptimalBuildWrapper: React.FC = () => {
  const { selectedSubSchool } = useAppStore();

  if (!selectedSubSchool) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#1d1d1f',
          margin: '0 0 20px 0',
          letterSpacing: '-0.02em'
        }}>理论最优</h3>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: '0.9em',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '12px' }}>🎯</div>
          选择流派后查看理论最优方案
        </div>
      </div>
    );
  }

  return <OptimalBuildDisplay subSchool={selectedSubSchool} />;
};

export default App;

