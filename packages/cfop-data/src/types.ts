export type AlgCategory = string;

export interface MethodStep {
  id: string;
  label: string;
  description?: string;
}

export interface AlgCase {
  id: string;
  name: string;
  category: AlgCategory;
  subcategory: string;
  group: string;
  primaryAlg: string;
  alternativeAlgs?: string[];
  probability?: string;
  description?: string;
  tips?: string;
  why?: string;
  is2Look?: boolean;
}

export interface AlgMethod {
  id: string;
  name: string;
  description?: string;
  steps: MethodStep[];
  cases: AlgCase[];
  isAvailable?: boolean;
}
