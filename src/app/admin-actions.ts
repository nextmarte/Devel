'use server'

import { prisma } from '@/lib/prisma'
import { requireServerAuth } from '@/lib/server-auth'
import { Prisma } from '@prisma/client'

// ============== SECURITY ==============

async function verifyAdminAccess() {
  const session = await requireServerAuth()
  if (session.user?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

async function logAuditEvent(
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: any
) {
  const session = await requireServerAuth()
  
  try {
    await prisma.auditLog.create({
      data: {
        user_id: session.user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: metadata || {},
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

// ============== USER MANAGEMENT ==============

export async function getAdminUsers(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    role?: string
    status?: string
    search?: string
  }
) {
  await verifyAdminAccess()

  const where: Prisma.UserWhereInput = {}

  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  if (filters?.role) {
    where.role = { name: filters.role }
  }

  if (filters?.status) {
    where.is_active = filters.status === 'active'
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: true,
        subscription: {
          include: { plan: true }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return {
    users,
    total,
    hasMore: offset + limit < total
  }
}

export async function getUserDetails(userId: string) {
  await verifyAdminAccess()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      subscription: {
        include: { plan: true }
      },
      usage_logs: {
        orderBy: { timestamp: 'desc' },
        take: 100
      },
      transcriptions: {
        orderBy: { created_at: 'desc' },
        take: 20
      },
      audit_logs: {
        orderBy: { timestamp: 'desc' },
        take: 50
      }
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

export async function updateUser(
  userId: string,
  data: {
    name?: string
    email?: string
    is_active?: boolean
  }
) {
  await verifyAdminAccess()

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updated_at: new Date()
    },
    include: {
      role: true,
      subscription: { include: { plan: true } }
    }
  })

  await logAuditEvent('update_user', 'user', userId, { changes: data })

  return updatedUser
}

export async function blockUser(userId: string) {
  await verifyAdminAccess()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { is_active: false, updated_at: new Date() },
    include: { role: true }
  })

  await logAuditEvent('block_user', 'user', userId)

  return user
}

export async function unblockUser(userId: string) {
  await verifyAdminAccess()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { is_active: true, updated_at: new Date() },
    include: { role: true }
  })

  await logAuditEvent('unblock_user', 'user', userId)

  return user
}

export async function deleteUser(userId: string, hardDelete: boolean = false) {
  await verifyAdminAccess()

  if (hardDelete) {
    // Hard delete: remove all related data
    await prisma.user.delete({
      where: { id: userId }
    })
    
    await logAuditEvent('hard_delete_user', 'user', userId, { hardDelete: true })
  } else {
    // Soft delete: just deactivate
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: false, updated_at: new Date() }
    })
    
    await logAuditEvent('soft_delete_user', 'user', userId)
  }

  return { success: true }
}

export async function changeUserPlan(userId: string, planId: string) {
  await verifyAdminAccess()

  const plan = await prisma.plan.findUnique({
    where: { id: planId }
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  const subscription = await prisma.subscription.update({
    where: { user_id: userId },
    data: {
      plan_id: planId,
      updated_at: new Date()
    },
    include: {
      plan: true,
      user: true
    }
  })

  await logAuditEvent('change_user_plan', 'subscription', subscription.id, {
    planId,
    planName: plan.name
  })

  return subscription
}

export async function resetUserPassword(userId: string) {
  await verifyAdminAccess()

  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-12)

  // In production, you would hash this and send it via email
  // For now, just return it so it can be displayed

  await logAuditEvent('reset_user_password', 'user', userId)

  return {
    success: true,
    tempPassword,
    message: 'Temporary password generated. Should be sent to user email.'
  }
}

// ============== TRANSCRIPTION MANAGEMENT ==============

export async function getAdminTranscriptions(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    status?: string
    userId?: string
    search?: string
    dateFrom?: Date
    dateTo?: Date
  }
) {
  await verifyAdminAccess()

  const where: Prisma.TranscriptionWhereInput = {}

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.userId) {
    where.user_id = filters.userId
  }

  if (filters?.search) {
    where.OR = [
      { file_name: { contains: filters.search, mode: 'insensitive' } },
      { job_id: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.created_at = {}
    if (filters.dateFrom) {
      ;(where.created_at as any).gte = filters.dateFrom
    }
    if (filters.dateTo) {
      ;(where.created_at as any).lte = filters.dateTo
    }
  }

  const [transcriptions, total] = await Promise.all([
    prisma.transcription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' }
    }),
    prisma.transcription.count({ where })
  ])

  return {
    transcriptions,
    total,
    hasMore: offset + limit < total
  }
}

