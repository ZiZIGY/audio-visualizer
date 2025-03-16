      <h1>Audio Visualizer Library</h1>
      
      <p>A lightweight JavaScript library for creating real-time audio visualizations using Web Audio API and HTML5 Canvas.</p>
      
      <h2>Installation</h2>
      
      <pre><code>npm install audio-visualizer</code></pre>
      
      <h2>Basic Usage</h2>
      
      <pre><code>// Get your HTML elements
const audioElement = document.getElementById('audio');
const canvas = document.getElementById('visualizer');

// Create a new visualizer instance
const visualizer = new AudioVisualizer(audioElement, canvas);

// Visualization starts automatically when audio plays</code></pre>
      
      <h2>API Reference</h2>
      
      <h3>AudioVisualizer</h3>
      
      <p>Main class for creating audio visualizations.</p>
      
      <pre><code>constructor(
  audioElement: HTMLAudioElement,
  canvas: HTMLCanvasElement,
  options?: Partial&lt;AudioVisualizerOptions&gt;
)</code></pre>
      
      <h4>Methods</h4>
      
      <ul>
        <li><code>start()</code> - Starts the visualization</li>
        <li><code>stop()</code> - Stops the visualization</li>
        <li><code>updateOptions(newOptions: Partial&lt;AudioVisualizerOptions&gt;)</code> - Updates visualizer settings</li>
      </ul>
      
      <h3>AudioVisualizerOptions</h3>
      
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>fftSize</code></td>
            <td>number</td>
            <td>256</td>
            <td>FFT size (must be power of 2)</td>
          </tr>
          <tr>
            <td><code>smoothingTimeConstant</code></td>
            <td>number</td>
            <td>0.85</td>
            <td>Smoothing factor (0-1)</td>
          </tr>
          <tr>
            <td><code>showFill</code></td>
            <td>boolean</td>
            <td>true</td>
            <td>Show fill area</td>
          </tr>
          <tr>
            <td><code>showLine</code></td>
            <td>boolean</td>
            <td>true</td>
            <td>Show outline</td>
          </tr>
          <tr>
            <td><code>lineWidth</code></td>
            <td>number</td>
            <td>2</td>
            <td>Line thickness</td>
          </tr>
          <tr>
            <td><code>lineColor</code></td>
            <td>string | null</td>
            <td>'rgba(255, 255, 255, 0.5)'</td>
            <td>Line color (null for gradient)</td>
          </tr>
          <tr>
            <td><code>fillColor</code></td>
            <td>string | null</td>
            <td>null</td>
            <td>Fill color (null for gradient)</td>
          </tr>
          <tr>
            <td><code>visualizationType</code></td>
            <td>'smooth' | 'bars'</td>
            <td>'smooth'</td>
            <td>Visualization style</td>
          </tr>
          <tr>
            <td><code>barWidth</code></td>
            <td>number</td>
            <td>4</td>
            <td>Bar width for bar visualization</td>
          </tr>
          <tr>
            <td><code>barSpacing</code></td>
            <td>number</td>
            <td>1</td>
            <td>Space between bars</td>
          </tr>
          <tr>
            <td><code>gradient.colors</code></td>
            <td>Array&lt;{position, color}&gt;</td>
            <td>Rainbow gradient</td>
            <td>Gradient color stops</td>
          </tr>
          <tr>
            <td><code>frequencyRange.start</code></td>
            <td>number</td>
            <td>0</td>
            <td>Start of frequency range (0-1)</td>
          </tr>
          <tr>
            <td><code>frequencyRange.end</code></td>
            <td>number</td>
            <td>0.7</td>
            <td>End of frequency range (0-1)</td>
          </tr>
          <tr>
            <td><code>amplification</code></td>
            <td>number</td>
            <td>1.2</td>
            <td>Signal amplification</td>
          </tr>
          <tr>
            <td><code>maxHeight</code></td>
            <td>number</td>
            <td>100</td>
            <td>Maximum height (% of canvas height)</td>
          </tr>
          <tr>
            <td><code>colorMode</code></td>
            <td>'rgb' | 'hsl'</td>
            <td>'rgb'</td>
            <td>Color mode</td>
          </tr>
          <tr>
            <td><code>hslBase</code></td>
            <td>{hue, saturation, lightness}</td>
            <td>{0, 80, 50}</td>
            <td>Base HSL values</td>
          </tr>
          <tr>
            <td><code>hslAnimation</code></td>
            <td>{enabled, hueStep, speed}</td>
            <td>{false, 10, 30}</td>
            <td>HSL animation settings</td>
          </tr>
        </tbody>
      </table>
      
      <h2>Examples</h2>
      
      <h3>Smooth Visualizer (Default)</h3>
      
      <pre><code>const visualizer = new AudioVisualizer(audioElement, canvas);</code></pre>
      
      <h3>Bar Visualizer</h3>
      
      <pre><code>const visualizer = new AudioVisualizer(audioElement, canvas, {
  visualizationType: 'bars',
  barWidth: 5,
  barSpacing: 2
});</code></pre>
      
      <h3>Custom Colors</h3>
      
      <pre><code>const visualizer = new AudioVisualizer(audioElement, canvas, {
  fillColor: 'rgba(0, 150, 255, 0.5)',
  lineColor: '#00aaff',
  showLine: true,
  showFill: true
});</code></pre>
      
      <h3>HSL Animation</h3>
      
      <pre><code>const visualizer = new AudioVisualizer(audioElement, canvas, {
  colorMode: 'hsl',
  hslAnimation: {
    enabled: true,
    hueStep: 15,
    speed: 50
  }
});</code></pre>
      
      <h2>Advanced Configuration</h2>
      
      <p>The visualizer can be customized with various options to achieve different visual effects:</p>
      
      <pre><code>const options = {
  // Audio analysis settings
  fftSize: 512,
  smoothingTimeConstant: 0.7,
  
  // Visual style
  visualizationType: 'smooth',
  showFill: true,
  showLine: true,
  
  // Custom gradient
  gradient: {
    colors: [
      { position: 0, color: '#ff0000' },
      { position: 0.5, color: '#00ff00' },
      { position: 1, color: '#0000ff' }
    ]
  },
  
  // Frequency range to visualize
  frequencyRange: {
    start: 0.1,
    end: 0.9
  }
};

const visualizer = new AudioVisualizer(audioElement, canvas, options);</code></pre>
    </div>