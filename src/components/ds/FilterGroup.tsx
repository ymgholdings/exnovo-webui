export interface FilterOption { id: string; label: string; count?: number; checked: boolean; }

export function FilterGroup({ legend, options, onChange }: { legend: string; options: FilterOption[]; onChange: (id: string, checked: boolean) => void }) {
  return (
    <fieldset className="ex-filter">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.id} className="ex-check">
          <input type="checkbox" id={`filter-${o.id}`} checked={o.checked} onChange={(e) => onChange(o.id, e.target.checked)} />
          <span>{o.label}</span>
          {o.count !== undefined && <span className="ex-check__count">{o.count}</span>}
        </label>
      ))}
    </fieldset>
  );
}
