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
  visualizationType: 'smooth' | 'bars'; // Плавный или столбчатый
  barWidth: number; // Ширина столбца (для столбчатого типа)
  barSpacing: number; // Расстояние между столбцами

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
}

export class AudioVisualizer {
  constructor(
    audioElement: HTMLAudioElement,
    canvas: HTMLCanvasElement,
    options?: Partial<AudioVisualizerOptions>
  );

  options: AudioVisualizerOptions;

  start(): void;
  stop(): void;
  updateOptions(newOptions: Partial<AudioVisualizerOptions>): void;
}
