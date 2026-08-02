import React from 'react';

export default function Chart({ type = 'bar', data = [], xKey = 'name', yKey = 'value', height = 220 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        No data available to plot.
      </div>
    );
  }

  const padding = 40;
  const svgHeight = height;
  const svgWidth = 500;
  const chartHeight = svgHeight - padding * 2;
  const chartWidth = svgWidth - padding * 2;

  const yValues = data.map(d => Number(d[yKey]) || 0);
  const maxY = Math.max(...yValues, 5); // Default min max is 5

  const points = data.map((d, index) => {
    const x = padding + (index * (chartWidth / (data.length - 1 || 1)));
    const yVal = Number(d[yKey]) || 0;
    const y = padding + (chartHeight - (yVal / maxY) * chartHeight);
    return { x, y, name: d[xKey], val: yVal };
  });

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        style={{ width: '100%', height: 'auto', minWidth: '400px' }}
      >
        {/* Gradients */}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.15"/>
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + chartHeight * ratio;
          const valLabel = Math.round(maxY * (1 - ratio));
          return (
            <g key={idx}>
              <line 
                x1={padding} 
                y1={y} 
                x2={svgWidth - padding} 
                y2={y} 
                stroke="var(--border-color)" 
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text 
                x={padding - 10} 
                y={y + 4} 
                fill="var(--text-muted)" 
                fontSize="10" 
                textAnchor="end"
                fontWeight="500"
              >
                {valLabel}
              </text>
            </g>
          );
        })}

        {/* Bar Chart Type */}
        {type === 'bar' && (
          <g>
            {data.map((d, index) => {
              const xRange = chartWidth / data.length;
              const barWidth = Math.max(15, xRange * 0.55);
              const x = padding + (index * xRange) + (xRange - barWidth) / 2;
              const yVal = Number(d[yKey]) || 0;
              const barHeight = (yVal / maxY) * chartHeight;
              const y = padding + (chartHeight - barHeight);

              return (
                <g key={index} className="chart-bar-group">
                  {/* Glowing Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#barGrad)"
                    rx="4"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {/* Tooltip value */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {yVal}
                  </text>
                  {/* X Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={svgHeight - padding + 16}
                    fill="var(--text-secondary)"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {d[xKey].length > 12 ? `${d[xKey].substring(0, 10)}..` : d[xKey]}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Line Chart Type */}
        {type === 'line' && points.length > 0 && (
          <g>
            {/* Area under the line */}
            <path
              d={`
                M ${points[0].x} ${svgHeight - padding}
                ${points.map(p => `L ${p.x} ${p.y}`).join(' ')}
                L ${points[points.length - 1].x} ${svgHeight - padding}
                Z
              `}
              fill="url(#lineGrad)"
            />

            {/* Line path */}
            <path
              d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Point circles */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="var(--bg-secondary)"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                />
                {/* Tooltip value */}
                <text
                  x={p.x}
                  y={p.y - 8}
                  fill="var(--text-primary)"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {p.val}
                </text>
                {/* X Axis Label */}
                <text
                  x={p.x}
                  y={svgHeight - padding + 16}
                  fill="var(--text-secondary)"
                  fontSize="9"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {p.name.length > 12 ? `${p.name.substring(0, 10)}..` : p.name}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
