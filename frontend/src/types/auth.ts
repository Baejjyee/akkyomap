export type UserRole = 'USER' | 'ADMIN'

export interface SignupRequest {
  email: string
  password: string
  nickname: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface UserResponse {
  id: number
  email: string
  nickname: string
  role: UserRole
}
