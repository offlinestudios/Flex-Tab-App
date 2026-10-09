import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppPreferences } from './AppPreferences';

interface SettingsDialogProps { open: boolean; onOpenChange: (open: boolean) => void }
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto bg-background text-foreground">
      <DialogHeader><DialogTitle>Settings</DialogTitle><DialogDescription>App appearance and available preferences.</DialogDescription></DialogHeader>
      <AppPreferences />
      <button type="button" className="rounded-xl bg-primary text-primary-foreground p-3" onClick={() => onOpenChange(false)}>Done</button>
    </DialogContent>
  </Dialog>;
}
