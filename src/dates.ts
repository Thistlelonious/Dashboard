export function localDate(time: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`
}
