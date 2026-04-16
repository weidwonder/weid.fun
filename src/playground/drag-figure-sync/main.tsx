import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/styles/global.css'
import { PlaygroundPage } from './page'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlaygroundPage />
  </React.StrictMode>,
)
