// A controlled list of text inputs with add/remove. Used for
// responsibilities, relationships, and patternsUsed — the same
// add-a-row/remove-a-row interaction repeats in all three, so this is one
// small shared piece rather than three near-identical copies.

function ListFieldEditor({ items, onChange, placeholder, addLabel, ariaLabel }) {
  const updateItem = (index, value) => {
    const next = items.slice();
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : ['']);
  };

  const addItem = () => onChange([...items, '']);

  return (
    <div className="list-field">
      {items.map((value, index) => (
        <div className="list-field__row" key={index}>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            onChange={(e) => updateItem(index, e.target.value)}
          />
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Remove"
            onClick={() => removeItem(index)}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn btn--secondary btn--small" onClick={addItem}>
        {addLabel}
      </button>
    </div>
  );
}

export default ListFieldEditor;