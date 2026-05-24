import type { Tool } from '@lakitu/api/tools';

import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';

interface ToolPolicyFieldsProps {
  tool: Tool;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function ToolPolicyFields({ tool, values, onChange }: ToolPolicyFieldsProps) {
  if (tool.policy_fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {tool.policy_fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <Label
            htmlFor={`policy-field-${field.key}`}
            className="text-xs font-semibold tracking-wide"
          >
            {field.label}
          </Label>
          <Input
            id={`policy-field-${field.key}`}
            data-testid={`tool-policy-field-${field.key}`}
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder}
            value={values[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
