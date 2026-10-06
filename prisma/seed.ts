import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { env } from "../src/config/env.js";
import { BCRYPT_COST } from "../src/modules/auth/password.js";

const prisma = new PrismaClient();

const demoUser = {
  name: "Demo User",
  email: "demo@example.com",
};

const movies = [
  {
    title: "The Silent Horizon",
    overview: "A lone astronaut drifts toward an uncharted signal at the edge of the solar system.",
    releaseYear: 2019,
    genres: ["Sci-Fi", "Drama"],
    posterUrl: "https://picsum.photos/seed/silent-horizon/400/600",
  },
  {
    title: "Neon Alley",
    overview: "A detective chases a hacker through the rain-soaked streets of a cyberpunk city.",
    releaseYear: 2021,
    genres: ["Action", "Thriller", "Sci-Fi"],
    posterUrl: "https://picsum.photos/seed/neon-alley/400/600",
  },
  {
    title: "Autumn Letters",
    overview:
      "Two estranged siblings reconnect while cleaning out their late father's countryside home.",
    releaseYear: 2017,
    genres: ["Drama", "Romance"],
    posterUrl: "https://picsum.photos/seed/autumn-letters/400/600",
  },
  {
    title: "The Last Bakery",
    overview: "A struggling baker in a small town must save her shop from closing before winter.",
    releaseYear: 2020,
    genres: ["Comedy", "Drama"],
    posterUrl: "https://picsum.photos/seed/last-bakery/400/600",
  },
  {
    title: "Iron Tide",
    overview: "A crew of salvagers uncover a sunken warship hiding a decades-old secret.",
    releaseYear: 2022,
    genres: ["Adventure", "Action"],
    posterUrl: "https://picsum.photos/seed/iron-tide/400/600",
  },
  {
    title: "Whispers in the Attic",
    overview:
      "A family moves into an old house where the previous owner's presence never truly left.",
    releaseYear: 2018,
    genres: ["Horror", "Mystery"],
    posterUrl: "https://picsum.photos/seed/whispers-attic/400/600",
  },
  {
    title: "Championship Summer",
    overview: "An underdog high school basketball team fights for a shot at the state title.",
    releaseYear: 2016,
    genres: ["Sports", "Drama"],
    posterUrl: "https://picsum.photos/seed/championship-summer/400/600",
  },
  {
    title: "The Cartographer's Daughter",
    overview:
      "In a kingdom on the brink of war, a mapmaker's daughter discovers a path that could end it.",
    releaseYear: 2023,
    genres: ["Fantasy", "Adventure"],
    posterUrl: "https://picsum.photos/seed/cartographers-daughter/400/600",
  },
  {
    title: "Static",
    overview:
      "A radio host begins receiving broadcasts from a version of her city that shouldn't exist.",
    releaseYear: 2020,
    genres: ["Mystery", "Sci-Fi", "Thriller"],
    posterUrl: "https://picsum.photos/seed/static/400/600",
  },
  {
    title: "Table for Two",
    overview:
      "Two rival food critics are forced to co-write a review, and fall for each other along the way.",
    releaseYear: 2015,
    genres: ["Comedy", "Romance"],
    posterUrl: "https://picsum.photos/seed/table-for-two/400/600",
  },
  {
    title: "Borderlines",
    overview: "A journalist embedded with refugees documents a crossing that changes her forever.",
    releaseYear: 2019,
    genres: ["Drama", "War"],
    posterUrl: "https://picsum.photos/seed/borderlines/400/600",
  },
  {
    title: "The Heist at Midnight",
    overview: "A retired thief is pulled back for one last job that could clear her family's debt.",
    releaseYear: 2021,
    genres: ["Crime", "Action", "Thriller"],
    posterUrl: "https://picsum.photos/seed/heist-midnight/400/600",
  },
  {
    title: "Paper Planes",
    overview:
      "A young boy builds a paper airplane he believes can carry messages to his late mother.",
    releaseYear: 2014,
    genres: ["Family", "Drama"],
    posterUrl: "https://picsum.photos/seed/paper-planes/400/600",
  },
  {
    title: "Deep Frequency",
    overview:
      "Marine biologists studying whale song intercept a pattern that isn't from any known species.",
    releaseYear: 2022,
    genres: ["Sci-Fi", "Mystery"],
    posterUrl: "https://picsum.photos/seed/deep-frequency/400/600",
  },
  {
    title: "Roadside Kingdom",
    overview:
      "Three friends on a cross-country road trip stumble into an abandoned theme park with a history.",
    releaseYear: 2018,
    genres: ["Adventure", "Comedy"],
    posterUrl: "https://picsum.photos/seed/roadside-kingdom/400/600",
  },
];

const main = async () => {
  if (!env.SEED_DEMO_PASSWORD) {
    throw new Error("SEED_DEMO_PASSWORD is required to seed the demo user");
  }

  console.log("seeding demo user...");
  const password = await bcrypt.hash(env.SEED_DEMO_PASSWORD, BCRYPT_COST);
  const { id: creatorId } = await prisma.user.upsert({
    where: { email: demoUser.email },
    update: { name: demoUser.name, password },
    create: { ...demoUser, password },
    select: { id: true },
  });

  // 1. 先建 Genre：收集所有不重複的名稱，upsert 讓重跑 seed 時不會撞到 @unique
  console.log("seeding genres...");
  const genreNames = [...new Set(movies.flatMap((movie) => movie.genres))];

  for (const name of genreNames) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. 再建 Movie，順便透過 movieGenres 寫入中間表
  console.log("seeding movies...");

  for (const { genres, ...movie } of movies) {
    const movieGenres = genres.map((name) => ({
      genre: { connect: { name } },
    }));

    const existingMovie = await prisma.movie.findFirst({
      where: { title: movie.title, createdBy: creatorId },
      select: { id: true },
    });

    if (existingMovie) {
      await prisma.movie.update({
        where: { id: existingMovie.id },
        data: {
          ...movie,
          movieGenres: { deleteMany: {}, create: movieGenres },
        },
      });
      console.log(`Updated movie: ${movie.title}`);
      continue;
    }

    await prisma.movie.create({
      data: {
        ...movie,
        createdBy: creatorId,
        movieGenres: { create: movieGenres },
      },
    });
    console.log(`Created movie: ${movie.title}`);
  }

  console.log("seeding completed");
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
