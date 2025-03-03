import { HandLandmark, GestureData } from '../gesture-processor'
import { HandLandmark, GestureData } from '../gesture-processor'

export interface GestureExample {
  id: string
  label: string
  data: GestureData
  metadata: {
    userId: string
    timestamp: number
    lighting?: string
    distance?: number
    quality?: number
  }
}

export interface DatasetStats {
  totalExamples: number
  examplesPerClass: Record<string, number>
  averageQuality: number
  lastUpdated: number
}

export class GestureDataset {
  private examples: GestureExample[] = []
  private stats: DatasetStats = {
    totalExamples: 0,
    examplesPerClass: {},
    averageQuality: 0,
    lastUpdated: Date.now()
  }

  constructor() {
    this.initialize()
  }

  public initialize(): void {
    // In-memory initialization
    console.log('Dataset initialized in memory')
  }

  public addExample(
    label: string,
    data: GestureData,
    userId: string,
    metadata: Partial<GestureExample['metadata']> = {}
  ): void {
    const example: GestureExample = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label,
      data,
      metadata: {
        userId,
        timestamp: Date.now(),
        quality: this.calculateQuality(data),
        ...metadata
      }
    }

    this.examples.push(example)
    this.updateStats()
  }

  private calculateQuality(data: GestureData): number {
    if (data.landmarks.length !== 21) {
      return 0
    }

    let qualityScore = 1.0

    // Check z-depth consistency
    const zValues = data.landmarks.map(l => l.z)
    const zRange = Math.max(...zValues) - Math.min(...zValues)
    if (zRange > 1.0) {
      qualityScore *= 0.8
    }

    // Check for NaN or invalid values
    const hasInvalidValues = data.landmarks.some(l => 
      isNaN(l.x) || isNaN(l.y) || isNaN(l.z) ||
      !isFinite(l.x) || !isFinite(l.y) || !isFinite(l.z)
    )
    if (hasInvalidValues) {
      qualityScore *= 0.5
    }

    return qualityScore
  }

  private updateStats(): void {
    const examplesPerClass: Record<string, number> = {}
    let totalQuality = 0

    for (const example of this.examples) {
      examplesPerClass[example.label] = (examplesPerClass[example.label] || 0) + 1
      totalQuality += example.metadata.quality || 0
    }

    this.stats = {
      totalExamples: this.examples.length,
      examplesPerClass,
      averageQuality: totalQuality / this.examples.length,
      lastUpdated: Date.now()
    }
  }

  public getStats(): DatasetStats {
    return this.stats
  }

  public getExamplesByLabel(label: string): GestureExample[] {
    return this.examples.filter(e => e.label === label)
  }

  public getExamplesByUser(userId: string): GestureExample[] {
    return this.examples.filter(e => e.metadata.userId === userId)
  }

  public removeExample(id: string): void {
    this.examples = this.examples.filter(e => e.id !== id)
    this.updateStats()
  }

  public exportDataset(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.examples, null, 2)
    } else {
      // Convert to CSV format
      const headers = ['id', 'label', 'timestamp', 'userId', 'quality']
      const rows = this.examples.map(e => [
        e.id,
        e.label,
        e.metadata.timestamp,
        e.metadata.userId,
        e.metadata.quality
      ])
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    }
  }
}
