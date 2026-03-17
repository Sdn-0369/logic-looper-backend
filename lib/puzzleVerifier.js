import crypto from "crypto"

export function generateDailySeed(date) {
  const SECRET = "logic_looper_secret"

  return crypto
    .createHash("sha256")
    .update(date + SECRET)
    .digest("hex")
}

export function verifyScore(score) {
  if (score < 0 || score > 100) return false
  return true
}

export function verifyTime(timeTaken) {
  if (timeTaken < 1) return false
  if (timeTaken > 36000) return false
  return true
}