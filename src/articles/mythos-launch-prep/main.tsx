import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArticlePage } from './page'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArticlePage />
  </React.StrictMode>
)
