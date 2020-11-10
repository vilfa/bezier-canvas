/**
 * Enums for various stuff.
 */
const POINT_TYPE = {
    END: 0,
    CONTROL: 1,
    INTERPOLATED: 2
}

const LINE_TYPE = {
    CURVE: 0,
    GUIDE: 1
}

const APP_MODE = {
    DAY: 0,
    NIGHT: 1
}

/**
 * Basically the main class.
 */
class Canvas {
    constructor() {
        this.controlPoints = [];
        this.isDrawnCurve = [];
        this.isDrawnGuide = [];

        this.isDrag = false;
        this.dragId = null;

        this.guides = true;

        this.bSpline = false;

        this.stroke = {
            endPoint: 'none',
            controlPoint: 'none',
            interpolatedPoint: 'none',
            curveLine: '#05F2C7',
            guideLine: '#0D0D0D'
        };

        this.fill = {
            endPoint: '#F25050',
            controlPoint: '#F27979',
            interpolatedPoint: '#F2836B',
            curveLine: 'none',
            guideLine: 'none'
        };

        this.thickness = {
            endPoint: 1,
            controlPoint: 1,
            interpolatedPoint: 1,
            curveLine: 2,
            guideLine: 1
        };

        this.radius = {
            endPoint: 5,
            controlPoint: 4,
            interpolatedPoint: 5
        };

        this.background = '#FFFFFF';

        this.canvas = document.querySelector('#canvas');
        this.context = this.canvas.getContext('2d');
        this.controls = new Controls(this.stroke.curveLine, this.background);

        this.refreshCanvas();
        this.controls.refresh();
    }

    /**
     *
     * POINTS
     *
     */
    createPoint(point) {
        this.controlPoints.push(point);
        if (this.controlPoints.length % 2 == 0) {
            this.isDrawnGuide.push(false);
        }
        if (this.controlPoints.length % 4 == 0) {
            this.isDrawnCurve.push(false);
        }
    }

    drawPoint(point) {
        console.log('draw point.');
        if (point.type === POINT_TYPE.END) {
            this.setDrawParams(this.fill.endPoint, this.stroke.endPoint, this.thickness.endPoint);
        } else if (point.type === POINT_TYPE.CONTROL) {
            this.setDrawParams(this.fill.controlPoint, this.stroke.controlPoint, this.thickness.controlPoint);
        }
        this.context.beginPath();
        this.context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        this.context.fill();
        this.context.closePath();
    }

    movePoint(pid, event) {
        this.controlPoints[pid].x = event.x;
        this.controlPoints[pid].y = event.y;
        this.repaint();
    }

    drawAllPoints() {
        for (const point of this.controlPoints) {
            this.drawPoint(point);
        }
    }

    /**
     *
     * CURVES
     *
     */
    drawCurve(quad) {
        const curve = BezierCurve.cubic(quad[0], quad[1], quad[2], quad[3], 0.001);
        this.setDrawParams(this.fill.curveLine, this.stroke.curveLine, this.thickness.curveLine);
        BezierCurve.draw(curve, LINE_TYPE.CURVE, this.context);
    }

    drawGuide(duo) {
        let guide = BezierCurve.linear(duo[0], duo[1], 0.001);
        this.setDrawParams(this.fill.guideLine, this.stroke.guideLine, this.thickness.guideLine);
        BezierCurve.drawDashed(guide, LINE_TYPE.GUIDE, this.context);
    }

    drawAllCurves() {
        for (let i = 0; i < this.isDrawnCurve.length; i++) {
            let index = i * 4;
            let quad = [
                this.controlPoints[index],
                this.controlPoints[index + 1],
                this.controlPoints[index + 2],
                this.controlPoints[index + 3]
            ];
            this.drawCurve(quad);
            this.isDrawnCurve[i] = true;
        }
    }

    drawAllGuides() {
        for (let i = 0; i < this.isDrawnGuide.length; i++) {
            let index = i * 2;
            let duo = [
                this.controlPoints[index],
                this.controlPoints[index + 1]
            ];
            this.drawGuide(duo);
        }
    }

    bSpline() {
        if (this.bSpline) {
            this.bSpline = false;
        } else {
            this.bSpline = true;
        }


    }

    /**
     *
     * UTILITIES
     *
     */
    refreshCanvas(event) {
        if (event) {
            windowW = event.target.innerWidth;
            windowH = event.target.innerHeight;
        }
        this.canvas.width = windowW;
        this.canvas.height = windowH;
        this.repaint();
        this.controls.refresh();
    }

