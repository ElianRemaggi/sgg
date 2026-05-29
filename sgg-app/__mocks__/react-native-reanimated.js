const React = require('react')
const { View } = require('react-native')

const createAnimatedComponent = (Component) => Component

const Animated = {
  View,
  Text: require('react-native').Text,
  Image: require('react-native').Image,
  ScrollView: require('react-native').ScrollView,
  createAnimatedComponent,
}

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (init) => ({ value: init }),
  useAnimatedStyle: (fn) => ({}),
  withTiming: (toValue) => toValue,
  withSpring: (toValue) => toValue,
  withRepeat: (animation) => animation,
  withDelay: (delay, animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  cancelAnimation: () => {},
  interpolate: (value, inputRange, outputRange) => outputRange[0],
  Extrapolation: { EXTEND: 'extend', CLAMP: 'clamp', IDENTITY: 'identity' },
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    in: (easing) => easing,
    out: (easing) => easing,
    inOut: (easing) => easing,
    bezier: () => (t) => t,
    poly: () => (t) => t,
    circle: (t) => t,
    exp: (t) => t,
    elastic: () => (t) => t,
    bounce: (t) => t,
    back: () => (t) => t,
  },
}
