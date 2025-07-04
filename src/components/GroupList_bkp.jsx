// src/components/GroupList.jsx

import React, { useEffect, useState } from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import { churchApi } from '../features/api'
import GroupCard from './GroupCard'

// paleta de cores para cada casal
const coupleColorClasses = [
  { border: 'border-pink-500',   ring: 'ring-pink-300'   },
  { border: 'border-blue-500',   ring: 'ring-blue-300'   },
  { border: 'border-green-500',  ring: 'ring-green-300'  },
  { border: 'border-yellow-500', ring: 'ring-yellow-300' },
  { border: 'border-purple-500', ring: 'ring-purple-300' },
  { border: 'border-red-500',    ring: 'ring-red-300'    },
  { border: 'border-teal-500',   ring: 'ring-teal-300'   },
  { border: 'border-indigo-500', ring: 'ring-indigo-300' }
]

export default function GroupList() {
  const [groups, setGroups] = useState([])
  const [filteredGroups, setFilteredGroups] = useState([])
  const [allStatuses, setAllStatuses] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [membersByGroup, setMembersByGroup] = useState({})
  const [collapsedMap, setCollapsedMap] = useState({})
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: groupList } = await churchApi.get(
          `/groups/ministries/${import.meta.env.VITE_MINISTRY_ID}`,
          { params: { hierarchy: true } }
        )

        // 1) coleta todos os status e seleciona todos por padrão
        const statuses = [...new Set(groupList.map(g => g.status))]
        setAllStatuses(statuses)
        setSelectedStatuses(statuses)
        setGroups(groupList)

        // 2) mapeia membros brutos em cada grupo
        const map = {}
        groupList.forEach(grp => {
          const list = grp.groupPersonResponseList || []
          map[grp.id] = list.map(gpr => {
            const { person, role } = gpr
            const ep = person.extraProperties || {}

            // número total de filhos informado
            const numKids = Number(ep.numberOfChildren) || 0

            // coleta filhos que efetivamente vão participar
            const kids = []
            for (let i = 1; i <= numKids; i++) {
              const willJoin = ep[`child${i}WillJoin`]?.trim().toLowerCase()
              const name     = ep[`child${i}Name`]
              const dob      = ep[`child${i}Dob`]
              if (willJoin === 'sim') {
                kids.push({ name, dob })
              }
            }

            // conta quantos filhos participarão
            const participatingChildrenCount = kids.length

            // calcula idade média dos filhos que vão participar
            const ages = kids.map(c =>
              (Date.now() - new Date(c.dob).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
            )
            const averageChildAge = ages.length
              ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
              : 0

            return {
              id: person.id,
              fullName: person.fullName,
              role,
              dayOfWeek: ep.dayOfWeek,
              civilStatus: person.civilStatus,
              numberOfChildren: numKids,
              smallGroupPriority: ep.smallGroupPriority || 0,
              hostAvailability: ep.hostAvailability || '',
              spouseName: ep.spouseName || '',
              averageChildAge,
              participatingChildrenCount
            }
          })
        })

        // 3) detecta casais e atribui cores
        Object.entries(map).forEach(([_, members]) => {
          let colorIndex = 0
          const coupleMap = {}

          members.forEach(member => {
            if (!member.spouseName) return
            const keyName = member.spouseName.trim().toLowerCase()
            const spouse = members.find(
              m => m.fullName.trim().toLowerCase() === keyName
            )
            if (!spouse) return

            const key = [member.fullName, spouse.fullName]
              .map(n => n.trim().toLowerCase())
              .sort()
              .join('||')

            if (!coupleMap[key]) {
              coupleMap[key] =
                coupleColorClasses[colorIndex++ % coupleColorClasses.length]
            }
            const { border, ring } = coupleMap[key]
            member.isCouple = true
            member.coupleBorderClass = border
            member.coupleRingClass   = ring
            spouse.isCouple = true
            spouse.coupleBorderClass = border
            spouse.coupleRingClass   = ring
          })
        })

        // 4) define spouseId em cada membro para uso em ordenação e contagens
        Object.entries(map).forEach(([_, members]) => {
          members.forEach(member => {
            if (!member.spouseName) return
            const target = member.spouseName.trim().toLowerCase()
            const spouse = members.find(
              m => m.fullName.trim().toLowerCase() === target
            )
            if (!spouse) return
            member.spouseId = spouse.id
            spouse.spouseId = member.id
          })
        })

        // 5) ordena membros mantendo casais juntos e aplicando prioridade
        Object.entries(map).forEach(([groupId, members]) => {
          const processed = new Set()
          const units = []

          // 5.1) agrupa pares de casal
          members.forEach(m => {
            if (m.isCouple && !processed.has(m.id)) {
              const partner = members.find(x => x.id === m.spouseId)
              if (partner) {
                units.push([m, partner])
                processed.add(m.id)
                processed.add(partner.id)
              }
            }
          })

          // 5.2) adiciona os solteiros restantes
          members.forEach(m => {
            if (!processed.has(m.id)) {
              units.push([m])
              processed.add(m.id)
            }
          })

          // 5.3) define peso: 1=líder, 2=host, 3=demais
          const unitWeight = unit => {
            if (unit.some(m => /líder|leader/i.test(m.role))) return 1
            if (unit.some(m => m.hostAvailability.toLowerCase().includes('sim')))
              return 2
            return 3
          }

          // 5.4) ordena unidades por peso e nome
          units.sort((a, b) => {
            const wa = unitWeight(a)
            const wb = unitWeight(b)
            if (wa !== wb) return wa - wb
            return a[0].fullName.localeCompare(b[0].fullName, undefined, {
              sensitivity: 'base'
            })
          })

          // 5.5) achata de volta
          map[groupId] = units.flat()
        })

        setMembersByGroup(map)
      } catch (err) {
        console.error('Erro ao buscar grupos:', err)
      }
    }
    fetchData()
  }, [])

  // inicializa estado de collapse
  useEffect(() => {
    const init = {}
    groups.forEach(g => (init[g.id] = true))
    setCollapsedMap(init)
  }, [groups])

  // filtra grupos por status selecionados
  useEffect(() => {
    if (!selectedStatuses.length) {
      setFilteredGroups(groups)
    } else {
      setFilteredGroups(
        groups.filter(g => selectedStatuses.includes(g.status))
      )
    }
  }, [groups, selectedStatuses])

  // handlers de drag, collapse, expand …
  function onDragEnd(result) {
    const { source, destination } = result
    if (!destination) return

    const src = source.droppableId
    const dst = destination.droppableId
    const copySrc = Array.from(membersByGroup[src] || [])
    const copyDst = Array.from(membersByGroup[dst] || [])

    if (src === dst) {
      const [moved] = copySrc.splice(source.index, 1)
      copySrc.splice(destination.index, 0, moved)
      setMembersByGroup(prev => ({ ...prev, [src]: copySrc }))
    } else {
      const [moved] = copySrc.splice(source.index, 1)
      copyDst.splice(destination.index, 0, moved)
      setMembersByGroup(prev => ({
        ...prev,
        [src]: copySrc,
        [dst]: copyDst
      }))
    }
  }

  function collapseAll() {
    const m = {}
    filteredGroups.forEach(g => (m[g.id] = true))
    setCollapsedMap(m)
  }
  function expandAll() {
    const m = {}
    filteredGroups.forEach(g => (m[g.id] = false))
    setCollapsedMap(m)
  }
  function toggleCollapse(id) {
    setCollapsedMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <button
          onClick={collapseAll}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Colapsar Todos
        </button>
        <button
          onClick={expandAll}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Expandir Todos
        </button>

        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(v => !v)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center space-x-1"
          >
            <span>Status</span>
            <span className="text-xs">
              {showStatusDropdown ? '▴' : '▾'}
            </span>
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg p-2 max-h-60 overflow-y-auto z-20">
              {allStatuses.map(status => (
                <label
                  key={status}
                  className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() =>
                      setSelectedStatuses(prev =>
                        prev.includes(status)
                          ? prev.filter(s => s !== status)
                          : [...prev, status]
                      )
                    }
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            members={membersByGroup[group.id] || []}
            collapsed={collapsedMap[group.id]}
            onToggle={() => toggleCollapse(group.id)}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
