import arif from "@/assets/arif.jpg";
export const userPhoto = arif;
export type Category = { slug: string; name: string; plural: string; tone: string };
export const categories: Category[] = [
  { slug: "electrician", name: "Electrician", plural: "Electricians", tone: "electrician" },
  { slug: "plumber", name: "Plumber", plural: "Plumbers", tone: "plumber" },
  { slug: "appliance", name: "Appliance Repair", plural: "Appliance Repair", tone: "appliance" },
  { slug: "carpenter", name: "Carpenter", plural: "Carpenters", tone: "carpenter" },
  { slug: "mobile", name: "Mobile & Telecom", plural: "Mobile & Telecom", tone: "mobile" },
  { slug: "mechanic", name: "Mechanic", plural: "Mechanics", tone: "mechanic" },
];

export type Provider = {
  id: string; name: string; category: string; role: string; photo: string; cover?: string; gallery?: string[];
  rating: number; reviews: number; years: number; area: string; rate: number; verified: boolean; availableToday?: boolean;
  segments: ("Residential" | "Commercial")[]; services: string[]; about: string; hours: string;
};

// Provider profiles are intentionally empty until verified providers are added from a trusted source.
// This prevents the customer experience from showing fabricated listings, ratings, prices, or review counts.
export const providers: Provider[] = [];

export const getProvider = (id: string) => providers.find(p => p.id === id);
export const getCategory = (slug: string) => categories.find(c => c.slug === slug);
