import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
};

function FormSubmitButton({ children, className }: FormSubmitButtonProps) {
  return (
    <Button className={cn("cursor-pointer rounded border px-3 py-2", className)} type="submit">
      {children}
    </Button>
  );
}

export { FormSubmitButton };
