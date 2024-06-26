class WE {
    constructor(rootId, node, dpi = 2, helpersSize = 10) {
        this.helpersSize = helpersSize;
        this.helpers = [];
        this.minsize = 20;
        this.node = node;
        this.dpi = dpi;
        this.root = document.getElementById(rootId);
        this.canvas = document.createElement("canvas");
        this.hEl = document.createElement("input");
        this.wEl = document.createElement("input");
        this.tip = document.createElement("span");
        this.colEl = [];
        this.rowEl = [];
        this.ctx = null;
        this.snapMode = false;
        this.forceCenter = true;
        this.thumbs = {
            res: 128,
            factor: 1,
        }
    }

    calcAvailableSpace(dir, index) {
        let spaceLeft = 0;
        let fixedSize = 0;
        this.helpers.forEach((helper, i) => {
            if (helper.index != index && helper.dir == dir) {
                helper.type == "text"
                    ? fixedSize += this.minsize
                    : fixedSize += (helper.value);
            }
        })
        dir == "col"
            ? spaceLeft = this.node.params.w - fixedSize
            : spaceLeft = this.node.params.h - fixedSize;
        return (spaceLeft);
    }

    parseParam(v) {
        let dir = v.size.substring(0, v.size.indexOf("-"));
        let index = v.size.substring(parseInt(v.size.indexOf("-") + 1, v.size.length));
        if (!this.node.params[dir][index])
            console.warn("WRONG PARAMETER: dir " + dir + " index " + index);
        else
            return ([this.node.params[dir][index], dir, index]);
    }

    calcOffset() {
        this.node.oldOffsetX = this.node.offsetX;
        this.node.oldOffsetY = this.node.offsetY;
        if (this.forceCenter) {
            this.node.offsetX = (this.canvas.width - (this.node.geom.x2 - this.node.geom.x1) - this.helpersSize) / 2;
            this.node.offsetY = (this.canvas.height - (this.node.geom.y2 - this.node.geom.y1) + this.helpersSize) / 2;
        } else {
            this.node.offsetX = (this.canvas.width - (this.node.geom.x2 - this.node.geom.x1)) / 2;
            this.node.offsetY = (this.canvas.height - (this.node.geom.y2 - this.node.geom.y1)) / 2;
        }
    }

    scaleGeometry(node) {
        if (!this.node.factor)
            this.node.factor = this.node.dpi;
        for (let key in node.geom) {
            node.geom[key] *= this.node.factor;
        }
        if (node.child)
            node.child.forEach((e) => this.scaleGeometry(e));
    }

    getArea() {
        let res = {
            w: [],
            h: [],
            area: 0,
        };
        let fixedCol = this.node.params.w - this.node.params.col.reduce((acc, v) => acc + v, 0);
        let fixedRow = this.node.params.h - this.node.params.row.reduce((acc, v) => acc + v, 0);
        let autoCol = fixedCol;
        let autoRow = fixedRow;
        if (this.node.params.col.length && this.node.params.colOrder)
            autoCol = autoCol / (this.node.params.colOrder.length - this.node.params.col.length)
        if (this.node.params.rowOrder && this.node.params.row.length)
            autoRow = autoRow / (this.node.params.rowOrder.length - this.node.params.row.length)
        if (this.node.params.areas) {
            this.node.params.areas.forEach((coords, i) => {
                let dir = coords.w.split("-")[0];
                let index = coords.w.split("-")[1];

                if (coords.options[coords.triangle] != undefined && coords.options[coords.triangle] != "none"){
                    index == "x"
                        ? res.w.push(autoCol)
                        : res.w.push((this.node.params[dir][index] || 0));
                    dir = coords.h.split("-")[0];
                    index = coords.h.split("-")[1];
                    index == "x"
                        ? res.h.push(autoRow)
                        : res.h.push((this.node.params[dir][index] || 0));
                    res.area += res.w[res.w.length - 1] * res.h[res.h.length - 1];   
                }
                console.log(res); 
            })
        } else {
            console.error("No area data specified!");
        }
        return (res);
    }

    calcNode(node, parent = null, i = 0) {
        node.bb = { x1: 0, y1: 0, x2: 0, y2: 0 };
        node.geom = { ...node.bb };

        if (!node.dir && node.child)
            node.dir = "h";
        if (!node.gap && node.child)
            node.gap = 0;
        if (!node.pd)
            node.pd = [0, 0, 0, 0]
        else if (node.pd.length == 1)
            node.pd = new Array(4).fill(node.pd[0]);
        if (!node) {
            console.error("NO NODE OBJECT! Failed to CalcNode");
            return;
        }

        //--- main geometry
        if (!parent) {
            node.bb = {
                x1: 0,
                y1: 0,
                x2: this.node.params.w,
                y2: this.node.params.h
            };
            node.geom = { ...node.bb };
        } else {
            if (parent.dir == "h") {
                let pw = parent.geom.x2 - parent.geom.x1;
                node.bb.y1 = parent.geom.y1;
                node.bb.y2 = parent.geom.y2;
                //--- get size of all previous child
                if (i > 0)
                    node.bb.x1 += parent.child[i - 1].bb.x2
                else
                    node.bb.x1 = parent.geom.x1;
                typeof node.size == "string"
                    ? node.bb.x2 = node.bb.x1 + this.parseParam(node)[0]
                    : node.bb.x2 = node.bb.x1 + parent.autoSize;
            } else {
                let ph = parent.geom.y2 - parent.geom.y1;
                node.bb.x1 = parent.geom.x1;
                node.bb.x2 = parent.geom.x2;
                //--- get size of all previous child
                if (i > 0)
                    node.bb.y1 += parent.child[i - 1].bb.y2
                else
                    node.bb.y1 = parent.geom.y1;
                typeof node.size == "string"
                    ? node.bb.y2 = node.bb.y1 + this.parseParam(node)[0]
                    : node.bb.y2 = node.bb.y1 + parent.autoSize;
            }
            node.geom = { ...node.bb };
            //--- padding from parent
            if (parent.child.length > 1) {
                if (parent.dir == "h") {
                    node.geom.y1 += parent.pd[0];
                    node.geom.y2 -= parent.pd[2];
                    if (i == 0)
                        node.geom.x1 += parent.pd[1];
                    if (i == parent.child.length - 1)
                        node.geom.x2 -= parent.pd[3];
                    //---gap
                    if (i > 0)
                        node.geom.x1 += parent.gap / 2;
                    if (i < parent.child.length - 1)
                        node.geom.x2 -= parent.gap / 2;
                } else {
                    node.geom.x1 += parent.pd[1];
                    node.geom.x2 -= parent.pd[3];
                    if (i == 0)
                        node.geom.y1 += parent.pd[0];
                    if (i == parent.child.length - 1)
                        node.geom.y2 -= parent.pd[2];
                    //---gap
                    if (i > 0)
                        node.geom.y1 += parent.gap / 2;
                    if (i < parent.child.length - 1)
                        node.geom.y2 -= parent.gap / 2;
                }
            } else {
                node.geom.x1 += parent.pd[3];
                node.geom.x2 -= parent.pd[1];
                node.geom.y1 += parent.pd[0];
                node.geom.y2 -= parent.pd[2];
            }
        }

        //--- calc auto size for child
        if (node.child) {
            let fixedSize = 0;
            let affectedChild = node.child.length;
            node.child.forEach((v) => {
                if (typeof v.size == "string") {
                    fixedSize += this.parseParam(v)[0];
                    affectedChild -= 1;
                }
            })
            node.dir == "h"
                ? node.autoSize = (node.geom.x2 - node.geom.x1 - fixedSize) / (affectedChild)
                : node.autoSize = (node.geom.y2 - node.geom.y1 - fixedSize) / (affectedChild);

            if (node.child)
                node.child.forEach((e, j) => this.calcNode(e, node, j));
        }
    }

    drawHelpers() {
        this.ctx.strokeStyle = "#000";
        this.ctx.fillStyle = "#000";
        this.ctx.lineWidth = this.dpi * 1.5;
        this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.beginPath();

        let multiplier = 1;

        if (this.helpers.length)
            multiplier *= 2;

        this.ctx.moveTo(this.node.geom.x1, this.node.geom.y1);
        this.ctx.lineTo(this.node.geom.x1, this.node.geom.y1 - this.helpersSize * multiplier);
        this.ctx.moveTo(this.node.geom.x2, this.node.geom.y1);
        this.ctx.lineTo(this.node.geom.x2, this.node.geom.y1 - this.helpersSize * multiplier);
        this.ctx.moveTo(this.node.geom.x1, this.node.geom.y1 - this.helpersSize * multiplier * 0.95);
        this.ctx.lineTo(this.node.geom.x2, this.node.geom.y1 - this.helpersSize * multiplier * 0.95);

        this.ctx.moveTo(this.node.geom.x2, this.node.geom.y1);
        this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * multiplier, this.node.geom.y1);
        this.ctx.moveTo(this.node.geom.x2, this.node.geom.y2);
        this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * multiplier, this.node.geom.y2);
        this.ctx.moveTo(this.node.geom.x2 + this.helpersSize * multiplier * 0.95, this.node.geom.y1);
        this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * multiplier * 0.95, this.node.geom.y2);

        if (this.snapMode) {
            let textX = (this.node.geom.x2 - this.node.geom.x1) / this.dpi;
            let textY = this.node.geom.y1 - (this.helpersSize * multiplier);
            this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
            this.ctx.fillText(parseFloat(this.node.params.w.toFixed(2)), textX, textY);
            this.ctx.fillStyle = "#000";

            textX = this.node.geom.x2 + (this.helpersSize * (multiplier * 0.65) + 60);
            textY = (this.node.geom.y2 - this.node.geom.y1) / this.dpi;
            this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
            this.ctx.fillText(parseFloat(this.node.params.h.toFixed(2)), textX, textY);
            this.ctx.fillStyle = "#000";
        }

        this.helpers.forEach((helper, i) => {
            if (helper.dir == "col") {
                this.ctx.moveTo(helper.pos * this.node.factor, this.node.geom.y1);
                this.ctx.lineTo(helper.pos * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.95);
                this.ctx.moveTo((helper.pos + helper.value) * this.node.factor, this.node.geom.y1);
                this.ctx.lineTo((helper.pos + helper.value) * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.95);
                this.ctx.moveTo((helper.pos) * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.85);
                this.ctx.lineTo((helper.pos + helper.value) * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.85);
                if (helper.type == "text" || this.snapMode) {
                    let textX = (helper.pos + helper.value / 2) * this.node.factor;
                    let textY = this.node.geom.y1 - this.helpersSize / 2 + 10 * this.dpi;
                    if (helper.value < (this.minsize + 1) && !this.snapMode) {
                        this.ctx.fillStyle = "#ce2020"
                        this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
                        this.ctx.fillText(parseFloat(helper.value.toFixed(2)), textX, textY - 10);
                        this.ctx.font = `bold ${this.dpi * 12}px sans-serif`;
                        this.ctx.fillText("Min." + this.minsize, textX, textY + 10);
                    } else {
                        this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
                        this.ctx.fillText(parseFloat(helper.value.toFixed(2)), textX, textY);
                    }
                    this.ctx.fillStyle = "#000";
                }
            }
            if (helper.dir == "row") {
                this.ctx.moveTo(this.node.geom.x2, helper.pos * this.node.factor);
                this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * 0.95, helper.pos * this.node.factor);
                this.ctx.moveTo(this.node.geom.x2, (helper.pos + helper.value) * this.node.factor);
                this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * 0.95, (helper.pos + helper.value) * this.node.factor);
                this.ctx.moveTo(this.node.geom.x2 + this.helpersSize * 0.85, (helper.pos) * this.node.factor);
                this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * 0.85, (helper.pos + helper.value) * this.node.factor);
                if (helper.type == "text" || this.snapMode) {
                    let textX = this.node.geom.x2 + this.helpersSize / (2.4);
                    let textY = (helper.pos + helper.value / 2) * this.node.factor + (this.node.factor * 4);
                    if (helper.value < (this.minsize + 1) && !this.snapMode) {
                        this.ctx.fillStyle = "#ce2020"
                        this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
                        this.ctx.fillText(parseFloat(helper.value.toFixed(2)), textX, textY - 10);
                        this.ctx.font = `bold ${this.dpi * 12}px sans-serif`;
                        this.ctx.fillText("Min." + this.minsize, textX, textY + 10);
                    } else {
                        this.ctx.font = `bold ${this.dpi * 22}px sans-serif`;
                        this.ctx.fillText(parseFloat(helper.value.toFixed(2)), textX, textY);
                    }
                }
            }
        })

        this.ctx.closePath();
        this.ctx.stroke();
    }

    setRelief(el = this.hEl) {
        el.classList.remove("urgent");
        this.tip.style.display = "none";
    }

    setUrgent(el = this.hEl, type = "min", value = 100500) {
        let msgStr = "";
        el.classList.add("urgent");
        this.tip.style.top = el.style.top;
        this.tip.style.left = el.style.left;
        this.tip.style.display = "block";
        type == "min"
            ? msgStr += "Min. "
            : msgStr += "Max. "
        msgStr += value;
        this.tip.innerHTML = msgStr;
    }

    stash() {
        this.backNode = JSON.parse(JSON.stringify(this.node));
        this.backHelpers = JSON.parse(JSON.stringify(this.helpers));
    }
    undo() {
        this.node = JSON.parse(JSON.stringify(this.backNode));
        this.helpers = JSON.parse(JSON.stringify(this.backHelpers));
    }

    resetInputs() {
        this.hEl.value = this.node.params.h;
        this.wEl.value = this.node.params.w;
        this.helpers.forEach((helper, i) => {
            if (helper.type == "input") {
                this[(helper.dir) + "El"][helper.index].value = helper.value;
            }
        })
    }

    getSnapshot() {
        this.snapMode = true;
        this.update();
        let blobPromise = new Promise((resolve) => {
            this.canvas.toBlob((blob) => { resolve(blob) }, "image/png");
        });
        this.snapMode = false;
        this.update();
        return blobPromise;
    }

    getSnapshotBase64() {
        this.snapMode = true;
        this.forceCenter = true;
        this.update();
        let b64 = this.canvas.toDataURL("image/png");
        this.snapMode = false;
        this.forceCenter = true;
        this.update();
        return b64;
    }

    checkBounds(driverDir, driverIndex) {
        let bounds = false;
        this.helpers.forEach((helper, i) => {
            let newLimit = this.calcAvailableSpace(driverDir, driverIndex);
            if (helper.value < this.minsize) {
                this.undo();
                bounds = true;
                this.resetInputs();
                this.setParam("" + driverDir + "-" + driverIndex, newLimit);
                this.syncInputs();
                this.helpers[i].urgent = true;
            } else {
                this.helpers[i].urgent = false;
            }
        })
        return bounds;
    }

    validate(el, value, min, max) {
        min = (min || this.minsize);
        max = (max || 1000);
        let res = 0;
        if (value < max && value > min) {
            res = value;
            this.setRelief(el);
        }
        else if (value <= min) {
            setTimeout(() => { this.setUrgent(el, "min", min) }, 50);
            res = min;
        }
        else if (value >= max) {
            setTimeout(() => { this.setUrgent(el, "max", max) }, 50);
            res = max;
        }
        res = parseInt(res);
        el.value = res;
        return (res);
    }

    applyRatioSize(dir = "col") {
        let ratioReset = false;
        let newRatio = [];
        let elCount = 0;

        if (dir == "col") {
            this.initRatio.forEach((ratio, j) => {
                if (ratio * this.node.params.w < (this.minsize + 1)) { ratioReset = true; }
            });
            if (ratioReset) {
                this.initRatio.forEach((ratio, j) => {
                    if (this.node.params.colOrder.length && j < this.node.params.colOrder.length)
                        this.initRatio[j] = (1 / this.node.params.colOrder.length);
                });
            }
        }
        if (dir == "row") {
            this.initRatio.forEach((ratio, j) => {
                if (ratio * this.node.params.h < (this.minsize + 1)) { ratioReset = true; }
            });
            if (ratioReset) {
                this.initRatio.forEach((ratio, j) => {
                    let rowj = j - this.node.params.colOrder.length;
                    if (rowj > 0)
                        this.initRatio[j] = (1 / this.node.params.rowOrder.length);
                });
            }
        }

        this.helpers.forEach((helper, i) => {
            if (helper.dir == "col" && dir == "col") {
                if (!isNaN(helper.index) && this.node.params.col[helper.index] != undefined) {
                    let newVal = Math.trunc(this.node.params.w * this.initRatio[i] * 10) / 10;
                    this.node.params.col[helper.index] = newVal;
                    helper.value = newVal;
                    if (this.colEl[helper.index])
                        this.colEl[helper.index].value = helper.value;
                }
            }
            if (helper.dir == "row" && dir == "row") {
                if (!isNaN(helper.index) && this.node.params.row[helper.index] != undefined) {
                    let newVal = Math.trunc(this.node.params.h * this.initRatio[i] * 10) / 10;
                    this.node.params.row[helper.index] = newVal;
                    helper.value = newVal;
                    if (this.rowEl[helper.index])
                        this.rowEl[helper.index].value = helper.value;
                }
            }
        })

        this.updateInputs();
    }

    setParam(param = "height", value = 100, limit = null) {
        let dir = "";
        let index = 0;

        this.stash();

        if (param == "height") {
            dir = "row"
            if (!limit) {
                this.node.params.h = this.validate(this.hEl, value,
                    this.node.params.minh,
                    this.node.params.maxh);
            } else {
                limit == "max"
                    ? this.hEl.max = this.params.maxh = value
                    : this.hEl.min = this.params.minh = value;
            }
        }
        else if (param == "width") {
            dir = "col"
            if (!limit) {
                this.node.params.w = this.validate(this.wEl, value,
                    this.node.params.minw,
                    this.node.params.maxw);
            } else {
                limit == "max"
                    ? this.wEl.max = this.params.maxw = value
                    : this.wEl.min = this.params.minw = value;
            }
        }
        else {
            dir = param.split("-")[0];
            index = param.split("-")[1];

            if (dir == "col") {
                if (!limit) {
                    this.node.params.col[index] = this.validate(this.colEl[index], value,
                        this.node.params.minCol[index],
                        this.node.params.maxCol[index]);
                } else {
                    limit == "max"
                        ? this.colEl[index].max = this.params.maxCol[index] = value
                        : this.colEl[index].min = this.params.minCol[index] = value;
                }
            }
            if (dir == "row") {
                if (!limit) {
                    this.node.params.row[index] = this.validate(this.rowEl[index], value,
                        this.node.params.minRow[index],
                        this.node.params.maxRow[index]);
                } else {
                    limit == "max"
                        ? this.rowEl[index].max = this.params.maxRow[index] = value
                        : this.rowEl[index].min = this.params.minRow[index] = value;
                }
            }
        }

        this.update();

        if (param == "height" || param == "width") {
            this.applyRatioSize(dir)
        } else {
            this.checkBounds(dir, index);
            this.calcRatio();
        }

        this.update();
        console.log(this);
    }

    syncInputs() {
        this.wEl.value = this.node.params.w;
        this.hEl.value = this.node.params.h;
        if (this.node.params.col)
            this.node.params.col.forEach((e, i) => { this.colEl[i].value = e; })
        if (this.node.params.row)
            this.node.params.row.forEach((e, i) => { this.rowEl[i].value = e; })
    }

    updateInputs() {
        let inputOffsetX = (this.node.params.w * this.node.factor) / (this.dpi * 2);
        let inputOffsetY = (this.node.params.h * this.node.factor) / (this.dpi * 2);

        let multiplier = 1;
        if (!this.helpers.length)
            multiplier = 0.5;

        this.wEl.style.top = `calc(50% - ${inputOffsetY + this.helpersSize * multiplier * (2 / this.dpi) - (this.helpersSize / 2)}px)`;
        this.wEl.style.left = `calc(50% - ${inputOffsetX - this.node.params.w * (this.node.factor / this.dpi) / 2 + (this.helpersSize / 2)}px)`;
        this.hEl.style.top = `50%`;
        this.hEl.style.left = `calc(50% - ${inputOffsetX - (this.node.params.w / this.dpi) * this.node.factor - this.helpersSize * multiplier * (2 / this.dpi)}px`;

        this.helpers.forEach((helper, i) => {
            if (helper.type == "input") {
                let j = helper.index;
                if (helper.dir == "col" && this.colEl[j]) {
                    this.colEl[j].style.left = `calc(50% - ${inputOffsetX - (this.helpers[i].pos + this.helpers[i].value / 2) * this.node.factor / this.dpi}px)`;
                    this.colEl[j].style.top = `calc(50% - ${inputOffsetY + this.helpersSize / (this.dpi * 1.1)}px)`;
                }
                if (helper.dir == "row" && this.rowEl[j]) {
                    this.rowEl[j].style.top = `calc(50% - ${inputOffsetY - (this.helpers[i].pos + this.helpers[i].value / 2) * this.node.factor / this.dpi}px)`;
                    this.rowEl[j].style.left = `calc(50% + ${inputOffsetX + this.helpersSize / (this.dpi * 1.2)}px)`;
                }
            }
        })
    }

    initInputs() {
        this.wEl.value = (this.node.params.w || 10);
        this.wEl.setAttribute("id", "we-width")
        this.wEl.type = "number";
        this.hEl.value = (this.node.params.h || 10);
        this.hEl.setAttribute("id", "we-height");
        this.hEl.type = "number";
        if (!isNaN(this.node.params.maxh))
            this.hEl.max = this.node.params.maxh;
        if (!isNaN(this.node.params.minh))
            this.hEl.min = this.node.params.minh;
        if (!isNaN(this.node.params.maxw))
            this.wEl.max = this.node.params.maxw;
        if (!isNaN(this.node.params.minw))
            this.wEl.min = this.node.params.minw;

        this.tip.classList.add("tooltip");
        this.tip.style.display = "none"
        this.root.appendChild(this.hEl);
        this.root.appendChild(this.wEl);
        this.root.appendChild(this.tip);

        this.colEl.forEach((el) => { el.remove() });
        this.rowEl.forEach((el) => { el.remove() });

        this.colEl = [];
        this.rowEl = [];

        if (this.node.params.row)
            this.node.params.row.forEach((row, i) => {
                this.rowEl.push(document.createElement("input"));
                this.rowEl[i].value = row;
                this.rowEl[i].type = "number";
                this.rowEl[i].setAttribute("id", "we-row-" + i);
                this.rowEl[i].addEventListener("blur", () => { this.setRelief(this.rowEl[i]) });
                this.rowEl[i].addEventListener("change", (el) => { this.setParam("row-" + i, el.target.value) });

                this.root.appendChild(this.rowEl[i]);
            })
        if (this.node.params.col)
            this.node.params.col.forEach((col, i) => {
                this.colEl.push(document.createElement("input"));
                this.colEl[i].value = col;
                this.colEl[i].type = "number";
                this.colEl[i].setAttribute("id", "we-col-" + i);
                this.colEl[i].addEventListener("blur", () => { this.setRelief(this.colEl[i]) });
                this.colEl[i].addEventListener("change", (el) => { this.setParam("col-" + i, el.target.value) });

                this.root.appendChild(this.colEl[i]);
            })

        this.hEl.addEventListener("blur", () => { this.setRelief(this.hEl) });
        this.wEl.addEventListener("blur", () => { this.setRelief(this.wEl) });
        this.hEl.addEventListener("change", (el) => { this.setParam("height", el.target.value) });
        this.wEl.addEventListener("change", (el) => { this.setParam("width", el.target.value) });
    }

    calcRatio() {
        if (this.helpers) {
            let intiialRatio = [];
            this.helpers.forEach((helper, i) => {
                helper.dir == "col"
                    ? intiialRatio.push(helper.value / this.node.params.w)
                    : intiialRatio.push(helper.value / this.node.params.h);
            })
            this.initRatio = [...intiialRatio];
        }
    }

    calcHelpers(firstEntry = false) {
        this.helpers = [];

        if (this.node.params.col.length > 0) {
            if (!this.node.params.colOrder) {
                this.node.params.colOrder = Array.from(Array(this.node.params.col.length).keys())
                this.node.params.colOrder.push(-1);
            }
        }
        if (this.node.params.row.length > 0) {
            if (!this.node.params.rowOrder) {
                this.node.params.rowOrder = Array.from(Array(this.node.params.row.length).keys())
                this.node.params.rowOrder.push(-1);
            }
        }
        if (this.node.params.colOrder)
            this.node.params.colOrder.forEach((order, i) => {
                let helper = { dir: "col" };
                if (order < 0) {
                    helper.type = "text";
                    let fixedSize = this.node.params.col.reduce((acc, v) => acc += v, 0);
                    helper.value = (this.node.params.w - fixedSize) /
                        (this.node.params.colOrder.length - this.node.params.col.length);
                } else {
                    helper.index = this.node.params.colOrder[i];
                    helper.type = "input";
                    helper.value = this.node.params.col[order];

                }
                helper.pos = 0;
                for (let k = 0; k < i; k++) {
                    helper.pos += this.helpers[k].value;
                    helper.inputPos = helper.pos + helper.value / 2;
                }
                this.helpers.push(helper);
            })
        if (this.node.params.rowOrder)
            this.node.params.rowOrder.forEach((order, i) => {
                let helper = { dir: "row" };
                if (order < 0) {
                    helper.type = "text";
                    let fixedSize = this.node.params.row.reduce((acc, v) => acc += v, 0);
                    helper.value = (this.node.params.h - fixedSize) /
                        (this.node.params.rowOrder.length - this.node.params.row.length);
                } else {
                    helper.index = this.node.params.rowOrder[i];
                    helper.type = "input";
                    helper.value = this.node.params.row[order];
                }
                helper.pos = 0;
                for (let k = 0; k < i; k++) {
                    if (this.node.params.colOrder)
                        helper.pos += this.helpers[k + this.node.params.colOrder.length].value
                    else
                        helper.pos += this.helpers[k].value
                    helper.inputPos = helper.pos + helper.value / 2;
                }
                this.helpers.push(helper);
            })
    }

    drawTriangle(node, dir = "none", vscale = 1, hscale = 1){
        switch (dir) {
            case "right":
                this.ctx.moveTo(node.geom.x1, node.geom.y1);
                this.ctx.lineTo(node.geom.x2, node.geom.y2 - (node.geom.y2 - node.geom.y1) / 2);
                this.ctx.lineTo(node.geom.x1, node.geom.y2);
                break;
            case "left":
                this.ctx.moveTo(node.geom.x2, node.geom.y1);
                this.ctx.lineTo(node.geom.x1, node.geom.y2 - (node.geom.y2 - node.geom.y1) / 2);
                this.ctx.lineTo(node.geom.x2, node.geom.y2);
                break;
            case "bottom":
                this.ctx.moveTo(node.geom.x1, node.geom.y1);
                this.ctx.lineTo(node.geom.x2 - (node.geom.x2 - node.geom.x1) / 2, node.geom.y2);
                this.ctx.lineTo(node.geom.x2, node.geom.y1);
                break;
            case "top":
                this.ctx.moveTo(node.geom.x1, node.geom.y2);
                this.ctx.lineTo(node.geom.x2 - (node.geom.x2 - node.geom.x1) / 2, node.geom.y1);
                this.ctx.lineTo(node.geom.x2, node.geom.y2);
                break;
            default:
                let dirlist = dir.split("-");
                dirlist.forEach(adir => {
                    if (typeof adir == 'string' && adir != "none" && adir != "")
                        this.drawTriangle(node, adir);
                });
        }
    }

    drawNode(node, firstEntry = true) {
        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = this.dpi * 1.5;
        this.ctx.fillStyle = "#fefdfa";
        if (node.glass)
            this.ctx.fillStyle = "#afdfff";
        this.ctx.fillRect(node.geom.x1,
            node.geom.y1,
            node.geom.x2 - node.geom.x1,
            node.geom.y2 - node.geom.y1);
        if (!node.borderless)
            this.ctx.strokeRect(node.geom.x1,
                node.geom.y1,
                node.geom.x2 - node.geom.x1,
                node.geom.y2 - node.geom.y1);
        if (node.child)
            node.child.forEach((e) => this.drawNode(e, false));
        if (node.winId != undefined) {
            let curTriangle = "none";
            if (this.node.params?.areas[node.winId]?.options)
                this.node.params.areas[node.winId].triangle
                    ? curTriangle = this.node.params.areas[node.winId].options[this.node.params.areas[node.winId].triangle]
                    : curTriangle = this.node.params.areas[node.winId].options[0];
            this.ctx.beginPath();
            this.drawTriangle(node, curTriangle);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    drawNodeThumb(node, firstEntry = true, lCtx, option = 0) {
        lCtx.strokeStyle = "#000";
        lCtx.lineWidth = 1;
        lCtx.fillStyle = "#afdfff";
        if (firstEntry) {
            lCtx.strokeRect(node.bb.x1 * this.thumbs.factor,
                node.bb.y1 * this.thumbs.factor,
                (node.bb.x2 - node.bb.x1) * this.thumbs.factor,
                (node.bb.y2 - node.bb.y1) * this.thumbs.factor);
        }
        // if (node.winId != undefined) {
        if (node.glass || node.winId != undefined) {
            // lCtx.fillStyle = `hsl(${(node.winId || 0) * 60}deg, 70%, 60%)`;
            option == node.winId
                ? lCtx.fillStyle = "#60a0ff"
                : lCtx.fillStyle = "#afdfff";
            lCtx.fillRect(node.bb.x1 * this.thumbs.factor,
                node.bb.y1 * this.thumbs.factor,
                (node.bb.x2 - node.bb.x1) * this.thumbs.factor,
                (node.bb.y2 - node.bb.y1) * this.thumbs.factor);
            lCtx.strokeRect(node.bb.x1 * this.thumbs.factor,
                node.bb.y1 * this.thumbs.factor,
                (node.bb.x2 - node.bb.x1) * this.thumbs.factor,
                (node.bb.y2 - node.bb.y1) * this.thumbs.factor);
        }

        if (node.child)
            node.child.forEach((e) => this.drawNodeThumb(e, false, lCtx, option));
    }

    calcThumbs() {
        let maxSide = Math.max(this.node.bb.x2, this.node.bb.y2);
        this.thumbs.factor = Math.floor((this.thumbs.res / maxSide) * 5) / 5;
        console.log(this.thumbs.factor);
        let calcW = this.node.bb.x2 * this.thumbs.factor;
        let calcH = this.node.bb.y2 * this.thumbs.factor;
        this.thumbs.offsetX = (this.thumbs.res - calcW) / 2;
        this.thumbs.offsetY = (this.thumbs.res - calcH) / 2;
    }

    setUrlParams(urlString = document.location){
        let url = new URL(urlString);
        url.searchParams.set("h", this.node.params.h);
        url.searchParams.set("w", this.node.params.w);
        if (this.node.params.col?.length > 0)
            url.searchParams.set("col", this.node.params.col)
        if (this.node.params.row?.length > 0)
            url.searchParams.set("row", this.node.params.row)
        if (this.node.params.areas){
            let triangles = this.node.params.areas.map(area => area.triangle);
            url.searchParams.set("opt", triangles); 
        }
    }

    getUrlParams(urlString = document.location){
        let url = new URL(urlString);
        if (url.searchParams.has("h"))
            this.node.params.h = parseFloat(url.searchParams.get("h")); 
        if (url.searchParams.has("w"))
            this.node.params.w = parseFloat(url.searchParams.get("w")); 
        if (url.searchParams.has("col"))
            this.node.params.col = url.searchParams.get("col").split(',').map(Number); 
        if (url.searchParams.has("row"))
            this.node.params.row = url.searchParams.get("row").split(',').map(Number); 
        if (url.searchParams.has("opt") && this.node.params.areas){
            let tri = url.searchParams.get("opt").split(',').map(Number);
            tri.forEach((opt, i) => {
                if (this.node.params.areas[i])
                    this.node.params.areas[i].triangle = opt; 
                let select = document.getElementsByName(`select-${i}`)[0];
                select.value = `option-${opt}`; 
            })
        }
        this.syncInputs(); 
        this.update(); 
    }

    getOptionImages() {
        let wrapEl = document.createElement('div');
        wrapEl.classList.add("we-option-wrap");
        this.calcThumbs();
        
        this.node.params.areas.forEach((area, j) => {
            if (area.options){
                let tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.thumbs.res;
                tempCanvas.height = this.thumbs.res;
                let lCtx = tempCanvas.getContext('2d');
                lCtx.translate(this.thumbs.offsetX, this.thumbs.offsetY);
                lCtx.restore();
                this.drawNodeThumb(this.node, true, lCtx, j);
                lCtx.save();

                let optionEl = document.createElement('div');
                let thumbEl = document.createElement('img');
                let selectEl = document.createElement('select')
                let thumbImage = new Image();

                optionEl.classList.add("we-option");
                selectEl.name = `select-${j}`;

                area.options.forEach((option, k) => {
                    let selectItemEl = document.createElement('option');
                    selectItemEl.value = `option-${k}`
                    selectItemEl.innerHTML = option;
                    if (area.triangle == k) {
                        selectItemEl.selected = true;
                    }
                    selectEl.appendChild(selectItemEl);
                })

                selectEl.addEventListener('change', (e) => {
                    let selectedIndex = parseInt(e.target.value.split("-")[1]);
                    let optionIndex = parseInt(e.target.name.split("-")[1]);
                    this.node.params.areas[optionIndex].triangle = selectedIndex;
                    this.update();
                })

                thumbImage.src = tempCanvas.toDataURL();
                thumbEl.src = thumbImage.src;

                optionEl.appendChild(thumbEl);
                optionEl.appendChild(selectEl);
                wrapEl.appendChild(optionEl);
            }
        })

        return (wrapEl);
    }

    updateCanvas() {
        this.canvas.width = this.root.clientWidth * this.dpi;
        this.canvas.height = this.root.clientHeight * this.dpi;
        let oldFactor = (this.node.invFactor || 1);
        this.node.factor = Math.min(Math.floor(this.canvas.width / (this.node.params.w + 80)),
            Math.floor(this.canvas.height / (this.node.params.h + 80)))
        this.node.invFactor = Math.min(this.canvas.width, this.canvas.height) / 100;
        this.helpersSize = (this.hEl.clientHeight * this.dpi) + 10;
    }

    update() {
        this.updateCanvas();
        this.calcNode(this.node);
        this.scaleGeometry(this.node);
        this.calcOffset(this.node);
        this.calcHelpers();

        this.render();

        this.updateInputs();
    }

    render() {
        if (this.node) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.ctx.translate(this.node.offsetX, this.node.offsetY);
            this.ctx.restore();
            this.drawNode(this.node);
            this.drawHelpers();
            this.ctx.save();
        }
    }

    init() {
        if (!this.node) {
            console.error("NO NODE OBJECT! Failed to init");
            return;
        }
        if (!this.root) {
            console.error("NO ROOT ELEMENT! Failed to init");
            return;
        }
        this.root.appendChild(this.canvas);
        this.canvas.width = this.canvas.clientWidth * this.dpi;
        this.canvas.height = this.canvas.clientHeight * this.dpi;
        this.node.factor = Math.min(Math.floor(this.canvas.width / (this.node.params.w + 80)),
            Math.floor(this.canvas.height / (this.node.params.h + 80)));
        this.node.invFactor = 10 / this.node.factor;
        this.ctx = this.canvas.getContext("2d");
        if (!this.node.params.maxh)
            this.node.params.maxh = 1000;
        if (!this.node.params.minh)
            this.node.params.minh = this.minsize;
        if (!this.node.params.maxw)
            this.node.params.maxw = 1000;
        if (!this.node.params.minw)
            this.node.params.minw = this.minsize;
        if (!this.node.params.col)
            this.node.params.col = [];
        if (!this.node.params.row)
            this.node.params.row = [];
        if (!this.node.params.minCol)
            this.node.params.minCol = [];
        if (!this.node.params.maxCol)
            this.node.params.maxCol = [];
        if (!this.node.params.maxRow)
            this.node.params.maxRow = [];
        if (!this.node.params.minRow)
            this.node.params.minRow = [];

        setTimeout(() => {
            this.initInputs();
            this.update();
            this.stash();
            this.calcRatio();
        }, 80);


    }
}
