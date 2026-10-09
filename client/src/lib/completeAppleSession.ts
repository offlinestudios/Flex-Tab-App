export async function completeAppleSession(token: string | undefined, actions: {
  status: () => Promise<{required:boolean;complete:boolean}>;
  store: (token:string) => Promise<unknown>;
}): Promise<'complete' | 'reauthenticate'> {
  const before = await actions.status();
  if (!before.required || before.complete) return 'complete';
  if (!token) return 'reauthenticate';
  await actions.store(token);
  const after = await actions.status();
  if (!after.complete) throw new Error('Apple setup is incomplete');
  return 'complete';
}
