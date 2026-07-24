export interface GetCompanyResponse {
  id: string
  name: string
  logoPath: string | null
  countryCode: string | null
  createdAt: Date
  updatedAt: Date
}
