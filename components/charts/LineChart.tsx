import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

type LineChartProps = {
  data: { value: number; label: string }[];
  color?: string;
  width?: number;
  height?: number;
};

export function LineChart({
  data,
  color = '#E63946',
  width = 300,
  height = 200,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data
    .map((point, index) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * index;
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Line
          x1={padding}
          y1={padding + chartHeight}
          x2={width - padding}
          y2={padding + chartHeight}
          stroke="#333"
          strokeWidth="2"
        />

        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartHeight}
          stroke="#333"
          strokeWidth="2"
        />

        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((point, index) => {
          const x = padding + (chartWidth / (data.length - 1 || 1)) * index;
          const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;

          return (
            <Circle key={index} cx={x} cy={y} r="5" fill={color} />
          );
        })}

        {data.map((point, index) => {
          const x = padding + (chartWidth / (data.length - 1 || 1)) * index;

          return (
            <SvgText
              key={index}
              x={x}
              y={padding + chartHeight + 20}
              fill="#999"
              fontSize="10"
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noData: {
    color: '#666',
    fontSize: 14,
  },
});
