import interactionLog from "@/src/data/mockInteractionLog.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecentInteractions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Interactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-500">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">Type</th>
                <th className="p-2">Product</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {[...interactionLog].reverse().map((item) => (
                <tr key={item.interaction_id} className="border-t border-slate-800 text-slate-300">
                  <td className="p-2">{new Date(item.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" })}</td>
                  <td className="p-2">{item.script_played ? "Script" : "Detection"}</td>
                  <td className="p-2">{item.product_name}</td>
                  <td className="p-2">{item.zone}</td>
                  <td className="p-2">{item.interaction_duration_sec}s</td>
                  <td className="p-2 text-green">{item.interaction_result.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
