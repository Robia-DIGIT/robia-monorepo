import { describe, expect, it, vi } from 'vitest'
import {
  buildCronExpression,
  describeCronHuman,
  detectBrowserTimeZone,
  ensureTimeZoneOption,
  formatInstantInTimeZone,
  formatNextRunAt,
  isFiveFieldCron,
  listIanaTimeZones,
  parseCronPreset,
} from './cron-schedule'

describe('buildCronExpression', () => {
  it('generates a daily expression: minute hour * * *', () => {
    expect(buildCronExpression('daily', { hour: 9, minute: 30 })).toBe('30 9 * * *')
  })

  it('generates a weekly expression: minute hour * * weekday', () => {
    expect(buildCronExpression('weekly', { hour: 6, minute: 0, weekday: 1 })).toBe('0 6 * * 1')
  })

  it('generates a monthly expression: minute hour dayOfMonth * *', () => {
    expect(buildCronExpression('monthly', { hour: 18, minute: 15, dayOfMonth: 28 })).toBe('15 18 28 * *')
  })

  it('never generates a 6-field or shorthand expression', () => {
    const daily = buildCronExpression('daily', { hour: 0, minute: 0 })
    const weekly = buildCronExpression('weekly', { hour: 0, minute: 0, weekday: 0 })
    const monthly = buildCronExpression('monthly', { hour: 0, minute: 0, dayOfMonth: 1 })
    for (const expr of [daily, weekly, monthly]) {
      expect(expr.split(/\s+/)).toHaveLength(5)
      expect(expr.startsWith('@')).toBe(false)
    }
  })
})

describe('parseCronPreset', () => {
  it('recognizes a daily preset', () => {
    expect(parseCronPreset('30 9 * * *')).toEqual({ frequency: 'daily', hour: 9, minute: 30 })
  })

  it('recognizes a weekly preset', () => {
    expect(parseCronPreset('0 6 * * 1')).toEqual({ frequency: 'weekly', hour: 6, minute: 0, weekday: 1 })
  })

  it('recognizes a monthly preset', () => {
    expect(parseCronPreset('15 18 28 * *')).toEqual({
      frequency: 'monthly',
      hour: 18,
      minute: 15,
      dayOfMonth: 28,
    })
  })

  it('falls back to null (advanced) for an expression with a range', () => {
    expect(parseCronPreset('0 9 * * 1-5')).toBeNull()
  })

  it('falls back to null (advanced) for an expression with a list', () => {
    expect(parseCronPreset('0 9 1,15 * *')).toBeNull()
  })

  it('falls back to null (advanced) for an expression with a step', () => {
    expect(parseCronPreset('*/15 9 * * *')).toBeNull()
  })

  it('falls back to null (advanced) for a day-of-month above 28', () => {
    expect(parseCronPreset('0 9 30 * *')).toBeNull()
  })

  it('falls back to null (advanced) for a non-5-field expression', () => {
    expect(parseCronPreset('0 9 * * * *')).toBeNull()
  })

  it('falls back to null (advanced) for an out-of-range hour', () => {
    expect(parseCronPreset('0 25 * * *')).toBeNull()
  })
})

describe('isFiveFieldCron', () => {
  it('accepts exactly 5 space-separated fields', () => {
    expect(isFiveFieldCron('0 9 * * 1')).toBe(true)
  })

  it('rejects a 6-field expression', () => {
    expect(isFiveFieldCron('0 0 9 * * 1')).toBe(false)
  })

  it('rejects an @daily-style shorthand', () => {
    expect(isFiveFieldCron('@daily')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isFiveFieldCron('   ')).toBe(false)
  })
})

describe('describeCronHuman', () => {
  it('describes a daily preset in French', () => {
    expect(describeCronHuman('30 9 * * *')).toBe('Tous les jours à 09:30')
  })

  it('describes a weekly preset in French', () => {
    expect(describeCronHuman('0 6 * * 1')).toBe('Chaque lundi à 06:00')
  })

  it('describes a monthly preset in French', () => {
    expect(describeCronHuman('0 8 28 * *')).toBe('Le 28 de chaque mois à 08:00')
  })

  it('describes an unrecognized expression as advanced, verbatim', () => {
    expect(describeCronHuman('0 9 * * 1-5')).toBe('Expression cron avancée : 0 9 * * 1-5')
  })

  it('describes a null cron expression as undefined scheduling', () => {
    expect(describeCronHuman(null)).toBe('Planification non définie')
  })
})

