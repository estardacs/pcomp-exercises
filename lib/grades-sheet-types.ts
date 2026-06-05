export interface GradesSheetData {
  sectionRow: string[]
  headerRow: string[]
  studentRows: Array<{ rowIndex: number; cells: string[] }>
}
