// frontend/src/components/ListFieldEditor.jsx
import React from 'react';

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
            className="cyber-text-input list-field__input"
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            onChange={(e) => updateItem(index, e.target.value)}
          />
          <button
            type="button"
            className="cyber-btn-secondary cyber-btn-add-row"
            onClick={addItem}
            title={addLabel}
          >
            {addLabel}
          </button>
          <button
            type="button"
            className="cyber-btn-secondary btn--danger cyber-btn-remove-row"
            aria-label="Remove"
            onClick={() => removeItem(index)}
          >
            ×
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <button type="button" className="cyber-btn-secondary list-field-add-btn" onClick={addItem}>
          {addLabel}
        </button>
      )}
    </div>
  );
}

export default ListFieldEditor;