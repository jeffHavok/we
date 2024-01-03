function calcNodeGrid(node, paddingNeeded){
    let stepX = node.w / node.grid[0]; 
    let stepY = node.h / node.grid[1];
    if (node.col && node.grid[0] > 1)
        stepX = (node.w - node.col) / (node.grid[0] - 1);
    if (node.row && node.grid[1] > 1)
        stepY = (node.h - node.row) / (node.grid[1] - 1);

    node.gridPts = Array.from(Array(node.grid[0]), () => new Array(node.grid[1]));
    
    for (let j = 0; j < node.grid[0]; j++){      
        for (let k = 0; k < node.grid[1]; k++) {
            node.gridPts[j][k] = {};
            //---basic geometry
            if (node.col){
                if (j != 0){
                    node.gridPts[j][k].x1 = stepX * (j - 1) + node.col;
                    node.gridPts[j][k].x2 = stepX * j + node.col;
                } else {
                    node.gridPts[j][k].x1 = 0;
                    node.gridPts[j][k].x2 = node.col; 
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
        ctx.beginPath();

        ctx.moveTo(node.bb.x1, node.bb.y1);     
        ctx.lineTo(node.bb.x1, node.bb.y1 - 30 * node.factor);
        ctx.moveTo(node.bb.x2, node.bb.y1);
        ctx.lineTo(node.bb.x2, node.bb.y1 - 30 * node.factor);
        ctx.moveTo(node.bb.x1, node.bb.y1 - 28 * node.factor);
        ctx.lineTo(node.bb.x2, node.bb.y1 - 28 * node.factor);

        ctx.moveTo(node.bb.x2, node.bb.y1);
        ctx.lineTo(node.bb.x2 + 30 * node.factor, node.bb.y1);
        ctx.moveTo(node.bb.x2, node.bb.y2);
        ctx.lineTo(node.bb.x2 + 30 * node.factor, node.bb.y2);
        ctx.moveTo(node.bb.x2 + 28 * node.factor, node.bb.y1);
        ctx.lineTo(node.bb.x2 + 28 * node.factor, node.bb.y2);

        if (node.col){
            ctx.fillStyle = "#0006";
            ctx.fillText((  node.w - node.col), 
                            node.bb.x2 - ((node.w - node.col) * node.factor) / 2,
                            node.bb.y1 - 15 * node.factor);

            ctx.moveTo(node.bb.x1 + node.col * node.factor, node.bb.y1);
            ctx.lineTo(node.bb.x1 + node.col * node.factor, node.bb.y1 - 15 * node.factor); 
            ctx.moveTo(node.bb.x1, node.bb.y1 - 13 * node.factor);
            ctx.lineTo(node.bb.x2, node.bb.y1 - 13 * node.factor);
        }
        if (node.row){
            ctx.fillStyle = "#0006";
            ctx.fillText((  node.h - node.row), 
                            node.bb.x2 + 20 * node.factor, 
                            node.bb.y2 - ((node.h - node.row) * node.factor) / 2);

            ctx.moveTo(node.bb.x2, node.bb.y1 + node.row * node.factor);
            ctx.lineTo(node.bb.x2 + 15 * node.factor, node.bb.y1 + node.row * node.factor);
            ctx.moveTo(node.bb.x2 + 13 * node.factor, node.bb.y1);
            ctx.lineTo(node.bb.x2 + 13 * node.factor, node.bb.y2);   
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
        return Math.max(Math.min(val, max), min); 
    }

    setParam(param = "height", value, inverted){
        switch (param) {
            case "height":
                this.node.h = this.clamp(value, this.node.minh, this.node.maxh)
                break;
            case "width":
                this.node.w = this.clamp(value, this.node.minw, this.node.maxw)
                break;
            case "col":
                this.node.col = this.clamp(value, this.node.mincol, this.node.maxcol)
                break;
            case "row":
                this.node.row = this.clamp(value, this.node.minrow, this.node.maxrow)
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
            this.node.minh = 5; 
        if (isNaN(this.node.minw))
            this.node.minw = 5; 
        if (isNaN(this.node.mincol))
            this.node.mincol = 5;
        if (isNaN(this.node.minrow))
            this.node.minrow = 5;
        
        if (isNaN(this.node.maxh))
            this.node.maxh = this.node.h * 2; 
        if (isNaN(this.node.maxw))
            this.node.maxw = this.node.w * 2; 
        if (isNaN(this.node.maxcol))
            this.node.maxcol = this.node.w;
        if (isNaN(this.node.maxrow))
            this.node.maxrow = this.node.h;

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
        let hEl = document.getElementById("we-height"), 
            wEl = document.getElementById("we-width"),
            colEl = document.getElementById("we-col"), 
            rowEl = document.getElementById("we-row");
        if (hEl){
            hEl.style.display = "block";
            hEl.style.left = `calc(50% + ${((this.node.w / 4) + 14)  * this.node.factor}px)`;
            hEl.setAttribute("min", this.node.minh);
            hEl.setAttribute("max", this.node.maxh);
            hEl.setAttribute("value", this.node.h);
        }
        if (wEl){
            wEl.style.display = "block";
            wEl.style.top = `calc(50% - ${((this.node.h / 4) + 14) * this.node.factor}px)`; 
            wEl.setAttribute("min", this.node.minw);
            wEl.setAttribute("max", this.node.maxw);
            wEl.setAttribute("value", this.node.w);
        }
        if(colEl){
            if (this.node.col)
                colEl.style.display = "block";
            else 
                colEl.style.display = "none";
            colEl.style.top = `calc(50% - ${((this.node.h / 4) + 7) * this.node.factor}px)`;
            colEl.style.left = `calc(50% - ${(((this.node.w - this.node.col) / 4) ) * this.node.factor}px)`; 
            colEl.setAttribute("min", this.node.mincol);
            colEl.setAttribute("max", this.node.maxcol);
            colEl.setAttribute("value", this.node.col);
        }
        if(rowEl){
            if (this.node.row)
                rowEl.style.display = "block";
            else 
                rowEl.style.display = "none";
            rowEl.style.left = `calc(50% + ${((this.node.w / 4) + 6) * this.node.factor}px)`;
            rowEl.style.top = `calc(50% - ${(((this.node.h - this.node.row) / 4) ) * this.node.factor}px)`; 
            rowEl.setAttribute("min", this.node.minrow);
            rowEl.setAttribute("max", this.node.maxrow);
            rowEl.setAttribute("value", this.node.row);
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