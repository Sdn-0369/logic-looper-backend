import { prisma } from "../lib/prisma.js"
import { verifyScore, verifyTime } from "../lib/puzzleVerifier.js"

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId, entries } = req.body

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: "Invalid payload" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(401).json({ error: "User does not exist" })
    }

    for (const entry of entries) {
      if (!entry.date) continue

      const score = Number(entry.score)
      const timeTaken = Number(entry.timeTaken)
      const hintsUsed = Number(entry.hintsUsed || 0)

      if (Number.isNaN(score) || Number.isNaN(timeTaken)) continue
      if (!verifyScore(score)) continue
      if (!verifyTime(timeTaken)) continue

      const date = new Date(entry.date)

      await prisma.dailyScore.upsert({
        where: {
          userId_date: {
            userId,
            date
          }
        },
        update: {
          score,
          timeTaken,
          hintsUsed
        },
        create: {
          userId,
          date,
          score,
          timeTaken,
          hintsUsed
        }
      })
    }

    return res.json({ success: true })

  } catch (error) {
    console.error("Database error:", error)
    return res.status(500).json({
      error: "Database error"
    })
  }
}