import { describe, expect, it } from 'vitest'

import { resolvePageTitle } from './navigation'

describe('resolvePageTitle', () => {
  it('distinguishes /odc/programmes from /odc/programmes?vue=formation', () => {
    expect(resolvePageTitle('/odc/programmes')).toBe('Candidatures ODC')
    expect(resolvePageTitle('/odc/programmes', '?vue=formation')).toBe('Formation')
  })

  it('treats any other query string on /odc/programmes as the appel/candidatures view', () => {
    expect(resolvePageTitle('/odc/programmes', '')).toBe('Candidatures ODC')
    expect(resolvePageTitle('/odc/programmes', '?vue=autre-chose')).toBe('Candidatures ODC')
  })

  it('applies the same distinction to the /odc/candidatures alias', () => {
    expect(resolvePageTitle('/odc/candidatures')).toBe('Candidatures ODC')
    expect(resolvePageTitle('/odc/candidatures', '?vue=formation')).toBe('Formation')
  })

  it('still resolves an unrelated route to its own label, unaffected by the ODC special-case', () => {
    expect(resolvePageTitle('/execution')).toBe('Actions')
    expect(resolvePageTitle('/ops/automations/run-1')).toBe('Automatisations')
  })

  it('returns undefined for a route with no known title', () => {
    expect(resolvePageTitle('/unknown-route')).toBeUndefined()
  })
})
