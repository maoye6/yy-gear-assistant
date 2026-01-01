import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// CSS 导入顺序很重要：
// 1. 首先导入设计系统变量（其他样式依赖这些变量）
import './styles/variables.css'

// 2. 然后导入全局基础样式
import './index.css'

// 3. 接着导入工具类
import './styles/utilities.css'

// 4. 最后 App.tsx 会导入 App.css

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
