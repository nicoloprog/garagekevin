"use client";

import { useState, useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { ShoppingCart, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, type Product } from "@/lib/data";
import { useCart } from "@/lib/store";
import { toast } from "sonner";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nhtsaParts, setNhtsaParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const { addItem } = useCart();

  // VIN & detected vehicle
  const [vin, setVin] = useState("");
  const [vehicle, setVehicle] = useState<{
    manufacturer: string;
    make: string;
    model: string;
    year: string;
    body?: string;
    engine?: string;
    fuel?: string;
  } | null>(null);

  // --- Decode VIN using NHTSA XML API ---
  const decodeVIN = async () => {
    if (!vin) return toast.error("Please enter a VIN");

    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${vin}?format=xml`,
      );
      const xmlText = await res.text();

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      const makeVal = xmlDoc.getElementsByTagName("Make")[0]?.textContent || "";
      const modelVal =
        xmlDoc.getElementsByTagName("Model")[0]?.textContent || "";
      const yearVal =
        xmlDoc.getElementsByTagName("ModelYear")[0]?.textContent || "";
      const manufacturerVal =
        xmlDoc.getElementsByTagName("Manufacturer")[0]?.textContent || "";

      const detectedVehicle = {
        make: makeVal,
        model: modelVal,
        year: yearVal,
        manufacturer: manufacturerVal,
        body: xmlDoc.getElementsByTagName("BodyClass")[0]?.textContent || "",
        engine:
          xmlDoc.getElementsByTagName("EngineModel")[0]?.textContent || "",
        fuel:
          xmlDoc.getElementsByTagName("FuelTypePrimary")[0]?.textContent || "",
      };

      setVehicle(detectedVehicle);

      // Autofill filters
      setMake(makeVal);
      setModel(modelVal);
      setYear(yearVal);

      toast.success(`VIN decoded: ${makeVal} ${modelVal} ${yearVal}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to decode VIN");
    }
  };

  // --- Fetch products from API ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);

      const useVehicleParts =
        make.trim() !== "" && model.trim() !== "" && year.trim() !== "";

      if (useVehicleParts) {
        params.append("make", make);
        params.append("model", model);
        params.append("year", year);
      }

      const url = useVehicleParts
        ? `/api/vehicle-parts?${params.toString()}`
        : `/api/products?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();

      if (Array.isArray(data)) {
        // console.log("API URL:", url);
        // console.log("API Response (store products):", data);
        setProducts(data);
        setNhtsaParts([]);
      } else {
        console.log("Store Inventory:", data.storeInventory);
        console.log("NHTSA Documentation:", data.nhtsaDocumentation);
        setProducts(data.storeInventory || []);
        setNhtsaParts(data.nhtsaDocumentation || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products");
      setProducts([]);
      setNhtsaParts([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever filters change
  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, make, model, year]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-4xl font-bold">Parts Shop</h1>
            <p className="mt-2 text-muted-foreground">
              Premium auto parts and accessories for every vehicle.
            </p>
          </div>

          {/* SEARCH & VIN */}
          <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search parts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* VIN input */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter VIN number"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                />
                <Button onClick={decodeVIN}>Decode VIN</Button>
              </div>

              {/* Car info box */}
              {vehicle && (
                <div className="rounded-md bg-secondary p-4 text-sm flex flex-col gap-1">
                  <strong>Detected Vehicle:</strong>
                  <span>Manufacturer: {vehicle.manufacturer}</span>
                  <span>Make: {vehicle.make}</span>
                  <span>Model: {vehicle.model}</span>
                  <span>Year: {vehicle.year}</span>
                  {vehicle.body && <span>Body: {vehicle.body}</span>}
                  {vehicle.engine && <span>Engine: {vehicle.engine}</span>}
                  {vehicle.fuel && <span>Fuel: {vehicle.fuel}</span>}
                </div>
              )}
            </div>

            {/* Vehicle filters */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                placeholder="Make (e.g. Ford)"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
              <Input
                placeholder="Model (e.g. F-150)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <Input
                placeholder="Year (e.g. 2020)"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          {/* STORE PRODUCTS */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-lg border bg-card"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <Filter className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h2 className="text-lg font-semibold">No parts found</h2>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col rounded-lg border bg-card p-4"
                >
                  <div className="mb-4 flex h-40 items-center justify-center bg-secondary rounded-md">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                  </div>

                  <span className="text-xs uppercase text-primary">
                    {product.category}
                  </span>

                  <h3 className="font-medium">{product.name}</h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold">
                        {formatPrice(product.price)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      disabled={product.stock === 0}
                      onClick={() => {
                        addItem(product);
                        toast.success(`${product.name} added to cart`);
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NHTSA PARTS DOCUMENTATION */}
          {nhtsaParts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">
                Official NHTSA Parts Documentation
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {nhtsaParts.map((part, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-lg border bg-card p-4"
                  >
                    <h3 className="font-medium">{part.Name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Manufacturer: {part.ManufacturerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Letter Date: {part.LetterDate}
                    </p>
                    {part.URL && (
                      <a
                        href={part.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2"
                      >
                        View Letter
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
