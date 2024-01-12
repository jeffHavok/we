
function calcNodeGrid(node, paddingNeeded){
    let stepX = node.w / node.grid[0]; 
    let stepY = node.h / node.grid[1];
    if (node.col && node.grid[0] > 1)
        stepX = (node.w - node.col) / (node.grid[0] - 1);
    if (node.row && node.grid[1] > 1)
        stepY = (node.h - node.row) / (node.grid[1] - 1);
    if (node.col2 && node.grid[0] > 2)
        stepX = (node.w - (node.col + node.col2)) / (node.grid[0] - 2);
    if (node.row2 && node.grid[1] > 2)
        stepY = (node.h - (node.row + node.row2)) / (node.grid[1] - 2);
    if (node.col3 && node.grid[0] > 3)
        stepX = (node.w - (node.col + node.col2 + node.col3)) / (node.grid[0] - 3);
    node.gridPts = Array.from(Array(node.grid[0]), () => new Array(node.grid[1]));
    
    for (let j = 0; j < node.grid[0]; j++){      
        for (let k = 0; k < node.grid[1]; k++) {
            node.gridPts[j][k] = {};
            //---basic geometry
            if (node.col){
                if (j > 0){
                    node.gridPts[j][k].x1 = stepX * (j - 1) + node.col;
                    node.gridPts[j][k].x2 = stepX * j + node.col;
                } else {
                    node.gridPts[j][k].x1 = 0;
                    node.gridPts[j][k].x2 = node.col; 
                }
                if (node.col2){
                    if (j > 1){
                        node.gridPts[j][k].x1 = stepX * (j - 2) + node.col + node.col2;
                        node.gridPts[j][k].x2 = stepX * (j - 1) + node.col + node.col2;
                    } 
                    if (j == 1){
                        node.gridPts[j][k].x1 = node.col;
                        node.gridPts[j][k].x2 = node.col + node.col2; 
                    }    
                    if (j == 0){
                        node.gridPts[j][k].x1 = 0;
                        node.gridPts[j][k].x2 = node.col; 
                    }    
                    if (node.col3){
                        if (j > 2){
                            node.gridPts[j][k].x1 = stepX * (j - 3) + node.col + node.col2 + node.col3;
                            node.gridPts[j][k].x2 = stepX * (j - 1) + node.col + node.col2 + node.col3;
                        } 
                        if (j == 2){
                            node.gridPts[j][k].x1 = node.col + node.col2;
                            node.gridPts[j][k].x2 = node.col + node.col2 + node.col3; 
                        }    
                        if (j == 1){
                            node.gridPts[j][k].x1 = node.col;
                            node.gridPts[j][k].x2 = node.col + node.col2; 
                        }    
                        if (j == 0){
                            node.gridPts[j][k].x1 = 0;
                            node.gridPts[j][k].x2 = node.col; 
                        }    
                    }
                }
            } else {
                node.gridPts[j][k].x1 = stepX * j;
                node.gridPts[j][k].x2 = stepX * (j + 1);
            }

            if (node.row){
                if (k != 0){
                    node.gridPts[j][k].y1 = stepY * (k - 1) + node.row;
                    node.gridPts[j][k].y2 = stepY * k + node.row;
                } else {
                    node.gridPts[j][k].y1 = 0;
                    node.gridPts[j][k].y2 = node.row; 
                }
                if (node.row2){
                    if (k > 1){
                        node.gridPts[j][k].y1 = stepY * (k - 2) + node.row + node.row2;
                        node.gridPts[j][k].y2 = stepY * (k - 1) + node.row + node.row2;
                    } 
                    if (k == 1){
                        node.gridPts[j][k].y1 = node.row;
                        node.gridPts[j][k].y2 = node.row + node.row2;
                    } 
                    if (k == 0){
                        node.gridPts[j][k].y1 = 0;
                        node.gridPts[j][k].y2 = node.row;
                    }
                }
            } else {
                node.gridPts[j][k].y1 = stepY * k;
                node.gridPts[j][k].y2 = stepY * (k + 1);
            }

            //---padding
            if (paddingNeeded){
                if (j == 0)
                    node.gridPts[j][k].x1 += node.pd[3]
                if (j == (node.grid[0] - 1))
                    node.gridPts[j][k].x2 -= node.pd[1]
                if (k == 0)
                    node.gridPts[j][k].y1 += node.pd[0]
                if (k == (node.grid[1] - 1)) 
                    node.gridPts[j][k].y2 -= node.pd[2]
            }
            //---gaps
            if (node.gap){
                //---horizontal
                if (node.grid[0] > 1){
                    if ((j + 1) < node.grid[0]) 
                        node.gridPts[j][k].x2 -= node.gap / 2;
                    if ((j) > 0)
                        node.gridPts[j][k].x1 += node.gap / 2;
                }
                //---vertical
                if (node.grid[1] > 1){
                    if ((k + 1) < node.grid[1]) 
                        node.gridPts[j][k].y2 -= node.gap / 2;
                    if ((k) > 0)
                        node.gridPts[j][k].y1 += node.gap / 2;
                }
            }
        }
    }
    return node; 
} 

