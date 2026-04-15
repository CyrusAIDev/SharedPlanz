import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (score: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 34 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const display = hovered > 0 ? hovered : value

  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= display
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileTap={readonly ? undefined : { scale: 0.75 }}
            animate={{ scale: active && !readonly ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
            className={readonly ? 'cursor-default' : 'cursor-pointer'}
            style={{ minWidth: size, minHeight: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Star
              size={size}
              fill={active ? '#FFD93D' : 'transparent'}
              stroke={active ? '#FFD93D' : 'rgba(255,255,255,0.25)'}
              strokeWidth={1.5}
            />
          </motion.button>
        )
      })}
    </div>
  )
}
