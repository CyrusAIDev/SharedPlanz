import { motion } from 'framer-motion'
import { ListTodo, Sparkles, Users } from 'lucide-react'
import type { TabName } from '../types'

interface Tab { id: TabName; label: string; icon: React.ElementType }

const TABS: Tab[] = [
  { id: 'plans', label: 'Plans', icon: ListTodo },
  { id: 'decide', label: 'Decide 🎯', icon: Sparkles },
  { id: 'people', label: 'People', icon: Users },
]

interface TabBarProps {
  active: TabName
  onChange: (tab: TabName) => void
  planCount: number
}

export function TabBar({ active, onChange, planCount }: TabBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-start"
      style={{
        height: 'calc(70px + env(safe-area-inset-bottom))',
        paddingTop: '6px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(26,16,37,0.92)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(168,85,247,0.12)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        const isDisabled = tab.id === 'decide' && planCount < 2

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.88 }}
            onClick={() => !isDisabled && onChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 relative"
            style={{ opacity: isDisabled ? 0.3 : 1 }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 inset-x-6 h-[2px] rounded-full"
                style={{ background: 'linear-gradient(90deg, #FF6B6B, #A855F7)' }}
              />
            )}
            <tab.icon size={22} style={{ color: isActive ? '#FF6B6B' : 'rgba(255,255,255,0.38)' }} />
            <span className="text-[10px] font-semibold"
              style={{ color: isActive ? '#FF6B6B' : 'rgba(255,255,255,0.38)' }}>
              {tab.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
