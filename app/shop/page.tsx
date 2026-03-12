"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Car,
  Zap,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice, type Product } from "@/lib/data";
import { useCart } from "@/lib/store";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────
const cleanVehicleString = (text: string, type: "make" | "model") => {
  if (!text) return "";
  let clean = text
    .replace(/\b(AWD|4WD|2WD|FWD|RWD|V6|V8|L4|TURBO|SDN|CP|SUV)\b/gi, "")
    .trim();
  if (type === "make") return clean.split(" ")[0].toUpperCase();
  return clean.toUpperCase();
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface CQData {
  makeId: string;
  modelId: string;
  trimId: string;
  body: string;
  doors: string;
  cylinders: string;
  displacement: string;
  horsepower: string;
  torque: string;
  fuel: string;
  drive: string;
  transmission: string;
  weight: string;
}

interface VehicleData {
  vin: string;
  make: string;
  model: string;
  year: string;
  manufacturer: string;
  bodyClass: string;
  engineModel: string;
  fuelType: string;
  trim: string;
  cq?: CQData;
  source: "cache" | "live";
}

interface AutoCarePart {
  partTerminologyId: number;
  partTerminologyName: string;
  brandLabel: string;
  partNumber: string;
  description: string;
  price?: number;
  fitmentNotes?: string;
}

// ── Step badge ────────────────────────────────────────────────────────────────
function StepBadge({
  step,
  label,
  status,
}: {
  step: number;
  label: string;
  status: "idle" | "loading" | "done" | "error";
}) {
  const colors: Record<typeof status, string> = {
    idle: "bg-muted text-muted-foreground",
    loading:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {status === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
      <span className="opacity-60">Step {step}</span> {label}
    </span>
  );
}

// ── VehicleCard ───────────────────────────────────────────────────────────────
function VehicleCard({ v }: { v: VehicleData }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border bg-card p-4 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <span className="font-semibold uppercase">
            {v.year} {v.make} {v.model}
          </span>
          {v.trim && (
            <Badge variant="secondary" className="text-xs">
              {v.trim}
            </Badge>
          )}
        </div>
        <Badge
          variant={v.source === "cache" ? "outline" : "default"}
          className="text-xs"
        >
          {v.source === "cache" ? "cached" : "live"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">Manufacturer</strong>:{" "}
          {v.manufacturer}
        </span>
        <span>
          <strong className="text-foreground">Body</strong>: {v.bodyClass}
        </span>
        <span>
          <strong className="text-foreground">Engine</strong>:{" "}
          {v.engineModel || "—"}
        </span>
        <span>
          <strong className="text-foreground">Fuel</strong>: {v.fuelType || "—"}
        </span>
      </div>
      {v.cq && (
        <>
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Zap className="h-3 w-3" /> Technical Specs{" "}
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {expanded && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground border-t pt-2">
              <span>
                <strong className="text-foreground">Drive</strong>:{" "}
                {v.cq.drive || "—"}
              </span>
              <span>
                <strong className="text-foreground">Trans</strong>:{" "}
                {v.cq.transmission || "—"}
              </span>
              <span>
                <strong className="text-foreground">Cyl</strong>:{" "}
                {v.cq.cylinders || "—"}
              </span>
              <span>
                <strong className="text-foreground">Disp</strong>:{" "}
                {v.cq.displacement ? `${v.cq.displacement} cc` : "—"}
              </span>
              <span>
                <strong className="text-foreground">HP</strong>:{" "}
                {v.cq.horsepower ? `${v.cq.horsepower} PS` : "—"}
              </span>
              <span>
                <strong className="text-foreground">Weight</strong>:{" "}
                {v.cq.weight ? `${v.cq.weight} kg` : "—"}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [vinSteps, setVinSteps] = useState<{
    nhtsa: "idle" | "loading" | "done" | "error";
    carquery: "idle" | "loading" | "done" | "error";
  }>({ nhtsa: "idle", carquery: "idle" });
  const [acParts, setAcParts] = useState<AutoCarePart[]>([]);
  const [acLoading, setAcLoading] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const [acSteps, setAcSteps] = useState<{
    vehicleLookup: "idle" | "loading" | "done" | "error";
    partsSearch: "idle" | "loading" | "done" | "error";
  }>({ vehicleLookup: "idle", partsSearch: "idle" });
  const { addItem } = useCart();

  // REFACTORED: Now accepts parameters directly to avoid state-lag
  const lookupParts = useCallback(
    async (m: string, mo: string, y: string, term: string) => {
      if (!m || !mo || !y || !term) {
        toast.error("Please enter vehicle details and part name");
        return;
      }

      // DEBUG: Check what data is being sent
      console.log("Searching for:", { m, mo, y, term });

      setAcLoading(true);
      setAcParts([]);
      setAcSteps({ vehicleLookup: "done", partsSearch: "loading" });
      try {
        const res = await fetch(`/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: y, make: m, model: mo, partName: term }),
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();
        console.log("API Response:", data); // DEBUG: Check if data is arriving

        const formattedParts: AutoCarePart[] = Array.isArray(data)
          ? data.map((item: any) => ({
              partTerminologyId: item.partTerminologyId ?? 0,
              partTerminologyName: item.partTerminologyName ?? "No Title",
              brandLabel: item.brand ?? "Amazon",
              partNumber: item.partNumber ?? "N/A",
              description: item.description ?? "",
              // If price is a string like "$15.87", consider parsing it if you need the number type
              price:
                typeof item.price === "string"
                  ? parseFloat(item.price.replace(/[^0-9.]/g, ""))
                  : (item.price?.extracted_price ?? 0),
            }))
          : [];

        setAcParts(formattedParts);
        setAcSteps({ vehicleLookup: "done", partsSearch: "done" });
      } catch (err: any) {
        console.error("Lookup error:", err);
        setAcSteps({ vehicleLookup: "error", partsSearch: "error" });
        toast.error("Failed to fetch parts. Check console logs.");
      } finally {
        setAcLoading(false);
      }
    },
    [],
  );

  const enrichVehicleData = async (targetVin: string) => {
    setVinSteps((prev) => ({ ...prev, carquery: "loading" }));
    try {
      const res = await fetch(`/api/vehicle-specs?vin=${targetVin}`);
      if (!res.ok) throw new Error("Spec lookup failed");
      const data = await res.json();
      const specs: CQData = {
        makeId: data.MakeID || "",
        modelId: data.ModelID || "",
        trimId: data.Trim || "",
        body: data.BodyClass || "",
        doors: data.Doors || "",
        cylinders: data.EngineCylinders || "",
        displacement: data.DisplacementCC || "",
        horsepower: data.Horsepower || "",
        torque: "",
        fuel: data.FuelTypePrimary || "",
        drive: data.DriveType || "",
        transmission: data.TransmissionStyle || "",
        weight: data.GVWR || "",
      };
      setVehicle((prev) => (prev ? { ...prev, cq: specs } : null));
      setVinSteps((prev) => ({ ...prev, carquery: "done" }));
    } catch (error) {
      setVinSteps((prev) => ({ ...prev, carquery: "error" }));
    }
  };

  const normalize = (make: string, model: string) => {
    const brand = make.split(" ")[0].toUpperCase();
    const cleanModel = model.split(" ")[0].toUpperCase();
    return { brand, cleanModel };
  };

  const decodeVIN = async () => {
    if (!vin || vin.length !== 17)
      return toast.error("Enter valid 17-char VIN");
    setVinSteps({ nhtsa: "loading", carquery: "idle" });
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${vin}?format=xml`,
      );
      const xmlText = await res.text();
      const xmlDoc = new DOMParser().parseFromString(
        xmlText,
        "application/xml",
      );
      const getVal = (tag: string) =>
        xmlDoc.getElementsByTagName(tag)[0]?.textContent || "";
      const rawMake = getVal("Make");
      const rawModel = getVal("Model");
      const year = getVal("ModelYear");
      const { brand, cleanModel } = normalize(rawMake, rawModel);
      const yearVal = year || "";
      if (!brand) {
        setVinSteps({ nhtsa: "error", carquery: "idle" });
        return toast.error("Invalid VIN");
      }
      setVehicle({
        vin,
        make: rawMake,
        model: cleanModel,
        year: yearVal,
        manufacturer: getVal("Manufacturer"),
        bodyClass: getVal("BodyClass"),
        engineModel: getVal("EngineModel"),
        fuelType: getVal("FuelTypePrimary"),
        trim: getVal("Trim"),
        source: "live",
      });
      setMake(rawMake);
      setModel(cleanModel);
      setYear(yearVal);
      setVinSteps({ nhtsa: "done", carquery: "idle" });
      toast.success(`Identified: ${rawMake} ${cleanModel}`);
      await enrichVehicleData(vin);
      // FIXED: Use direct variables instead of state-dependent logic
      await lookupParts(rawMake, cleanModel, yearVal, partSearch);
    } catch (error) {
      setVinSteps({ nhtsa: "error", carquery: "idle" });
      toast.error("Failed to decode VIN");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);
      if (make && model && year) {
        params.append("make", make);
        params.append("model", model);
        params.append("year", year);
      }
      const url =
        make && model && year
          ? `/api/vehicle-parts?${params}`
          : `/api/products?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed fetch");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.storeInventory ?? []));
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, make, model, year]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 space-y-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold">Parts Shop</h1>
            <p className="mt-2 text-muted-foreground">
              Search by VIN to find guaranteed fitment for your vehicle.
            </p>
          </div>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" /> Vehicle Identification
            </h2>
            <div className="flex gap-2 max-w-lg">
              <Input
                placeholder="Enter 17-character VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
              />
              <Button
                onClick={decodeVIN}
                disabled={vin.length !== 17 || vinSteps.nhtsa === "loading"}
              >
                {vinSteps.nhtsa === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Identify Vehicle"
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <StepBadge step={1} label="NHTSA" status={vinSteps.nhtsa} />
              <StepBadge step={2} label="Specs" status={vinSteps.carquery} />
            </div>
            {vehicle && <VehicleCard v={vehicle} />}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg">
              <Input
                placeholder="Make"
                value={make}
                onChange={(e) => setMake(e.target.value.toUpperCase())}
              />
              <Input
                placeholder="Model"
                value={model}
                onChange={(e) => setModel(e.target.value.toUpperCase())}
              />
              <Input
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </section>
          {(vehicle || (make && model && year)) && (
            <section className="space-y-4 pt-6 border-t">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Fitment Results
                (AutoCare)
              </h2>
              <div className="flex gap-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search specific parts (e.g. Filter)"
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      lookupParts(make, model, year, partSearch)
                    }
                  />
                </div>
                <Button
                  onClick={() => lookupParts(make, model, year, partSearch)}
                  disabled={acLoading}
                  variant="secondary"
                >
                  {acLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search Catalog"
                  )}
                </Button>
              </div>
              {acParts.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {acParts.map((part, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-lg border bg-card p-4 gap-2 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm leading-tight">
                          {part.partTerminologyName}
                        </h3>
                        {part.price && (
                          <span className="text-sm font-bold">
                            {formatPrice(part.price)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">
                        {part.brandLabel} — {part.partNumber}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {part.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          <section className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Shop Inventory
              </h2>
            </div>
            {loadingProducts ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-lg border bg-card"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col rounded-lg border bg-card p-4"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {product.category}
                    </span>
                    <h3 className="font-medium mb-4">{product.name}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {formatPrice(product.price)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          addItem(product);
                          toast.success("Added to cart");
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
