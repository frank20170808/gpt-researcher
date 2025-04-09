import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// 简单的输入节点样式
const nodeStyle: React.CSSProperties = {
  background: '#D6D5E6', // Light purple background
  color: '#333',
  border: '1px solid #222138',
  padding: '10px',
  borderRadius: '3px',
  width: 180,
};

// InputNode 组件定义
const InputNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  // data 中可以包含 label, defaultValue 等
  const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log(evt.target.value); // 可以在这里更新节点数据
    // 如果需要将输入值存入节点 data，需要更复杂的处理（如通过 context 或 zustand 更新）
  }, []);

  return (
    <div style={nodeStyle}>
      {/* 输出端口 (右侧) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <div>
        <strong>{data.label || '输入节点'}</strong>
      </div>
      <hr style={{ margin: '5px 0', borderColor: '#AAA' }} />
      <textarea
        id="text"
        name="text"
        onChange={onChange}
        className="nodrag" // 防止拖动 textarea 时移动整个节点
        placeholder="输入研究主题..."
        rows={3}
        style={{ width: '100%', resize: 'none', border: '1px solid #AAA', borderRadius: '2px' }}
        defaultValue={data.defaultValue || ''}
      />
    </div>
  );
};

export default memo(InputNode);