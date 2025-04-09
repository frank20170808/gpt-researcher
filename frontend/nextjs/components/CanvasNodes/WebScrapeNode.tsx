import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const nodeStyle: React.CSSProperties = {
  background: '#E6F7FF',
  border: '1px solid #1890ff',
  padding: '10px',
  borderRadius: '3px',
  width: 200,
};

const WebScrapeNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  return (
    <div style={nodeStyle}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <strong>网页爬取节点</strong>
      <hr />
      <input
        type="text"
        value={data.url || ''}
        onChange={(e) => data.onChange?.('url', e.target.value)}
        placeholder="请输入URL"
        style={{ width: '100%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default memo(WebScrapeNode);