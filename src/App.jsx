import React from 'react'
import GroupList from './components/GroupList'

export default function App() {
  return (
    <div className="min-h-screen p-6 text-xs">
      <h1 className="text-2xl font-bold mb-6 text-center">
        IgrejaRed - Pequenos Grupos
      </h1>
      <GroupList />
    </div>
  )
}