function calcNode(node, parent = false, i = false){
    node.bb = {x1: 0, y1: 0, x2: node.w, y2: node.h};
    if (!node.pd)
        node.pd = [0,0,0,0];
    
    if (parent.grid){
        node.gridPosX = i % parent.grid[0];
        node.gridPosY = Math.floor((i + 0.99) / parent.grid[0]);
        if (parent.gridPts && node.gridPosX < parent.grid[0] && node.gridPosY < parent.grid[1]){
            node.bb.x1 = parent.bb.x1 + parent.gridPts[node.gridPosX][node.gridPosY].x1;
            node.bb.x2 = parent.bb.x1 + parent.gridPts[node.gridPosX][node.gridPosY].x2;
            node.bb.y1 = parent.bb.y1 + parent.gridPts[node.gridPosX][node.gridPosY].y1;
            node.bb.y2 = parent.bb.y1 + parent.gridPts[node.gridPosX][node.gridPosY].y2;
        } 
    } 
    if (!parent.grid && parent) {
        node.bb.x1 = parent.bb.x1 + node.pd[3];
        node.bb.x2 = parent.bb.x2 - node.pd[1];
        node.bb.y1 = parent.bb.y1 + node.pd[0];
        node.bb.y2 = parent.bb.y2 - node.pd[2]; 
    }

    if (parent){
        node.w = node.bb.x2 - node.bb.x1;
        node.h = node.bb.y2 - node.bb.y1;
    }

    if (node.grid){
        let paddingNeeded = true;
        if (parent.pd) paddingNeeded = false; 
        node = calcNodeGrid(node, paddingNeeded)
    }
    if (node.child)
        node.child.forEach((e, i) => calcNode(e, node, i));
}

