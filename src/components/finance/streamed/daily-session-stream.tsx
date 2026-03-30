import { DailySessionControl } from "../daily-session-control";
import { getDailySession } from "@/lib/actions/finance-actions";
import { serializePrisma } from "@/lib/utils";

export async function DailySessionStream() {
    const sessionRaw = await getDailySession();
    const session = serializePrisma(sessionRaw);

    return <DailySessionControl session={session} />;
}
