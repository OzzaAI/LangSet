// Disable all instrumentation to prevent OpenTelemetry issues
export function register() {
  // No-op - completely disable tracing
  if (typeof process !== 'undefined') {
    process.env.OTEL_SDK_DISABLED = 'true';
    process.env.NEXT_OTEL_VERBOSE = '0';
  }
}