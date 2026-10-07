import { getAccountLifecycle } from './accountLifecycle';
import { accountDeletionConfigured, createDeletionServices } from './accountDeletionServices';

export function startAccountDeletionWorker() {
  let running = false;
  const tick = async () => {
    if (running || !accountDeletionConfigured()) return;
    running = true;
    try {
      await getAccountLifecycle().expireReceipts();
      const services = createDeletionServices();
      for (let count = 0; count < 10; count++) {
        if (await getAccountLifecycle().processNext(services) === 'idle') break;
      }
    } catch {
      console.error('[Account deletion] Worker unavailable; persisted requests will retry.');
    } finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  return () => clearInterval(timer);
}
