import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export function Spinner({ className, ...props }: SpinnerProps) {
    return (
        <Loader2
            className={cn("animate-spin", className)}
            {...props}
        />
    );
}
