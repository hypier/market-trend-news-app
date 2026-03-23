export interface AssetCategory {
  code: string;
  parentCode: string | null;
  level: number;
  nameTranslations: {
    [key: string]: string;
  };
  descriptionTranslations: {
    [key: string]: string;
  };
  logo: string;
  sortOrder: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  children: AssetCategory[];
}

export interface AssetCategoriesResponse {
  code: number;
  data: AssetCategory[];
  message: string;
} 