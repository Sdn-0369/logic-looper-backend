import { prisma } from "../lib/prisma.js"

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "https://logic-looper-one-psi.vercel.app"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
}

export default async function handler(req, res) {
  // 1. Attach headers
  setCorsHeaders(res);

  // 2. Handle the preflight safety check
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const scores = await prisma.dailyScore.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        score: "desc"
      },
      take: 10,
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    return res.json(scores)

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: "Leaderboard error"
    })
  }
}