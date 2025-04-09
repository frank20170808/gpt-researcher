from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
import asyncio

router = APIRouter()

class NodeModel(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]
    params: List[Dict[str, Any]] = []

class EdgeModel(BaseModel):
    id: str
    source: str
    target: str

class WorkflowRequest(BaseModel):
    nodes: List[NodeModel]
    edges: List[EdgeModel]

clients = []
tasks = {}  # 任务ID -> asyncio.Task

@router.websocket("/ws/workflow")
async def workflow_ws(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)

@router.post("/api/start-workflow")
async def start_workflow(workflow: WorkflowRequest):
    task_id = str(uuid.uuid4())
    print(f"收到新工作流任务: {task_id}")

    async def run_workflow():
        adj = {node.id: [] for node in workflow.nodes}
        indegree = {node.id: 0 for node in workflow.nodes}
        for edge in workflow.edges:
            adj[edge.source].append(edge.target)
            indegree[edge.target] += 1

        queue = [nid for nid, deg in indegree.items() if deg == 0]
        execution_order = []

        while queue:
            current = queue.pop(0)
            execution_order.append(current)
            for neighbor in adj[current]:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    queue.append(neighbor)

        print("节点执行顺序：", execution_order)

        node_map = {node.id: node for node in workflow.nodes}
        for nid in execution_order:
            node = node_map[nid]
            print(f"开始执行节点 {node.id} 类型 {node.type}")
            await broadcast({"event": "current_node", "node_id": node.id})
            await broadcast({"event": "start", "node_id": node.id})
            # 模拟第一个节点失败
            if node.id.endswith("1"):
                await broadcast({"event": "error", "node_id": node.id, "error": "模拟错误"})
                continue
            await broadcast({"event": "log", "node_id": node.id, "log": "开始处理..."})
            await asyncio.sleep(0.5)
            await broadcast({"event": "log", "node_id": node.id, "log": "处理中..."})
            await asyncio.sleep(0.5)
            await broadcast({"event": "log", "node_id": node.id, "log": "处理完成"})
            print(f"完成节点 {node.id}")
            await broadcast({"event": "finish", "node_id": node.id})

    await broadcast({"event": "task_status", "status": "running", "task_id": task_id})
    async def wrapped_workflow():
        try:
            await run_workflow()
            await broadcast({"event": "task_status", "status": "finished", "task_id": task_id})
        except asyncio.CancelledError:
            await broadcast({"event": "task_status", "status": "cancelled", "task_id": task_id})
        except Exception as e:
            await broadcast({"event": "task_status", "status": "failed", "task_id": task_id, "error": str(e)})
            raise

    task = asyncio.create_task(wrapped_workflow())
    tasks[task_id] = task
    return {"task_id": task_id, "status": "started"}

@router.post("/api/stop-workflow")
async def stop_workflow(task_id: str):
    task = tasks.get(task_id)
    if task:
        task.cancel()
        return {"status": "stopped"}
    else:
        return {"status": "not_found"}

async def broadcast(message: dict):
    to_remove = []
    for ws in clients:
        try:
            await ws.send_json(message)
        except:
            to_remove.append(ws)
    for ws in to_remove:
        clients.remove(ws)


@router.post("/api/pause-workflow")
async def pause_workflow(task_id: str):
    # TODO: 实现暂停逻辑
    return {"status": "paused"}

@router.post("/api/resume-workflow")
async def resume_workflow(task_id: str):
    # TODO: 实现恢复逻辑
    return {"status": "resumed"}

@router.post("/api/retry-node")
async def retry_node(task_id: str, node_id: str):
    # 模拟节点重试
    await broadcast({"event": "start", "node_id": node_id})
    await broadcast({"event": "log", "node_id": node_id, "log": "重新开始处理..."})
    await asyncio.sleep(0.5)
    await broadcast({"event": "log", "node_id": node_id, "log": "重新处理中..."})
    await asyncio.sleep(0.5)
    await broadcast({"event": "log", "node_id": node_id, "log": "重新处理完成"})
    await broadcast({"event": "finish", "node_id": node_id})
    return {"status": "retrying"}


@router.get("/api/node-templates")
async def get_node_templates():
    return {
        "inputNode": [
            {"name": "question", "label": "研究问题", "type": "textarea", "required": True, "description": "请输入研究主题"}
        ],
        "webScrapeNode": [
            {"name": "url", "label": "网址", "type": "text", "required": True, "description": "要爬取的网址"}
        ],
        "summarizeNode": [
            {"name": "length", "label": "摘要长度", "type": "select", "options": ["short", "medium", "long"], "required": True}
        ],
        "reportNode": [
            {"name": "reportType", "label": "报告类型", "type": "select", "options": ["summary", "detailed"], "required": True},
            {"name": "tone", "label": "语气", "type": "select", "options": ["objective", "casual", "formal"], "required": True}
        ]
    }
