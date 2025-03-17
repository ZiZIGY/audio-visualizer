export interface AudioVisualizerOptions {
  // Основные настройки
  fftSize: number; // Размер FFT (должен быть степенью 2)
  smoothingTimeConstant: number; // Сглаживание (0-1)

  // Настройки отображения
  showFill: boolean; // Показывать заливку
  showLine: boolean; // Показывать линию
  lineWidth: number; // Толщина линии
  lineColor: string | null; // Цвет линии (null для градиента)
  fillColor: string | null; // Цвет заливки (null для градиента)

  // Тип визуализации
  visualizationType: 'smooth' | 'bars' | 'custom'; // Плавный, столбчатый или кастомный
  barWidth: number; // Ширина столбца (для столбчатого типа)
  barSpacing: number; // Расстояние между столбцами
  customRenderer?: (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    params: {
      canvas: HTMLCanvasElement;
      startIndex: number;
      usableBufferLength: number;
      maxHeightPx: number;
      options: AudioVisualizerOptions;
      getColor: (index: number) => string | CanvasGradient;
    }
  ) => void; // Функция для кастомного рендеринга

  // Настройки градиента
  gradient: {
    colors: Array<{ position: number; color: string }>; // Цвета градиента
  };

  // Настройки анализа
  frequencyRange: {
    start: number; // Начало диапазона (0-1)
    end: number; // Конец диапазона (0-1)
  };
  amplification: number; // Усиление сигнала

  // Настройки анимации
  maxHeight: number; // Максимальная высота (% от высоты canvas)

  // Настройки цвета HSL
  colorMode: 'rgb' | 'hsl'; // Режим цвета: RGB или HSL
  hslBase: {
    // Базовые значения HSL
    hue: number; // Оттенок (0-360)
    saturation: number; // Насыщенность (0-100)
    lightness: number; // Яркость (0-100)
  };
  hslAnimation: {
    // Настройки анимации HSL
    enabled: boolean; // Включена ли анимация
    hueStep: number; // Шаг изменения оттенка для каждого столбца
    speed: number; // Скорость анимации
  };

  // Настройки эффекта свечения
  glowEffect: {
    enabled: boolean; // Включен ли эффект свечения
    color: string; // Цвет свечения
    blur: number; // Размер размытия (0-50)
    intensity: number; // Интенсивность свечения (0-1)
  };
}

export class AudioVisualizer {
  constructor(
    canvas: HTMLCanvasElement,
    mediaElement?: HTMLAudioElement | HTMLVideoElement,
    options?: Partial<AudioVisualizerOptions>
  );

  options: AudioVisualizerOptions;

  // Основные методы
  start(): void;
  stop(): void;
  updateOptions(newOptions: Partial<AudioVisualizerOptions>): void;

  // Геттеры
  get isPlaying(): boolean;
  get audioData(): Uint8Array | null;
  get frequencyBinCount(): number;
  get canvasContext(): CanvasRenderingContext2D;
  get canvasElement(): HTMLCanvasElement;
  get mediaElement(): HTMLAudioElement | HTMLVideoElement | null;

  // Методы для работы с данными и визуализацией
  setMediaElement(newMediaElement: HTMLAudioElement | HTMLVideoElement): void;
  setCustomRenderer(
    renderer: (
      ctx: CanvasRenderingContext2D,
      dataArray: Uint8Array,
      params: {
        canvas: HTMLCanvasElement;
        startIndex: number;
        usableBufferLength: number;
        maxHeightPx: number;
        options: AudioVisualizerOptions;
        getColor: (index: number) => string | CanvasGradient;
      }
    ) => void
  ): void;

  getAudioData(): { dataArray: Uint8Array; bufferLength: number } | null;

  getProcessedAudioData(): {
    dataArray: Uint8Array;
    startIndex: number;
    usableBufferLength: number;
    maxHeightPx: number;
  } | null;

  setVisualizationType(type: 'smooth' | 'bars' | 'custom'): void;
  getVisualizationType(): string;
  toggleVisualization(forceState?: boolean): boolean;
  resize(width: number, height: number): void;
}
