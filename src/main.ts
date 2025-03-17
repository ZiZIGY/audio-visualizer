import { AudioVisualizer } from './core/AudioVisualizer';

// Создаем основные элементы интерфейса
function createUI() {
  // Создаем элементы управления, если они еще не существуют
  if (!document.getElementById('visualizer-controls')) {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'visualizer-controls';
    controlsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;

    // Кнопка воспроизведения
    const btnPlay = document.createElement('button');
    btnPlay.id = 'btn-play';
    btnPlay.textContent = 'Воспроизвести';
    btnPlay.style.cssText = `
      background-color: #ff5500;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      cursor: pointer;
    `;

    // Кнопка загрузки файла
    const btnUpload = document.createElement('button');
    btnUpload.id = 'btn-upload';
    btnUpload.textContent = 'Загрузить трек';
    btnUpload.style.cssText = `
      background-color: #3399ff;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      cursor: pointer;
    `;

    // Скрытый input для выбора файла
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'audio-file-input';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';

    // Кнопка переключения режима цвета
    const btnColorMode = document.createElement('button');
    btnColorMode.id = 'btn-color-mode';
    btnColorMode.textContent = 'Анимация HSL: Вкл';
    btnColorMode.style.cssText = `
      background-color: #ff5500;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      cursor: pointer;
    `;

    // Кнопка эффекта свечения
    const btnGlow = document.createElement('button');
    btnGlow.id = 'btn-glow';
    btnGlow.textContent = 'Свечение: Выкл';
    btnGlow.style.cssText = `
      background-color: #555555;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      cursor: pointer;
    `;

    // Создаем canvas для визуализации
    const canvas = document.createElement('canvas');
    canvas.id = 'visualizer-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      background-color: #000;
    `;

    // Добавляем элементы на страницу
    controlsContainer.appendChild(btnPlay);
    controlsContainer.appendChild(btnUpload);
    controlsContainer.appendChild(btnColorMode);
    controlsContainer.appendChild(btnGlow);
    document.body.appendChild(fileInput);
    document.body.appendChild(controlsContainer);
    document.body.appendChild(canvas);

    return {
      canvas,
      btnPlay,
      btnUpload,
      fileInput,
      btnColorMode,
      btnGlow,
    };
  } else {
    // Если элементы уже существуют, возвращаем их
    return {
      canvas: document.getElementById('visualizer-canvas') as HTMLCanvasElement,
      btnPlay: document.getElementById('btn-play') as HTMLButtonElement,
      btnUpload: document.getElementById('btn-upload') as HTMLButtonElement,
      fileInput: document.getElementById(
        'audio-file-input'
      ) as HTMLInputElement,
      btnColorMode: document.getElementById(
        'btn-color-mode'
      ) as HTMLButtonElement,
      btnGlow: document.getElementById('btn-glow') as HTMLButtonElement,
    };
  }
}

// Функция для изменения размера canvas
function resizeCanvas(
  canvas: HTMLCanvasElement,
  visualizer: AudioVisualizer | null
): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (visualizer) {
    visualizer.resize(canvas.width, canvas.height);
  }
}

// Инициализация приложения
function initApp(): void {
  const ui = createUI();
  let visualizer: AudioVisualizer | null = null;
  let activeMediaElement: HTMLAudioElement | HTMLVideoElement | null = null;

  // Инициализация canvas
  const canvas = ui.canvas;
  resizeCanvas(canvas, null);

  // Обработчик изменения размера окна
  window.addEventListener('resize', () => {
    resizeCanvas(canvas, visualizer);
  });

  // Обработчик для кнопки загрузки файла
  ui.btnUpload.addEventListener('click', () => {
    ui.fileInput.click();
  });

  // Обработчик выбора файла
  ui.fileInput.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const audioURL = URL.createObjectURL(file);

      // Если визуализатор уже существует, обновляем его
      if (visualizer && activeMediaElement) {
        // Останавливаем текущее воспроизведение
        activeMediaElement.pause();

        // Создаем новый аудио элемент
        const audio = new Audio();
        audio.src = audioURL;
        audio.crossOrigin = 'anonymous';

        // Настраиваем обработчики событий
        setupMediaEventListeners(audio);

        // Обновляем медиа элемент в визуализаторе
        visualizer.setMediaElement(audio);

        // Запускаем воспроизведение
        audio.play().catch((error) => {
          console.error('Ошибка воспроизведения:', error);
        });

        // Обновляем активный медиа элемент
        activeMediaElement = audio;

        // Обновляем текст кнопки
        ui.btnPlay.textContent = 'Пауза';
      } else {
        // Создаем новый аудио элемент
        const audio = new Audio();
        audio.src = audioURL;
        audio.crossOrigin = 'anonymous';

        // Настраиваем обработчики событий
        setupMediaEventListeners(audio);

        // Создаем визуализатор
        visualizer = new AudioVisualizer(canvas, audio);

        // Запускаем воспроизведение
        audio.play().catch((error) => {
          console.error('Ошибка воспроизведения:', error);
        });

        // Обновляем активный медиа элемент
        activeMediaElement = audio;

        // Обновляем текст кнопки
        ui.btnPlay.textContent = 'Пауза';

        // Создаем расширенный UI после первого запуска визуализатора
        if (!document.querySelector('.settings-panel')) {
          createExtendedUI(visualizer);
        }
      }

      // Отображаем имя файла
      const fileName = file.name;
      const trackInfo = document.createElement('div');
      trackInfo.id = 'track-info';
      trackInfo.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 5px 10px;
        border-radius: 5px;
        z-index: 1000;
      `;
      trackInfo.textContent = `Сейчас играет: ${fileName}`;

      // Удаляем предыдущую информацию о треке, если она есть
      const existingTrackInfo = document.getElementById('track-info');
      if (existingTrackInfo) {
        existingTrackInfo.remove();
      }

      document.body.appendChild(trackInfo);
    }
  });

  // Обработчик для кнопки воспроизведения
  ui.btnPlay.addEventListener('click', () => {
    if (!visualizer) {
      // Если визуализатор еще не создан, предлагаем загрузить файл
      ui.fileInput.click();
    } else if (activeMediaElement) {
      // Переключаем воспроизведение/паузу
      if (activeMediaElement.paused) {
        activeMediaElement.play();
        ui.btnPlay.textContent = 'Пауза';
      } else {
        activeMediaElement.pause();
        ui.btnPlay.textContent = 'Воспроизвести';
      }
    }
  });

  // Функция для настройки обработчиков событий медиа элемента
  function setupMediaEventListeners(mediaElement) {
    mediaElement.addEventListener('play', () => {
      activeMediaElement = mediaElement;
    });

    mediaElement.addEventListener('pause', () => {
      // Обновляем текст кнопки
      ui.btnPlay.textContent = 'Воспроизвести';
    });

    mediaElement.addEventListener('ended', () => {
      // Обновляем текст кнопки
      ui.btnPlay.textContent = 'Воспроизвести';
    });
  }

  // Обработчик для кнопки переключения режима анимации HSL
  ui.btnColorMode.addEventListener('click', () => {
    if (!visualizer) return;

    // Переключаем режим анимации HSL
    const newAnimationState = !visualizer.options.hslAnimation.enabled;

    visualizer.updateOptions({
      hslAnimation: {
        ...visualizer.options.hslAnimation,
        enabled: newAnimationState,
      },
    });

    // Обновляем стиль кнопки
    ui.btnColorMode.style.backgroundColor = newAnimationState
      ? '#ff5500'
      : '#555555';
    ui.btnColorMode.textContent = newAnimationState
      ? 'Анимация HSL: Вкл'
      : 'Анимация HSL: Выкл';
  });

  // Обработчик для кнопки свечения
  ui.btnGlow.addEventListener('click', () => {
    if (!visualizer) return;

    // Получаем текущие настройки
    const currentOptions = visualizer.options;

    // Инвертируем состояние эффекта свечения
    const newGlowState = !currentOptions.glowEffect.enabled;

    // Обновляем настройки визуализатора
    visualizer.updateOptions({
      glowEffect: {
        ...currentOptions.glowEffect,
        enabled: newGlowState,
      },
    });

    // Обновляем стиль кнопки
    ui.btnGlow.style.backgroundColor = newGlowState ? '#ff5500' : '#555555';
    ui.btnGlow.textContent = newGlowState ? 'Свечение: Вкл' : 'Свечение: Выкл';
  });
}

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Функция для создания расширенного UI с настройками
function createExtendedUI(visualizer?: any): void {
  if (!visualizer) return;

  // Создаем контейнер для настроек
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'settings-panel';
  settingsPanel.style.cssText = `
    position: fixed;
    right: 20px;
    top: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 10px;
    padding: 15px;
    color: white;
    max-height: 80vh;
    overflow-y: auto;
    width: 300px;
    z-index: 1000;
    font-family: Arial, sans-serif;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  `;

  // Кнопка для скрытия/показа панели настроек
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Настройки';
  toggleButton.style.cssText = `
    position: fixed;
    right: 20px;
    top: 20px;
    background-color: #ff5500;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 8px 15px;
    cursor: pointer;
    z-index: 1001;
    font-weight: bold;
  `;

  let isPanelVisible = false;
  settingsPanel.style.display = 'none';

  toggleButton.addEventListener('click', () => {
    isPanelVisible = !isPanelVisible;
    settingsPanel.style.display = isPanelVisible ? 'block' : 'none';
    toggleButton.textContent = isPanelVisible
      ? 'Скрыть настройки'
      : 'Настройки';
  });

  document.body.appendChild(toggleButton);
  document.body.appendChild(settingsPanel);

  // Заголовок панели
  const title = document.createElement('h3');
  title.textContent = 'Настройки визуализатора';
  title.style.cssText = `
    margin-top: 0;
    margin-bottom: 15px;
    text-align: center;
    color: #ff5500;
  `;
  settingsPanel.appendChild(title);

  // Функция для создания раздела настроек
  function createSection(title: string): HTMLDivElement {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 15px;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    `;

    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
      margin-top: 5px;
      margin-bottom: 10px;
      color: #ff9900;
    `;

    section.appendChild(sectionTitle);
    return section;
  }

  // Функция для создания слайдера
  function createSlider(
    label: string,
    min: number,
    max: number,
    step: number,
    value: number,
    onChange: (value: number) => void
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 10px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = `${label}: ${value}`;
    labelElement.style.cssText = `
      display: block;
      margin-bottom: 5px;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.style.cssText = `
      width: 100%;
    `;

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      labelElement.textContent = `${label}: ${newValue}`;
      onChange(newValue);
    });

    container.appendChild(labelElement);
    container.appendChild(slider);
    return container;
  }

  // Функция для создания переключателя
  function createToggle(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = checked;
    toggle.style.cssText = `
      margin-left: 10px;
    `;

    toggle.addEventListener('change', () => {
      onChange(toggle.checked);
    });

    container.appendChild(labelElement);
    container.appendChild(toggle);
    return container;
  }

  // Функция для создания выпадающего списка
  function createSelect(
    label: string,
    options: { value: string; label: string }[],
    value: string,
    onChange: (value: string) => void
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 10px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      display: block;
      margin-bottom: 5px;
    `;

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%;
      padding: 5px;
      background-color: #333;
      color: white;
      border: 1px solid #555;
      border-radius: 3px;
    `;

    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      if (option.value === value) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });

    select.addEventListener('change', () => {
      onChange(select.value);
    });

    container.appendChild(labelElement);
    container.appendChild(select);
    return container;
  }

  // Раздел основных настроек
  const basicSection = createSection('Основные настройки');

  // FFT Size
  basicSection.appendChild(
    createSelect(
      'Размер FFT',
      [
        { value: '32', label: '32' },
        { value: '64', label: '64' },
        { value: '128', label: '128' },
        { value: '256', label: '256' },
        { value: '512', label: '512' },
        { value: '1024', label: '1024' },
        { value: '2048', label: '2048' },
        { value: '4096', label: '4096' },
        { value: '8192', label: '8192' },
        { value: '16384', label: '16384' },
        { value: '32768', label: '32768' },
      ],
      visualizer.options.fftSize.toString(),
      (value) => {
        visualizer.updateOptions({
          fftSize: parseInt(value),
        });
      }
    )
  );

  // Smoothing Time Constant
  basicSection.appendChild(
    createSlider(
      'Сглаживание',
      0,
      0.99,
      0.01,
      visualizer.options.smoothingTimeConstant,
      (value) => {
        visualizer.updateOptions({
          smoothingTimeConstant: value,
        });
      }
    )
  );

  settingsPanel.appendChild(basicSection);

  // Раздел отображения
  const displaySection = createSection('Отображение');

  // Visualization Type
  displaySection.appendChild(
    createSelect(
      'Тип визуализации',
      [
        { value: 'bars', label: 'Столбцы' },
        { value: 'smooth', label: 'Плавная линия' },
        { value: 'wave', label: 'Волна' },
      ],
      visualizer.options.visualizationType,
      (value) => {
        visualizer.updateOptions({
          visualizationType: value,
        });
      }
    )
  );

  // Show Fill
  displaySection.appendChild(
    createToggle(
      'Показывать заливку',
      visualizer.options.showFill,
      (checked) => {
        visualizer.updateOptions({
          showFill: checked,
        });
      }
    )
  );

  // Show Line
  displaySection.appendChild(
    createToggle('Показывать линию', visualizer.options.showLine, (checked) => {
      visualizer.updateOptions({
        showLine: checked,
      });
    })
  );

  // Line Width
  displaySection.appendChild(
    createSlider(
      'Толщина линии',
      1,
      10,
      1,
      visualizer.options.lineWidth,
      (value) => {
        visualizer.updateOptions({
          lineWidth: value,
        });
      }
    )
  );

  settingsPanel.appendChild(displaySection);

  // Раздел настроек столбцов
  const barsSection = createSection('Настройки столбцов');

  // Bar Width
  barsSection.appendChild(
    createSlider(
      'Ширина столбца',
      1,
      20,
      1,
      visualizer.options.barWidth,
      (value) => {
        visualizer.updateOptions({
          barWidth: value,
        });
      }
    )
  );

  // Bar Spacing
  barsSection.appendChild(
    createSlider(
      'Расстояние между столбцами',
      0,
      10,
      1,
      visualizer.options.barSpacing,
      (value) => {
        visualizer.updateOptions({
          barSpacing: value,
        });
      }
    )
  );

  settingsPanel.appendChild(barsSection);

  // Раздел цветов и анимации
  const colorSection = createSection('Цвета и анимация');

  // HSL Animation Enabled
  colorSection.appendChild(
    createToggle(
      'Анимация HSL',
      visualizer.options.hslAnimation.enabled,
      (checked) => {
        visualizer.updateOptions({
          hslAnimation: {
            ...visualizer.options.hslAnimation,
            enabled: checked,
          },
        });

        // Обновляем основную кнопку
        const btnColorMode = document.getElementById(
          'btn-color-mode'
        ) as HTMLButtonElement;
        if (btnColorMode) {
          btnColorMode.style.backgroundColor = checked ? '#ff5500' : '#555555';
          btnColorMode.textContent = checked
            ? 'Анимация HSL: Вкл'
            : 'Анимация HSL: Выкл';
        }
      }
    )
  );

  // HSL Animation Speed
  colorSection.appendChild(
    createSlider(
      'Скорость анимации HSL',
      0.1,
      5,
      0.1,
      visualizer.options.hslAnimation.speed,
      (value) => {
        visualizer.updateOptions({
          hslAnimation: {
            ...visualizer.options.hslAnimation,
            speed: value,
          },
        });
      }
    )
  );

  settingsPanel.appendChild(colorSection);

  // Раздел эффекта свечения
  const glowSection = createSection('Эффект свечения');

  // Glow Effect Enabled
  glowSection.appendChild(
    createToggle(
      'Эффект свечения',
      visualizer.options.glowEffect.enabled,
      (checked) => {
        visualizer.updateOptions({
          glowEffect: {
            ...visualizer.options.glowEffect,
            enabled: checked,
          },
        });

        // Обновляем основную кнопку
        const btnGlow = document.getElementById(
          'btn-glow'
        ) as HTMLButtonElement;
        if (btnGlow) {
          btnGlow.style.backgroundColor = checked ? '#ff5500' : '#555555';
          btnGlow.textContent = checked ? 'Свечение: Вкл' : 'Свечение: Выкл';
        }
      }
    )
  );

  // Glow Effect Blur
  glowSection.appendChild(
    createSlider(
      'Размытие свечения',
      1,
      20,
      1,
      visualizer.options.glowEffect.blur,
      (value) => {
        visualizer.updateOptions({
          glowEffect: {
            ...visualizer.options.glowEffect,
            blur: value,
          },
        });
      }
    )
  );

  // Glow Effect Intensity
  glowSection.appendChild(
    createSlider(
      'Интенсивность свечения',
      0.1,
      1,
      0.05,
      visualizer.options.glowEffect.intensity,
      (value) => {
        visualizer.updateOptions({
          glowEffect: {
            ...visualizer.options.glowEffect,
            intensity: value,
          },
        });
      }
    )
  );

  settingsPanel.appendChild(glowSection);

  // Кнопка сброса настроек
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Сбросить настройки';
  resetButton.style.cssText = `
    background-color: #ff3300;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 8px 15px;
    cursor: pointer;
    width: 100%;
    margin-top: 15px;
    font-weight: bold;
  `;

  resetButton.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
      // Сбрасываем настройки к значениям по умолчанию
      visualizer.resetOptions();

      // Перезагрузка страницы для обновления всех элементов управления
      window.location.reload();
    }
  });

  settingsPanel.appendChild(resetButton);
}
