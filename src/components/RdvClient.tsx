"use client";

import { useTransition } from "react";
import { fmt } from "@/lib/format";
import { bookSlot } from "@/app/(app)/actions";
import type { ServiceItem, AppointmentSlot } from "@/lib/types";

const DAY_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function RdvClient({
  services,
  takenSlots,
  currency,
}: {
  services: ServiceItem[];
  takenSlots: AppointmentSlot[];
  currency: string;
}) {
  const [pending, startTransition] = useTransition();
  const takenTimes = new Set(takenSlots.map((s) => s.slot_time));

  function book(time: string) {
    if (!services.length) return;
    const fd = new FormData();
    fd.set("slotTime", time);
    fd.set("serviceId", services[0].id);
    fd.set("clientName", "Nouveau client");
    startTransition(() => bookSlot(fd));
  }

  return (
    <div data-tour="vente-rdv">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-2.5 px-1">Créneaux du jour</h2>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {DAY_SLOTS.map((time) => {
          const taken = takenTimes.has(time);
          return (
            <button
              key={time}
              disabled={taken || pending}
              onClick={() => book(time)}
              className={`h-11 rounded-xl text-sm font-mono border transition-colors ${
                taken ? "bg-line text-muted border-transparent line-through" : "bg-card border-line active:border-ochre"
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>

      <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-2.5 px-1">Rendez-vous du jour</h2>
      {takenSlots.length === 0 ? (
        <p className="text-sm text-muted px-1">Aucun rendez-vous pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2">
          {[...takenSlots]
            .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
            .map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-card border border-line rounded-2xl card-surface px-3.5 py-3 min-w-0">
                <span className="font-mono text-sm w-12 shrink-0">{s.slot_time}</span>
                <p className="text-sm truncate flex-1 min-w-0">{s.client}</p>
                <span className="text-xs text-muted shrink-0 truncate max-w-[40%]">{s.service_name}</span>
              </div>
            ))}
        </div>
      )}

      {services.length > 0 && (
        <p className="text-xs text-muted mt-5 px-1">
          Chaque réservation utilise « {services[0].name} » · {fmt(services[0].price, currency)}
        </p>
      )}
    </div>
  );
}
