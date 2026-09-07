import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@jmphoa.org";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const password = "ChangeMe123!";
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name: "Site Admin",
        email: adminEmail,
        passwordHash,
        status: "APPROVED",
        roles: { create: { role: "ADMIN" } },
        profile: { create: { showInDirectory: false } },
      },
    });

    const credsPath = path.join(process.cwd(), "SEED_CREDENTIALS.txt");
    writeFileSync(
      credsPath,
      `JMPHOA website - initial admin login\n\nEmail: ${adminEmail}\nPassword: ${password}\n\nLog in at /login and change this password by creating a new admin account, then remove this file.\n`
    );
    console.log(`Created admin user. Credentials written to ${credsPath}`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  const boardTitles = ["President", "Vice President", "Secretary", "Treasurer", "Member at Large"];
  const existingPositions = await prisma.boardPosition.count();
  if (existingPositions === 0) {
    await prisma.boardPosition.createMany({
      data: boardTitles.map((title, i) => ({ title, sortOrder: i })),
    });
    console.log("Seeded board positions.");
  }

  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({
      data: [
        {
          question: "How do I get access to the members-only areas of the site?",
          answer:
            "Click Register in the top right, fill out your info, and submit. A Membership Coordinator will review and approve your request, usually within a few days.",
          sortOrder: 0,
        },
        {
          question: "How do I pay my HOA dues?",
          answer: "Visit Members > Pay Association Fees for our Venmo handle and mailing address.",
          sortOrder: 1,
        },
        {
          question: "How do I join a committee?",
          answer: "Visit Members > Join a Committee and request to join the Architecture or Social committee.",
          sortOrder: 2,
        },
      ],
    });
    console.log("Seeded FAQ.");
  }

  const rootFolderCount = await prisma.folder.count({ where: { parentId: null } });
  if (rootFolderCount === 0) {
    const generalFolders = [
      "HOA Incorporation Document",
      "HOA Bylaws",
      "HOA Covenants and Restrictions Declarations",
    ];
    for (const [i, name] of generalFolders.entries()) {
      await prisma.folder.create({ data: { name, category: "HOA_GENERAL", sortOrder: i, parentId: null } });
    }
    await prisma.folder.create({
      data: { name: "Board Meeting Minutes", category: "BOARD", sortOrder: 0, parentId: null },
    });
    await prisma.folder.create({
      data: { name: "Committee Guidelines & Communications", category: "COMMITTEE_ARCH", sortOrder: 0, parentId: null },
    });
    await prisma.folder.create({
      data: { name: "Committee Guidelines & Communications", category: "COMMITTEE_SOCIAL", sortOrder: 0, parentId: null },
    });
    console.log("Seeded document folders.");
  }

  await prisma.pageContent.upsert({
    where: { key: "home_hero" },
    create: {
      key: "home_hero",
      title: "Welcome to John Mitchell Preserve",
      body: "<p>A single source for community news, events, documents, and neighbor connections for the John Mitchell Preserve Homeowners Association.</p>",
    },
    update: {},
  });

  await prisma.pageContent.upsert({
    where: { key: "home_intro" },
    create: {
      key: "home_intro",
      title: "Sharing Our Community",
      body: "<p>We're excited to welcome you! This site is your single source for community events, amenities, calendars, historical documents, and more. Feel free to reach out through the Contact Us page if you have any questions or need help creating an account.</p>",
    },
    update: {},
  });

  await prisma.pageContent.upsert({
    where: { key: "about_intro" },
    create: {
      key: "about_intro",
      body: "<p>John Mitchell Preserve is a friendly, well-kept community. This page has information about our Board, committees, and how our HOA operates.</p>",
    },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
