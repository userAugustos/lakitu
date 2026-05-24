import { Label } from '@repo/ui/shadcn/label';
import { Switch } from '@repo/ui/shadcn/switch';

interface AutoApproveToggleProps {
  checked: boolean;
  onToggle: () => void;
}

export function AutoApproveToggle({ checked, onToggle }: AutoApproveToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch
        id="auto-approve"
        data-testid="auto-approve-toggle"
        checked={checked}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="auto-approve" className="text-sm">
        Always approve (skip manual review)
      </Label>
    </div>
  );
}