function drawNodeTree(node, ctx, firstEntry = false){

    if (!node.bb)
        return null; 
    ctx.font = `${node.factor * 8}px sans-serif`;
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.fillStyle = "#FFF0";
    if (node.glass) 
        ctx.fillStyle = "#AAF8";
    if (node.borderless)
        ctx.strokeStyle = "#FFF"; 
    
    ctx.fillRect(node.bb.x1, node.bb.y1, node.bb.x2 - node.bb.x1, node.bb.y2 - node.bb.y1); 
    ctx.strokeRect(node.bb.x1, node.bb.y1, node.bb.x2 - node.bb.x1, node.bb.y2 - node.bb.y1); 
    
    ctx.strokeStyle = "#0006";

    if (firstEntry){
        node.invFactor = 7 / node.factor;
        ctx.beginPath();

        ctx.moveTo(node.bb.x1, node.bb.y1);     
        ctx.lineTo(node.bb.x1, node.bb.y1 - (30 * node.invFactor) * node.factor);
        ctx.moveTo(node.bb.x2, node.bb.y1);
        ctx.lineTo(node.bb.x2, node.bb.y1 - (30 * node.invFactor) * node.factor);
        ctx.moveTo(node.bb.x1, node.bb.y1 - (28 * node.invFactor) * node.factor);
        ctx.lineTo(node.bb.x2, node.bb.y1 - (28 * node.invFactor) * node.factor);

        ctx.moveTo(node.bb.x2, node.bb.y1);
        ctx.lineTo(node.bb.x2 + (30 * node.invFactor) * node.factor, node.bb.y1);
        ctx.moveTo(node.bb.x2, node.bb.y2);
        ctx.lineTo(node.bb.x2 + (30 * node.invFactor) * node.factor, node.bb.y2);
        ctx.moveTo(node.bb.x2 + (28 * node.invFactor) * node.factor, node.bb.y1);
        ctx.lineTo(node.bb.x2 + (28 * node.invFactor) * node.factor, node.bb.y2);

        if (node.col){
            ctx.moveTo(node.bb.x1 + node.col * node.factor, node.bb.y1);
            ctx.lineTo(node.bb.x1 + node.col * node.factor, node.bb.y1 - (15 * node.invFactor) * node.factor); 
            ctx.moveTo(node.bb.x1, node.bb.y1 - (13 * node.invFactor) * node.factor);
            ctx.lineTo(node.bb.x2, node.bb.y1 - (13 * node.invFactor) * node.factor);
        }

        ctx.fillStyle = "#0006";
        if (node.col && !node.col2){
            ctx.fillText((  node.w - node.col), 
                            node.bb.x2 - ((node.w - node.col) * node.factor) / 2,
                            node.bb.y1 - (15 * node.invFactor) * node.factor);
        }
        if (node.col && node.col2){
            ctx.moveTo(node.bb.x1 + (node.col + node.col2) * node.factor, node.bb.y1);
            ctx.lineTo(node.bb.x1 + (node.col + node.col2) * node.factor, node.bb.y1 - (15 * node.invFactor) * node.factor); 
            ctx.fillText((  node.w - node.col - node.col2), 
                            node.bb.x2 - ((node.w - node.col - node.col2) * node.factor) / 2,
                            node.bb.y1 - (15 * node.invFactor) * node.factor);
        }
        if (node.col && node.col3){
            ctx.moveTo(node.bb.x1 + (node.col + node.col3) * node.factor, node.bb.y1);
            ctx.lineTo(node.bb.x1 + (node.col + node.col3) * node.factor, node.bb.y1 - (15 * node.invFactor) * node.factor); 
            ctx.fillText((  node.w - node.col - node.col3), 
                            node.bb.x2 - ((node.w - node.col - node.col3) * node.factor) / 2,
                            node.bb.y1 - (15 * node.invFactor) * node.factor);
        }
        if (node.row){
            ctx.moveTo(node.bb.x2, node.bb.y1 + node.row * node.factor);
            ctx.lineTo(node.bb.x2 + (15 * node.invFactor) * node.factor, node.bb.y1 + node.row * node.factor);
            ctx.moveTo(node.bb.x2 + (13 * node.invFactor) * node.factor, node.bb.y1);
            ctx.lineTo(node.bb.x2 + (13 * node.invFactor) * node.factor, node.bb.y2);   
        }
        if (node.row && !node.row2){
            ctx.fillText((  node.h - node.row), 
                            node.bb.x2 + (20 * node.invFactor) * node.factor, 
                            node.bb.y2 - ((node.h - node.row) * node.factor) / 2);
        }
        if (node.row && node.row2){
            ctx.fillText((  node.h - node.row - node.row2), 
                            node.bb.x2 + (20 * node.invFactor) * node.factor, 
                            node.bb.y2 - ((node.h - node.row - node.row2) * node.factor) / 2);
            ctx.moveTo(node.bb.x2, node.bb.y1 + (node.row + node.row2) * node.factor);
            ctx.lineTo(node.bb.x2 + (15 * node.invFactor) * node.factor, node.bb.y1 + (node.row + node.row2) * node.factor);
        }

        ctx.closePath();
        ctx.stroke();
    }
    
    ctx.strokeStyle = "#0006";

    if (node.cross){
        ctx.beginPath();
        if (node.child){
            ctx.moveTo(node.bb.x1, node.bb.y1);
            ctx.lineTo(node.child[0].bb.x1, node.child[0].bb.y1);
            ctx.moveTo(node.bb.x2, node.bb.y2);
            ctx.lineTo(node.child[0].bb.x2, node.child[0].bb.y2);
            ctx.moveTo(node.bb.x2, node.bb.y1);
            ctx.lineTo(node.child[0].bb.x2, node.child[0].bb.y1);
            ctx.moveTo(node.bb.x1, node.bb.y2);
            ctx.lineTo(node.child[0].bb.x1, node.child[0].bb.y2);
        } else {
            ctx.moveTo(node.bb.x1, node.bb.y1);
            ctx.lineTo(node.bb.x2, node.bb.y2);
            ctx.moveTo(node.bb.x2, node.bb.y1);
            ctx.lineTo(node.bb.x1, node.bb.y2);
        }
        ctx.closePath();
        ctx.stroke();
    }

    if (node.planks){
        ctx.beginPath();
        if (node.child){
            ctx.moveTo(node.child[0].bb.x1, node.bb.y1);
            ctx.lineTo(node.child[0].bb.x1, node.child[0].bb.y1);
            ctx.moveTo(node.child[0].bb.x2, node.bb.y2);
            ctx.lineTo(node.child[0].bb.x2, node.child[0].bb.y2);
            ctx.moveTo(node.child[0].bb.x2, node.bb.y1);
            ctx.lineTo(node.child[0].bb.x2, node.child[0].bb.y1);
            ctx.moveTo(node.child[0].bb.x1, node.bb.y2);
            ctx.lineTo(node.child[0].bb.x1, node.child[0].bb.y2);
        }
        ctx.closePath();
        ctx.stroke();
    }

    if (node.dashed)
        ctx.setLineDash([20, 20]);
    if (node.triangle)
        switch (node.triangle) {
            case "right":
                ctx.beginPath();
                ctx.moveTo(node.bb.x1, node.bb.y1);
                ctx.lineTo(node.bb.x2, node.bb.y2 - (node.bb.y2 - node.bb.y1) / 2);
                ctx.lineTo(node.bb.x1, node.bb.y2);
                ctx.closePath();
                ctx.stroke();
                break;
            case "left":
                ctx.beginPath();
                ctx.moveTo(node.bb.x2, node.bb.y1);
                ctx.lineTo(node.bb.x1, node.bb.y2 - (node.bb.y2 - node.bb.y1) / 2);
                ctx.lineTo(node.bb.x2, node.bb.y2);
                ctx.closePath();
                ctx.stroke();
                break;
            case "bottom":
                ctx.beginPath();
                ctx.moveTo(node.bb.x1, node.bb.y1);
                ctx.lineTo(node.bb.x2 - (node.bb.x2 - node.bb.x1) / 2, node.bb.y2);
                ctx.lineTo(node.bb.x2, node.bb.y1);
                ctx.closePath();
                ctx.stroke();
                break;
            case "top":
                ctx.beginPath();
                ctx.moveTo(node.bb.x1, node.bb.y2);
                ctx.lineTo(node.bb.x2 - (node.bb.x2 - node.bb.x1) / 2, node.bb.y1);
                ctx.lineTo(node.bb.x2, node.bb.y2);
                ctx.closePath();
                ctx.stroke();
                break;        
            default:
                break;
        }
    ctx.setLineDash([]);
    if (node.child)
        node.child.forEach((e) => drawNodeTree(e, ctx));
}

