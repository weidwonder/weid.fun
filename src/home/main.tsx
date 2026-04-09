import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/styles/global.css'
import { HomePage } from './HomePage'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>,
)
