/**
 * Hermes WebUI - Native Accessible Circular Round Table Orchestration Matrix
 * Adheres strictly to Karpathy minimalism: 0 external 3D libraries, pure polar math, WCAG AAA.
 */

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4
});

const RADIAL_CONFIG = {
  radiusPx: 190,
  subagents: [
    { id: 'knight-node-01', index: 1, angleDeg: 0, name: 'Sir Lancelot', role: 'Code Generation' },
    { id: 'knight-node-02', index: 2, angleDeg: 90, name: 'Sir Galahad', role: 'Security Auditor' },
    { id: 'knight-node-03', index: 3, angleDeg: 180, name: 'Sir Tristan', role: 'Testing & QA' },
    { id: 'knight-node-04', index: 4, angleDeg: 270, name: 'Sir Gawain', role: 'Documentation' }
  ]
};

export function initRoundTableMatrix(containerEl) {
  if (!containerEl) return;

  containerEl.innerHTML = `
    <section 
      class="round-table-container" 
      role="region" 
      aria-label="King Arthur's Round Table Orchestration Matrix"
      tabindex="-1"
    >
      <!-- Authoritative Focus 1: King Arthur Orchestrator -->
      <main 
        id="king-arthur-orchestrator" 
        class="orchestrator-node" 
        tabindex="0"
        aria-live="assertive"
        aria-label="King Arthur: Central Orchestrator"
      >
        <div class="node-crest" aria-hidden="true">👑</div>
        <div class="node-title">KING ARTHUR</div>
        <div class="node-role">Orchestrator</div>
        
        <!-- Live OpenRouter Telemetry Readout -->
        <div class="telemetry-box">
          <span class="telemetry-label">OpenRouter USD:</span>
          <output id="openrouter-usd-telemetry" for="streaming-events" aria-live="polite">
            $0.0000
          </output>
        </div>
        
        <!-- Pulse Emitter SVG for Visual Shimmers -->
        <svg class="conduit-canvas" aria-hidden="true" viewBox="0 0 500 500"></svg>
      </main>

      <!-- Sequential Focus 2 to 5: Subagent Knights -->
      <nav class="knights-roster" aria-label="Knight Subagents">
        ${RADIAL_CONFIG.subagents.map((k) => `
          <article 
            id="${k.id}" 
            class="knight-node state-idle" 
            tabindex="0"
            aria-label="Knight Agent ${k.index}: ${k.role}"
            aria-describedby="${k.id}-log"
            data-angle="${k.angleDeg}"
          >
            <div class="knight-indicator" aria-hidden="true"></div>
            <div class="knight-name">${k.name}</div>
            <div class="knight-role">${k.role}</div>
            <span class="knight-state-pill" data-state="idle">IDLE</span>
            <div id="${k.id}-log" class="knight-task-log" aria-live="polite">Standby for delegation...</div>
          </article>
        `).join('')}
      </nav>
    </section>
  `;

  // Apply trigonometric layout coordinates natively
  applyPolarCoordinates(containerEl);
  
  // Attach SSE Streaming Consumer
  connectTelemetryStream();
}

function applyPolarCoordinates(containerEl) {
  const container = containerEl.querySelector('.round-table-container');
  if (!container) return;

  const r = RADIAL_CONFIG.radiusPx;

  RADIAL_CONFIG.subagents.forEach((k) => {
    const el = container.querySelector(`#${k.id}`);
    if (!el) return;

    // Convert degrees to radians: theta = deg * (PI / 180)
    const rad = (k.angleDeg * Math.PI) / 180;
    
    // Polar to Cartesian: x = r * cos(theta), y = r * sin(theta)
    const x = Math.round(r * Math.cos(rad));
    const y = Math.round(r * Math.sin(rad));

    // Center node relative to circular hub using CSS transforms
    el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  });
}

export function updateGlobalCost(amountUsd) {
  requestAnimationFrame(() => {
    const out = document.getElementById('openrouter-usd-telemetry');
    if (out) {
      out.textContent = USD_FORMATTER.format(amountUsd);
    }
  });
}

export function syncKnightNode(knightIndex, payload) {
  requestAnimationFrame(() => {
    const node = document.getElementById(`knight-node-0${knightIndex}`);
    if (!node) return;

    // Clean previous state classes
    node.classList.remove('state-idle', 'state-thinking', 'state-executing', 'state-complete');
    node.classList.add(`state-${payload.state}`);

    // Update state pill and accessible log reference
    const pill = node.querySelector('.knight-state-pill');
    if (pill) {
      pill.setAttribute('data-state', payload.state);
      pill.textContent = payload.state.toUpperCase();
    }

    const log = document.getElementById(`knight-node-0${knightIndex}-log`);
    if (log && payload.message) {
      log.textContent = payload.message;
    }

    // Trigger visual shimmer vector when delegating
    if (payload.delegated) {
      triggerDelegationShimmer(knightIndex);
    }
  });
}

function triggerDelegationShimmer(knightIndex) {
  const node = document.getElementById(`knight-node-0${knightIndex}`);
  if (!node) return;

  node.classList.add('shimmer-active');
  setTimeout(() => {
    node.classList.remove('shimmer-active');
  }, 1200);
}

function connectTelemetryStream() {
  const eventSource = new EventSource('/api/streaming');

  eventSource.addEventListener('telemetry_cost', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (typeof data.usd_total === 'number') {
        updateGlobalCost(data.usd_total);
      }
    } catch (err) {
      console.error('Error parsing telemetry cost:', err);
    }
  });

  [1, 2, 3, 4].forEach((idx) => {
    eventSource.addEventListener(`subagent_0${idx}_frame_change`, (e) => {
      try {
        const payload = JSON.parse(e.data);
        syncKnightNode(idx, payload);
      } catch (err) {
        console.error(`Error syncing knight ${idx}:`, err);
      }
    });
  });

  eventSource.onerror = () => {
    console.warn('SSE Telemetry connection dropped. Retrying...');
  };
}