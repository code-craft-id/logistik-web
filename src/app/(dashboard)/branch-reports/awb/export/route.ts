import { awbStatusExport } from "@/features/reports/awb-status/export-route";

export function GET(request: Request) {
  return awbStatusExport(request, "awb");
}
