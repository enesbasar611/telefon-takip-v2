import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed";
import { getLiveActivity } from "@/lib/actions/live-actions";
import { serializePrisma } from "@/lib/utils";

export async function LiveActivityStream() {
    const liveActivityRaw = await getLiveActivity();
    const liveActivity = serializePrisma(liveActivityRaw);

    return <LiveActivityFeed activity={liveActivity} />;
}
