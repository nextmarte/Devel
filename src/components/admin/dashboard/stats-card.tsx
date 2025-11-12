'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down'
    value: number
    period: string
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorMap = {
  blue: 'from-blue-600 to-blue-900',
  green: 'from-green-600 to-green-900',
  purple: 'from-purple-600 to-purple-900',
  orange: 'from-orange-600 to-orange-900',
  red: 'from-red-600 to-red-900'
}

const textColorMap = {
  blue: 'text-blue-200',
  green: 'text-green-200',
  purple: 'text-purple-200',
  orange: 'text-orange-200',
  red: 'text-red-200'
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'blue'
}: StatsCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-lg shadow-lg p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={`${textColorMap[color]} text-sm font-semibold mb-2`}>
            {title}
          </div>
          <div className="text-3xl font-bold text-white">
            {value}
          </div>
        </div>
        {icon && (
          <div className={`${textColorMap[color]} opacity-50`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className={`${textColorMap[color]} text-xs mt-4 flex items-center gap-1`}>
          {trend.direction === 'up' ? (
            <TrendingUp size={14} className="text-green-400" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
          {trend.direction === 'up' ? '+' : '-'}
          {trend.value} {trend.period}
        </div>
      )}
    </div>
  )
}

interface StatsGridProps {
  stats: StatsCardProps[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <StatsCard key={idx} {...stat} />
      ))}
    </div>
  )
}
