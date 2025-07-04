// src/components/GroupCard.jsx

import React from 'react'
import { Droppable } from 'react-beautiful-dnd'
import PersonCard from './PersonCard'

export default function GroupCard({ group, members, collapsed, onToggle }) {
  // total de membros
  const memberCount = members.length

  // hosts únicos (casais contam como 1)
  const hostCount = (() => {
    const uniq = new Set()
    members.forEach(m => {
      if (!m.hostAvailability?.toLowerCase().includes('sim')) return
      if (m.isCouple && m.spouseId) {
        const [a, b] = [m.id, m.spouseId].sort((x, y) => x - y)
        uniq.add(`c_${a}_${b}`)
      } else {
        uniq.add(`s_${m.id}`)
      }
    })
    return uniq.size
  })()

  // filhos inscritos únicos (casais contam como 1)
  const childCount = (() => {
    const seen = new Set()
    let total = 0
    members.forEach(m => {
      const cnt = m.participatingChildrenCount || 0
      if (cnt <= 0) return
      if (m.isCouple && m.spouseId) {
        const [a, b] = [m.id, m.spouseId].sort((x, y) => x - y)
        const key = `c_${a}_${b}`
        if (!seen.has(key)) {
          seen.add(key)
          total += cnt
        }
      } else {
        const key = `s_${m.id}`
        if (!seen.has(key)) {
          seen.add(key)
          total += cnt
        }
      }
    })
    return total
  })()

  return (
    <div className="bg-white shadow rounded overflow-hidden">
      {/* cabeçalho */}
      <div
        className="flex items-center px-4 py-2 bg-gray-100 cursor-pointer"
        onClick={onToggle}
      >
        <h2 className="font-semibold">{group.name}</h2>

        {/* container que empurra badges + seta para a direita */}
        <div className="flex items-center ml-auto gap-2">
          {/* badge de membros */}
          <span className="inline-flex items-center bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs font-medium">
            <span className="mr-1">👥</span>
            {memberCount}
          </span>

          {/* badge de hosts */}
          <span className="inline-flex items-center bg-green-100 text-green-800 rounded px-2 py-1 text-xs font-medium">
            <span className="mr-1">🏠</span>
            {hostCount}
          </span>

          {/* badge de filhos */}
          <span className="inline-flex items-center bg-yellow-100 text-yellow-800 rounded px-2 py-1 text-xs font-medium">
            <span className="mr-1">👶</span>
            {childCount}
          </span>

          {/* seta de colapso/expansão */}
          <span className="text-lg">{collapsed ? '▾' : '▴'}</span>
        </div>
      </div>

      {/* lista de membros */}
      {!collapsed && (
        <Droppable droppableId={`${group.id}`}>
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2 p-4 border-t"
            >
              {members.length > 0 ? (
                members.map((m, i) => (
                  <PersonCard
                    key={m.id}
                    member={m}
                    members={members}
                    index={i}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center">Nenhum membro</p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  )
}