export async function getTranscriptionDetails(jobId: string) {
  await verifyAdminAccess()

  const transcription = await prisma.transcription.findUnique({
    where: { job_id: jobId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })

  if (!transcription) {
    throw new Error('Transcription not found')
  }

  return transcription
}

export async function deleteTranscription(jobId: string) {
  await verifyAdminAccess()

  const transcription = await prisma.transcription.delete({
    where: { job_id: jobId }
  })

  await logAuditEvent('delete_transcription', 'transcription', jobId, {
    userId: transcription.user_id,
    fileName: transcription.file_name
  })

  return { success: true }
}

export async function reprocessTranscription(jobId: string) {
  await verifyAdminAccess()

  const transcription = await prisma.transcription.update({
    where: { job_id: jobId },
    data: {
      status: 'PENDING'
    }
  })

  await logAuditEvent('reprocess_transcription', 'transcription', jobId, {
    userId: transcription.user_id
  })

  return transcription
}

// ============== ANALYTICS ==============

export async function getSystemStats() {
  await verifyAdminAccess()

  const [totalUsers, activeUsers24h, totalTranscriptions, successfulTranscriptions] =
    await Promise.all([
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({
        where: {
          is_active: true,
          last_login: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.transcription.count(),
      prisma.transcription.count({
        where: { status: 'SUCCESS' }
      })
    ])

  // Calculate revenue
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: { plan: true }
  })

  const totalMRR = subscriptions.reduce((sum, sub) => sum + (sub.plan.price || 0), 0) / 100

  const successRate =
    totalTranscriptions > 0 ? ((successfulTranscriptions / totalTranscriptions) * 100).toFixed(2) : '0'

  return {
    users: {
      total: totalUsers,
      active24h: activeUsers24h
    },
    transcriptions: {
      total: totalTranscriptions,
      successful: successfulTranscriptions,
      successRate: parseFloat(successRate as string)
    },
    revenue: {
      mrr: totalMRR,
      activeSubscriptions: subscriptions.length
    }
  }
}

export async function getUsersGrowth(days: number = 30) {
  await verifyAdminAccess()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    where: {
      created_at: {
        gte: startDate
      }
    },
    select: {
      created_at: true
    },
    orderBy: { created_at: 'asc' }
  })

  // Group by day
  const grouped: { [key: string]: number } = {}
  users.forEach((user) => {
    const date = user.created_at.toISOString().split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  })

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  }))
}

export async function getTranscriptionsStats(days: number = 30) {
  await verifyAdminAccess()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const transcriptions = await prisma.transcription.findMany({
    where: {
      created_at: {
        gte: startDate
      }
    },
    select: {
      status: true,
      file_duration: true,
      created_at: true
    },
    orderBy: { created_at: 'asc' }
  })

  // Group by day and status
  const grouped: { [key: string]: { [key: string]: number } } = {}

  transcriptions.forEach((t) => {
    const date = t.created_at.toISOString().split('T')[0]
    if (!grouped[date]) {
      grouped[date] = { PENDING: 0, PROCESSING: 0, SUCCESS: 0, FAILED: 0, CANCELLED: 0 }
    }
    grouped[date][t.status] = (grouped[date][t.status] || 0) + 1
  })

  return Object.entries(grouped).map(([date, statuses]) => ({
    date,
    ...statuses
  }))
}

// ============== AUDIT LOGS ==============

export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
  filters?: {
    action?: string
    userId?: string
    resourceType?: string
    dateFrom?: Date
    dateTo?: Date
  }
) {
  await verifyAdminAccess()

  const where: Prisma.AuditLogWhereInput = {}

  if (filters?.action) {
    where.action = filters.action
  }

  if (filters?.userId) {
    where.user_id = filters.userId
  }

  if (filters?.resourceType) {
    where.resource_type = filters.resourceType
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.timestamp = {}
    if (filters.dateFrom) {
      ;(where.timestamp as any).gte = filters.dateFrom
    }
    if (filters.dateTo) {
      ;(where.timestamp as any).lte = filters.dateTo
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    logs,
    total,
    hasMore: offset + limit < total
  }
}

// ============== SYSTEM SETTINGS ==============

export async function getSystemSettings() {
  await verifyAdminAccess()

  const stats = await getSystemStats()
  const plans = await prisma.plan.findMany({
    where: { is_active: true }
  })

  return {
    stats,
    plans,
    version: process.env.npm_package_version || '0.0.1'
  }
}
