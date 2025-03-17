import { AudioVisualizerOptions } from '../types';

// Класс аудио визуализатора
export class AudioVisualizer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private animationId: number = 0;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _mediaElement: HTMLAudioElement | HTMLVideoElement | null = null;
  public options: AudioVisualizerOptions;
  private hueOffset: number = 0; // Смещение оттенка для анимации
  private lastFrameTime: number = 0; // Время последнего кадра для анимации

  // Добавим метод для сглаживания данных анализа
  private smoothedAnalysisData = {
    bassPercent: 0,
    midPercent: 0,
    highPercent: 0,
    spectralCentroid: 0,
    spectralFlatness: 0,
  };

  private smoothingFactor = 0.85; // Фактор сглаживания (0-1)

  // Значения по умолчанию
  private static readonly DEFAULT_OPTIONS: AudioVisualizerOptions = {
    fftSize: 256,
    smoothingTimeConstant: 0.85,
    showFill: true,
    showLine: true,
    lineWidth: 2,
    lineColor: null, // null означает использовать HSL градиент
    fillColor: null, // null означает использовать HSL градиент
    visualizationType: 'smooth',
    barWidth: 4,
    barSpacing: 1,
    gradient: {
      colors: [
        { position: 0, color: 'hsl(0, 80%, 50%)' },
        { position: 0.2, color: 'hsl(72, 80%, 50%)' },
        { position: 0.4, color: 'hsl(144, 80%, 50%)' },
        { position: 0.6, color: 'hsl(216, 80%, 50%)' },
        { position: 0.8, color: 'hsl(288, 80%, 50%)' },
        { position: 1, color: 'hsl(360, 80%, 50%)' },
      ],
    },
    frequencyRange: {
      start: 0,
      end: 0.7,
    },
    amplification: 1.2,
    maxHeight: 100,
    colorMode: 'hsl', // Всегда используем HSL
    hslBase: {
      hue: 0,
      saturation: 80,
      lightness: 50,
    },
    hslAnimation: {
      enabled: true, // По умолчанию анимация включена
      hueStep: 10,
      speed: 30,
    },
    // Настройки эффекта свечения
    glowEffect: {
      enabled: false,
      color: 'rgba(255, 255, 255, 0.7)',
      blur: 15,
      intensity: 0.5,
    },
  };

  constructor(
    canvas: HTMLCanvasElement,
    mediaElement?: HTMLAudioElement | HTMLVideoElement,
    options: Partial<AudioVisualizerOptions> = {}
  ) {
    this.canvas = canvas;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;

    // Объединяем настройки по умолчанию с переданными
    this.options = { ...AudioVisualizer.DEFAULT_OPTIONS, ...options };

    // Если передан медиа элемент, инициализируем аудио контекст
    if (mediaElement) {
      this.setMediaElement(mediaElement);
    }
  }

  // Инициализация аудио контекста и анализатора
  private initAudio(): void {
    if (!this._mediaElement) return;

    // Создаем аудио контекст
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Создаем анализатор
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;

    // Подключаем медиа элемент к анализатору
    this.source = this.audioContext.createMediaElementSource(
      this._mediaElement
    );
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  // Настройка обработчиков событий
  private setupEventListeners(): void {
    if (!this._mediaElement) return;

    // Запуск визуализации при воспроизведении
    this._mediaElement.addEventListener('play', this.start.bind(this));

    // Остановка визуализации при паузе
    this._mediaElement.addEventListener('pause', this.stop.bind(this));

    // Остановка визуализации при окончании
    this._mediaElement.addEventListener('ended', this.stop.bind(this));
  }

  // Запуск визуализации
  public start(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    // Если нет медиа элемента, просто рисуем пустую визуализацию
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
    // Если нет анализатора, рисуем пустую визуализацию
    if (!this.analyser) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(
        'Медиа элемент не подключен',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.animationId = requestAnimationFrame(this.draw.bind(this));
      return;
    }

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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
        usableBufferLength,
        maxHeightPx
      );
    } else if (this.options.visualizationType === 'bars') {
      this.drawBarsEqualizer(
        dataArray,
        startIndex,
        usableBufferLength,
        maxHeightPx
      );
    } else if (
      this.options.visualizationType === 'custom' &&
      this.options.customRenderer
    ) {
      // Вызываем пользовательскую функцию рендеринга
      this.options.customRenderer(this.ctx, dataArray, {
        canvas: this.canvas,
        startIndex,
        usableBufferLength,
        maxHeightPx,
        options: this.options,
        getColor: this.getColor.bind(this),
      });
    }

    // Применяем эффект свечения, если он включен
    if (this.options.glowEffect.enabled) {
      this.applyGlowEffect();
    }

    // Продолжаем анимацию
    this.animationId = requestAnimationFrame(this.draw.bind(this));
  }

  // Метод для применения эффекта свечения
  private applyGlowEffect(): void {
    // Сохраняем текущие настройки контекста
    this.ctx.save();

    // Устанавливаем параметры свечения
    this.ctx.shadowColor = this.options.glowEffect.color;
    this.ctx.shadowBlur = this.options.glowEffect.blur;
    this.ctx.globalAlpha = this.options.glowEffect.intensity;

    // Рисуем содержимое canvas поверх себя для создания эффекта свечения
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.drawImage(this.canvas, 0, 0);

    // Восстанавливаем настройки контекста
    this.ctx.restore();
  }

  // Метод для получения цвета в зависимости от режима
  private getColor(
    index: number,
    isGradient: boolean = false
  ): string | CanvasGradient {
    if (isGradient) {
      // Создаем HSL градиент
      const gradient = this.ctx.createLinearGradient(
        0,
        0,
        this.canvas.width,
        0
      );

      // Если анимация включена, смещаем весь градиент
      const hueShift = this.options.hslAnimation.enabled ? this.hueOffset : 0;

      // Добавляем цвета градиента с учетом смещения
      for (const colorStop of this.options.gradient.colors) {
        const hslMatch = colorStop.color.match(
          /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/
        );
        if (hslMatch) {
          const hue = (parseInt(hslMatch[1]) + hueShift) % 360;
          gradient.addColorStop(
            colorStop.position,
            `hsl(${hue}, ${hslMatch[2]}%, ${hslMatch[3]}%)`
          );
        } else {
          gradient.addColorStop(colorStop.position, colorStop.color);
        }
      }

      return gradient;
    } else {
      // Для отдельных элементов (столбцы, точки на линии)
      if (this.options.hslAnimation.enabled) {
        // Используем HSL с анимацией
        const hue =
          (this.options.hslBase.hue +
            this.hueOffset +
            index * this.options.hslAnimation.hueStep) %
          360;
        return `hsl(${hue}, ${this.options.hslBase.saturation}%, ${this.options.hslBase.lightness}%)`;
      } else {
        // Используем HSL без анимации
        const hue =
          (this.options.hslBase.hue +
            index * this.options.hslAnimation.hueStep) %
          360;
        return `hsl(${hue}, ${this.options.hslBase.saturation}%, ${this.options.hslBase.lightness}%)`;
      }
    }
  }

  // Метод для рисования плавного эквалайзера
  private drawSmoothEqualizer(
    dataArray: Uint8Array,
    startIndex: number,
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
        ((dataArray[startIndex + usableBufferLength - 1] *
          this.options.amplification) /
          255) *
          maxHeightPx,
    });

    // Рисуем заливку, если она включена
    if (this.options.showFill) {
      // Создаем градиент для заливки
      const fillStyle = this.getColor(0, true);

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
      // Создаем градиент для линии
      const strokeStyle = this.options.lineColor || this.getColor(0, true);

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
    usableBufferLength: number,
    maxHeightPx: number
  ): void {
    // Вычисляем ширину столбца и расстояние между ними
    const totalBarWidth = this.options.barWidth + this.options.barSpacing;
    const numBars = Math.floor(this.canvas.width / totalBarWidth);

    // Получаем градиент для всех столбцов
    const gradientFill = this.getColor(0, true);

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

      // Рисуем столбец
      if (this.options.showFill) {
        // Используем градиент для всех столбцов
        this.ctx.fillStyle = gradientFill;

        // Сохраняем контекст для ограничения градиента только текущим столбцом
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(
          x,
          this.canvas.height - barHeight,
          this.options.barWidth,
          barHeight
        );
        this.ctx.clip();
        this.ctx.fillRect(
          0,
          this.canvas.height - barHeight,
          this.canvas.width,
          barHeight
        );
        this.ctx.restore();
      }

      // Рисуем контур столбца, если включена линия
      if (this.options.showLine) {
        this.ctx.strokeStyle =
          this.options.lineColor || this.getColor(i, false);
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

  // Геттеры и сеттеры для удобства работы с классом
  public get isPlaying(): boolean {
    return this.animationId !== 0;
  }

  public get audioData(): Uint8Array | null {
    if (!this.analyser) return null;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public get frequencyBinCount(): number {
    return this.analyser ? this.analyser.frequencyBinCount : 0;
  }

  public get canvasContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public get canvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  // Метод для установки кастомного рендерера
  public setCustomRenderer(
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
  ): void {
    this.options.customRenderer = renderer;
    this.options.visualizationType = 'custom';
  }

  // Метод для получения текущих аудио данных (для внешнего использования)
  public getAudioData(): {
    dataArray: Uint8Array;
    bufferLength: number;
  } | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return { dataArray, bufferLength };
  }

  // Метод для получения обработанных данных в соответствии с настройками
  public getProcessedAudioData(): {
    dataArray: Uint8Array;
    startIndex: number;
    usableBufferLength: number;
    maxHeightPx: number;
  } | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const startIndex = Math.floor(
      bufferLength * this.options.frequencyRange.start
    );
    const endIndex = Math.floor(bufferLength * this.options.frequencyRange.end);
    const usableBufferLength = endIndex - startIndex;
    const maxHeightPx = (this.canvas.height * this.options.maxHeight) / 100;

    return { dataArray, startIndex, usableBufferLength, maxHeightPx };
  }

  // Метод для переключения типа визуализации
  public setVisualizationType(type: 'smooth' | 'bars' | 'custom'): void {
    this.options.visualizationType = type;
  }

  // Метод для получения текущего типа визуализации
  public getVisualizationType(): string {
    return this.options.visualizationType;
  }

  // Метод для паузы/возобновления визуализации без остановки аудио
  public toggleVisualization(forceState?: boolean): boolean {
    const newState = forceState !== undefined ? forceState : !this.isPlaying;

    if (newState && !this.isPlaying) {
      this.start();
      return true;
    } else if (!newState && this.isPlaying) {
      this.stop();
      return false;
    }

    return this.isPlaying;
  }

  // Метод для изменения размера canvas
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // Геттер для получения медиа элемента
  get mediaElement(): HTMLAudioElement | HTMLVideoElement | null {
    return this._mediaElement;
  }

  // Метод для замены медиа элемента
  public setMediaElement(
    newMediaElement: HTMLAudioElement | HTMLVideoElement
  ): void {
    // Останавливаем текущую визуализацию
    this.stop();

    // Удаляем обработчики событий со старого элемента
    if (this._mediaElement) {
      this._mediaElement.removeEventListener('play', this.start.bind(this));
      this._mediaElement.removeEventListener('pause', this.stop.bind(this));
      this._mediaElement.removeEventListener('ended', this.stop.bind(this));
    }

    // Отключаем старый источник, если он существует
    if (this.source) {
      this.source.disconnect();
    }

    // Закрываем старый аудио контекст, если он существует
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Устанавливаем новый медиа элемент
    this._mediaElement = newMediaElement;

    // Пересоздаем аудио контекст и анализатор
    this.initAudio();
    this.setupEventListeners();

    // Если новый элемент уже воспроизводится, запускаем визуализацию
    if (this._mediaElement && !this._mediaElement.paused) {
      this.start();
    }
  }
}
