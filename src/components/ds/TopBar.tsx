interface TopBarProps { title: string; onMenu?: () => void; }

export function TopBar({ title, onMenu }: TopBarProps) {
  return (
    <header className="ex-topbar">
      <div className="ex-topbar__mark">
        <img src="/exnovo-knot.webp" alt="" width={52} height={52} />
        <span className="ex-wordmark" aria-label="Exnovo">
          <span className="ex-wordmark__ex">EX</span><span className="ex-wordmark__novo">NOVO</span>
        </span>
        <span className="ex-topbar__product">AGENTIC OS:</span>
      </div>
      <h1 className="ex-topbar__title">{title.toUpperCase()}</h1>
      {onMenu && <button className="ex-topbar__menu" type="button" aria-label="Open menu" onClick={onMenu}><span /></button>}
    </header>
  );
}
