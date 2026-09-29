import { Figtree, Fraunces } from 'next/font/google'

// To swap a font: change the import and the function name below.
// Browse fonts at fonts.google.com (spaces become underscores: "DM Sans" -> DM_Sans).
export const bodyFont = Figtree({ subsets: ['latin'], variable: '--font-body' })
export const headingFont = Fraunces({ subsets: ['latin'], variable: '--font-heading' })