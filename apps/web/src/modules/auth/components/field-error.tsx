interface FieldErrorProps {
  message?: string | null;
}

export function FieldError({ message }: FieldErrorProps) {
  return (
    <p
      className={`text-destructive h-4 text-[13px] transition-opacity duration-200 ${message ? 'opacity-100' : 'opacity-0'}`}
    >
      {message ?? ' '}
    </p>
  );
}
