class DayNightCycle {
  constructor(config = {}) {
    const defaults = {
      dayLengthSeconds: 180,
      sunColor: 0xFFF4A3,
      moonColor: 0xCFE3FF,
      sunriseStart: 0.20,
      sunriseEnd: 0.30,
      sunsetStart: 0.70,
      sunsetEnd: 0.80,
      minDarkAlpha: 0.55,
      maxLightAlpha: 0.0,
    };
    this.config = { ...defaults, ...config };

    this.scene = null;
    this.timeOfDay = 0; // 0..1
    this.elapsed = 0;
    this.currentDayCount = 0;
    this.executionsThisDay = 0;
    this.lastHour = -1;

    // game object references
    this.container = null;
    this.sun = null;
    this.moon = null;
    this.overlay = null;

    // callbacks
    this.fullDayHandlers = [];
    this.hourHandlers = [];
  }

  /**
   * Create visual elements and overlay. Call from scene.create().
   * @param {Phaser.Scene} scene
   * @param {object} layers - depth configuration
   * @param {number} layers.backCloudsDepth - depth of back cloud layer
   * @param {number} [layers.overlayDepth] - depth for the lighting overlay
   */
  init(scene, layers = {}) {
    this.scene = scene;
    const { backCloudsDepth = 0, overlayDepth = 28.9 } = layers;

    // Container for sun and moon positioned behind back clouds
    this.container = scene.add.container(0, 0).setDepth(backCloudsDepth - 1);

    // Create sun
    this.sun = scene.add.circle(0, 0, 30, this.config.sunColor);
    this.sun.setAlpha(0);
    this.container.add(this.sun);

    // Create crescent moon texture via graphics
    const gfx = scene.add.graphics();
    gfx.fillStyle(this.config.moonColor, 1);
    gfx.fillCircle(20, 20, 20);
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(28, 20, 20);
    gfx.generateTexture('crescent-moon', 40, 40);
    gfx.destroy();

    this.moon = scene.add.image(0, 0, 'crescent-moon');
    this.moon.setAlpha(1);
    this.container.add(this.moon);

    // Fullscreen light/dark overlay
    this.overlay = scene.add.rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      scene.scale.width,
      scene.scale.height,
      0x000000,
      1
    );
    this.overlay.setDepth(overlayDepth);
    this.overlay.setScrollFactor(0);
    this.overlay.setAlpha(this.config.minDarkAlpha);

    return this;
  }

  setDayLength(seconds) {
    this.config.dayLengthSeconds = seconds;
  }

  getTimeOfDay() {
    return this.timeOfDay;
  }

  onFullDay(cb) {
    if (cb) this.fullDayHandlers.push(cb);
  }

  onHourlyExecution(cb) {
    if (cb) this.hourHandlers.push(cb);
  }

  update(deltaSeconds) {
    if (!this.scene) return;
    const prev = this.timeOfDay;
    this.timeOfDay = (this.timeOfDay + deltaSeconds / this.config.dayLengthSeconds) % 1;

    // Day wrap
    if (this.timeOfDay < prev) {
      this.executionsThisDay = 0;
      this.currentDayCount++;
      this.fullDayHandlers.forEach(fn => fn(this.currentDayCount));
    }

    // Hourly execution
    const currentHour = Math.floor(this.timeOfDay * 24);
    if (currentHour !== this.lastHour) {
      this.lastHour = currentHour;
      if (this.executionsThisDay < 24) {
        this.executionsThisDay++;
        this.hourHandlers.forEach(fn => fn(currentHour));
      }
    }

    this.updateOverlay();
    this.updateCelestials();
  }

  // Smoothly adjust overlay alpha based on time of day
  updateOverlay() {
    if (!this.overlay) return;
    const { minDarkAlpha, maxLightAlpha } = this.config;
    const alpha =
      minDarkAlpha +
      (maxLightAlpha - minDarkAlpha) * 0.5 *
        (1 - Math.cos(this.timeOfDay * Math.PI * 2));
    this.overlay.setAlpha(alpha);
  }

  // Position and fade the sun and moon
  updateCelestials() {
    const { sunriseStart, sunriseEnd, sunsetStart, sunsetEnd } = this.config;
    const width = this.scene.scale.width;
    const baseY = 120;
    const arc = 80;
    const t = this.timeOfDay;

    // --- Sun ---
    if (t >= sunriseStart && t <= sunsetEnd) {
      const sunT = Phaser.Math.Clamp((t - sunriseStart) / (sunsetEnd - sunriseStart), 0, 1);
      const angle = sunT * Math.PI;
      this.sun.setPosition(width * sunT, baseY - Math.sin(angle) * arc);
      if (t < sunriseEnd) {
        const p = (t - sunriseStart) / (sunriseEnd - sunriseStart);
        this.sun.setAlpha(Phaser.Math.Easing.Quadratic.InOut(p));
      } else if (t > sunsetStart) {
        const p = 1 - (t - sunsetStart) / (sunsetEnd - sunsetStart);
        this.sun.setAlpha(Phaser.Math.Easing.Quadratic.InOut(p));
      } else {
        this.sun.setAlpha(1);
      }
    } else {
      this.sun.setAlpha(0);
    }

    // --- Moon ---
    const nightLength = (1 - sunsetEnd) + sunriseStart;
    let moonT;
    if (t >= sunsetEnd) {
      moonT = (t - sunsetEnd) / nightLength;
    } else {
      moonT = (t + (1 - sunsetEnd)) / nightLength;
    }
    const moonAngle = moonT * Math.PI;
    this.moon.setPosition(width * moonT, baseY - Math.sin(moonAngle) * arc);

    let moonAlpha = 0;
    if (t >= sunsetStart && t <= sunsetEnd) {
      const p = (t - sunsetStart) / (sunsetEnd - sunsetStart);
      moonAlpha = Phaser.Math.Easing.Quadratic.InOut(p);
    } else if (t >= sunriseStart && t <= sunriseEnd) {
      const p = 1 - (t - sunriseStart) / (sunriseEnd - sunriseStart);
      moonAlpha = Phaser.Math.Easing.Quadratic.InOut(p);
    } else if (t <= sunriseStart || t >= sunsetEnd) {
      moonAlpha = 1;
    }
    this.moon.setAlpha(moonAlpha);
  }
}

// Expose globally
window.DayNightCycle = DayNightCycle;

