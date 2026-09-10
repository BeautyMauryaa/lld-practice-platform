import ListFieldEditor from './ListFieldEditor';

function ClassEditor({ classData, onUpdate, onRemove }) {
  return (
    <div className="class-editor">
      <div className="class-editor__header">
        <input
          type="text"
          className="class-editor__name"
          placeholder="Class name (e.g. ParkingLot)"
          value={classData.name}
          onChange={(e) => onUpdate({ ...classData, name: e.target.value })}
        />
        <button type="button" className="btn btn--danger btn--small" onClick={onRemove}>
          Remove Class
        </button>
      </div>

      <div className="class-editor__field">
        <label>Responsibilities</label>
        <ListFieldEditor
          items={classData.responsibilities}
          onChange={(responsibilities) => onUpdate({ ...classData, responsibilities })}
          placeholder="e.g. Track occupied state"
          addLabel="+ Add responsibility"
          ariaLabel={`Responsibility for ${classData.name || 'this class'}`}
        />
      </div>

      <div className="class-editor__field">
        <label>Relationships</label>
        <ListFieldEditor
          items={classData.relationships}
          onChange={(relationships) => onUpdate({ ...classData, relationships })}
          placeholder="e.g. Contains ParkingSpot"
          addLabel="+ Add relationship"
          ariaLabel={`Relationship for ${classData.name || 'this class'}`}
        />
      </div>
    </div>
  );
}

export default ClassEditor;