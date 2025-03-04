import { GestureDataset, GestureExample } from '../dataset/gesture-dataset'
import { HandLandmark } from '../gesture-processor'
import fs from 'fs/promises'
import path from 'path'

export interface TrainingConfig {
  epochs: number
  batchSize: number
  validationSplit: number
  learningRate: number
  augmentation: {
    enabled: boolean
    rotationRange: number
    scaleRange: number
    translationRange: number
  }
}

export interface TrainingMetrics {
  epoch: number
  loss: number
  accuracy: number
  validationLoss: number
  validationAccuracy: number
}

export interface ModelMetadata {
  version: string
  trainedAt: number
  datasetStats: {
    totalExamples: number
    examplesPerClass: Record<string, number>
  }
  performance: {
    accuracy: number
    precision: Record<string, number>
    recall: Record<string, number>
    f1Score: Record<string, number>
  }
  config: TrainingConfig
}

export class GestureTrainer {
  private dataset: GestureDataset
  private config: TrainingConfig
  private modelPath: string
  private metadata: ModelMetadata | null = null

  constructor(
    dataset: GestureDataset,
    config: Partial<TrainingConfig> = {},
    modelPath: string = 'models/gesture-recognition'
  ) {
    this.dataset = dataset
    this.modelPath = modelPath
    this.config = {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      learningRate: 0.001,
      augmentation: {
        enabled: true,
        rotationRange: 30,
        scaleRange: 0.2,
        translationRange: 0.1
      },
      ...config
    }
  }

  public async train(): Promise<ModelMetadata> {
    try {
      // Prepare directories
      await fs.mkdir(this.modelPath, { recursive: true })

      // Get dataset statistics
      const datasetStats = await this.dataset.getStats()

      // Split dataset into training and validation sets
      const examples = await this.prepareTrainingData()
      const { trainingSet, validationSet } = this.splitDataset(examples)

      // Initialize training metrics
      const metrics: TrainingMetrics[] = []

      // Training loop
      for (let epoch = 0; epoch < this.config.epochs; epoch++) {
        const batchMetrics = await this.trainEpoch(trainingSet, validationSet, epoch)
        metrics.push(batchMetrics)

        // Save checkpoint if it's the best model so far
        if (this.shouldSaveCheckpoint(metrics)) {
          await this.saveCheckpoint(epoch)
        }
      }

      // Evaluate final model
      const performance = await this.evaluateModel(validationSet)

      // Create and save model metadata
      this.metadata = {
        version: `${Date.now()}`,
        trainedAt: Date.now(),
        datasetStats: {
          totalExamples: datasetStats.totalExamples,
          examplesPerClass: datasetStats.examplesPerClass
        },
        performance,
        config: this.config
      }

      await this.saveMetadata()

      return this.metadata

    } catch (error) {
      console.error('Training failed:', error)
      throw error
    }
  }

  private async prepareTrainingData(): Promise<GestureExample[]> {
    const examples = []
    const stats = await this.dataset.getStats()
    
    for (const label of Object.keys(stats.examplesPerClass)) {
      const labelExamples = await this.dataset.getExamplesByLabel(label)
      examples.push(...labelExamples)

      // Apply data augmentation if enabled
      if (this.config.augmentation.enabled) {
        const augmentedExamples = this.augmentData(labelExamples)
        examples.push(...augmentedExamples)
      }
    }

    return this.shuffleArray(examples)
  }

  private augmentData(examples: GestureExample[]): GestureExample[] {
    const augmented: GestureExample[] = []

    for (const example of examples) {
      // Create 3 augmented versions of each example
      for (let i = 0; i < 3; i++) {
        const augmentedLandmarks = this.applyAugmentation(example.data.landmarks)
        augmented.push({
          ...example,
          id: `${example.id}-aug${i}`,
          data: {
            ...example.data,
            landmarks: augmentedLandmarks
          }
        })
      }
    }

    return augmented
  }

