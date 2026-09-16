import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { MissionConfigurator } from './components/MissionConfigurator'
import { RocketBuilder } from './components/RocketBuilder'
import { StatsPanel } from './components/StatsPanel'
import { TelemetryPanel } from './components/TelemetryPanel'
import { TrajectoryView } from './components/TrajectoryView'
import { componentRegistry } from './data/componentRegistry'
import { launchSites, targetOrbits } from './data/missions'
import { createInitialSimulationState, stepSimulation } from './simulation/engine'
import type { Mission, Rocket, SimulationState, Stage } from './types/models'
import { createId } from './utils/id'

const createDefaultStage = (name = 'Stage 1'): Stage => ({
  id: createId('stage'),
  name,
  components: [],
})

const createDefaultRocket = (): Rocket => ({
  id: createId('rocket'),
  name: 'ORBITAL Prototype Vehicle',
  stages: [createDefaultStage()],
})

const initialMission: Mission = {
  launchSiteId: launchSites[0].id,
  targetOrbitId: targetOrbits[0].id,
  notes: 'MVP simplified simulation model',
}

function App() {
  const [rocket, setRocket] = useState<Rocket>(() => createDefaultRocket())
  const [selectedStageId, setSelectedStageId] = useState<string>(() => rocket.stages[0].id)
  const [mission, setMission] = useState<Mission>(initialMission)
  const [timeAcceleration, setTimeAcceleration] = useState<number>(1)

  const targetOrbit = useMemo(
    () => targetOrbits.find((target) => target.id === mission.targetOrbitId) ?? targetOrbits[0],
    [mission.targetOrbitId],
  )

  const [simulation, setSimulation] = useState<SimulationState>(() =>
    createInitialSimulationState(rocket, mission, componentRegistry),
  )

  useEffect(() => {
    if (simulation.status !== 'RUNNING') {
      return
    }

    const handle = window.setInterval(() => {
      setSimulation((previous) => stepSimulation(previous, componentRegistry, targetOrbit, previous.dtSec * timeAcceleration))
    }, 100)

    return () => window.clearInterval(handle)
  }, [simulation.status, targetOrbit, timeAcceleration])

  const resetSimulation = () => {
    setSimulation(createInitialSimulationState(rocket, mission, componentRegistry))
  }

  useEffect(() => {
    resetSimulation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rocket, mission.targetOrbitId])

  const addStage = () => {
    setRocket((previous) => {
      const nextStage = createDefaultStage(`Stage ${previous.stages.length + 1}`)
      setSelectedStageId(nextStage.id)
      return {
        ...previous,
        stages: [...previous.stages, nextStage],
      }
    })
  }

  const removeStage = (stageId: string) => {
    setRocket((previous) => {
      const filteredStages = previous.stages.filter((stage) => stage.id !== stageId)
      if (!filteredStages.length) {
        return previous
      }
      if (selectedStageId === stageId) {
        setSelectedStageId(filteredStages[0].id)
      }
      return {
        ...previous,
        stages: filteredStages.map((stage, index) => ({ ...stage, name: `Stage ${index + 1}` })),
      }
    })
  }

  const addComponent = (componentId: string) => {
    setRocket((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) =>
        stage.id === selectedStageId
          ? {
              ...stage,
              components: [...stage.components, { instanceId: createId('component'), componentId }],
            }
          : stage,
      ),
    }))
  }

  const removeComponent = (stageId: string, instanceId: string) => {
    setRocket((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              components: stage.components.filter((entry) => entry.instanceId !== instanceId),
            }
          : stage,
      ),
    }))
  }

  const moveComponent = (stageId: string, instanceId: string, direction: 'UP' | 'DOWN') => {
    setRocket((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) => {
        if (stage.id !== stageId) {
          return stage
        }

        const index = stage.components.findIndex((entry) => entry.instanceId === instanceId)
        if (index < 0) {
          return stage
        }

        const targetIndex = direction === 'UP' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= stage.components.length) {
          return stage
        }

        const nextComponents = [...stage.components]
        ;[nextComponents[index], nextComponents[targetIndex]] = [nextComponents[targetIndex], nextComponents[index]]

        return {
          ...stage,
          components: nextComponents,
        }
      }),
    }))
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>ORBITAL — Rocket Workstation</h1>
        <p>Technical MVP with a simplified mission model. Not a high-fidelity aerospace simulator.</p>
      </header>

      <main className="app-grid">
        <RocketBuilder
          rocket={rocket}
          selectedStageId={selectedStageId}
          registry={componentRegistry}
          onSelectStage={setSelectedStageId}
          onAddStage={addStage}
          onRemoveStage={removeStage}
          onAddComponent={addComponent}
          onRemoveComponent={removeComponent}
          onMoveComponent={moveComponent}
        />

        <StatsPanel rocket={rocket} registry={componentRegistry} />

        <MissionConfigurator
          mission={mission}
          launchSites={launchSites}
          targetOrbits={targetOrbits}
          onMissionChange={setMission}
        />

        <section className="panel">
          <h2>Simulation Control</h2>
          <div className="controls">
            <button
              className="button"
              onClick={() => setSimulation((previous) => ({ ...previous, status: 'RUNNING' }))}
              type="button"
            >
              Start
            </button>
            <button
              className="button"
              onClick={() => setSimulation((previous) => ({ ...previous, status: 'PAUSED' }))}
              type="button"
            >
              Pause
            </button>
            <button className="button" onClick={resetSimulation} type="button">
              Reset
            </button>
            <label>
              Time Acceleration
              <select value={timeAcceleration} onChange={(event) => setTimeAcceleration(Number(event.target.value))}>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={5}>5×</option>
              </select>
            </label>
          </div>
        </section>

        <TrajectoryView state={simulation} target={targetOrbit} />

        <TelemetryPanel state={simulation} registry={componentRegistry} />
      </main>
    </div>
  )
}

export default App
