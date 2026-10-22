"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const menus = [
  "Dashboard",
  "Sistem Setting - Grup User",
  "Sistem Setting - Manajemen User",
  "Sistem Setting - Hak Akses Menu",
  "Kantor",
  "Master Data - Logistik",
  "Master Data - Vendor",
  "Master Data - Perkiraan",
  "Master Data - Shipment Status",
  "Akunting",
  "Modul - Pemasaran/Penjualan",
  "Modul - Transaksi",
  "Modul - Booking",
  "Modul - Operasional",
  "Laporan - Cabang",
  "Laporan - Kurir",
  "Laporan - Keuangan",
  "Laporan - Customer",
  "Ticketing",
];
const actions = ["Read", "Input", "Edit", "Delete"];

export function MenuAccessPreview() {
  const id = useId();
  const [group, setGroup] = useState("Administrator");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const visible = menus.filter(
    (menu) =>
      !selectedOnly || actions.some((action) => checks[`${menu}:${action}`]),
  );
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Hak Akses Menu</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Isolated permission-matrix presentation. These fictional groups and
          checkbox changes never grant access or alter a user. Saving is
          unavailable until PLT-01.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-background p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setLoaded(group);
          setChecks({});
        }}
      >
        <div className="space-y-2">
          <Label htmlFor={`${id}-group`}>Group User (preview)</Label>
          <select
            id={`${id}-group`}
            value={group}
            onChange={(event) => setGroup(event.currentTarget.value)}
            className="min-h-11 rounded-md border border-input px-3 text-sm"
          >
            {["Administrator", "Operasional", "Viewer"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-type`}>Type</Label>
          <select
            id={`${id}-type`}
            value={selectedOnly ? "selected" : "all"}
            onChange={(event) =>
              setSelectedOnly(event.currentTarget.value === "selected")
            }
            className="min-h-11 rounded-md border border-input px-3 text-sm"
          >
            <option value="all">All menus</option>
            <option value="selected">Selected menus</option>
          </select>
        </div>
        <Button type="submit" className="min-h-11">
          Show Menu
        </Button>
        <Button disabled className="min-h-11">
          Simpan — unavailable
        </Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableCaption className="pb-3">
            Preview permission matrix only. No session or authorization data is
            used.
          </TableCaption>
          <TableHeader>
            <TableRow>
              {["No", "Menu", "Group User", ...actions].map((label) => (
                <TableHead key={label} scope="col">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loaded ? (
              visible.map((menu, index) => (
                <TableRow key={menu}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{menu}</TableCell>
                  <TableCell>{loaded} · fixture</TableCell>
                  {actions.map((action) => (
                    <TableCell key={action}>
                      <label className="flex min-h-11 min-w-11 items-center justify-center">
                        <input
                          type="checkbox"
                          className="size-5 accent-primary"
                          aria-label={`${action} ${menu} preview`}
                          checked={!!checks[`${menu}:${action}`]}
                          onChange={(event) => {
                            const checked = event.currentTarget.checked;
                            setChecks((current) => ({
                              ...current,
                              [`${menu}:${action}`]: checked,
                            }));
                          }}
                        />
                      </label>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Select Show Menu to inspect the local preview.
                </TableCell>
              </TableRow>
            )}
            {loaded && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No selected preview permissions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <output
        className="block text-sm text-muted-foreground"
        aria-live="polite"
      >
        {Object.values(checks).filter(Boolean).length} preview checkboxes
        selected. Nothing saved; no access granted.
      </output>
    </>
  );
}