  private applyAugmentation(landmarks: HandLandmark[]): HandLandmark[] {
    const { rotationRange, scaleRange, translationRange } = this.config.augmentation
    
    // Apply random rotation
    const rotation = (Math.random() - 0.5) * 2 * rotationRange
    
    // Apply random scale
    const scale = 1 + (Math.random() - 0.5) * 2 * scaleRange
    
    // Apply random translation
    const tx = (Math.random() - 0.5) * 2 * translationRange
    const ty = (Math.random() - 0.5) * 2 * translationRange

    return landmarks.map(landmark => {
      // Apply transformations
      const x = landmark.x * scale + tx
      const y = landmark.y * scale + ty
      
      // Apply rotation
      const rad = rotation * Math.PI / 180
      const rotatedX = x * Math.cos(rad) - y * Math.sin(rad)
      const rotatedY = x * Math.sin(rad) + y * Math.cos(rad)

      return {
        x: rotatedX,
        y: rotatedY,
        z: landmark.z * scale
      }
    })
  }

  private splitDataset(examples: GestureExample[]): {
    trainingSet: GestureExample[]
    validationSet: GestureExample[]
  } {
    const splitIndex = Math.floor(examples.length * (1 - this.config.validationSplit))
    return {
      trainingSet: examples.slice(0, splitIndex),
      validationSet: examples.slice(splitIndex)
    }
  }

  private async trainEpoch(
    trainingSet: GestureExample[],
    validationSet: GestureExample[],
    epoch: number
  ): Promise<TrainingMetrics> {
    // In a real implementation, this would use TensorFlow.js or a similar library
    // For demo purposes, we'll simulate training metrics
    const progress = (epoch + 1) / this.config.epochs
    return {
      epoch,
      loss: 0.5 * Math.exp(-progress * 2),
      accuracy: 0.5 + 0.4 * (1 - Math.exp(-progress * 3)),
      validationLoss: 0.6 * Math.exp(-progress * 2),
      validationAccuracy: 0.4 + 0.4 * (1 - Math.exp(-progress * 3))
    }
  }

  private shouldSaveCheckpoint(metrics: TrainingMetrics[]): boolean {
    if (metrics.length < 2) return true
    const current = metrics[metrics.length - 1]
    const previous = metrics[metrics.length - 2]
    return current.validationAccuracy > previous.validationAccuracy
  }

  private async saveCheckpoint(epoch: number): Promise<void> {
    // In a real implementation, this would save model weights
    const checkpointPath = path.join(this.modelPath, `checkpoint_${epoch}.json`)
    await fs.writeFile(checkpointPath, JSON.stringify({ epoch }))
  }

  private async evaluateModel(validationSet: GestureExample[]): Promise<ModelMetadata['performance']> {
    // In a real implementation, this would compute actual metrics
    // For demo purposes, we'll return simulated metrics
    const gestures = [...new Set(validationSet.map(e => e.label))]
    const metrics: ModelMetadata['performance'] = {
      accuracy: 0.85,
      precision: {},
      recall: {},
      f1Score: {}
    }

    for (const gesture of gestures) {
      metrics.precision[gesture] = 0.8 + Math.random() * 0.15
      metrics.recall[gesture] = 0.8 + Math.random() * 0.15
      metrics.f1Score[gesture] = 0.8 + Math.random() * 0.15
    }

    return metrics
  }

  private async saveMetadata(): Promise<void> {
    if (!this.metadata) return
    const metadataPath = path.join(this.modelPath, 'metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(this.metadata, null, 2))
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  public async loadMetadata(): Promise<ModelMetadata | null> {
    try {
      const metadataPath = path.join(this.modelPath, 'metadata.json')
      const content = await fs.readFile(metadataPath, 'utf-8')
      this.metadata = JSON.parse(content)
      return this.metadata
    } catch (error) {
      console.error('Failed to load model metadata:', error)
      return null
    }
  }
}
