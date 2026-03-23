export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface GymPublicDto {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
}

export interface GymDto extends GymPublicDto {
  routineCycle: string
}

export interface GymMemberDto {
  memberId: number
  userId: number
  fullName: string
  email: string
  avatarUrl: string | null
  role: string
  status: string
  membershipExpiresAt: string | null
  joinedAt: string
}

export interface MembershipDto {
  membershipId: number
  gymId: number
  gymName: string
  gymSlug: string
  gymLogoUrl: string | null
  role: string
  status: string
  membershipExpiresAt: string | null
}

export interface JoinRequestResponse {
  membershipId: number
  status: string
  gymName: string
}

export type MemberRole = 'MEMBER' | 'COACH' | 'ADMIN' | 'ADMIN_COACH'
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED' | 'REMOVED' | 'EXPIRED'

// ─── Platform DTOs ───

export interface GymSummaryDto {
  id: number
  name: string
  slug: string
  status: string
  membersCount: number
  ownerName: string | null
  ownerEmail: string | null
  createdAt: string
}

export interface UserSummaryDto {
  id: number
  fullName: string
  email: string
}

export interface GymStatsDto {
  activeMembers: number
  coaches: number
  templates: number
}

export interface GymDetailDto {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  routineCycle: string
  status: string
  owner: UserSummaryDto | null
  stats: GymStatsDto
  createdAt: string
}

export interface SuperAdminDto {
  id: number
  fullName: string
  email: string
}

export interface UserSearchDto {
  id: number
  fullName: string
  email: string
}

export interface UserDto {
  id: number
  fullName: string
  email: string
  avatarUrl: string | null
  platformRole: string
}
