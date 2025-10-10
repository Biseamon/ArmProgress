import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

type PieChartProps = {
  data: { value: number; color: string }[];
  size?: number;
};

export function PieChart({ data, size = 180 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2;
  const strokeWidth = size / 3;
  const innerRadius = radius - strokeWidth / 2;

  let currentAngle = -90;
  const circles = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const dashArray = 2 * Math.PI * innerRadius;
    const dashOffset = dashArray - (dashArray * percentage);

    const rotation = currentAngle;
    currentAngle += angle;

    return (
      <Circle
        key={index}
        cx={radius}
        cy={radius}
        r={innerRadius}
        fill="none"
        stroke={item.color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        rotation={rotation}
        origin={`${radius}, ${radius}`}
      />
    );
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>{circles}</G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
