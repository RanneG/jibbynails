import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-[#070605] md:bg-[radial-gradient(circle_at_top,#2a2116_0%,#070605_55%)]">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-hidden bg-background md:min-h-[min(100dvh,920px)] md:my-6 md:rounded-[2.15rem] md:border md:border-gold/18 md:shadow-[0_40px_90px_rgba(0,0,0,0.6)]",
          className
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
