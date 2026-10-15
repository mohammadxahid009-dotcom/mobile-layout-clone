import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProStoreProvider } from "@/lib/pro-store";

export const Route = createFileRoute("/pro")({
  component: ProLayout,
});

function ProLayout() {
  return (
    <ProStoreProvider>
      <Outlet />
    </ProStoreProvider>
  );
}
