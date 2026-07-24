import { Company } from '../../../domain/entities/company'
import { Genre } from '../../../domain/entities/genre'
import { Person } from '../../../domain/entities/person'

export interface GenreDTO {
  id: string
  name: string
}

export interface PersonDTO {
  id: string
  name: string
  biography: string | null
  birthDate: Date | null
  profilePath: string | null
}

export interface CompanyDTO {
  id: string
  name: string
  logoPath: string | null
  countryCode: string | null
}

// Unwraps the relation entities shared by the Movie and Series read models
// into flat primitive DTOs. Aggregate-specific mappers compose these.
export const toGenreDTO = (genre: Genre): GenreDTO => ({
  id: genre.id,
  name: genre.data.name.value,
})

export const toPersonDTO = (person: Person): PersonDTO => {
  const { name, biography, birthDate, profilePath } = person.data

  return {
    id: person.id,
    name: name.value,
    biography,
    birthDate,
    profilePath,
  }
}

export const toCompanyDTO = (company: Company): CompanyDTO => ({
  id: company.id,
  name: company.data.name.value,
  logoPath: company.data.logoPath,
  countryCode: company.data.countryCode?.value ?? null,
})