    clearCanvas() {
        this.context.fillStyle = this.background;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearIsDrawn() {
        for (let i = 0; i < this.isDrawnCurve.length; i++) {
            this.isDrawnCurve[i] = false;
        }
    }

    checkCollision(event) {
        for (let i = 0; i < this.controlPoints.length; i++) {
            const p = this.controlPoints[i];
            if ((event.x >= p.x - p.r) && (event.x <= p.x + p.r) && (event.y >= p.y - p.r) && (event.y <= p.y + p.r)) {
                console.log('collided point. event coords.');
                console.log(p);
                console.log(event.x, event.y);
                return { isCollided: true, pid: i };
            }
        }
        return { isCollided: false, pid: null };
    }

    isEndpoint() {
        if (this.controlPoints.length % 4 === 0) return true;
        if (this.controlPoints.length % 4 === 3) return true;
    }

    setDrawParams(fill, stroke, lineWidth) {
        this.context.fillStyle = fill;
        this.context.strokeStyle = stroke;
        this.context.lineWidth = lineWidth;
    }

    toggleGuides() {
        if (this.guides) {
            this.guides = false;
        } else {
            this.guides = true;
        }
        this.repaint();
    }

    repaint() {
        this.clearCanvas();
        this.clearIsDrawn();
        this.drawAllPoints();
        this.drawAllCurves();
        if (this.guides) {
            this.drawAllGuides();
        }
    }

    refresh() {
        this.controlPoints = [];
        this.isDrawnCurve = [];
        this.isDrawnGuide = [];

        this.isDrag = false;
        this.dragId = null;

        this.clearCanvas();
    }

    /**
     *
     * EVENT HANDLERS
     *
     */
    onMouseDown(event) {
        const collision = this.checkCollision(event);
        if (collision.isCollided) {
            console.log('collision.');
            this.isDrag = true;
            this.dragId = collision.pid;
            this.canvas.style.cursor = 'move';
        }
    }

    onMouseMove(event) {
        if (this.isDrag) {
            this.movePoint(this.dragId, event);
        }
    }

    onMouseUp(event) {
        if (!this.isDrag) {
            if (this.isEndpoint()) {
                app.createPoint(new Point(event.x, event.y, this.radius.endPoint, POINT_TYPE.END));
            } else {
                app.createPoint(new Point(event.x, event.y, this.radius.controlPoint, POINT_TYPE.CONTROL));
            }
            app.repaint();
        } else {
            this.isDrag = false;
            this.dragId = null;
            this.canvas.style.cursor = 'default';
        }
    }
}

/**
 * Static class to partition off the handling of events and also clean stuff up.
 */
class EventHandler {
    static handleWindowResize(event) {
        console.log('resize.');
        app.refreshCanvas(event);
    }

    static handleMouseDown(event) {
        app.onMouseDown(event);
        app.canvas.addEventListener('mousemove', EventHandler.handleMouseMove);
        app.canvas.addEventListener('mouseup', EventHandler.handleMouseUp);
    }

    static handleMouseMove(event) {
        app.onMouseMove(event);
    }

    static handleMouseUp(event) {
        app.onMouseUp(event);
        app.canvas.removeEventListener('mousemove', EventHandler.handleMouseMove);
    }

    static handleBackgroundColorChange(event) {
        app.controls.onColorChangeBG(event);
    }

    static handleForegroundColorChange(event) {
        app.controls.onColorChangeC(event);
    }

    static handleBSpline() {
        app.controls.onBSplineClick();
    }

    static handleToggleGuides() {
        app.controls.onToggleGuideClick();
    }

    static handleClear() {
        app.controls.onClearClick();
    }
}

/**
 * Represents the controls on the page.
 */
class Controls {
    constructor(foreground, background) {
        this.appForeground = foreground;
        this.appBackground = background;

        this.controlBox = document.querySelector('#controls');
        this.width = this.controlBox.clientWidth;
        this.height = this.controlBox.clientHeight;
        this.position = {
            top: 0,
            left: 10
        };

        this.colorCB = document.querySelector('#c-color-curves');
        this.colorBGB = document.querySelector('#c-color-background');
        this.bSplineB = document.querySelector('#c-b-spline');
        this.toggleGuidesB = document.querySelector('#c-toogle-guides');
        this.clearB = document.querySelector('#c-clear');
        this.controlElements = [this.colorCB, this.colorBGB, this.bSplineB, this.toggleGuidesB, this.clearB];

        this.color = '#FFFFFF';

        this.refresh();
    }

    refresh() {
        this.reposition();
        this.repaintControls();
        this.refreshColorPickerC(this.appForeground);
        this.refreshColorPickerBG(this.appBackground);
    }

