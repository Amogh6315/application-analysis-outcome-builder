export type SmartContextRow = {
  id: string
  section: string
  scope: string
  identification: string
  attribute: string
  raw: unknown
}

export type FinderRow = {
  id: string
  scope: string
  attribute: string
  condition: string
  raw: unknown
}

export type ApplicationForm = {
  customerName: string
  applicationName: string
  entName: string
  version: string
  analysisStartDate: string
  analysisEndDate: string
  ootb: string
  iframes: string
  languages: string
  development: string
  personas: string
  browsers: string
  smartContextStatus: string
  elementDetectionStatus: string
  uniqueUserStatus: string
  roleSegmentationStatus: string
  observations: string
  recommendations: string
}
