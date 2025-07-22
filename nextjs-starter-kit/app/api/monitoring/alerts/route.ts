import { NextRequest, NextResponse } from "next/server";
import { alertingSystem, Alert } from "@/lib/monitoring/alerts";
import { withErrorHandler } from "@/lib/monitoring/error-handler";

/**
 * Get alerts
 * GET /api/monitoring/alerts?status=active&limit=50
 */
async function getAlerts(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'active', 'resolved', 'all'
  const limit = parseInt(searchParams.get('limit') || '100');
  
  let alerts: Alert[];
  
  if (status === 'active') {
    alerts = alertingSystem.getActiveAlerts().slice(0, limit);
  } else {
    alerts = alertingSystem.getAlertHistory(limit);
    
    if (status === 'resolved') {
      alerts = alerts.filter(alert => alert.resolved);
    }
  }
  
  return NextResponse.json({
    alerts,
    total: alerts.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Resolve alert
 * POST /api/monitoring/alerts/resolve
 */
async function resolveAlert(request: NextRequest) {
  const { alertId } = await request.json();
  
  if (!alertId) {
    return NextResponse.json(
      { error: 'Alert ID is required' },
      { status: 400 }
    );
  }
  
  await alertingSystem.resolveAlert(alertId);
  
  return NextResponse.json({
    message: 'Alert resolved successfully',
    alertId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get alerting rules
 * GET /api/monitoring/alerts/rules
 */
async function getAlertRules() {
  const rules = alertingSystem.getRules();
  
  return NextResponse.json({
    rules,
    total: rules.length,
    timestamp: new Date().toISOString()
  });
}

// Route handlers
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { pathname } = new URL(request.url);
  
  if (pathname.endsWith('/rules')) {
    return getAlertRules();
  }
  
  return getAlerts(request);
}, 'monitoring');

export const POST = withErrorHandler(resolveAlert, 'monitoring');