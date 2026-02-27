// Types
export type Role = "ADMIN" | "CUSTOMER"
export type BookingStatus = "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED"

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  createdAt: string
}

export interface Vehicle {
  id: string
  userId: string
  make: string
  model: string
  year: number
  vin?: string
  createdAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  basePrice: number
  durationMinutes: number
  createdAt: string
}

export interface Booking {
  id: string
  userId: string
  vehicleId: string
  serviceId: string
  scheduledAt: string
  status: BookingStatus
  notes?: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  total: number
  status: OrderStatus
  createdAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
}

export interface CartItem {
  productId: string
  quantity: number
}

// Mock Users
export const users: User[] = [
  {
    id: "u1",
    name: "Admin User",
    email: "admin@ironworks.com",
    password: "admin123",
    role: "ADMIN",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "u2",
    name: "John Smith",
    email: "john@example.com",
    password: "customer123",
    role: "CUSTOMER",
    createdAt: "2025-02-15T00:00:00Z",
  },
  {
    id: "u3",
    name: "Sarah Connor",
    email: "sarah@example.com",
    password: "customer123",
    role: "CUSTOMER",
    createdAt: "2025-03-10T00:00:00Z",
  },
]

// Mock Vehicles
export const vehicles: Vehicle[] = [
  {
    id: "v1",
    userId: "u2",
    make: "Ford",
    model: "F-150",
    year: 2022,
    vin: "1FTFW1E85NFA00001",
    createdAt: "2025-02-15T00:00:00Z",
  },
  {
    id: "v2",
    userId: "u2",
    make: "Toyota",
    model: "Camry",
    year: 2021,
    createdAt: "2025-03-01T00:00:00Z",
  },
  {
    id: "v3",
    userId: "u3",
    make: "Honda",
    model: "Civic",
    year: 2023,
    vin: "19XFC2F59PE000001",
    createdAt: "2025-03-10T00:00:00Z",
  },
]

// Mock Services
export const services: Service[] = [
  {
    id: "s1",
    name: "Oil Change",
    description: "Full synthetic oil change with filter replacement. Includes multi-point inspection and fluid top-off.",
    basePrice: 79.99,
    durationMinutes: 45,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s2",
    name: "Brake Service",
    description: "Complete brake pad replacement and rotor inspection. Includes brake fluid check and caliper service.",
    basePrice: 249.99,
    durationMinutes: 120,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s3",
    name: "Engine Diagnostics",
    description: "Full computer diagnostic scan with detailed report. Covers all major systems and error codes.",
    basePrice: 129.99,
    durationMinutes: 60,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s4",
    name: "Tire Rotation & Balance",
    description: "Four-tire rotation with computerized balancing. Includes tread depth measurement and pressure adjustment.",
    basePrice: 59.99,
    durationMinutes: 45,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s5",
    name: "Transmission Service",
    description: "Transmission fluid flush and filter replacement. Full inspection of transmission components.",
    basePrice: 349.99,
    durationMinutes: 180,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s6",
    name: "AC Service & Repair",
    description: "Complete air conditioning system inspection, refrigerant recharge, and leak detection.",
    basePrice: 189.99,
    durationMinutes: 90,
    createdAt: "2025-01-01T00:00:00Z",
  },
]

