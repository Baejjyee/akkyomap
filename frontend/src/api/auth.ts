import { apiClient } from './client'
import type {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from '../types/auth'

export async function signup(request: SignupRequest): Promise<UserResponse> {
  const response = await apiClient.post<UserResponse>('/auth/signup', request)
  return response.data
}

export async function login(request: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/login', request)
  return response.data
}

export async function fetchMe(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>('/auth/me')
  return response.data
}
