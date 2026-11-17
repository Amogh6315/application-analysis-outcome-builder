import type { FinderRow, SmartContextRow } from './types'

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const objectEntries = (value: unknown): [string, unknown][] =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.entries(value as Record<string, unknown>)
    : []

/**
 * Starter parser: walks the JSON tree and looks for rule-like objects.
 * Once real SC/Finder samples are provided, replace this heuristic with schema-specific
 * mappings so no configuration fields or rule semantics are lost.
 */
function collectRuleObjects(root: unknown): { path: string[]; value: Record<string, unknown> }[] {
  const found: { path: string[]; value: Record<string, unknown> }[] = []
  const visit = (node: unknown, path: string[]) => {
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, [...path, String(index)]))
      return
    }
    const entries = objectEntries(node)
    if (!entries.length) return
    const keys = entries.map(([key]) => key.toLowerCase())
    const looksLikeRule = keys.some((key) =>
      ['selector', 'op1', 'operator', 'attribute', 'condition', 'identification', 'type'].includes(key),
    )
    if (looksLikeRule) found.push({ path, value: node as Record<string, unknown> })
    entries.forEach(([key, child]) => visit(child, [...path, key]))
  }
  visit(root, [])
  return found
}

function nearestSection(path: string[]): string {
  const candidates = path.filter((part) => !/^\d+$/.test(part))
  const skip = new Set(['rule_config_is', 'naming_rule_config_is', 'app_identifier_rules', 'include_name_for_page'])
  return [...candidates].reverse().find((part) => !skip.has(part.toLowerCase())) ?? 'Unclassified'
}

function readFirst(obj: Record<string, unknown>, keys: string[]): string {
  const entries = Object.entries(obj)
  const match = entries.find(([key]) => keys.includes(key.toLowerCase()))
  return match ? asText(match[1]) : ''
}

export function parseSmartContext(jsonText: string): SmartContextRow[] {
  const parsed: unknown = JSON.parse(jsonText)
  return collectRuleObjects(parsed).map(({ path, value }, index) => ({
    id: `sc-${index}`,
    section: nearestSection(path),
    scope: readFirst(value, ['scope', 'section', 'name']) || nearestSection(path),
    identification: readFirst(value, ['identification', 'operator', 'type', 'op1']),
    attribute: readFirst(value, ['attribute', 'selector', 'op1']),
    raw: value,
  }))
}

const splitFinderSelectors = (value: string): string[] => {
  const selectors: string[] = []
  let current = ''
  let squareDepth = 0
  let roundDepth = 0
  let quote = ''
  let escaped = false

  for (const char of value) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      current += char
      escaped = true
      continue
    }

    if (quote) {
      current += char
      if (char === quote) quote = ''
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }

    if (char === '[') squareDepth++
    if (char === ']') squareDepth = Math.max(0, squareDepth - 1)
    if (char === '(') roundDepth++
    if (char === ')') roundDepth = Math.max(0, roundDepth - 1)

    if (char === ',' && squareDepth === 0 && roundDepth === 0) {
      if (current.trim()) selectors.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) selectors.push(current.trim())

  return selectors
}

const formatFinderCondition = (value: unknown): string => {
  const conditionLabels: Record<string, string> = {
    '!a': 'Trust when value is not alphanumeric',
    g: 'Good',
  }

  const rawValue = asText(value).trim()

  return conditionLabels[rawValue] || rawValue
}

export function parseFinder(jsonText: string): FinderRow[] {
  const parsed: unknown = JSON.parse(jsonText)

  const sections = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as Record<string, unknown>).rules)
      ? (parsed as Record<string, unknown>).rules as unknown[]
      : []

  return sections.map((section, index) => {
    const rules = collectRuleObjects(section).map(({ value }) => value)

    const hierarchyRules = rules.filter(
      (rule) => rule.type === 'element_hierarchy'
    )

    const identifierRules = rules.filter(
      (rule) => rule.type === 'element_identifier'
    )

    const scopeSelectors = [
      ...hierarchyRules.flatMap((rule) =>
        splitFinderSelectors(asText(rule.op1))
      ),
      ...identifierRules.flatMap((rule) =>
        splitFinderSelectors(asText(rule.op1))
      ),
    ]

    const uniqueScopeSelectors = [...new Set(scopeSelectors)]

    const scope = uniqueScopeSelectors.length
      ? uniqueScopeSelectors.map((selector) => `• ${selector}`).join('\n')
      : 'Fallback'

    const attribute = identifierRules
      .map((rule) => asText(rule.op2).trim())
      .filter(Boolean)
      .join(', ')

    const condition = identifierRules
      .map((rule) => formatFinderCondition(rule.trustable))
      .filter(Boolean)

    return {
      id: `finder-${index}`,
      scope,
      attribute,
      condition: [...new Set(condition)].join(', '),
      raw: section,
    }
  })
}
