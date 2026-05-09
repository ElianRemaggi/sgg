import type { UserDto, MembershipDto } from '@/lib/api/types'

export const memberUser: UserDto = {
  id: 1,
  fullName: 'Ana Pérez',
  email: 'member@test.com',
  avatarUrl: null,
  platformRole: 'USER',
}

export const coachUser: UserDto = {
  id: 2,
  fullName: 'Carlos Coach',
  email: 'coach@test.com',
  avatarUrl: null,
  platformRole: 'USER',
}

export const memberMembership: MembershipDto = {
  membershipId: 10,
  gymId: 1,
  gymName: 'Test Gym',
  gymSlug: 'test-gym',
  gymLogoUrl: null,
  role: 'MEMBER',
  status: 'ACTIVE',
  membershipExpiresAt: null,
}

export const coachMembership: MembershipDto = {
  membershipId: 11,
  gymId: 1,
  gymName: 'Test Gym',
  gymSlug: 'test-gym',
  gymLogoUrl: null,
  role: 'COACH',
  status: 'ACTIVE',
  membershipExpiresAt: null,
}
