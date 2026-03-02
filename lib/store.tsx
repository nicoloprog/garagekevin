"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { CartItem, Product } from "@/lib/supabase/types";

// ─── AUTH LOGIC ─────────────────────────────────────────────────────────────

interface CustomUser extends User {
  name?: string;
  role?: string;
  isAdmin: boolean;
}

interface AuthState {
  user: CustomUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    confirmPassword: string,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// ─── SECURITY HELPERS ────────────────────────────────────────────────────────

const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

function validatePassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < PASSWORD_RULES.minLength)
    return { valid: false, message: "Password must be at least 8 characters." };
  if (!PASSWORD_RULES.hasUppercase.test(password))
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter.",
    };
  if (!PASSWORD_RULES.hasLowercase.test(password))
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter.",
    };
  if (!PASSWORD_RULES.hasNumber.test(password))
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  if (!PASSWORD_RULES.hasSpecial.test(password))
    return {
      valid: false,
      message: "Password must contain at least one special character.",
    };
  return { valid: true, message: "" };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeName(name: string): string {
  return name
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 64);
}

const registerAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = registerAttempts.get(email);
  if (!entry) return false;
  if (now - entry.lastAttempt > LOCKOUT_MS) {
    registerAttempts.delete(email);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function trackAttempt(email: string) {
  const now = Date.now();
  const entry = registerAttempts.get(email);
  if (!entry || now - entry.lastAttempt > LOCKOUT_MS) {
    registerAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    entry.count += 1;
    entry.lastAttempt = now;
  }
}

// ─── REDIRECT HELPER ─────────────────────────────────────────────────────────

function resolveRedirect(isAdmin: boolean): string {
  return isAdmin ? "/admin" : "/shop";
}

// ─── AUTH PROVIDER ───────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const formatUser = (supabaseUser: User | null): CustomUser | null => {
    if (!supabaseUser) return null;

    // ✅ Accessing the Binary is_admin bit
    // Priority: app_metadata (system) > user_metadata (fallback)
    const isAdminFlag = !!(
      supabaseUser.app_metadata?.is_admin ||
      supabaseUser.user_metadata?.is_admin
    );

    const rawRole = supabaseUser.app_metadata?.role || "CUSTOMER";
    const normalizedRole =
      typeof rawRole === "string" ? rawRole.toUpperCase() : "CUSTOMER";

    return {
      ...supabaseUser,
      name:
        supabaseUser.user_metadata?.name ||
        supabaseUser.user_metadata?.full_name ||
        "User",
      role: normalizedRole,
      isAdmin: isAdminFlag,
    };
  };

  const isAdmin = !!user?.isAdmin;

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(formatUser(session?.user ?? null));
      setLoading(false);
    });

    // Listen for Auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const formatted = formatUser(session?.user ?? null);
      setUser(formatted);
      setLoading(false);

      if (event === "SIGNED_IN" && formatted) {
        router.push(resolveRedirect(formatted.isAdmin));
      }

      if (event === "SIGNED_OUT") {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail))
      return { success: false, message: "Invalid email." };
    if (isRateLimited(cleanEmail))
      return { success: false, message: "Too many attempts." };

    trackAttempt(cleanEmail);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setLoading(false);
        return { success: false, message: "Invalid credentials." };
      }
      return { success: true, message: "Welcome back!" };
    } catch (err) {
      setLoading(false);
      return { success: false, message: "Unexpected error during login." };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeName(name);

    // Validate email
    if (!validateEmail(cleanEmail))
      return { success: false, message: "Invalid email address." };

    // Validate name
    if (cleanName.length < 2)
      return { success: false, message: "Name is too short." };

    // Validate password match
    if (password !== confirmPassword)
      return { success: false, message: "Passwords do not match." };

    // Strong password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid)
      return { success: false, message: passwordCheck.message };

    if (isRateLimited(cleanEmail))
      return { success: false, message: "Too many attempts. Try again later." };

    trackAttempt(cleanEmail);
    setLoading(true);

    try {
      // 🔥 Minimal signup — no metadata for now
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { success: false, message: error.message };
      }

      setLoading(false);

      return {
        success: true,
        message:
          "Account created successfully. Check your email to verify your account.",
      };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: "Unexpected registration error.",
      };
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── CART LOGIC ─────────────────────────────────────────────────────────────

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*");
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const addItem = useCallback((productId: string, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);
  }, [items, products]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
