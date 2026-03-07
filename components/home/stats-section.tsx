import { Wrench, ShieldCheck, Clock, Users } from "lucide-react";

const stats = [
  { icon: Wrench, value: "2,000+", label: "Reparations Effectuées" },
  { icon: ShieldCheck, value: "2 Year", label: "Garantie sur Pièces" },
  { icon: Clock, value: "Même Jour", label: "Service Disponible" },
  { icon: Users, value: "4,800+", label: "Clients Satisfaits" },
];

export function StatsSection() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <stat.icon className="h-6 w-6 text-primary" />
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground sm:text-3xl">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
