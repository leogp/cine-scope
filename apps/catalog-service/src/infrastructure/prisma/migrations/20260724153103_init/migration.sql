-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "overview" TEXT,
    "release_date" DATE,
    "duration" INTEGER,
    "original_language" CHAR(2) NOT NULL,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "overview" TEXT,
    "first_air_date" DATE,
    "last_air_date" DATE,
    "original_language" CHAR(2) NOT NULL,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "biography" TEXT,
    "birth_date" DATE,
    "profile_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo_path" TEXT,
    "country_code" CHAR(2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_genres" (
    "movie_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,

    CONSTRAINT "movie_genres_pkey" PRIMARY KEY ("movie_id","genre_id")
);

-- CreateTable
CREATE TABLE "movie_cast" (
    "movie_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,

    CONSTRAINT "movie_cast_pkey" PRIMARY KEY ("movie_id","person_id")
);

-- CreateTable
CREATE TABLE "movie_directors" (
    "movie_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,

    CONSTRAINT "movie_directors_pkey" PRIMARY KEY ("movie_id","person_id")
);

-- CreateTable
CREATE TABLE "movie_production_companies" (
    "movie_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "movie_production_companies_pkey" PRIMARY KEY ("movie_id","company_id")
);

-- CreateTable
CREATE TABLE "series_genres" (
    "series_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,

    CONSTRAINT "series_genres_pkey" PRIMARY KEY ("series_id","genre_id")
);

-- CreateTable
CREATE TABLE "series_cast" (
    "series_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,

    CONSTRAINT "series_cast_pkey" PRIMARY KEY ("series_id","person_id")
);

-- CreateTable
CREATE TABLE "series_directors" (
    "series_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,

    CONSTRAINT "series_directors_pkey" PRIMARY KEY ("series_id","person_id")
);

-- CreateTable
CREATE TABLE "series_production_companies" (
    "series_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "series_production_companies_pkey" PRIMARY KEY ("series_id","company_id")
);

-- CreateIndex
CREATE INDEX "movies_title_idx" ON "movies"("title");

-- CreateIndex
CREATE INDEX "series_title_idx" ON "series"("title");

-- CreateIndex
CREATE INDEX "people_name_idx" ON "people"("name");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE INDEX "movie_genres_genre_id_idx" ON "movie_genres"("genre_id");

-- CreateIndex
CREATE INDEX "movie_cast_person_id_idx" ON "movie_cast"("person_id");

-- CreateIndex
CREATE INDEX "movie_directors_person_id_idx" ON "movie_directors"("person_id");

-- CreateIndex
CREATE INDEX "movie_production_companies_company_id_idx" ON "movie_production_companies"("company_id");

-- CreateIndex
CREATE INDEX "series_genres_genre_id_idx" ON "series_genres"("genre_id");

-- CreateIndex
CREATE INDEX "series_cast_person_id_idx" ON "series_cast"("person_id");

-- CreateIndex
CREATE INDEX "series_directors_person_id_idx" ON "series_directors"("person_id");

-- CreateIndex
CREATE INDEX "series_production_companies_company_id_idx" ON "series_production_companies"("company_id");

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_cast" ADD CONSTRAINT "movie_cast_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_cast" ADD CONSTRAINT "movie_cast_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_directors" ADD CONSTRAINT "movie_directors_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_directors" ADD CONSTRAINT "movie_directors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_production_companies" ADD CONSTRAINT "movie_production_companies_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_production_companies" ADD CONSTRAINT "movie_production_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_cast" ADD CONSTRAINT "series_cast_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_cast" ADD CONSTRAINT "series_cast_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_directors" ADD CONSTRAINT "series_directors_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_directors" ADD CONSTRAINT "series_directors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_production_companies" ADD CONSTRAINT "series_production_companies_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_production_companies" ADD CONSTRAINT "series_production_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
