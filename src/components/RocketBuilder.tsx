import type { ComponentRegistry, Rocket } from '../types/models'

interface RocketBuilderProps {
  rocket: Rocket
  selectedStageId: string
  registry: ComponentRegistry
  onSelectStage: (stageId: string) => void
  onAddStage: () => void
  onRemoveStage: (stageId: string) => void
  onAddComponent: (componentId: string) => void
  onRemoveComponent: (stageId: string, instanceId: string) => void
  onMoveComponent: (stageId: string, instanceId: string, direction: 'UP' | 'DOWN') => void
}

export const RocketBuilder = ({
  rocket,
  selectedStageId,
  registry,
  onSelectStage,
  onAddStage,
  onRemoveStage,
  onAddComponent,
  onRemoveComponent,
  onMoveComponent,
}: RocketBuilderProps) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Rocket Builder</h2>
        <button className="button" onClick={onAddStage} type="button">
          Add Stage
        </button>
      </div>

      <div className="builder-layout">
        <div className="stage-list">
          {rocket.stages.map((stage, index) => (
            <button
              key={stage.id}
              className={`stage-tab ${selectedStageId === stage.id ? 'active' : ''}`}
              onClick={() => onSelectStage(stage.id)}
              type="button"
            >
              <span>{stage.name || `Stage ${index + 1}`}</span>
              {rocket.stages.length > 1 && (
                <span
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveStage(stage.id)
                  }}
                >
                  ×
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="component-palette">
          <h3>Add Components</h3>
          <div className="component-grid">
            {registry.all.map((component) => (
              <button key={component.id} className="component-card" onClick={() => onAddComponent(component.id)} type="button">
                <strong>{component.name}</strong>
                <small>{component.type.replace('_', ' ')}</small>
                <small>{component.dryMassKg} kg dry</small>
              </button>
            ))}
          </div>
        </div>

        <div className="rocket-stack">
          {rocket.stages.map((stage, stageIndex) => (
            <div key={stage.id} className="stage-block">
              <div className="stage-title">{stage.name || `Stage ${stageIndex + 1}`}</div>
              <div className="stack-components">
                {[...stage.components].reverse().map((entry) => {
                  const component = registry.byId[entry.componentId]
                  if (!component) return null
                  return (
                    <div key={entry.instanceId} className="stack-item">
                      <div>
                        <strong>{component.name}</strong>
                        <small>{component.type}</small>
                      </div>
                      <div className="stack-actions">
                        <button onClick={() => onMoveComponent(stage.id, entry.instanceId, 'UP')} type="button">
                          ↑
                        </button>
                        <button onClick={() => onMoveComponent(stage.id, entry.instanceId, 'DOWN')} type="button">
                          ↓
                        </button>
                        <button onClick={() => onRemoveComponent(stage.id, entry.instanceId)} type="button">
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