function upscaleGeometry(node, factor = 1, ctx, firstEntry = false){
    if (firstEntry)
        calcNode(node);
    if (ctx)
        ctx.lineWidth = Math.pow(factor, 0.6);
    if (node.bb)
        Object.keys(node.bb).forEach(coord => node.bb[coord] *= factor );
    if (node.child)
        node.child.forEach((e) => upscaleGeometry(e, factor, ctx));
}

function getWindowCenter(params){
    if (params.node.w && params.node.h && params.node.factor){
        let viewportHeight = params.canvasEl.clientHeight * params.dpi; 
        let viewportWidth = params.canvasEl.clientWidth * params.dpi; 

        params.oldOffsetX = params.offsetX;
        params.oldOffsetY = params.offsetY;
        params.offsetX = (viewportWidth - (params.node.w * params.node.factor)) / 2;
        params.offsetY = (viewportHeight - (params.node.h * params.node.factor)) / 2;
    }
    return params;    
}

function updateWindowEditor(params, node = null) {
    !node
        ? node = params.node
        : params.node = node;

    params.ctx.canvas.width = params.canvasEl.clientWidth * params.dpi; 
    params.ctx.canvas.height = params.canvasEl.clientHeight * params.dpi; 
    params.canvasEl.width = params.canvasEl.clientWidth * params.dpi; 
    params.canvasEl.height = params.canvasEl.clientHeight * params.dpi; 
    params.node.factor =    Math.min(params.canvasEl.width, params.canvasEl.height) /
                            Math.max(params.node.h, params.node.w);

    params = getWindowCenter(params);
    params.ctx.translate(- params.oldOffsetX, - params.oldOffsetY);
    params.ctx.translate(params.offsetX, params.offsetY);

    calcNode(node);
    params.ctx.clearRect(0, 0, params.canvasEl.clientWidth, params.canvasEl.clientHeight);
    upscaleGeometry(params.node, params.node.factor,  params.ctx, true);
    drawNodeTree(params.node, params.ctx); 

    return params; 
}


