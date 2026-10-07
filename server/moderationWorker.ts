import { sql } from 'drizzle-orm';
import { getDb } from './db';
import { removeOwnedMedia } from './ownedMedia';

export async function processModerationCleanup(remove = removeOwnedMedia) {
  const db = await getDb(); if (!db) return 'idle';
  let reportId: number | undefined;
  try {
    return await db.transaction(async tx => {
      const result = await tx.execute(sql`SELECT id,"targetUserId","mediaKeys" FROM content_reports
        WHERE "mediaCleanupPending"=true AND "nextCleanupAt"<=now() ORDER BY "nextCleanupAt" LIMIT 1 FOR UPDATE SKIP LOCKED`);
      const report = result.rows[0]; if (!report) return 'idle';
      reportId = Number(report.id);
      await remove(report.mediaKeys as string[],Number(report.targetUserId));
      await tx.execute(sql`UPDATE content_reports SET "mediaCleanupPending"=false,"mediaKeys"='[]'::jsonb WHERE id=${reportId}`);
      return 'removed';
    });
  } catch {
    if (reportId !== undefined) await db.execute(sql`UPDATE content_reports SET "cleanupAttempts"="cleanupAttempts"+1,"nextCleanupAt"=now()+interval '15 minutes' WHERE id=${reportId}`);
    console.error('[Moderation] Storage cleanup will retry', {reportId});
    return 'retry';
  }
}
export function startModerationWorker() {
  let running = false;
  const tick = async () => {if(running)return;running=true;try{for(let i=0;i<10;i++){if(await processModerationCleanup()==='idle')break;}}catch{console.error('[Moderation] Worker unavailable');}finally{running=false;}};
  void tick();const timer=setInterval(()=>void tick(),60000);timer.unref();return()=>clearInterval(timer);
}
