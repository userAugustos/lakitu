import { Badge } from '../shadcn/badge';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const VARIANT: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="outline" className={VARIANT[level]}>
      {level.toUpperCase()}
    </Badge>
  );
}