function initWindowEditor(targetEl, node) {
    let params = {
        canvasEl: null,
        dpi: 2,
        ready: false,
        ctx: null, 
        node: null,
        offsetX: 0,
        offsetY: 0,
        oldOffsetX: 0, 
        oldOffsetY: 0,
    }

    if (!document.getElementById("#editor-viewport")){
        params.canvasEl = document.createElement("canvas");
        params.canvasEl.setAttribute("id", "editor-viewport");
        document.getElementById(targetEl).appendChild(params.canvasEl);
    } else {
        params.canvasEl = document.getElementById("#editor-viewport");
    }

    //--- canvas inner size
    params.canvasEl.width = params.canvasEl.clientWidth * params.dpi; 
    params.canvasEl.height = params.canvasEl.clientHeight * params.dpi; 

    params.ctx = params.canvasEl.getContext("2d");
    params.node = node;

    //--- adjust scale factor
    params.node.factor =    Math.min(params.canvasEl.width, params.canvasEl.height) /
                            Math.max(params.node.h, params.node.w);
    params.node.factor = Math.floor(params.node.factor); 

    params.ready = true;
    params = updateWindowEditor(params, node);
    return params; 
}

class WE {
    constructor(node, dpi = 2){
        this.node = node;
        this.dpi = dpi;
        this.offsetX = 0;
        this.offsetY = 0;
        this.canvasEl = null;
        this.ctx = null;
    }

    clamp(val,min,max){
        if (isNaN(min))
            min = 0; 
        if (isNaN(max))
            min = 5000; 
        return Math.max(Math.min(val, max), min); 
    }

