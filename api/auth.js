import { prisma } from "../lib/prisma.js"
import verifyGoogleToken from "../lib/googleAuth.js"

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
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: "Token missing" })
    }

    const payload = await verifyGoogleToken(token)

    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid Google token" })
    }

    const email = payload.email

    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email }
      })
    }

    return res.json({
      userId: user.id,
      email: user.email
    })

  } catch (error) {
    console.error("OAuth error:", error)
    return res.status(401).json({
      error: "Google authentication failed"
    })
  }
}