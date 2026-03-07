#!/usr/bin/env tsx

import { hashAdminPassword } from '../lib/admin-auth'

const password = process.argv[2]

if (!password) {
  console.error('Usage: pnpm admin:hash-password "<password>"')
  process.exit(1)
}

console.log(hashAdminPassword(password))
