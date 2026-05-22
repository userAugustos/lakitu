interface TimeCellProps {
  relative: string;
  absolute: string;
}

export function TimeCell({ relative, absolute }: TimeCellProps) {
  return (
    <div className="text-dash-ink-2">
      {relative}
      <span className="text-dash-muted block text-[11.5px]">{absolute}</span>
    </div>
  );
}
