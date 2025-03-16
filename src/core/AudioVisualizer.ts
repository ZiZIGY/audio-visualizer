import { AudioVisualizerOptions } from '../types';

// Класс аудио визуализатора
export class AudioVisualizer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private animationId: number = 0;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioElement: HTMLAudioElement;
  public options: AudioVisualizerOptions;
  private hueOffset: number = 0; // Смещение оттенка для анимации
  private lastFrameTime: number = 0; // Время последнего кадра для анимации

  // Значения по умолчанию
  private static readonly DEFAULT_OPTIONS: AudioVisualizerOptions = {
    fftSize: 256,
    smoothingTimeConstant: 0.85,
    showFill: true,
    showLine: true,
    lineWidth: 2,
    lineColor: 'rgba(255, 255, 255, 0.5)',
    fillColor: null, // null означает использовать градиент
    visualizationType: 'smooth',
    barWidth: 4,
    barSpacing: 1,
    gradient: {
      colors: [
        { position: 0, color: 'rgb(255, 0, 0)' }, // Красный
        { position: 0.2, color: 'rgb(255, 165, 0)' }, // Оранжевый
        { position: 0.4, color: 'rgb(255, 255, 0)' }, // Желтый
        { position: 0.6, color: 'rgb(0, 255, 0)' }, // Зеленый
        { position: 0.8, color: 'rgb(0, 255, 255)' }, // Голубой
        { position: 1, color: 'rgb(0, 0, 255)' }, // Синий
      ],
    },
    frequencyRange: {
      start: 0,
      end: 0.7,
    },
    amplification: 1.2,
    maxHeight: 100,
    colorMode: 'rgb',
    hslBase: {
      hue: 0,
      saturation: 80,
      lightness: 50,
    },
    hslAnimation: {
      enabled: false,
      hueStep: 10,
      speed: 30,
    },
  };

  constructor(
    audioElement: HTMLAudioElement,
    canvas: HTMLCanvasElement,
    options: Partial<AudioVisualizerOptions> = {}
  ) {
    this.audioElement = audioElement;
    this.canvas = canvas;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;

    // Объединяем настройки по умолчанию с переданными
    this.options = { ...AudioVisualizer.DEFAULT_OPTIONS, ...options };

    // Инициализируем аудио контекст и анализатор
    this.initAudio();

    // Добавляем обработчики событий
    this.setupEventListeners();
  }

  // Инициализация аудио контекста и анализатора
  private initAudio(): void {
    // Создаем аудио контекст
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Создаем анализатор
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;

    // Подключаем аудио элемент к анализатору
    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  // Настройка обработчиков событий
  private setupEventListeners(): void {
    // Запуск визуализации при воспроизведении
    this.audioElement.addEventListener('play', this.start.bind(this));

    // Остановка визуализации при паузе
    this.audioElement.addEventListener('pause', this.stop.bind(this));

    // Остановка визуализации при окончании
    this.audioElement.addEventListener('ended', this.stop.bind(this));
  }

  // Запуск визуализации
  public start(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.draw();
  }

  // Остановка визуализации
  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  // Метод для рисования визуализации
  private draw(timestamp: number = 0): void {
    if (!this.analyser) return;

    // Обновляем смещение оттенка для анимации
    if (this.options.hslAnimation.enabled) {
      const deltaTime = timestamp - this.lastFrameTime;
      this.hueOffset =
        (this.hueOffset +
          (this.options.hslAnimation.speed * deltaTime) / 1000) %
        360;
      this.lastFrameTime = timestamp;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Получаем данные о частотах
    this.analyser.getByteFrequencyData(dataArray);

    // Очищаем canvas
    this.ctx.fillStyle = 'rgb(20, 20, 30)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Используем только часть спектра согласно настройкам
    const startIndex = Math.floor(
      bufferLength * this.options.frequencyRange.start
    );
    const endIndex = Math.floor(bufferLength * this.options.frequencyRange.end);
    const usableBufferLength = endIndex - startIndex;

    // Максимальная высота в пикселях
    const maxHeightPx = (this.canvas.height * this.options.maxHeight) / 100;

    // Выбираем тип визуализации
    if (this.options.visualizationType === 'smooth') {
      this.drawSmoothEqualizer(
        dataArray,
        startIndex,
        endIndex,
        usableBufferLength,
        maxHeightPx
      );
    } else {
      this.drawBarsEqualizer(
        dataArray,
        startIndex,
        endIndex,
        usableBufferLength,
        maxHeightPx
      );
    }

    // Продолжаем анимацию
    this.animationId = requestAnimationFrame(this.draw.bind(this));
  }

  // Метод для создания цвета в зависимости от режима
  private getColor(index: number, total: number): string | CanvasGradient {
    if (this.options.colorMode === 'hsl' && this.options.hslAnimation.enabled) {
      // Используем HSL с анимацией
      const hue =
        (this.options.hslBase.hue +
          this.hueOffset +
          index * this.options.hslAnimation.hueStep) %
        360;
      return `hsl(${hue}, ${this.options.hslBase.saturation}%, ${this.options.hslBase.lightness}%)`;
    } else if (this.options.colorMode === 'hsl') {
      // Используем HSL без анимации
      const hue =
        (this.options.hslBase.hue + index * this.options.hslAnimation.hueStep) %
        360;
      return `hsl(${hue}, ${this.options.hslBase.saturation}%, ${this.options.hslBase.lightness}%)`;
    } else {
      // Используем обычный градиент или цвет
      if (this.options.fillColor) {
        return this.options.fillColor;
      } else {
        // Создаем градиент
        const gradient = this.ctx.createLinearGradient(
          0,
          0,
          this.canvas.width,
          0
        );

        // Добавляем цвета градиента
        for (const colorStop of this.options.gradient.colors) {
          gradient.addColorStop(colorStop.position, colorStop.color);
        }

        return gradient;
      }
    }
  }

  // Метод для рисования плавного эквалайзера
  private drawSmoothEqualizer(
    dataArray: Uint8Array,
    startIndex: number,
    endIndex: number,
    usableBufferLength: number,
    maxHeightPx: number
  ): void {
    // Вычисляем точки для кривой
    const points: { x: number; y: number }[] = [];
    const barWidth = this.canvas.width / (usableBufferLength - 1);

    for (let i = 0; i < usableBufferLength; i++) {
      // Получаем данные с учетом смещения
      const dataIndex = startIndex + i;

      // Применяем усиление и ограничиваем максимальное значение
      let value = dataArray[dataIndex] * this.options.amplification;
      value = Math.min(value, 255); // Ограничиваем максимум

      // Высота точки зависит от амплитуды на данной частоте
      const barHeight = (value / 255) * maxHeightPx;

      // Сохраняем точку для кривой
      const x = i * barWidth;

      points.push({
        x: x,
        y: this.canvas.height - barHeight,
      });
    }

    // Добавляем точку в правом краю canvas
    points.push({
      x: this.canvas.width,
      y:
        this.canvas.height -
        ((dataArray[endIndex - 1] * this.options.amplification) / 255) *
          maxHeightPx,
    });

    // Рисуем заливку, если она включена
    if (this.options.showFill) {
      // Создаем стиль для заливки
      let fillStyle = this.getColor(0, 1);

      // Начинаем путь для заливки
      this.ctx.beginPath();

      if (points.length > 0) {
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          const xc = (points[i - 1].x + points[i].x) / 2;
          const yc = (points[i - 1].y + points[i].y) / 2;
          this.ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }

        // Завершаем путь до нижнего правого угла и обратно к началу
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
      }

      // Заливаем область
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }

    // Рисуем линию, если она включена
    if (this.options.showLine) {
      // Создаем стиль для линии
      let strokeStyle = this.options.lineColor || this.getColor(0, 1);

      // Рисуем контур кривой
      this.ctx.beginPath();
      if (points.length > 0) {
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          const xc = (points[i - 1].x + points[i].x) / 2;
          const yc = (points[i - 1].y + points[i].y) / 2;
          this.ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
      }

      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.stroke();
    }
  }

  // Метод для рисования столбчатого эквалайзера
  private drawBarsEqualizer(
    dataArray: Uint8Array,
    startIndex: number,
    endIndex: number,
    usableBufferLength: number,
    maxHeightPx: number
  ): void {
    // Вычисляем ширину столбца и расстояние между ними
    const totalBarWidth = this.options.barWidth + this.options.barSpacing;
    const numBars = Math.floor(this.canvas.width / totalBarWidth);

    // Рисуем столбцы
    for (let i = 0; i < numBars; i++) {
      // Вычисляем индекс данных для текущего столбца
      const dataIndex = Math.floor(
        startIndex + (i / numBars) * usableBufferLength
      );

      // Применяем усиление и ограничиваем максимальное значение
      let value = dataArray[dataIndex] * this.options.amplification;
      value = Math.min(value, 255); // Ограничиваем максимум

      // Высота столбца зависит от амплитуды на данной частоте
      const barHeight = (value / 255) * maxHeightPx;

      // Позиция столбца
      const x = i * totalBarWidth;

      // Получаем цвет для текущего столбца
      const fillStyle =
        this.options.colorMode === 'hsl'
          ? this.getColor(i, numBars)
          : this.getColor(0, 1); // Для RGB используем один цвет/градиент

      // Рисуем столбец
      if (this.options.showFill) {
        this.ctx.fillStyle = fillStyle;
        this.ctx.fillRect(
          x,
          this.canvas.height - barHeight,
          this.options.barWidth,
          barHeight
        );
      }

      // Рисуем контур столбца, если включена линия
      if (this.options.showLine) {
        this.ctx.strokeStyle = this.options.lineColor || fillStyle;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
          x,
          this.canvas.height - barHeight,
          this.options.barWidth,
          barHeight
        );
      }
    }
  }

  // Метод для обновления настроек
  public updateOptions(newOptions: Partial<AudioVisualizerOptions>): void {
    this.options = { ...this.options, ...newOptions };

    // Обновляем настройки анализатора, если он существует
    if (this.analyser) {
      this.analyser.fftSize = this.options.fftSize;
      this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
    }
  }
}
