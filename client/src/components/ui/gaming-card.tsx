import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GamingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GamingCard = forwardRef<HTMLDivElement, GamingCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("gaming-card", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GamingCard.displayName = "GamingCard";

export default GamingCard;
