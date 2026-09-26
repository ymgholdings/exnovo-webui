{
  "topology_context": "round_table_orchestrator_matrix",
  "spatial_engine": {
    "type": "polar_trigonometric",
    "base_radius_px": 180,
    "formula_x": "calc(50% + (r * cos(theta)) - (node_width / 2))",
    "formula_y": "calc(50% + (r * sin(theta)) - (node_height / 2))",
    "shimmer_vector_animation": "pulse_delegation_flow"
  },
  "accessibility_spec": {
    "wcag_target": "AAA",
    "region_role": "region",
    "region_aria_label": "King Arthur's Round Table Orchestration Matrix",
    "keyboard_traversal_order": [
      "king-arthur-orchestrator",
      "knight-node-01",
      "knight-node-02",
      "knight-node-03",
      "knight-node-04"
    ]
  },
  "orchestrator": {
    "node_id": "king-arthur-orchestrator",
    "role_label": "King Arthur (Orchestrator)",
    "dom_tag": "main",
    "aria_live": "assertive",
    "global_cost_tracker_id": "openrouter-usd-telemetry",
    "cost_formatter": "new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 })",
    "position": {
      "radial_offset_deg": null,
      "center": true
    }
  },
  "subagents": [
    {
      "node_id": "knight-node-01",
      "knight_name": "Sir Lancelot",
      "role": "Code Generation Specialist",
      "angular_position_deg": 0,
      "aria_label": "Knight Agent 1: Code Generation Specialist",
      "state_binding_event": "subagent_01_frame_change",
      "render_target": "requestAnimationFrame(() => syncKnightNode(1, payload))",
      "described_by_id": "knight-01-log"
    },
    {
      "node_id": "knight-node-02",
      "knight_name": "Sir Galahad",
      "role": "Security Auditor Specialist",
      "angular_position_deg": 90,
      "aria_label": "Knight Agent 2: Security Auditor Specialist",
      "state_binding_event": "subagent_02_frame_change",
      "render_target": "requestAnimationFrame(() => syncKnightNode(2, payload))",
      "described_by_id": "knight-02-log"
    },
    {
      "node_id": "knight-node-03",
      "knight_name": "Sir Tristan",
      "role": "Testing & QA Specialist",
      "angular_position_deg": 180,
      "aria_label": "Knight Agent 3: Testing & QA Specialist",
      "state_binding_event": "subagent_03_frame_change",
      "render_target": "requestAnimationFrame(() => syncKnightNode(3, payload))",
      "described_by_id": "knight-03-log"
    },
    {
      "node_id": "knight-node-04",
      "knight_name": "Sir Gawain",
      "role": "Documentation Specialist",
      "angular_position_deg": 270,
      "aria_label": "Knight Agent 4: Documentation Specialist",
      "state_binding_event": "subagent_04_frame_change",
      "render_target": "requestAnimationFrame(() => syncKnightNode(4, payload))",
      "described_by_id": "knight-04-log"
    }
  ]
}