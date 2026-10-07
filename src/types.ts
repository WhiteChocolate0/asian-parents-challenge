export type Dimension = 'money' | 'safety' | 'face' | 'tradition'
export type OptionKey = 'A' | 'B' | 'C'

export type Scores = Record<Dimension, number>
export interface QuizOption { key: OptionKey; text: string; scores: Scores }
export interface Question { id: string; stage: 1 | 2 | 3; text: string; options: QuizOption[] }
export interface ResultProfile {
  key: Dimension
  name: string
  skill: string
  concern: string
  strategy: string
  quote: string
  personality?: string
  communicationTip?: string
  doList?: string[]
  avoidList?: string[]
}
