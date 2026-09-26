"""
Hermes Agentic OS - Real-time SSE Telemetry Emitter
Dispatches OpenRouter USD cost metrics and knight subagent state frames.
"""

import asyncio
import json
from aiohttp import web

async def sse_handler(request: web.Request) -> web.StreamResponse:
    response = web.StreamResponse(
        status=200,
        reason='OK',
        headers={
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    )
    await response.prepare(request)

    async def emit_event(event_name: str, data: dict):
        payload = f"event: {event_name}\ndata: {json.dumps(data)}\n\n"
        await response.write(payload.encode('utf-8'))

    # Initial handshake
    await emit_event("telemetry_cost", {"usd_total": 0.0412})
    await emit_event("subagent_01_frame_change", {
        "state": "idle",
        "message": "Standing by for code synthesis dispatch...",
        "delegated": False
    })

    # Keepalive / frame broadcaster loop
    try:
        while True:
            await asyncio.sleep(5)
            # Heartbeat ping
            await response.write(b": heartbeat\n\n")
    except (asyncio.CancelledError, ConnectionResetError):
        pass

    return response

def setup_streaming_routes(app: web.Application):
    app.router.add_get('/api/streaming', sse_handler)