// Mock Products
export const products: Product[] = [
  {
    id: "p1",
    name: "Performance Air Filter",
    description: "High-flow reusable air filter for improved engine performance and throttle response. Washable and reusable for up to 100,000 miles.",
    price: 49.99,
    stock: 25,
    category: "Engine",
    images: ["/images/products/air-filter.jpg"],
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "p2",
    name: "Ceramic Brake Pads (Front)",
    description: "Premium ceramic brake pads with low dust formula. Provides excellent stopping power and reduced noise.",
    price: 89.99,
    stock: 40,
    category: "Brakes",
    images: ["/images/products/brake-pads.jpg"],
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "p3",
    name: "Full Synthetic Motor Oil (5W-30)",
    description: "Premium full synthetic motor oil for maximum engine protection. 5-quart jug suitable for most vehicles.",
    price: 34.99,
    stock: 100,
    category: "Oils & Fluids",
    images: ["/images/products/motor-oil.jpg"],
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "p4",
    name: "LED Headlight Kit (H11)",
    description: "Ultra-bright LED headlight conversion kit. 6000K white light with 300% brighter than halogen. Plug and play.",
    price: 129.99,
    stock: 15,
    category: "Lighting",
    images: ["/images/products/led-headlight.jpg"],
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "p5",
    name: "Spark Plug Set (4-Pack)",
    description: "Iridium spark plugs for improved fuel efficiency and performance. Pre-gapped for easy installation.",
    price: 39.99,
    stock: 60,
    category: "Engine",
    images: ["/images/products/spark-plugs.jpg"],
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "p6",
    name: "Heavy-Duty Floor Jack (3-Ton)",
    description: "Professional grade hydraulic floor jack with rapid pump technology. Low profile design for sports cars.",
    price: 189.99,
    stock: 8,
    category: "Tools",
    images: ["/images/products/floor-jack.jpg"],
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-02-15T00:00:00Z",
  },
  {
    id: "p7",
    name: "Transmission Fluid (ATF)",
    description: "Universal automatic transmission fluid compatible with most domestic and import vehicles.",
    price: 24.99,
    stock: 45,
    category: "Oils & Fluids",
    images: ["/images/products/transmission-fluid.jpg"],
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-02-15T00:00:00Z",
  },
  {
    id: "p8",
    name: "Stainless Steel Exhaust Tip",
    description: "Polished stainless steel universal exhaust tip. Bolt-on installation. 2.5 inch inlet, 4 inch outlet.",
    price: 44.99,
    stock: 20,
    category: "Exhaust",
    images: ["/images/products/exhaust-tip.jpg"],
    createdAt: "2025-03-01T00:00:00Z",
    updatedAt: "2025-03-01T00:00:00Z",
  },
]

// Mock Bookings
export const bookings: Booking[] = [
  {
    id: "b1",
    userId: "u2",
    vehicleId: "v1",
    serviceId: "s1",
    scheduledAt: "2026-03-05T09:00:00Z",
    status: "COMPLETED",
    createdAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "b2",
    userId: "u2",
    vehicleId: "v2",
    serviceId: "s2",
    scheduledAt: "2026-03-10T14:00:00Z",
    status: "APPROVED",
    notes: "Customer requested OEM parts only",
    createdAt: "2026-02-25T00:00:00Z",
  },
  {
    id: "b3",
    userId: "u3",
    vehicleId: "v3",
    serviceId: "s3",
    scheduledAt: "2026-03-12T10:00:00Z",
    status: "PENDING",
    notes: "Check engine light on",
    createdAt: "2026-02-27T00:00:00Z",
  },
  {
    id: "b4",
    userId: "u3",
    vehicleId: "v3",
    serviceId: "s5",
    scheduledAt: "2026-03-15T11:00:00Z",
    status: "PENDING",
    createdAt: "2026-02-27T00:00:00Z",
  },
]

// Mock Orders
export const orders: Order[] = [
  {
    id: "o1",
    userId: "u2",
    total: 174.97,
    status: "COMPLETED",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "o2",
    userId: "u3",
    total: 129.99,
    status: "SHIPPED",
    createdAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "o3",
    userId: "u2",
    total: 89.99,
    status: "PAID",
    createdAt: "2026-02-25T00:00:00Z",
  },
]

// Mock OrderItems
export const orderItems: OrderItem[] = [
  { id: "oi1", orderId: "o1", productId: "p3", quantity: 2, price: 34.99 },
  { id: "oi2", orderId: "o1", productId: "p1", quantity: 1, price: 49.99 },
  { id: "oi3", orderId: "o1", productId: "p5", quantity: 1, price: 39.99 },
  { id: "oi4", orderId: "o2", productId: "p4", quantity: 1, price: 129.99 },
  { id: "oi5", orderId: "o3", productId: "p2", quantity: 1, price: 89.99 },
]

// Helper functions
export function getProductCategories(): string[] {
  return [...new Set(products.map((p) => p.category))]
}

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id)
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((v) => v.id === id)
}

export function getVehiclesByUser(userId: string): Vehicle[] {
  return vehicles.filter((v) => v.userId === userId)
}

export function getBookingsByUser(userId: string): Booking[] {
  return bookings.filter((b) => b.userId === userId)
}

export function getOrdersByUser(userId: string): Order[] {
  return orders.filter((o) => o.userId === userId)
}

export function getOrderItemsByOrder(orderId: string): OrderItem[] {
  return orderItems.filter((oi) => oi.orderId === orderId)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