    calcNewMax(){
        let multX = 1;
        let multY = 1;
        if (this.node.grid){
            multX = this.node.grid[0];
            if (this.node.col)
                multX--;
            if (this.node.col2)
                multX--;
            if (this.node.col3)
                multX--;
            multY = (this.node.grid[1] | 0);
            if (this.node.row)
                multY--;
            if (this.node.row2)
                multY--;
        }
        
        let newMinW = ((this.node.col | 0) + (this.node.col2 | 0) + 10 * multX);
        let newMinH = ((this.node.row | 0) + (this.node.row2 | 0) + 10 * multY);
        let newMaxCol = (this.node.w - (this.node.col2 | 0) - 10 * multX);
        let newMaxCol2 = (this.node.w - (this.node.col | 0) - 10 * multX);
        let newMaxCol3 = (this.node.w - (this.node.col | 0) - 10 * multX);
        let newMaxRow = (this.node.h - (this.node.row2 | 0) - 10 * multX);
        let newMaxRow2 = (this.node.h - (this.node.row | 0) - 10 * multX);
        console.log(newMinW, newMinH, newMaxCol, newMaxCol2, newMaxRow, newMaxRow2); 
        this.wEl.setAttribute("min", newMinW); 
        this.hEl.setAttribute("min", newMinH); 
        this.colEl.setAttribute("max", newMaxCol); 
        this.col2El.setAttribute("max", newMaxCol2); 
        this.rowEl.setAttribute("max", newMaxRow); 
        this.row2El.setAttribute("max", newMaxRow2); 
    }

    setParam(param = "height", value, inverted){
        let oldVal = 0; 
        let multX = 1;
        let multY = 1;
        if (this.node.grid){
            multX = this.node.grid[0];
            if (this.node.col)
                multX--;
            if (this.node.col2)
                multX--;
            if (this.node.col3)
                multX--;
            multY = (this.node.grid[1] | 0);
            if (this.node.row)
                multY--;
            if (this.node.row2)
                multY--;
        }
        let newMinX = ((this.node.col | 0) + (this.node.col2 | 0) + (this.node.col3 | 0) + 10 * multX); 
        let newMinY = ((this.node.row | 0) + (this.node.row2 | 0) + 10 * multY); 
        let capX = this.node.w - newMinX;
        let capY = this.node.h - newMinY;
        
        this.calcNewMax();

        switch (param) {
            case "height":
                if (capY > 0) 
                    this.node.h = this.clamp(value, this.node.minh, this.node.maxh)
                else if ((this.node.h - value) > 0)
                    this.node.h = this.clamp(value, this.node.minh, this.node.maxh)
                this.hEl.value = this.node.h;
                break;
            case "width":
                if (capX > 0) 
                    this.node.w = this.clamp(value, this.node.minw, this.node.maxw)
                else if ((this.node.w - value) > 0)
                    this.node.w = this.clamp(value, this.node.minw, this.node.maxw)
                this.wEl.value = this.node.w;
                break;
            case "col":
                if (capX > 0)  
                    this.node.col = this.clamp(value, this.node.mincol, this.node.maxcol)
                else if ((this.node.col - value) > 0)
                    this.node.col = this.clamp(value, this.node.mincol, this.node.maxcol)
                this.colEl.value = this.node.col;
                break;
            case "row":
                if (capY > 0)  
                    this.node.row = this.clamp(value, this.node.minrow, this.node.maxrow)
                else if ((this.node.row - value) > 0)
                    this.node.row = this.clamp(value, this.node.minrow, this.node.maxrow)
                this.rowEl.value = this.node.row;
                break;
            case "col2":
                if (capX > 0)  
                    this.node.col2 = this.clamp(value, this.node.mincol2, this.node.maxcol2)
                else if ((this.node.col2 - value) > 0)
                    this.node.col2 = this.clamp(value, this.node.mincol2, this.node.maxcol2)
                this.col2El.value = this.node.col2;
                break;
            case "col3":
                if (capX > 0)  
                    this.node.col3 = this.clamp(value, this.node.mincol3, this.node.maxcol3)
                else if ((this.node.col3 - value) > 0)
                    this.node.col3 = this.clamp(value, this.node.mincol3, this.node.maxcol3)
                this.col3El.value = this.node.col3;
                break;
            case "row2":
                if (capY > 0)  
                    this.node.row2 = this.clamp(value, this.node.minrow2, this.node.maxrow2)
                else if ((this.node.row2 - value) > 0)
                    this.node.row2 = this.clamp(value, this.node.minrow2, this.node.maxrow2)
                this.row2El.value = this.node.row2;
                break;
            case "dpi":
                this.dpi = this.clamp(value, 0.5, 8)
                break;
            default:
                console.log("Wrong parameter! - " + param)
                break;
        }
        this.update();        
    }

