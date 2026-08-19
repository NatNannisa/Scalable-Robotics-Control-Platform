"use client";

import { useEffect, useState } from "react";
import { AlertCenter } from "@/src/alerts/AlertCenter";
import { BernoulliStoreMap } from "@/src/branch-monitor/BernoulliStoreMap";
import { BranchStatusTable } from "@/src/branch-monitor/BranchStatusTable";
import { getBranchSnapshot, listBranches } from "@/src/branch-monitor/cpApiAdapter";
import type { BranchRow, BranchSnapshot } from "@/src/branch-monitor/types";
import { canViewBusinessMetrics } from "@/src/auth/permissions";
import type { ControlRoomSession } from "@/src/auth/types";
import { EventLogPanel } from "@/src/event-log/EventLogPanel";
import { SelectedBranchPanel } from "@/src/selected-branch/SelectedBranchPanel";
import { AdapterHealthPanel } from "@/src/supplier-support/AdapterHealthPanel";

export type BranchMonitorView = "overview" | "map" | "events" | "alerts";

export function BranchMonitorWorkspace({ session, view = "overview" }: { session: ControlRoomSession; view?: BranchMonitorView }) {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(session.branchIds[0] ?? "");
  const [snapshot, setSnapshot] = useState<BranchSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listBranches(session.branchIds).then((items) => {
      if (!active) return;
      setBranches(items);
      setSelectedBranchId((current) => current || items[0]?.branchId || "");
    });
    return () => {
      active = false;
    };
  }, [session.branchIds]);

  useEffect(() => {
    if (!selectedBranchId) return;
    let active = true;
    setLoading(true);
    getBranchSnapshot(selectedBranchId).then((nextSnapshot) => {
      if (!active) return;
      setSnapshot(nextSnapshot);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedBranchId]);

  if (!snapshot) {
    return <div className="rounded-[24px] border border-white/10 bg-white/[0.065] p-6 text-slate-300">Loading branch control room...</div>;
  }

  const map = <BernoulliStoreMap snapshot={snapshot} />;
  const events = <EventLogPanel events={snapshot.events} />;
  const alerts = <AlertCenter alerts={snapshot.alerts} />;

  if (view === "map") return <div className="grid gap-5 2xl:grid-cols-[1.4fr_.75fr]">{map}<div className="space-y-5"><SelectedBranchPanel snapshot={snapshot} /><AdapterHealthPanel snapshot={snapshot} /></div></div>;
  if (view === "events") return <div className="grid gap-5 2xl:grid-cols-[1.2fr_.8fr]">{events}<div className="space-y-5"><BranchStatusTable branches={branches} selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} /><SelectedBranchPanel snapshot={snapshot} /></div></div>;
  if (view === "alerts") return <div className="grid gap-5 2xl:grid-cols-[1.2fr_.8fr]">{alerts}<div className="space-y-5"><SelectedBranchPanel snapshot={snapshot} /><AdapterHealthPanel snapshot={snapshot} /></div></div>;

  return (
    <div className="space-y-5">
      {canViewBusinessMetrics(session.role) ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tasks Today" value="18" />
          <Metric label="Total Distance" value="12.8 km" />
          <Metric label="Total Runtime" value="7h 42m" />
          <Metric label="Customer Interactions" value="2,845" />
        </div>
      ) : null}
      <div className="grid gap-5 2xl:grid-cols-[1.45fr_.9fr]">
        {map}
        <div className="space-y-5">
          <SelectedBranchPanel snapshot={snapshot} />
          <AdapterHealthPanel snapshot={snapshot} />
        </div>
      </div>
      <div className="grid gap-5 2xl:grid-cols-[1.15fr_.85fr]">
        <BranchStatusTable branches={branches} selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
        {loading ? <div className="rounded-[24px] border border-white/10 bg-white/[0.065] p-6 text-slate-400">Refreshing branch data...</div> : alerts}
      </div>
      {events}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </section>
  );
}
