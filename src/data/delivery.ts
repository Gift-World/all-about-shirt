// DUMMY logistics for the pitch: estates, ride times, riders. Shop 305 sits in the CBD.

export type Estate = { name: string; mins: number; x: number; y: number }

/** Map space is 1000 x 700. The CBD (Platinum Plaza) is at 560, 400. */
export const SHOP = { name: 'Platinum Plaza, Shop 305', x: 560, y: 400 }

export const ESTATES: Estate[] = [
  { name: 'Upper Hill', mins: 20, x: 500, y: 450 },
  { name: 'Westlands', mins: 25, x: 470, y: 270 },
  { name: 'Parklands', mins: 25, x: 560, y: 260 },
  { name: 'South B', mins: 25, x: 680, y: 480 },
  { name: 'Kilimani', mins: 30, x: 410, y: 420 },
  { name: 'Kileleshwa', mins: 30, x: 380, y: 340 },
  { name: 'Lavington', mins: 35, x: 300, y: 360 },
  { name: 'Lang’ata', mins: 40, x: 470, y: 590 },
  { name: 'Runda', mins: 45, x: 480, y: 110 },
  { name: 'Kasarani', mins: 45, x: 800, y: 170 },
  { name: 'Karen', mins: 50, x: 210, y: 590 },
  { name: 'Syokimau', mins: 55, x: 880, y: 600 },
]

export const findEstate = (s?: string | null) => {
  if (!s) return undefined
  const t = s.toLowerCase().replace(/[’']/g, '')
  return ESTATES.find((e) => t.includes(e.name.toLowerCase().replace(/[’']/g, '').split(' ')[0]))
}

const CUTOFF_HOUR = 14 // 2pm same day cut off
const fmtTime = (d: Date) => d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Nairobi' })

/** Uber style promise: when it arrives if you order now. */
export function eta(estate: Estate, now = new Date()) {
  const nairobiHour = Number(now.toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Africa/Nairobi' }))
  const nairobiMin = Number(now.toLocaleString('en-GB', { minute: '2-digit', timeZone: 'Africa/Nairobi' }))
  const sameDay = nairobiHour < CUTOFF_HOUR
  const packing = 60
  if (sameDay) {
    const arrive = new Date(now.getTime() + (packing + estate.mins) * 60000)
    const left = (CUTOFF_HOUR - nairobiHour) * 60 - nairobiMin
    return {
      day: 'today',
      label: `today by ${fmtTime(arrive)}`,
      cutoff: `${Math.floor(left / 60)}h ${String(left % 60).padStart(2, '0')}m`,
    }
  }
  // next morning run leaves at 10am
  const tomorrow = new Date(now.getTime() + 86400000)
  const ten = new Date(
    Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 7, 0, 0), // 10:00 EAT
  )
  const arrive = new Date(ten.getTime() + estate.mins * 60000)
  return { day: 'tomorrow', label: `tomorrow by ${fmtTime(arrive)}`, cutoff: null }
}

export const RIDERS = [
  { name: 'Joseph Kamau', rating: 4.96, trips: 1284, plate: 'KMFB 312Q', bike: 'Boxer 150' },
  { name: 'Peter Odhiambo', rating: 4.93, trips: 942, plate: 'KMGD 088T', bike: 'TVS HLX 125' },
  { name: 'Ali Hassan', rating: 4.98, trips: 1730, plate: 'KMEZ 571L', bike: 'Honda Ace' },
]

export const TRY_AT_HOME = {
  id: 'tryhome',
  label: 'Try at home',
  note: 'Rider waits 15 minutes. Pay only for what you keep.',
  fee: 450,
}