    calcNewFactor(){
        if (isNaN(this.node.minh))
            this.node.minh = 10; 
        if (isNaN(this.node.minw))
            this.node.minw = 10; 
        if (isNaN(this.node.mincol))
            this.node.mincol = 10;
        if (isNaN(this.node.minrow))
            this.node.minrow = 10;
        if (isNaN(this.node.mincol2))
            this.node.mincol2 = 10;
        if (isNaN(this.node.mincol3))
            this.node.mincol3 = 10;
        if (isNaN(this.node.minrow2))
            this.node.minrow2 = 10;
        
        if (isNaN(this.node.maxh))
            this.node.maxh = this.node.h * 2; 
        if (isNaN(this.node.maxw))
            this.node.maxw = this.node.w * 2; 
        if (isNaN(this.node.maxcol))
            this.node.maxcol = this.node.w;
        if (isNaN(this.node.maxrow))
            this.node.maxrow = this.node.h;
        if (isNaN(this.node.maxcol2))
            this.node.maxcol2 = this.node.w;
        if (isNaN(this.node.maxrow2))
            this.node.maxrow2 = this.node.h;

        this.ctx.width = this.canvasEl.width = this.canvasEl.clientWidth * this.dpi;
        this.ctx.height = this.canvasEl.height = this.canvasEl.clientHeight * this.dpi;
        
        //if (!this.node.factor){
            this.node.factor =  Math.max(this.canvasEl.width, this.canvasEl.height) /
            Math.max(this.node.maxh, this.node.maxw);
            this.node.factor =  Math.floor(this.node.factor);   
        //}
        
        let viewportHeight = this.canvasEl.height; 
        let viewportWidth = this.canvasEl.width; 
        this.offsetX = (viewportWidth - (this.node.w * this.node.factor)) / 2;
        this.offsetY = (viewportHeight - (this.node.h * this.node.factor)) / 2;
    }

