"use client";

import { AuthGate } from "@/components/AuthGate";
import { KanbanWorkspace } from "@/components/KanbanWorkspace";

export default function Home() {
  return (
    <AuthGate>
      {({ onLogout }) => <KanbanWorkspace onLogout={onLogout} />}
    </AuthGate>
  );
}
