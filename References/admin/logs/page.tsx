'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, Filter, RefreshCw, Search, AlertTriangle, Shield, Activity, Users } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SecurityLog {
  id: string
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, any>
  userId?: string
  userName?: string
  createdAt: string
}

interface LogsFilter {
  eventType?: string
  severity?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

interface LogsPagination {
  page: number
  limit: number
  sortBy: 'createdAt' | 'severity' | 'eventType'
  sortOrder: 'asc' | 'desc'
  total: number
  totalPages: number
}

interface ChatAnalytics {
  date: string
  totalSessions: number
  uniqueUsers: number
  avgDuration: number
}

export default function AdminLogsPage() {
  const [filters, setFilters] = useState<LogsFilter>({})
  const [pagination, setPagination] = useState<LogsPagination>({
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    total: 0,
    totalPages: 0
  })
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  // Fetch security logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-logs', filters, pagination.page, pagination.limit, pagination.sortBy, pagination.sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/admin/logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      return response.json()
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch chat analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['chat-analytics', dateRange.from, dateRange.to],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: (dateRange.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: (dateRange.to || new Date()).toISOString()
      })

      const response = await fetch(`/api/admin/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    }
  })

  // Update pagination when data changes
  useEffect(() => {
    if (logsData?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: logsData.pagination.total,
        totalPages: logsData.pagination.totalPages
      }))
    }
  }, [logsData])

  const handleFilterChange = (key: keyof LogsFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleDateRangeChange = (from?: Date, to?: Date) => {
    setDateRange({ from, to })
    setFilters(prev => ({ ...prev, startDate: from, endDate: to }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() })
      })

      const response = await fetch(`/api/admin/logs?${params}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export logs:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Admin Logs & Monitoring
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor security events, chat analytics, and system performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", logsLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="border-slate-200 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {logsData?.pagination?.total || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Critical Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {logsData?.logs?.filter((log: SecurityLog) => log.severity === 'critical').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Chat Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {analyticsData?.reduce((sum: number, day: ChatAnalytics) => sum + day.totalSessions, 0) || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData?.reduce((sum: number, day: ChatAnalytics) => sum + day.uniqueUsers, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-100">
              <Shield className="h-4 w-4 mr-2" />
              Security Logs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-100">
              <Activity className="h-4 w-4 mr-2" />
              Chat Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Event Type</label>
                    <Select value={filters.eventType || ''} onValueChange={(value) => handleFilterChange('eventType', value || undefined)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="All events" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All events</SelectItem>
                        <SelectItem value="security_login_attempt">Login Attempts</SelectItem>
                        <SelectItem value="rate_limit_exceeded">Rate Limits</SelectItem>
                        <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                        <SelectItem value="admin_access_granted">Admin Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Severity</label>
                    <Select value={filters.severity || ''} onValueChange={(value) => handleFilterChange('severity', value || undefined)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All levels</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-slate-200",
                            !dateRange.from && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => handleDateRangeChange(date, dateRange.to)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-slate-200",
                            !dateRange.to && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => handleDateRangeChange(dateRange.from, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">User ID</label>
                    <Input
                      placeholder="Filter by user ID"
                      value={filters.userId || ''}
                      onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
                      className="bg-white border-slate-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search logs..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                        className="pl-10 bg-white border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Logs Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Security Events</CardTitle>
                <CardDescription>
                  Real-time security events and system logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-600">Loading logs...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logsData?.logs?.map((log: SecurityLog) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-lg border border-slate-200 bg-white/50 hover:bg-white/80 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getSeverityIcon(log.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-sm font-medium text-slate-900">
                                  {log.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h3>
                                <Badge className={getSeverityColor(log.severity)}>
                                  {log.severity}
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-600 space-y-1">
                                {log.userName && (
                                  <p><span className="font-medium">User:</span> {log.userName}</p>
                                )}
                                {log.details.path && (
                                  <p><span className="font-medium">Path:</span> {log.details.path}</p>
                                )}
                                {log.details.userAgent && (
                                  <p><span className="font-medium">User Agent:</span> {log.details.userAgent.substring(0, 100)}...</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-slate-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page <= 1}
                          className="border-slate-200"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-slate-600">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page >= pagination.totalPages}
                          className="border-slate-200"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Chat Analytics</CardTitle>
                <CardDescription>
                  Daily chat session statistics and user engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-600">Loading analytics...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData?.map((day: ChatAnalytics) => (
                      <div
                        key={day.date}
                        className="p-4 rounded-lg border border-slate-200 bg-white/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-slate-900">
                              {format(new Date(day.date), 'MMMM dd, yyyy')}
                            </h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                              <span>
                                <Users className="inline h-4 w-4 mr-1" />
                                {day.totalSessions} sessions
                              </span>
                              <span>
                                <Activity className="inline h-4 w-4 mr-1" />
                                {day.uniqueUsers} unique users
                              </span>
                              <span>
                                Avg duration: {Math.round(day.avgDuration / 60)}m
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
