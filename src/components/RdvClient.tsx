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
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-2">Créneaux du jour</p>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {DAY_SLOTS.map((time) => {
          const taken = takenTimes.has(time);
          return (
            <button
              key={time}
              disabled={taken || pending}
              onClick={() => book(time)}
              className={`rounded-lg py-2.5 text-sm font-mono ${
                taken ? "bg-line text-muted" : "bg-card border border-line hover:border-ochre"
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>

      <p className="text-xs uppercase tracking-widest text-muted mb-2">Rendez-vous du jour</p>
      {takenSlots.length === 0 ? (
        <p className="text-sm text-muted">Aucun rendez-vous pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2">
          {takenSlots
            .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
            .map((s) => (
              <div key={s.id} className="flex justify-between items-center bg-card border border-line rounded-xl px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-mono">{s.slot_time}</p>
                  <p className="text-xs text-muted">{s.client}</p>
                </div>
                <span className="text-xs text-muted">{s.service_name}</span>
              </div>
            ))}
        </div>
      )}

      {services.length > 0 && (
        <p className="text-xs text-muted mt-6">
          Chaque réservation utilise « {services[0].name} » · {fmt(services[0].price, currency)}
        </p>
      )}
    </div>
  );
}
