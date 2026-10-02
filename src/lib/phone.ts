// Телефон хранится только цифрами в международном формате: 79161234567

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }
  else if (digits.length === 10 && digits.startsWith('9')) {
    digits = `7${digits}`
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

// +7 ••• •••-45-67
export function maskPhone(phone: string): string {
  return `+${phone.slice(0, phone.length - 10)} ••• •••-${phone.slice(-4, -2)}-${phone.slice(-2)}`
}
