import { describe, expect, it } from 'vitest'
import {
  editDistance,
  formatPhone,
  phoneDigits,
  suggestEmail,
  validateEmail,
  validateName,
  validatePhone,
  validateRegistration,
  validateSeats,
} from './validation.js'

describe('validateName', () => {
  it('accepts ordinary names, including non-Latin scripts', () => {
    expect(validateName('Priya Sharma')).toBe('')
    expect(validateName("D'Souza")).toBe('')
    expect(validateName('Anne-Marie K.')).toBe('')
    expect(validateName('প্রিয়া')).toBe('')
  })
  it('rejects empty, numeric or one-letter names', () => {
    expect(validateName('   ')).toMatch(/full name/)
    expect(validateName('R2D2')).toMatch(/letters only/)
    expect(validateName('A')).toMatch(/two letters/)
  })
  it('rejects names over 60 characters', () => {
    expect(validateName('a'.repeat(61))).toMatch(/under 60/)
  })
})

describe('validateEmail', () => {
  it('accepts valid addresses', () => {
    expect(validateEmail('priya@example.com')).toBe('')
    expect(validateEmail('first.last+events@uni.ac.in')).toBe('')
  })
  it('explains what is wrong', () => {
    expect(validateEmail('')).toMatch(/Enter your email/)
    expect(validateEmail('priya example.com')).toMatch(/spaces/)
    expect(validateEmail('priya.example.com')).toMatch(/@/)
    expect(validateEmail('priya@example..com')).toMatch(/two dots/)
    expect(validateEmail('priya@example')).toMatch(/like name@example.com/)
  })
})

describe('suggestEmail', () => {
  it('suggests a fix for common domain typos', () => {
    expect(suggestEmail('priya@gmial.com')).toBe('priya@gmail.com')
    expect(suggestEmail('priya@hotmal.com')).toBe('priya@hotmail.com')
    expect(suggestEmail('priya@yaho.com')).toBe('priya@yahoo.com')
  })
  it('stays quiet for correct or unrelated domains', () => {
    expect(suggestEmail('priya@gmail.com')).toBeNull()
    expect(suggestEmail('priya@kiit.ac.in')).toBeNull()
    expect(suggestEmail('no-at-sign')).toBeNull()
  })
  it('counts adjacent swaps as one edit', () => {
    expect(editDistance('gmial.com', 'gmail.com')).toBe(1)
  })
})

describe('phone numbers', () => {
  it('strips country codes and formatting', () => {
    expect(phoneDigits('+91 98765-43210')).toBe('9876543210')
    expect(phoneDigits('09876543210')).toBe('9876543210')
    expect(phoneDigits('919876543210')).toBe('9876543210')
  })
  it('validates Indian mobile numbers', () => {
    expect(validatePhone('98765 43210')).toBe('')
    expect(validatePhone('+91 7012345678')).toBe('')
    expect(validatePhone('')).toMatch(/Enter your mobile/)
    expect(validatePhone('98765')).toMatch(/5 digits/)
    expect(validatePhone('5876543210')).toMatch(/start with 6, 7, 8 or 9/)
    expect(validatePhone('98765abc10')).toMatch(/digits only/)
    expect(validatePhone('98765432101')).toMatch(/too many/)
  })
  it('formats valid numbers and leaves invalid ones alone', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210')
    expect(formatPhone('12345')).toBe('12345')
  })
})

describe('validateSeats', () => {
  it('limits seats per booking and to what is left', () => {
    expect(validateSeats('2', { seatsLeft: 10 })).toBe('')
    expect(validateSeats('0', { seatsLeft: 10 })).toMatch(/how many/)
    expect(validateSeats('5', { seatsLeft: 10 })).toMatch(/up to 4/)
    expect(validateSeats('3', { seatsLeft: 2 })).toMatch(/Only 2 seats left/)
  })
})

describe('validateRegistration', () => {
  const good = { name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543210', event: 'build-weekend', seats: '1' }
  const open = { event: { slug: 'build-weekend' }, seatsLeft: 20, isPast: false, alreadyRegistered: false }

  it('returns no errors for a valid form', () => {
    expect(validateRegistration(good, open)).toEqual({})
  })
  it('returns only the fields with problems', () => {
    const errors = validateRegistration({ ...good, name: '', phone: '123' }, open)
    expect(Object.keys(errors).sort()).toEqual(['name', 'phone'])
  })
  it('blocks sold-out, past and duplicate registrations', () => {
    expect(validateRegistration(good, { ...open, seatsLeft: 0 }).event).toMatch(/sold out/)
    expect(validateRegistration(good, { ...open, isPast: true }).event).toMatch(/already happened/)
    expect(validateRegistration(good, { ...open, alreadyRegistered: true }).email).toMatch(/already registered/)
  })
  it('asks for an event when none is chosen', () => {
    expect(validateRegistration({ ...good, event: '' }, { ...open, event: null }).event).toMatch(/Choose the event/)
  })
})
