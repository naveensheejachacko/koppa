import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { QuestionType, XpAction } from "../src/domain/enums.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.xpRule.upsert({
    where: { action: XpAction.NEW_CAFE_VISIT },
    update: { xp: 20, isActive: true },
    create: { action: XpAction.NEW_CAFE_VISIT, xp: 20 },
  });
  await prisma.xpRule.upsert({
    where: { action: XpAction.REVISIT },
    update: { xp: 10, isActive: true },
    create: { action: XpAction.REVISIT, xp: 10 },
  });
  await prisma.xpRule.upsert({
    where: { action: XpAction.CAFE_SUGGESTION },
    update: { xp: 20, isActive: true },
    create: { action: XpAction.CAFE_SUGGESTION, xp: 20 },
  });

  const categories = [
    ["work", "Work"],
    ["study", "Study"],
    ["date", "Date"],
    ["pet-friendly", "Pet Friendly"],
    ["dessert", "Dessert"],
    ["friends", "Friends / Hangout"],
    ["family", "Family"],
    ["breakfast", "Breakfast"],
    ["brunch", "Brunch"],
    ["photography", "Photography"],
    ["quiet", "Quiet"],
    ["outdoor", "Outdoor"],
    ["specialty-coffee", "Specialty Coffee"],
    ["late-night", "Late Night"],
  ] as const;

  for (const [index, [slug, name]] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, sortOrder: index },
      create: { slug, name, sortOrder: index },
    });
  }

  await seedOnboarding();
  await seedAdmin();
}

async function seedOnboarding(): Promise<void> {
  const categoryOptions = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  const questions = [
    {
      key: "categories",
      prompt: "What kind of cafes do you look for?",
      type: QuestionType.MULTI,
      options: categoryOptions.map((c) => ({ label: c.name, value: c.slug })),
    },
    {
      key: "features",
      prompt: "Which features matter most?",
      type: QuestionType.MULTI,
      options: [
        { label: "WiFi", value: "wifi" },
        { label: "Power outlets", value: "power_outlets" },
        { label: "Quiet environment", value: "quiet" },
        { label: "Parking", value: "parking" },
        { label: "Outdoor seating", value: "outdoor" },
        { label: "Pet friendly", value: "pet_friendly" },
        { label: "Good desserts", value: "desserts" },
        { label: "Good coffee", value: "coffee" },
        { label: "Affordable", value: "affordable" },
        { label: "Comfortable seating", value: "seating" },
      ],
    },
    {
      key: "price",
      prompt: "Preferred price range?",
      type: QuestionType.SINGLE,
      options: [
        { label: "Budget", value: "BUDGET" },
        { label: "Moderate", value: "MODERATE" },
        { label: "Premium", value: "PREMIUM" },
      ],
    },
    {
      key: "distance_km",
      prompt: "How far will you travel for a cafe (km)?",
      type: QuestionType.NUMBER,
      options: [],
    },
  ];

  for (const [index, question] of questions.entries()) {
    const row = await prisma.onboardingQuestion.upsert({
      where: { key: question.key },
      update: { prompt: question.prompt, type: question.type, sortOrder: index, isActive: true },
      create: {
        key: question.key,
        prompt: question.prompt,
        type: question.type,
        sortOrder: index,
      },
    });
    await prisma.onboardingOption.deleteMany({ where: { questionId: row.id } });
    if (question.options.length > 0) {
      await prisma.onboardingOption.createMany({
        data: question.options.map((opt, sortOrder) => ({
          questionId: row.id,
          label: opt.label,
          value: opt.value,
          sortOrder,
        })),
      });
    }
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME ?? "koppaadmin";
  if (!email || !password) {
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }
  await prisma.user.create({
    data: {
      email,
      username,
      name: "Koppa Admin",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
