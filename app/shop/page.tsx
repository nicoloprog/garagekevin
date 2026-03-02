"use client";

import { useState, useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { ShoppingCart, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getProducts,
  getProductCategories,
  formatPrice,
  type Product,
} from "@/lib/data";
import { useCart } from "@/lib/store";
import { toast } from "sonner";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    Promise.all([getProducts(), getProductCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-2xl">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-foreground">
              Parts Shop
            </h1>
            <p className="mt-2 text-muted-foreground">
              Premium auto parts and accessories for every vehicle.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search parts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={!selectedCategory ? "default" : "secondary"}
                className={`cursor-pointer ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "secondary"}
                  className={`cursor-pointer ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-lg border border-border bg-card"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Filter className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h2 className="text-lg font-semibold text-foreground">
                No parts found
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <div
                  key={product.id}
                  className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="mb-4 flex h-40 items-center justify-center rounded-md bg-secondary">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <span className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                    {product.category}
                  </span>
                  <h3 className="mb-1 font-medium text-foreground">
                    {product.name}
                  </h3>
                  <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-foreground">
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
                        addItem(product.id);
                        toast.success(`${product.name} added to cart`);
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