    updateInputs(){
        this.hEl = document.getElementById("we-height"), 
        this.wEl = document.getElementById("we-width"),
        this.colEl = document.getElementById("we-col"), 
        this.rowEl = document.getElementById("we-row"),
        this.col2El = document.getElementById("we-col2"), 
        this.col3El = document.getElementById("we-col3"), 
        this.row2El = document.getElementById("we-row2");

        if (this.hEl){
            this.hEl.style.display = "block";
            this.hEl.style.left = `calc(50% + ${((this.node.w / 4) + (14 * this.node.invFactor))  * this.node.factor}px)`;
            this.hEl.setAttribute("min", this.node.minh);
            this.hEl.setAttribute("max", this.node.maxh);
            this.hEl.setAttribute("value", this.node.h);
        }
        if (this.wEl){
            this.wEl.style.display = "block";
            this.wEl.style.top = `calc(50% - ${((this.node.h / 4) + (14 * this.node.invFactor)) * this.node.factor}px)`; 
            this.wEl.setAttribute("min", this.node.minw);
            this.wEl.setAttribute("max", this.node.maxw);
            this.wEl.setAttribute("value", this.node.w);
        }
        if(this.colEl){
            if (this.node.col)
                this.colEl.style.display = "block";
            else 
                this.colEl.style.display = "none";
            this.colEl.style.top = `calc(50% - ${((this.node.h / 4) + (7 * this.node.invFactor)) * this.node.factor}px)`;
            this.colEl.style.left = `calc(50% - ${(((this.node.w - this.node.col) / 4) ) * this.node.factor}px)`; 
            this.colEl.setAttribute("min", this.node.mincol);
            this.colEl.setAttribute("max", this.node.maxcol);
            this.colEl.setAttribute("value", this.node.col);
        }
        if(this.rowEl){
            if (this.node.row)
                this.rowEl.style.display = "block";
            else 
                this.rowEl.style.display = "none";
            this.rowEl.style.left = `calc(50% + ${((this.node.w / 4) + (6 * this.node.invFactor)) * this.node.factor}px)`;
            this.rowEl.style.top = `calc(50% - ${(((this.node.h - this.node.row) / 4) ) * this.node.factor}px)`; 
            this.rowEl.setAttribute("min", this.node.minrow);
            this.rowEl.setAttribute("max", this.node.maxrow);
            this.rowEl.setAttribute("value", this.node.row);
        }
        if(this.col2El){
            if (this.node.col2)
                this.col2El.style.display = "block";
            else 
                this.col2El.style.display = "none";
            this.col2El.style.top = `calc(50% - ${((this.node.h / 4) + (7 * this.node.invFactor)) * this.node.factor}px)`;
            this.col2El.style.left = `calc(50% - ${(((this.node.w - this.node.col2) / 4 - this.node.col / 2) ) * this.node.factor}px)`; 
            this.col2El.setAttribute("min", this.node.mincol2);
            this.col2El.setAttribute("max", this.node.maxcol2);
            this.col2El.setAttribute("value", this.node.col2);
        }
        if(this.col3El){
            if (this.node.col2)
                this.col3El.style.display = "block";
            else 
                this.col3El.style.display = "none";
            this.col3El.style.top = `calc(50% - ${((this.node.h / 4) + (7 * this.node.invFactor)) * this.node.factor}px)`;
            this.col3El.style.left = `calc(50% - ${(((this.node.w - this.node.col2) / 4 - this.node.col / 2) ) * this.node.factor}px)`; 
            this.col3El.setAttribute("min", this.node.mincol2);
            this.col3El.setAttribute("max", this.node.maxcol2);
            this.col3El.setAttribute("value", this.node.col2);
        }
        if(this.row2El){
            if (this.node.row2)
                this.row2El.style.display = "block";
            else 
                this.row2El.style.display = "none";
            this.row2El.style.left = `calc(50% + ${((this.node.w / 4) + (6 * this.node.invFactor)) * this.node.factor}px)`;
            this.row2El.style.top = `calc(50% - ${(((this.node.h - this.node.row2) / 4 - this.node.row / 2) ) * this.node.factor}px)`;
            this.row2El.setAttribute("min", this.node.minrow2);
            this.row2El.setAttribute("max", this.node.maxrow2);
            this.row2El.setAttribute("value", this.node.row2);
        }
    }

    update(newNode = null){
        if (newNode)
            this.node = newNode;

        this.calcNewFactor();   
        calcNode(this.node);
        this.ctx.restore();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.clearRect(0, 0, this.canvasEl.clientWidth, this.canvasEl.clientHeight);
        upscaleGeometry(this.node, this.node.factor,  this.ctx, true);
        drawNodeTree(this.node, this.ctx, true);
    }

    init(targetId) {
        if (!document.getElementById("editor-viewport")){
            this.canvasEl = document.createElement("canvas");
            this.canvasEl.setAttribute("id", "editor-viewport");
            document.getElementById(targetId).appendChild(this.canvasEl);
        } else {
            this.canvasEl = document.getElementById("editor-viewport");
        }
        this.ctx = this.canvasEl.getContext("2d");
        this.ctx.width = this.canvasEl.width = this.canvasEl.clientWidth * this.dpi;
        this.ctx.height = this.canvasEl.height = this.canvasEl.clientHeight * this.dpi;
        this.update(); 
        this.update(); 
    }
}