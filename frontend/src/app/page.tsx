"use client";

import { AuthGate } from "@/components/AuthGate";
import { KanbanBoard } from "@/components/KanbanBoard";

export default function Home() {
  return (
    <AuthGate>
      {({ onLogout }) => <KanbanBoard onLogout={onLogout} />}
    </AuthGate>
  );
}
