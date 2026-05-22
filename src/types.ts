import type { LucideIcon } from "lucide-react";

export type BusinessProfile = {
  name: string;
  introduction: string;
  strengths: string[];
  specialties: string[];
  phone: string;
  phoneHref: string;
  kakaoUrl: string;
  naverBlogUrl: string;
  area: string;
  hours: string;
  registrationNumber: string;
  owner: string;
  address: string;
};

export type NavItem = {
  label: string;
  href: string;
};

export type ServiceCategory = {
  title: string;
  icon: LucideIcon;
  text: string;
};

export type ConstructionCase = {
  title: string;
  area: string;
  problem: string;
  solution: string;
  image: string;
};

export type PortfolioPost = {
  title: string;
  description: string;
  date: string;
  link: string;
};

export type NaverBlogItem = {
  title: string;
  description: string;
  link: string;
  postdate?: string;
};

export type WorkProcessStep = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export type EditableServiceCard = {
  title: string;
  text: string;
};

export type EditableCaseCard = {
  title: string;
  area: string;
  problem: string;
  solution: string;
  image: string;
};

export type EditableProcessStep = {
  title: string;
  text: string;
};

export type HomepageContent = {
  hero: {
    title: string;
    description: string;
    image: string;
    mediaNote: string;
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    strengths: string[];
  };
  symptoms: string[];
  services: EditableServiceCard[];
  cases: EditableCaseCard[];
  process: EditableProcessStep[];
  contact: {
    title: string;
    description: string;
  };
};

export type InquiryStatus = "new" | "contacted" | "done" | "spam";

export type InquiryRow = {
  id: string;
  name: string;
  phone: string;
  service_area: string | null;
  message: string;
  status: InquiryStatus;
  source: string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
  notified_at: string | null;
};
