import type {
  HardwareItem,
  PricingRule,
  WebbingItem,
} from "../actions/catalog";

export type StrapEnds = "sealed" | "folded" | "loops";
export type LogoKind = "none" | "woven";
export interface StrapConfig {
  material: string;
  widthMm: number;
  lengthMm: number;
  color: string;
  hardwareId: string | null;
  ends: StrapEnds;
  logo: { kind: LogoKind; text: string };
  quantity: number;
  region: string;
}
export interface Catalog {
  webbing: WebbingItem[];
  hardware: HardwareItem[];
  rules: PricingRule[];
  source: "live" | "seed";
}
export interface PointMm {
  x: number;
  y: number;
}
export interface BuckleAsset {
  id: string;
  name: string;
  widthMm: number;
  svgUrl: string;
  anchors: { left: PointMm; right: PointMm };
  recolorableIds?: string[];
  viewBox: [number, number, number, number];
}
export interface StrapTemplate {
  id: string;
  name: string;
  description: string;
  material: string;
  widthMm: number;
  lengthMm: number;
  hardwareSku: string | null;
  ends: StrapEnds;
}
export interface Contact {
  name: string;
  email: string;
  company: string;
  projectName: string;
}