    reposition() {
        this.position.top = (windowH - this.height) / 2;
        this.controlBox.style.left = this.position.left + 'px';
        this.controlBox.style.top = this.position.top + 'px';
    }

    repaintControls() {
        for (const button of this.controlElements) {
            button.style.backgroundColor = this.color;
        }
    }

    refreshColorPickerC(color) {
        this.colorCB.value = color;
    }

    refreshColorPickerBG(color) {
        this.colorBGB.value = color;
    }

    /**
     *
     * BUTTONS
     *
     */
    onColorChangeC(event) {
        app.stroke.curveLine = event.target.value;
        this.appForeground = event.target.value;
        this.refreshColorPickerC(this.appForeground);
        app.repaint();
    }

    onColorChangeBG(event) {
        app.background = event.target.value;
        this.appBackground = event.target.value;
        this.refreshColorPickerBG(this.appBackground);
        app.repaint();
    }

    onBSplineClick() {
        app.bSpline();
    }

    onToggleGuideClick() {
        app.toggleGuides();
    }

    onClearClick() {
        app.refresh();
    }
}

/**
 * Static class for calculating and drawing the actual curves.
 */
class BezierCurve {
    static linear(p0, p1, res) {
        let curve = [];
        // for (let t = 0; t < 1; t += res) {
        //     let px = (1 - t) * p0.x
        //         + t * p1.x;
        //     let py = (1 - t) * p0.y
        //         + t * p1.y;
        //     curve.push(new Point(px, py));
        // }
        curve.push(p0);
        curve.push(p1);
        return curve;
    }

    static quadratic(p0, p1, p2, res) {
        let curve = [];
        for (let t = 0; t < 1; t += res) {
            let px = (1 - t) ** 2 * p0.x
                + 2 * (1 - t) * t * p1.x
                + t ** 2 * p2.x;
            let py = (1 - t) ** 2 * p0.y
                + 2 * (1 - t) * t * p1.y
                + t ** 2 * p2.y;
            curve.push(new Point(px, py));
        }
        return curve;
    }

    static cubic(p0, p1, p2, p3, res) {
        let curve = [];
        for (let t = 0; t < 1; t += res) {
            let px = (1 - t) ** 3 * p0.x
                + 3 * (1 - t) ** 2 * t * p1.x
                + 3 * (1 - t) * t ** 2 * p2.x
                + t ** 3 * p3.x;
            let py = (1 - t) ** 3 * p0.y
                + 3 * (1 - t) ** 2 * t * p1.y
                + 3 * (1 - t) * t ** 2 * p2.y
                + t ** 3 * p3.y;
            curve.push(new Point(px, py));
        }
        return curve;
    }

    static draw(curve, type, context) {
        if (type === LINE_TYPE.CURVE) {
            app.setDrawParams(app.fill.curveLine, app.stroke.curveLine, app.thickness.curveLine);
        } else if (type === LINE_TYPE.GUIDE) {
            app.setDrawParams(app.fill.guideLine, app.stroke.guideLine, app.thickness.guideLine);
        }
        context.beginPath();
        context.moveTo(curve[0].x, curve[0].y);
        for (const point of curve) {
            context.lineTo(point.x, point.y);
            context.moveTo(point.x, point.y);
        }
        context.stroke();
        context.closePath();
    }

    static drawDashed(curve, type, context) {
        if (type === LINE_TYPE.CURVE) {
            app.setDrawParams(app.fill.curveLine, app.stroke.curveLine, app.thickness.curveLine);
        } else if (type === LINE_TYPE.GUIDE) {
            app.setDrawParams(app.fill.guideLine, app.stroke.guideLine, app.thickness.guideLine);
        }
        context.beginPath();
        context.setLineDash([10, 10]);
        context.moveTo(curve[0].x, curve[0].y);
        context.lineTo(curve[1].x, curve[1].y);
        context.stroke();
        context.closePath();
    }
}

/**
 * Class that represents the point.
 */
class Point {
    constructor(x, y, r, type) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.type = type;
    }
}

/**
 * main()
 */
let windowW = window.innerWidth;
let windowH = window.innerHeight;

const app = new Canvas();

window.addEventListener('resize', EventHandler.handleWindowResize);
app.canvas.addEventListener('mousedown', EventHandler.handleMouseDown);
app.controls.colorCB.addEventListener('change', EventHandler.handleForegroundColorChange);
app.controls.colorBGB.addEventListener('change', EventHandler.handleBackgroundColorChange);
app.controls.bSplineB.addEventListener('click', EventHandler.handleBSpline);
app.controls.toggleGuidesB.addEventListener('click', EventHandler.handleToggleGuides);
app.controls.clearB.addEventListener('click', EventHandler.handleClear);