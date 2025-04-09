import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SimpleNode = ({ data }: any) => (
  <div style={{ padding: 5, border: '1px solid #999', background: '#fff' }}>
    <div>{data.label}</div>
    <div style={{ fontSize: 10 }}>{data.id}</div>
  </div>
);

const nodeTypes = {
  inputNode: SimpleNode,
  webScrapeNode: SimpleNode,
  summarizeNode: SimpleNode,
  reportNode: SimpleNode,
};

interface WorkflowMessage {
  event: string;
  node_id: string;
  status?: string;
  log?: string;
  error?: string;
  [key: string]: any;
}

export default function CanvasEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [nodeLogs, setNodeLogs] = useState<{ [key: string]: string[] }>({});
  const [taskStatus, setTaskStatus] = useState('未开始');
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [nodeTemplates, setNodeTemplates] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    fetch('/api/node-templates')
      .then(res => res.json())
      .then(setNodeTemplates)
      .catch(console.error);

    const ws = new WebSocket('ws://localhost:8000/ws/workflow');
    ws.onmessage = (e) => {
      const msg: WorkflowMessage = JSON.parse(e.data);
      msg.node_id = msg.node_id ?? '';
      if (!msg.node_id) return;
      if (msg.event === 'task_status') setTaskStatus(msg.status ?? '');
      if (!msg.node_id) return;
      if (msg.event === 'current_node') setCurrentNodeId(msg.node_id);
      if (!msg.node_id) return;
      if (msg.event === 'log') {
        setNodeLogs(logs => {
          const arr = logs[msg.node_id] || [];
          return { ...logs, [msg.node_id]: [...arr, msg.log ?? ''] };
        });
      }
      if (!msg.node_id) return;
      if (msg.event === 'error') {
        setNodeLogs(logs => {
          const arr = logs[msg.node_id] || [];
          return { ...logs, [msg.node_id]: [...arr, '错误: ' + (msg.error ?? '')] };
        });
        setNodes(nds =>
          nds.map(n =>
            n.id === msg.node_id
              ? { ...n, style: { ...(n.style || {}), borderColor: 'red', borderWidth: 2 } }
              : n
          )
        );
      }
      if (!msg.node_id) return;
      setNodes(nds =>
        nds.map(n => {
          let color = '#ccc';
          let width = 2;
          if (n.id === msg.node_id) {
            if (msg.event === 'start') color = 'orange';
            if (msg.event === 'finish') color = 'green';
          }
          if (n.id === currentNodeId) {
            color = 'blue';
            width = 3;
          }
          return { ...n, style: { ...(n.style || {}), borderColor: color, borderWidth: width } };
        })
      );
    };
    return () => ws.close();
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        // 新增节点时附加模板
        return updated.map(node => {
          if (!node.data?.params && nodeTemplates[node.type]) {
            return { ...node, data: { ...node.data, params: nodeTemplates[node.type], label: node.type, id: node.id } };
          }
          return node;
        });
      });
    },
    [nodeTemplates]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (conn) => setEdges((eds) => addEdge(conn, eds)),
    []
  );

  const handleStart = async () => {
    for (const node of nodes) {
      const params = node.data?.params || [];
      for (const param of params) {
        if (param.required && !node.data[param.name]) {
          alert(`节点${node.id}缺少必填参数${param.label || param.name}`);
          return;
        }
      }
    }
    const res = await fetch('/api/start-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    });
    const data = await res.json();
    if (data.task_id) setCurrentTaskId(data.task_id ?? '');
    else setCurrentTaskId('');
  };

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ flexGrow: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onNodeClick={(_, node) => setSelectedNode(node)}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: 300, borderLeft: '1px solid #ccc', padding: 10 }}>
            <div>任务状态：{taskStatus}</div>
            {selectedNode && (
              <>
                <div>ID: {selectedNode.id}</div>
                <div>类型: {selectedNode.type}</div>
                {(selectedNode.data?.params || []).map((param: any, idx: number) => (
                  <div key={idx}>
                    <label>{param.label || param.name}{param.required ? '*' : ''}</label>
                    {param.type === 'select' ? (
                      <select
                        value={selectedNode.data[param.name] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNodes(nds =>
                            nds.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, [param.name]: val } }
                                : n
                            )
                          );
                        }}
                      >
                        {param.options.map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : param.type === 'textarea' ? (
                      <textarea
                        value={selectedNode.data[param.name] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNodes(nds =>
                            nds.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, [param.name]: val } }
                                : n
                            )
                          );
                        }}
                      />
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        value={selectedNode.data[param.name] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNodes(nds =>
                            nds.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, [param.name]: val } }
                                : n
                            )
                          );
                        }}
                      />
                    )}
                  </div>
                ))}
                {nodeLogs[selectedNode.id] && (
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {nodeLogs[selectedNode.id].map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ flexGrow: 1, padding: 10 }}>
            <button onClick={handleStart}>开始研究</button>
            <button onClick={() => {
              const versions = JSON.parse(localStorage.getItem('workflow_versions') || '[]');
              const name = prompt('请输入版本备注');
              if (!name) return;
              versions.push({
                name,
                time: new Date().toLocaleString(),
                data: { nodes, edges },
              });
              localStorage.setItem('workflow_versions', JSON.stringify(versions));
              alert('版本已保存');
            }}>保存版本</button>
            <button onClick={() => {
              const versions = JSON.parse(localStorage.getItem('workflow_versions') || '[]');
              if (versions.length === 0) {
                alert('没有历史版本');
                return;
              }
              const options = versions.map((v: any, i: number) => `${i + 1}. ${v.name} (${v.time})`).join('\n');
              const idx = prompt('选择要加载的版本：\n' + options);
              const version = versions[parseInt(idx) - 1];
              if (version) {
                setNodes(version.data.nodes);
                setEdges(version.data.edges);
              }
            }}>加载版本</button>
            <button onClick={() => {
              localStorage.removeItem('workflow_versions');
              alert('所有版本已删除');
            }}>删除所有版本</button>
            <button onClick={() => {
              const versions = JSON.parse(localStorage.getItem('workflow_versions') || '[]');
              if (versions.length < 2) {
                alert('至少需要两个版本');
                return;
              }
              const options = versions.map((v: any, i: number) => `${i + 1}. ${v.name} (${v.time})`).join('\n');
              const idx1 = prompt('选择第一个版本：\n' + options);
              const idx2 = prompt('选择第二个版本：\n' + options);
              const v1 = versions[parseInt(idx1) - 1];
              const v2 = versions[parseInt(idx2) - 1];
              if (!v1 || !v2) return;

              const nodes1 = v1.data.nodes.map((n: any) => n.id);
              const nodes2 = v2.data.nodes.map((n: any) => n.id);
              const addedNodes = nodes2.filter((id: string) => !nodes1.includes(id));
              const removedNodes = nodes1.filter((id: string) => !nodes2.includes(id));

              const edges1 = v1.data.edges.map((e: any) => e.id);
              const edges2 = v2.data.edges.map((e: any) => e.id);
              const addedEdges = edges2.filter((id: string) => !edges1.includes(id));
              const removedEdges = edges1.filter((id: string) => !edges2.includes(id));

              alert(
                `新增节点: ${addedNodes.join(', ') || '无'}\n` +
                `删除节点: ${removedNodes.join(', ') || '无'}\n` +
                `新增边: ${addedEdges.join(', ') || '无'}\n` +
                `删除边: ${removedEdges.join(', ') || '无'}`
              );
            }}>比较版本</button>
            <button onClick={async () => {
              if (!currentTaskId || currentTaskId === '') { alert('无任务ID'); return; }
              await fetch('/api/stop-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: currentTaskId }),
              });
            }}>终止任务</button>
            <button onClick={async () => {
              if (!currentTaskId || currentTaskId === '') { alert('无任务ID'); return; }
              await fetch('/api/pause-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: currentTaskId }),
              });
            }}>暂停任务</button>
            <button onClick={async () => {
              if (!currentTaskId || currentTaskId === '') { alert('无任务ID'); return; }
              await fetch('/api/resume-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: currentTaskId }),
              });
            }}>恢复任务</button>
            <button onClick={async () => {
              if (!currentTaskId || currentTaskId === '') { alert('无任务ID'); return; }
              const nodeId = prompt('请输入节点ID');
              if (!nodeId) return;
              await fetch('/api/retry-node', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: currentTaskId, node_id: nodeId }),
              });
            }}>重试节点</button>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
