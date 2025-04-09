import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const nodeStyle: React.CSSProperties = {
  background: '#FFF7E6',
  border: '1px solid #faad14',
  padding: '10px',
  borderRadius: '3px',
  width: 200,
};

const SummarizeNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  return (
    <div style={nodeStyle}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <strong>摘要节点</strong>
      <hr />
      <select
        value={data.length || 'short'}
        onChange={(e) => data.onChange?.('length', e.target.value)}
        style={{ width: '100%' }}
      >
        <option value="short">简短</option>
        <option value="medium">中等</option>
        <option value="long">详细</option>
      </select>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default memo(SummarizeNode);