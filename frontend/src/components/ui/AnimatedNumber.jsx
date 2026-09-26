import { useCountUp } from '../../hooks/useCountUp.js'

export default function AnimatedNumber({ value, decimals = 1, prefix = '', suffix = '', formatter }) {
  const { ref, value: animated } = useCountUp(value, { decimals })
  const display = formatter ? formatter(animated) : animated.toFixed(decimals)
  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
