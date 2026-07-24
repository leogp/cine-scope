export interface GetPersonResponse {
  id: string
  name: string
  biography: string | null
  birthDate: Date | null
  profilePath: string | null
  createdAt: Date
  updatedAt: Date
}
