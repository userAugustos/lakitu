import { CircleCheck } from 'lucide-react';

interface SuccessScreenProps {
  email: string;
}

export function SuccessScreen({ email }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center pt-2 text-center" data-testid="success-screen">
      <div className="animate-in zoom-in-75 inline-flex size-16 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(11,27,51,0.08),0_2px_6px_rgba(11,27,51,0.04)]">
        <CircleCheck className="size-9" />
      </div>
      <h2 className="font-display mt-4 mb-1.5 text-[28px] font-bold -tracking-wide">Green flag.</h2>
      <p className="text-muted-foreground m-0 mb-6 text-sm">
        Welcome back. Routing <strong className="text-foreground font-semibold">{email}</strong> to
        the control tower...
      </p>
      <div className="bg-border h-1 w-55 overflow-hidden rounded-full">
        <div className="animate-slide bg-foreground h-full w-2/5 rounded-full" />
      </div>
    </div>
  );
}
