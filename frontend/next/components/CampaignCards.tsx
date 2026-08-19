import { Megaphone, ScrollText } from "lucide-react";
import type { getActiveCampaign } from "@/src/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RobotAsset from "@/components/RobotAsset";

type Campaign = ReturnType<typeof getActiveCampaign>;

export function ActiveCampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Campaign</CardTitle>
        <span className="rounded-full bg-purple/15 px-2 py-1 text-xs font-bold text-purple">{campaign.status}</span>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <RobotAsset variant="duo" size="md" className="h-24 w-24" />
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone size={16} className="text-purple" />
              {campaign.campaign_name}
            </div>
            <div className="mt-1 text-lg font-bold text-amber">{campaign.product_name}</div>
            <div className="mt-1 text-xs text-slate-500">{campaign.sampling_period}</div>
            <p className="mt-2 text-sm leading-5 text-slate-300">{campaign.objective}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CurrentScriptCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Script</CardTitle>
        <ScrollText size={18} className="text-purple" />
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-purple/25 bg-purple/10 p-4 text-base leading-7 text-slate-100">
          “{campaign.script_th}”
        </div>
      </CardContent>
    </Card>
  );
}
