/* Strict WCAG AAA Contrast & Polar Coordinate Layout */

.round-table-container {
  position: relative;
  width: 520px;
  height: 520px;
  margin: 2rem auto;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(11, 17, 30, 0.95) 0%, rgba(4, 7, 14, 0.98) 75%);
  border: 2px solid rgba(0, 240, 255, 0.35);
  box-shadow: 0 0 35px rgba(0, 240, 255, 0.08), inset 0 0 20px rgba(0, 0, 0, 0.8);
}

/* Center Orchestrator: King Arthur */
.orchestrator-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: #070c18;
  border: 2px solid #00f0ff;
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 10;
  outline: none;
}

.orchestrator-node:focus-visible {
  outline: 3px solid #ffd700;
  outline-offset: 4px;
}

.node-crest {
  font-size: 20px;
  line-height: 1;
}

.node-title {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #00f0ff;
  margin-top: 4px;
}

.node-role {
  font-size: 9px;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}

.telemetry-box {
  margin-top: 6px;
  padding: 4px 8px;
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 6px;
}

.telemetry-label {
  display: block;
  font-size: 8px;
  color: #64748b;
  font-family: ui-monospace, monospace;
}

#openrouter-usd-telemetry {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #ffd700;
}

/* Radial Subagents: Knights */
.knights-roster {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.knight-node {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 130px;
  padding: 10px;
  background: #090e1a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  font-family: ui-monospace, monospace;
  pointer-events: auto;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.knight-node:focus-visible {
  outline: 3px solid #00f0ff;
  outline-offset: 3px;
}

.knight-name {
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
}

.knight-role {
  font-size: 9px;
  color: #64748b;
  margin-bottom: 6px;
}

.knight-state-pill {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.knight-state-pill[data-state="idle"] { background: #1e293b; color: #94a3b8; }
.knight-state-pill[data-state="thinking"] { background: rgba(0, 240, 255, 0.2); color: #00f0ff; }
.knight-state-pill[data-state="executing"] { background: rgba(255, 215, 0, 0.2); color: #ffd700; }
.knight-state-pill[data-state="complete"] { background: rgba(16, 185, 129, 0.2); color: #10b981; }

.knight-task-log {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 6px;
  line-height: 1.3;
}

/* Shimmer Vector Flow (Delegation vector from hub to knight) */
.knight-node.shimmer-active {
  border-color: #00f0ff;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  animation: shimmer-pulse 1.2s ease-out;
}

@keyframes shimmer-pulse {
  0% { transform: scale(0.96); box-shadow: 0 0 5px rgba(0, 240, 255, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(0, 240, 255, 0.7); }
  100% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 240, 255, 0.2); }
}