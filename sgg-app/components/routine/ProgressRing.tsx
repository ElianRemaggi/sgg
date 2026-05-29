import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated'
import { useColorScheme } from 'nativewind'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface Props {
  percent: number
  size?: number
  strokeWidth?: number
}

export function ProgressRing({ percent, size = 160, strokeWidth = 14 }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = useSharedValue(0)
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  useEffect(() => {
    progress.value = withTiming(percent / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    })
  }, [percent])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  const trackColor = isDark ? '#334155' : '#e2e8f0'

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#16a34a"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">{Math.round(percent)}%</Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500">completado</Text>
      </View>
    </View>
  )
}
