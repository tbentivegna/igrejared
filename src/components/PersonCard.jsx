// src/components/PersonCard.jsx

import React from 'react'
import { Draggable } from 'react-beautiful-dnd'

export default function PersonCard({ member, members, index }) {
  const isLeader = /leader/i.test(member.role)
  const isCouple = member.isCouple
  const isHost   = member.hostAvailability?.toLowerCase().includes('sim')

  const borderClass = isCouple ? member.coupleBorderClass : ''
  const ringClass   = isCouple ? member.coupleRingClass   : ''

  return (
    <Draggable draggableId={member.id.toString()} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-gray-50 border rounded p-2 text-sm shadow-sm hover:shadow-md transition
            ${borderClass} ring-1 ${ringClass}
          `}
        >
          {/* Header: nome (bold) + ID (normal) */}
          <div className="flex items-center justify-between">
            <p className="font-bold">
              {member.fullName}
              <span className="font-normal"> ({member.id})</span>
            </p>
            <div className="flex items-center space-x-1">
              {isLeader && (
                <span className="text-yellow-400" title="Líder">
                  🌟
                </span>
              )}
              {isCouple && (
                <span className="text-pink-500" title="Parte de um casal">
                  💑
                </span>
              )}
              {isHost && (
                <span className="text-green-600" title="Host">
                  🏠
                </span>
              )}
            </div>
          </div>

          {/* Detalhes */}
          <p>Função: {member.role}</p>
          <p>Dia: {member.dayOfWeek}</p>
          <p>Estado civil: {member.civilStatus}</p>
          <p>Filhos: {member.numberOfChildren}</p>
          {member.averageChildAge > 0 && (
            <p>Idade média dos filhos: {member.averageChildAge} anos</p>
          )}
          <p>Prioridade: {member.smallGroupPriority}</p>
        </div>
      )}
    </Draggable>
  )
}
