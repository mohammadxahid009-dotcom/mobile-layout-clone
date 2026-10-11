import sameer from "@/assets/sameer.jpg";
import bilal from "@/assets/bilal.jpg";
import zaheer from "@/assets/zaheer.jpg";
import aamir from "@/assets/aamir.jpg";
import arif from "@/assets/arif.jpg";
import work from "@/assets/electrician-work.jpg";
import lake from "@/assets/kashmir-lake.jpg";

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

export const userPhoto = arif;
export const landscape = lake;

export const providers: Provider[] = [
  { id: "sameer-electricals", name: "Haroon Rashid", category: "electrician", role: "Electrician", photo: sameer, gallery: [work, lake, work, lake], rating: 4.8, reviews: 124, years: 5, area: "Budgam, Chadoora", rate: 300, verified: true, availableToday: true, segments: ["Residential", "Commercial"], services: ["House Wiring", "Switch Board", "Lighting", "Fan Installation", "Inverter Setup", "MCB Repair"], about: "Professional electrician providing safe and reliable electrical services for homes and offices. Available for emergency calls too.", hours: "8:00 AM – 8:00 PM (Mon - Sun)" },
  { id: "bilal-electric-works", name: "Haroon Rashid", category: "electrician", role: "Electrician", photo: bilal, rating: 4.6, reviews: 89, years: 7, area: "Budgam, Beerwah", rate: 350, verified: true, segments: ["Commercial"], services: ["AC Repair", "Industrial Wiring", "Panel Setup", "Lighting"], about: "Experienced in commercial wiring, AC repair and electrical panel installation for shops and offices.", hours: "9:00 AM – 7:00 PM (Mon - Sat)" },
  { id: "zaheer-khan", name: "Haroon Rashid", category: "electrician", role: "Electrician", photo: zaheer, rating: 4.7, reviews: 67, years: 6, area: "Budgam, Magam", rate: 280, verified: true, segments: ["Residential"], services: ["House Wiring", "Switch Board", "Lighting", "Geyser Repair"], about: "Friendly electrician for all household electrical repairs, new fittings and safety checks.", hours: "8:00 AM – 9:00 PM (Mon - Sun)" },
  { id: "aamir-khan", name: "Haroon Rashid", category: "plumber", role: "Plumber", photo: aamir, cover: lake, rating: 4.7, reviews: 98, years: 6, area: "Budgam, Beerwah", rate: 300, verified: true, availableToday: true, segments: ["Residential", "Commercial"], services: ["Pipe Fitting", "Leak Repair", "Bathroom Fitting", "Water Tank", "Geyser Fitting"], about: "Reliable and experienced plumber with expertise in residential and commercial plumbing. Quick response and quality work guaranteed.", hours: "8:00 AM – 8:00 PM (Mon - Sun)" },
  { id: "imran-plumbing", name: "Haroon Rashid", category: "plumber", role: "Plumber", photo: bilal, cover: lake, rating: 4.5, reviews: 52, years: 9, area: "Budgam, Chadoora", rate: 320, verified: true, segments: ["Residential"], services: ["Leak Repair", "Tap Fitting", "Drain Cleaning"], about: "Fast and tidy plumbing repairs for homes across Budgam.", hours: "9:00 AM – 6:00 PM (Mon - Sat)" },
  { id: "fixit-appliances", name: "Haroon Rashid", category: "appliance", role: "Appliance Repair", photo: zaheer, cover: lake, rating: 4.6, reviews: 71, years: 8, area: "Budgam, Main Chowk", rate: 400, verified: true, availableToday: true, segments: ["Residential", "Commercial"], services: ["Washing Machine", "Refrigerator", "Microwave", "AC Service"], about: "Doorstep repair for all major home appliances with genuine spare parts.", hours: "10:00 AM – 7:00 PM (Mon - Sat)" },
  { id: "rafiq-woodworks", name: "Haroon Rashid", category: "carpenter", role: "Carpenter", photo: bilal, cover: lake, rating: 4.9, reviews: 143, years: 15, area: "Budgam, Khansahib", rate: 450, verified: true, segments: ["Residential", "Commercial"], services: ["Furniture Repair", "Door Fitting", "Walnut Carving", "Cabinets"], about: "Traditional Kashmiri woodwork and modern carpentry for homes and shops.", hours: "8:00 AM – 6:00 PM (Mon - Sat)" },
  { id: "connect-mobile", name: "Haroon Rashid", category: "mobile", role: "Mobile & Telecom", photo: aamir, cover: lake, rating: 4.4, reviews: 38, years: 4, area: "Budgam, Bus Stand", rate: 200, verified: false, availableToday: true, segments: ["Residential"], services: ["Screen Replacement", "Battery", "Wi-Fi Setup", "Broadband"], about: "Phone repairs and home internet setup, same-day service for most fixes.", hours: "10:00 AM – 8:00 PM (Mon - Sun)" },
  { id: "javed-auto", name: "Haroon Rashid", category: "mechanic", role: "Mechanic", photo: sameer, cover: lake, rating: 4.6, reviews: 84, years: 11, area: "Budgam, Ompora", rate: 350, verified: true, segments: ["Residential", "Commercial"], services: ["Car Service", "Bike Repair", "Breakdown Help", "Tyres"], about: "Car and bike servicing with roadside breakdown assistance around Budgam.", hours: "9:00 AM – 7:00 PM (Mon - Sat)" },
];

export const getProvider = (id: string) => providers.find(p => p.id === id);
export const getCategory = (slug: string) => categories.find(c => c.slug === slug);
