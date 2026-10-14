import { ManagerShell } from "@/components/manager/manager-nav";
import { isNew } from "@/lib/manager";
import { isOwner } from "@/lib/owner";
import { listBookings } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({ children }: LayoutProps<"/owner">) {
  const owner = await isOwner();
  const newCount = owner ? (await listBookings()).filter(isNew).length : 0;

  if (!owner) {
    return <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">{children}</div>;
  }

  return <ManagerShell newCount={newCount}>{children}</ManagerShell>;
}
