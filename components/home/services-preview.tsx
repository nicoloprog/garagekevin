import Link from "next/link"
import { ArrowRight, Droplets, Disc, Cpu, RotateCcw, Settings2, Thermometer } from "lucide-react"
import { services, formatPrice } from "@/lib/data"

const iconMap: Record<string, React.ElementType> = {
  "Oil Change": Droplets,
  "Brake Service": Disc,
  "Engine Diagnostics": Cpu,
  "Tire Rotation & Balance": RotateCcw,
  "Transmission Service": Settings2,
  "AC Service & Repair": Thermometer,
}

export function ServicesPreview() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground">
              Our Services
            </h2>
            <p className="mt-2 text-muted-foreground">
              Expert repair and maintenance for all makes and models
            </p>
          </div>
          <Link
            href="/services"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 md:flex"
          >
            View All Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.name] || Settings2
            return (
              <Link
                key={service.id}
                href="/services"
                className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
                  {service.name}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    From {formatPrice(service.basePrice)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ~{service.durationMinutes} min
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View All Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
