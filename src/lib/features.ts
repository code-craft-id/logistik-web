import "server-only";

/**
 * Feature switches for work that is built but not yet adopted. Off unless
 * the server env sets the value to exactly "true".
 */
export function awbScanEnabled() {
  return process.env.FEATURE_AWB_SCAN === "true";
}
