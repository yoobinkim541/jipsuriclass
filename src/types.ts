import type { LucideIcon } from "lucide-react";

export type BusinessProfile = {
  name: string;
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