describe('detectBrowserTimeZone', () => {
  it('returns the environment-resolved IANA timezone', () => {
    const zone = detectBrowserTimeZone()
    expect(typeof zone).toBe('string')
    expect(zone.length).toBeGreaterThan(0)
  })

  it('falls back to UTC if Intl throws', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(detectBrowserTimeZone()).toBe('UTC')
    spy.mockRestore()
  })
})

describe('listIanaTimeZones', () => {
  it('returns a non-empty list including common zones', () => {
    const zones = listIanaTimeZones()
    expect(zones.length).toBeGreaterThan(0)
    expect(zones).toContain('UTC')
  })
})

describe('ensureTimeZoneOption', () => {
  it('inserts a browser-detected timezone that is absent from the base list', () => {
    const zones = ['UTC', 'Europe/Paris']
    expect(ensureTimeZoneOption(zones, 'Not/InTheBaseList')).toEqual([
      'Not/InTheBaseList',
      'UTC',
      'Europe/Paris',
    ])
  })

  it('inserts an existing automation timezone that is absent from the local list', () => {
    const zones = ['UTC', 'Europe/Paris']
    expect(ensureTimeZoneOption(zones, 'Some/OtherBrowserZone')).toContain('Some/OtherBrowserZone')
  })

  it('never duplicates a timezone that is already present', () => {
    const zones = ['UTC', 'Europe/Paris']
    expect(ensureTimeZoneOption(zones, 'Europe/Paris')).toEqual(['UTC', 'Europe/Paris'])
  })

  it('returns the list unchanged when current is null/undefined', () => {
    const zones = ['UTC', 'Europe/Paris']
    expect(ensureTimeZoneOption(zones, null)).toEqual(zones)
    expect(ensureTimeZoneOption(zones, undefined)).toEqual(zones)
  })

  it('works with the real static fallback list too', () => {
    const zones = ensureTimeZoneOption(['UTC'], 'Indian/Antananarivo')
    expect(zones).toContain('Indian/Antananarivo')
    expect(zones).toContain('UTC')
    expect(zones.filter((z) => z === 'Indian/Antananarivo')).toHaveLength(1)
  })
})

describe('formatInstantInTimeZone / formatNextRunAt', () => {
  it('formats an instant in French, in the given timezone, with the timezone shown', () => {
    const formatted = formatInstantInTimeZone('2026-09-21T06:00:00.000Z', 'UTC')
    expect(formatted).toBe('21/09/2026 06:00 (UTC)')
  })

  it('never hides which timezone a formatted date is in', () => {
    const paris = formatInstantInTimeZone('2026-09-21T06:00:00.000Z', 'Europe/Paris')
    expect(paris).toContain('(Europe/Paris)')
  })

  it('falls back to UTC, clearly labelled, for a timezone this runtime does not recognize', () => {
    const result = formatInstantInTimeZone('2026-09-21T06:00:00.000Z', 'Not/AZone')
    expect(result).toContain('06:00 UTC')
    expect(result).toContain('Not/AZone')
    expect(result).toContain('non reconnu')
    // Never present the UTC fallback as if it were the originally
    // requested (unrecognized) zone.
    expect(result).not.toBe('21/09/2026 06:00 (Not/AZone)')
  })

  it('never crashes on an invalid ISO instant', () => {
    expect(formatInstantInTimeZone('not-a-date', 'UTC')).toBe('Date invalide')
    expect(formatInstantInTimeZone('not-a-date', 'Not/AZone')).toBe('Date invalide')
  })

  it('shows "Non planifiée" for a null nextRunAt', () => {
    expect(formatNextRunAt(null, 'Europe/Paris')).toBe('Non planifiée')
  })

  it('formats a real nextRunAt in the automation\'s own timezone', () => {
    expect(formatNextRunAt('2026-09-21T06:00:00.000Z', 'Indian/Antananarivo')).toBe(
      '21/09/2026 09:00 (Indian/Antananarivo)',
    )
  })

  it('defaults to UTC when timezone is null', () => {
    expect(formatNextRunAt('2026-09-21T06:00:00.000Z', null)).toBe('21/09/2026 06:00 (UTC)')
  })

  it('never crashes formatNextRunAt on an unrecognized timezone', () => {
    const result = formatNextRunAt('2026-09-21T06:00:00.000Z', 'Not/AZone')
    expect(result).toContain('non reconnu')
  })
})
