export interface CreatePersonRequest {
  name: string
  biography?: string | null
  birthDate?: Date | null
  profilePath?: string | null
}
