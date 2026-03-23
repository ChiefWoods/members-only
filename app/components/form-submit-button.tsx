import { Button } from "~/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { cn } from "~/lib/utils";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  isSubmitting?: boolean;
};

function FormSubmitButton({ children, className, isSubmitting = false }: FormSubmitButtonProps) {
  return (
    <Button
      aria-busy={isSubmitting}
      className={cn("cursor-pointer rounded border px-3 py-2", className)}
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

export { FormSubmitButton };
