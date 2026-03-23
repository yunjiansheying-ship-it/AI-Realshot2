
// Fix: Removed incorrect import of 'Angle' from 'lucide-react'. The 'Angle' type is defined within this file.

export interface GeneratedResult {
  id: number;
  name: string;
  type: string;
  imageUrl: string | null;
  status: 'loading' | 'completed' | 'error' | 'analyzing';
  finalPrompt: string;
  isDynamic: boolean;
  errorMessage?: string;
  description_cn?: string;
}

export interface Angle {
  id: number;
  name: string;
  type: string;
  promptSuffix: string;
  description_cn: string;
  isDynamic?: boolean;
}

export interface SavedProject {
  id: string;
  timestamp: number;
  name: string;
  mainImage: string | null;
  productName: string;
  productMaterial?: string;
  lightingSuggestion: string;
  generatedResults: GeneratedResult[];
  customPrompt?: string;
}
