export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CafeSource = {
  ADMIN: "ADMIN",
  SUGGESTION: "SUGGESTION",
} as const;
export type CafeSource = (typeof CafeSource)[keyof typeof CafeSource];

export const OwnerType = {
  PLATFORM: "PLATFORM",
  VENDOR: "VENDOR",
} as const;
export type OwnerType = (typeof OwnerType)[keyof typeof OwnerType];

export const CafeStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type CafeStatus = (typeof CafeStatus)[keyof typeof CafeStatus];

export const SuggestionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type SuggestionStatus = (typeof SuggestionStatus)[keyof typeof SuggestionStatus];

export const VerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const MediaType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const XpAction = {
  NEW_CAFE_VISIT: "NEW_CAFE_VISIT",
  REVISIT: "REVISIT",
  CAFE_SUGGESTION: "CAFE_SUGGESTION",
} as const;
export type XpAction = (typeof XpAction)[keyof typeof XpAction];

export const PriceRange = {
  BUDGET: "BUDGET",
  MODERATE: "MODERATE",
  PREMIUM: "PREMIUM",
} as const;
export type PriceRange = (typeof PriceRange)[keyof typeof PriceRange];

export const QuestionType = {
  SINGLE: "SINGLE",
  MULTI: "MULTI",
  NUMBER: "NUMBER",
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}
