import debounce from 'lodash-es/debounce';
import settings from './settings';
import loadFont from './utils/loadFont';
import { InvertColor } from './utils/invertColor';
let {
  canvasHeight,
  canvasWidth,
  fontSize,
  subtitleFontSize,
  horizontalTilt,
  textBaseLine,
  graphOffset,
  paddingX,
  hollowPath,
} = settings;
const font = 'RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff,NotoSansThai-Bold, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif';
let subtitleFont = `${subtitleFontSize}px RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`;

export default class LogoCanvas {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public textL = 'ブルー';
  public textR = 'アーカイブ';
  public subtitle = 'BlueArchive';
  private textMetricsL: TextMetrics | null = null;
  private textMetricsR: TextMetrics | null = null;
  private textMetricsST: TextMetrics | null = null;
  private canvasWidthL = canvasWidth / 2;
  private canvasWidthR = canvasWidth / 2;
  private textWidthL = 0;
  private textWidthR = 0;
  private textWidthST = 0;
  private graphOffset = graphOffset;
  private accentColor = '#128AFA';
  private mainColor = '#2B2B2B';
  private transparentBg = false;
  private swapColors = false;
  private darkMode = false;
  private mainRelativeToDarkMode = true;
  private drawSubtitle = false;
  private scaleLevel = 1;
  constructor() {
    this.canvas = document.querySelector('#canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.height = canvasHeight * this.scaleLevel;
    this.canvas.width = canvasWidth * this.scaleLevel;
    this.bindEvent();
  }
  get backgroundColor() {
    return this.darkMode ? '#2B2B2B' : '#fff';
  }
  get textColor() {
      return this.darkMode && this.mainRelativeToDarkMode ? InvertColor(this.mainColor) : this.mainColor;
  }
  get primaryColor() {
    return this.swapColors ? this.textColor : this.accentColor;
  }
  get secondaryColor() {
    return this.swapColors ? this.accentColor : this.textColor;
  }
  async draw() {
    const loading = document.querySelector('#loading')!;
    loading.classList.remove('hidden');
    const c = this.ctx;
    //predict canvas width
    await loadFont(this.textL + this.textR + this.subtitle, this.scaleLevel);
    loading.classList.add('hidden');
    c.font = `${fontSize * this.scaleLevel}px ${font}`;
    this.textMetricsL = c.measureText(this.textL);
    this.textMetricsR = c.measureText(this.textR);
    this.textMetricsST = c.measureText(this.subtitle);
    this.setWidth();
    this.canvas.height = canvasHeight * this.scaleLevel;
    //clear canvas
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //Background
    if (!this.transparentBg) {
      c.fillStyle = this.backgroundColor;
      c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    //guide line
    if (import.meta.env.DEV) {
      c.strokeStyle = '#00cccc';
      c.lineWidth = 1 * this.scaleLevel;
      c.beginPath();
      c.moveTo(this.canvasWidthL, 0);
      //c.lineTo(this.canvasWidthL, this.canvas.height);
      c.stroke();
      console.log(this.textMetricsL.width, this.textMetricsR.width, this.textMetricsST.width);
      console.log(this.textWidthL, this.textWidthR, this.textWidthST);
      c.moveTo(this.canvasWidthL - this.textWidthL, 0);
      //c.lineTo(this.canvasWidthL - this.textWidthL, this.canvas.height);
      c.moveTo(this.canvasWidthL + this.textWidthR, 0);
      //c.lineTo(this.canvasWidthL + this.textWidthR, this.canvas.height);
      c.stroke();
    }
    //blue text -> halo -> black text -> cross
    c.font = `${fontSize * this.scaleLevel}px ${font}`;
    c.fillStyle = this.primaryColor;
    c.textAlign = 'end';
    c.setTransform(1, 0, horizontalTilt, 1, 0, 0);
    c.fillText(this.textL, this.canvasWidthL, this.canvas.height * textBaseLine);
    c.resetTransform(); //restore don't work
    this.drawSVG(
      c,
      window.halo,
      this.canvasWidthL - this.canvas.height / 2 + (this.graphOffset.X * this.scaleLevel),
      this.graphOffset.Y * this.scaleLevel,
      canvasHeight * this.scaleLevel,
      canvasHeight * this.scaleLevel,
      this.textColor,
    );
    c.fillStyle = this.secondaryColor;
    c.textAlign = 'start';
    if (this.transparentBg) {
      c.globalCompositeOperation = 'destination-out';
    }
    c.strokeStyle = this.backgroundColor;
    c.lineWidth = 12 * this.scaleLevel;
    c.setTransform(1, 0, horizontalTilt, 1, 0, 0);
    c.strokeText(this.textR, this.canvasWidthL, this.canvas.height * textBaseLine);
    c.globalCompositeOperation = 'source-over';
    c.fillText(this.textR, this.canvasWidthL, this.canvas.height * textBaseLine);
    c.resetTransform();
    if(this.drawSubtitle) {
        c.font = `${subtitleFont.replace(/\d+px/gi, subtitleFontSize * this.scaleLevel + "px")}`;
        c.setTransform(1, 0, horizontalTilt * 1, 1, 0, 0);
        c.textAlign = 'end';
        c.fillText(this.subtitle, this.canvasWidthL + this.textWidthR + subtitleFontSize * this.scaleLevel, this.canvas.height * textBaseLine + subtitleFontSize * this.scaleLevel + 5);
        c.resetTransform();
    }
    const graph = {
      X: this.canvasWidthL - this.canvas.height / 2 + (graphOffset.X * this.scaleLevel),
      Y: this.graphOffset.Y * this.scaleLevel,
    };
    c.beginPath();
    c.moveTo(
      graph.X + ((hollowPath[0][0] * this.scaleLevel) / (500 * this.scaleLevel)) * (canvasHeight * this.scaleLevel),
      graph.Y + ((hollowPath[0][1] * this.scaleLevel) / (500 * this.scaleLevel)) * (canvasHeight * this.scaleLevel)
    );
    for (let i = 1; i < 4; i++) {
      c.lineTo(
        graph.X + ((hollowPath[i][0] * this.scaleLevel) / (500 * this.scaleLevel)) * (canvasHeight * this.scaleLevel),
        graph.Y + ((hollowPath[i][1] * this.scaleLevel) / (500 * this.scaleLevel)) * (canvasHeight * this.scaleLevel)
      );
    }
    c.closePath();
    if (this.transparentBg) {
      c.globalCompositeOperation = 'destination-out';
    }
    c.fillStyle = this.backgroundColor;
    c.fill();
    c.globalCompositeOperation = 'source-over';
    this.drawSVG(
      c,
      window.cross,
      this.canvasWidthL - this.canvas.height / 2 + (graphOffset.X * this.scaleLevel),
      this.graphOffset.Y * this.scaleLevel,
      canvasHeight * this.scaleLevel,
      canvasHeight * this.scaleLevel,
      this.accentColor,
    );
  }
  private drawSVG(c: CanvasRenderingContext2D, paths: string[], x: number, y: number, w: number, h: number, color: string) {
    const path = new Path2D();
    paths.forEach(pathString => {
      const matrix = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
      const transformedMatrix = matrix.scale(w / 500, h / 500);
      path.addPath(new Path2D(pathString), transformedMatrix);
    });
    c.fillStyle = color;
    c.translate(x, y);
    c.fill(path);
  }
  bindEvent() {
    const process = (id: 'textL' | 'textR' | 'subtitle' | 'subtitleSize', el: HTMLInputElement) => {
      if (id === 'subtitleSize') {
        subtitleFontSize = parseInt(el.value);
        subtitleFont = `${subtitleFontSize}px RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`;
      }
      else {
        this[id] = el.value;
      }
      this.draw();
    };
    for (const t of ['textL', 'textR', 'subtitle' ,'subtitleSize']) {
      const id = t as 'textL' | 'textR' | 'subtitle' | 'subtitleSize';
      const el = document.getElementById(id)! as HTMLInputElement;
      el.addEventListener('compositionstart', () => el.setAttribute('composing', ''));
      el.addEventListener('compositionend', () => {
        process(id, el);
        el.removeAttribute('composing');
      });
      el.addEventListener(
        'input',
        debounce(() => {
          if (el.hasAttribute('composing')) {
            return;
          }
          process(id, el);
        }, 300)
      );
      console.log("sad")
    }
    document.querySelector('#save')!.addEventListener('click', () => this.saveImg());
    document.querySelector('#copy')!.addEventListener('click', () => this.copyImg());
    const tSwitch = document.querySelector('#transparent')! as HTMLInputElement;
    tSwitch.checked = false;
    tSwitch.addEventListener('change', () => {
      this.transparentBg = tSwitch.checked;
      this.draw();
    });
    const sSwitch = document.querySelector("#sub-toggle")! as HTMLInputElement;
    sSwitch.checked = false;
    sSwitch.addEventListener("change", () => {
        this.drawSubtitle = !this.drawSubtitle;
        this.draw();
    })
    const scSwitch = document.querySelector('#swap-colors')! as HTMLInputElement;
    scSwitch.checked = false;
    scSwitch.addEventListener('change', () => {
      this.swapColors = scSwitch.checked;
      this.draw();
    });
    const mcrSwitch = document.querySelector('#main-color-dark-relative-mode')! as HTMLInputElement;
    mcrSwitch.checked = true;
    mcrSwitch.addEventListener('change', () => {
      this.mainRelativeToDarkMode = mcrSwitch.checked;
      this.draw();
    });
    const dSwitch = document.querySelector('#dark-mode')! as HTMLInputElement;
    dSwitch.checked = false;
    dSwitch.addEventListener('change', () => {
      this.darkMode = dSwitch.checked;
      this.draw();
    });
    const accentColorInput = document.querySelector('#accent-color')! as HTMLInputElement;
    accentColorInput.value = this.accentColor;
    accentColorInput.addEventListener('input', () => {
      this.accentColor = accentColorInput.value;
      this.draw();
    });
    const mainColorInput = document.querySelector('#main-color')! as HTMLInputElement;
    mainColorInput.value = this.mainColor;
    mainColorInput.addEventListener('input', () => {
      this.mainColor = mainColorInput.value;
      this.draw();
    });
    document.querySelector('#reset-colors')!.addEventListener('click', () => {
        accentColorInput.value = "#128AFA";
        this.accentColor = "#128AFA";
        mainColorInput.value = "#2B2B2B";
        this.mainColor = "#2B2B2B";
        this.draw();
    });
    const gx = document.querySelector('#graphX')! as HTMLInputElement;
    const gxr = document.querySelector('#graphX-range')! as HTMLInputElement;
    const gy = document.querySelector('#graphY')! as HTMLInputElement;
    const gyr = document.querySelector('#graphY-range')! as HTMLInputElement;
    gyr.max = ( this.canvas.height / 2 ).toString();
    gyr.min = ( -this.canvas.height / 2 ).toString();
    gx.value = gx.getAttribute("value") || "-15";
    gy.value = gy.getAttribute("value") || "0";
    gxr.value = gx.value;
    gyr.value = gy.value;
    gx.addEventListener('input', () => {
      this.graphOffset.X = parseInt(gx.value);
      gxr.value = gx.value;
      this.draw();
    });
    gxr.addEventListener('input', () => {
      this.graphOffset.X = parseInt(gxr.value);
      gx.value = gxr.value;
      this.draw();
    });
    gy.addEventListener('input', () => {
      this.graphOffset.Y = parseInt(gy.value);
      gyr.value = gy.value;
      this.draw();
    });
    gyr.addEventListener('input', () => {
      this.graphOffset.Y = parseInt(gyr.value);
      gy.value = gyr.value;
      this.draw();
    });
    const scaleInput = document.querySelector('#scaleLevel')! as HTMLInputElement;
    const scaleLabel = document.querySelector('#scale-level-label')! as HTMLInputElement;
    scaleInput.value = "1";
    scaleInput.addEventListener('input', async () => {
      this.scaleLevel = parseInt(scaleInput.value);
      await this.draw();

      let width = Math.floor(this.textWidthL + this.textWidthR + paddingX * this.scaleLevel * 2);
      let height = this.canvas.height;
      scaleLabel.textContent = `${width} x ${height} px`;
    });
    scaleInput.dispatchEvent(new Event("input"));
  }
  setWidth() {
    this.textWidthL =
      this.textMetricsL!.width -
      (textBaseLine * (canvasHeight * this.scaleLevel) + this.textMetricsL!.fontBoundingBoxDescent) * horizontalTilt;
    this.textWidthR =
      this.textMetricsR!.width +
      (textBaseLine * (canvasHeight * this.scaleLevel) - this.textMetricsR!.fontBoundingBoxAscent) * horizontalTilt;
    //extend canvas
    this.canvasWidthL =
      this.textWidthL + (paddingX * this.scaleLevel) > (canvasWidth * this.scaleLevel) / 2 ?
        this.textWidthL + (paddingX * this.scaleLevel) : (canvasWidth * this.scaleLevel) / 2;
    this.canvasWidthR =
      this.textWidthR + (paddingX * this.scaleLevel) > (canvasWidth * this.scaleLevel) / 2 ?
        this.textWidthR + (paddingX * this.scaleLevel) : (canvasWidth * this.scaleLevel) / 2;
    const gxr = document.querySelector('#graphX-range')! as HTMLInputElement;
    gxr.min = (-Math.round(this.canvasWidthL / this.scaleLevel)).toString();
    gxr.max = (Math.round(this.canvasWidthR / this.scaleLevel)).toString();
    this.canvas.width = this.canvasWidthL + this.canvasWidthR;
  }
  generateImg() {
    let outputCanvas: HTMLCanvasElement;
      outputCanvas = document.createElement('canvas');
      outputCanvas.width = this.textWidthL + this.textWidthR + (paddingX * this.scaleLevel) * 2;
      outputCanvas.height = this.canvas.height;
      const ctx = outputCanvas.getContext('2d')!;
      ctx.drawImage(
        this.canvas,
        canvasWidth / 2 - this.textWidthL - paddingX,
        0,
        outputCanvas.width,
        outputCanvas.height,
        0,
        0,
        outputCanvas.width,
        outputCanvas.height,
      );
    return new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob((blob) => blob ? resolve(blob) : reject());
    });
  }
  saveImg() {
    this.generateImg().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.textL}${this.textR}_ba-style.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  async copyImg() {
    const blob = await this.generateImg();
    const cp = [new ClipboardItem({ 'image/png': blob })];
    navigator.clipboard
      .write(cp)
      .then(() => {
        console.log('image copied');
        const msg = document.querySelector('#message-switch') as HTMLInputElement;
        msg.checked = true;
        setTimeout(() => (msg.checked = false), 2000);
      })
      .catch((e) => console.error("can't copy", e));
  }
  resetColor() {
      this.mainColor = "#2B2B2B";
      this.accentColor = "#128AFA";
      this.draw();
  }
}
