  import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const nodeStyle: React.CSSProperties = {
  background: '#F6FFED',
  border: '1px solid #52c41a',
  padding: '10px',
  borderRadius: '3px',
  width: 200,
};

const ReportNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  return (
    <div style={nodeStyle}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <strong>报告生成节点</strong>
      <hr />
      <select
        value={data.reportType || 'summary'}
        onChange={(e) => data.onChange?.('reportType', e.target.value)}
        style={{ width: '100%' }}
      >
        <option value="summary">简要报告</option>
        <option value="detailed">详细报告</option>
      </select>
      <select
        value={data.tone || 'objective'}
        onChange={(e) => data.onChange?.('tone', e.target.value)}
        style={{ width: '100%', marginTop: '5px' }}
      >
        <option value="objective">客观</option>
        <option value="casual">随意</option>
        <option value="formal">正式</option>
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

export default memo(ReportNode);