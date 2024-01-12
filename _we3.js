let win1 = {
    params: {
        h: 90,
        w: 200,
        col: [50, 40, 60],
        row: [],
    }, 
    pd: [4,4,4,4],
    gap: 4,
    dir: "v",
    child: [
        {
            gap: 4,
            pd: [4,4,4,4],
            dir: "h",
            child: [{size: "col-1"},{size: "col-2"},{}]
        },
        {},
        {size: "col-1"},
    ]
}

let win2 = {
    params: {
        h: 150,
        w: 178,
        col: [40, 60],
        row: [100],
        colOrder: [0,1,-1],
        rowOrder: [-1,0]
    },
    pd: [2,2,2,2],
    gap: 2,
    dir: "v",
    child: [
        {
            pd: [3,3,3,3],
            child: [{glass: true}],
        },
        {
            size: "row-0",
            gap: 2, 
            borderless: true,
            child: [
                {
                    size: "col-0",
                    pd: [3,3,3,3],
                    child: [{glass: true}],
                },
                {
                    size: "col-1",
                    pd: [3,3,3,3],
                    child: [{glass: true}],
                },
                {
                    pd: [3,3,3,3],
                    child: [{glass: true}],
                },
            ]
        }
    ]
}

class WE{
    constructor(rootId, node, dpi = 2, helpersSize = 20){
        this.helpersSize = helpersSize; 
        this.helpers = [];
        this.node = node;
        this.dpi = dpi; 
        this.root = document.getElementById(rootId);
        this.canvas = document.createElement("canvas");
        this.hEl = document.createElement("input");
        this.wEl = document.createElement("input");
        this.ctx = null;
    }

    parseParam(v){
        let dir = v.size.substring(0, v.size.indexOf("-"));
        let index = v.size.substring(parseInt(v.size.indexOf("-") + 1, v.size.length));
        if (!this.node.params[dir][index])
            console.warn("WRONG PARAMETER: dir " + dir + " index " + index);
        else
            return([this.node.params[dir][index], dir, index]);
    }

    calcOffset(){
        this.node.oldOffsetX = this.node.offsetX; 
        this.node.oldOffsetY = this.node.offsetY; 
        this.node.offsetX = (this.canvas.width - (this.node.geom.x2 - this.node.geom.x1)) / 2;
        this.node.offsetY = (this.canvas.height - (this.node.geom.y2 - this.node.geom.y1)) / 2;
    }

    scaleGeometry(node){
        if (!this.node.factor)
            this.node.factor = this.node.dpi;  
        for (let key in node.geom) {
            node.geom[key] *= this.node.factor;
        }
        if (node.child)
            node.child.forEach((e) => this.scaleGeometry(e));
    }

    calcNode(node, parent = null, i = 0){
        node.bb = {x1: 0, y1: 0, x2: 0, y2: 0};
        node.geom = {...node.bb}; 

        if (!node.dir && node.child)
            node.dir = "h"; 
        if (!node.gap && node.child)
            node.gap = 0; 
        if (!node.pd)
            node.pd = [0,0,0,0];
        if (!node){
            console.error("NO NODE OBJECT! Failed to CalcNode");
            return; 
        }

        //--- main geometry
        if (!parent){
            node.bb = { x1: 0,
                        y1: 0,
                        x2: this.node.params.w,
                        y2: this.node.params.h };
            node.geom = {...node.bb}; 
        } else {
            if (parent.dir == "h"){
                let pw = parent.geom.x2 - parent.geom.x1;
                node.bb.y1 = parent.geom.y1; 
                node.bb.y2 = parent.geom.y2;
                //--- get size of all previous child
                if (i > 0)
                    node.bb.x1 += parent.child[i-1].bb.x2
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
                    node.bb.y1 += parent.child[i-1].bb.y2
                else 
                    node.bb.y1 = parent.geom.y1;
                typeof node.size == "string"
                    ? node.bb.y2 = node.bb.y1 + this.parseParam(node)[0]
                    : node.bb.y2 = node.bb.y1 + parent.autoSize;
            }
            node.geom = {...node.bb};
            //--- padding from parent
            if (parent.child.length > 1){
                if (parent.dir == "h"){
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
        if (node.child){
            let fixedSize = 0; 
            let affectedChild = node.child.length;
            node.child.forEach((v) => {
                if (typeof v.size == "string"){
                    fixedSize += this.parseParam(v)[0];
                    affectedChild -= 1; 
                }
            })
            node.dir == "h"
                ? node.autoSize = (node.geom.x2 - node.geom.x1 - fixedSize) / (affectedChild)
                : node.autoSize = (node.geom.y2 - node.geom.y1 - fixedSize) / (affectedChild);
            
            //console.log("fixed size:" + fixedSize + "  i:" + i + "  auto-size: " + node.autoSize + "  childs:" + (node.child.length - 1)); 
                
            if (node.child)
                node.child.forEach((e, j) => this.calcNode(e, node, j));
        }
    }
    
    drawHelpers(){
        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = this.dpi * 2; 
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

        this.helpers.forEach((helper, i) => {
            if (helper.dir == "col"){
                this.ctx.moveTo(helper.pos * this.node.factor, this.node.geom.y1);
                this.ctx.lineTo(helper.pos * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.95);
                this.ctx.moveTo((helper.pos + helper.value) * this.node.factor, this.node.geom.y1);
                this.ctx.lineTo((helper.pos + helper.value) * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.95);
                this.ctx.moveTo((helper.pos) * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.85);
                this.ctx.lineTo((helper.pos + helper.value) * this.node.factor, this.node.geom.y1 - this.helpersSize * 0.85);
            }
            if (helper.dir == "row"){
                this.ctx.moveTo(this.node.geom.x2, helper.pos * this.node.factor);
                this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * 0.95, helper.pos * this.node.factor);
                this.ctx.moveTo(this.node.geom.x2, (helper.pos + helper.value) * this.node.factor);
                this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * 0.95, (helper.pos + helper.value) * this.node.factor);
                this.ctx.moveTo(this.node.geom.x2 + this.helpersSize * 0.85, (helper.pos) * this.node.factor);
                this.ctx.lineTo(this.node.geom.x2 + this.helpersSize * 0.85, (helper.pos + helper.value) * this.node.factor);
            }
        })

        this.ctx.closePath(); 
        this.ctx.stroke();
    }

    calcHelpers(){
        this.helpers = []; 

        if (this.node.params.col.length > 0){
            if (!this.node.params.colOrder){
                this.node.params.colOrder = Array.from(Array(this.node.params.col.length).keys())
                this.node.params.colOrder.push(-1);
            }
        }
        if (this.node.params.row.length > 0){
            if (!this.node.params.rowOrder){
                this.node.params.rowOrder = Array.from(Array(this.node.params.row.length).keys())
                this.node.params.rowOrder.push(-1);
            }
        }
        this.node.params.colOrder.forEach((order, i) => {
            let helper = {dir: "col"}; 
            if (order < 0){
                helper.type = "text";
                let fixedSize = this.node.params.col.reduce((acc, v) => acc+= v, 0);
                helper.value =  (this.node.params.w - fixedSize) / 
                                (this.node.params.colOrder.length - this.node.params.col.length);
            } else {
                helper.type = "input";
                helper.value = this.node.params.col[order]; 
                
            }
            helper.pos = 0; 
            for (let k = 0; k < i; k++) {
                helper.pos += this.helpers[k].value; 
            }
            this.helpers.push(helper); 
        })
        this.node.params.rowOrder.forEach((order, i) => {
            let helper = {dir: "row"}; 
            if (order < 0){
                helper.type = "text";
                let fixedSize = this.node.params.row.reduce((acc, v) => acc+= v, 0);
                helper.value =  (this.node.params.h - fixedSize) / 
                                (this.node.params.rowOrder.length - this.node.params.row.length);
            } else {
                helper.type = "input";
                helper.value = this.node.params.row[order]; 
            }
            helper.pos = 0; 
            for (let k = 0; k < i; k++) {
                helper.pos += this.helpers[k + this.node.params.colOrder.length].value; 
            }
            this.helpers.push(helper); 
        })
    }

    drawNode(node, firstEntry = true){
        if (firstEntry){
            this.ctx.translate(this.node.offsetX, this.node.offsetY);
            this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
        }

        this.ctx.font = `${4 * 8}px sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = this.dpi; 
        this.ctx.fillStyle = `hsl(${(node.bb.x2 / node.bb.y2) * 360 + node.bb.x1 * 3 }deg, 60%, 70%)`;
        this.ctx.fillRect(  node.geom.x1,
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
    }

    updateCanvas(){
        this.canvas.width = this.canvas.clientWidth * this.dpi;
        this.canvas.height = this.canvas.clientHeight * this.dpi;
        this.node.factor = Math.min(    Math.floor(this.canvas.width / (this.node.params.w + 80)),
                                        Math.floor(this.canvas.height / (this.node.params.h + 80))) 
    }

    update(){
        this.updateCanvas();
        this.calcNode(this.node);
        this.scaleGeometry(this.node);
        this.calcOffset(this.node); 
        this.drawNode(this.node); 
        this.calcHelpers();
        this.drawHelpers();
    }

    init(){
        if (!this.node){
            console.error("NO NODE OBJECT! Failed to init");
            return; 
        }
        if (!this.root){
            console.error("NO ROOT ELEMENT! Failed to init");
            return; 
        }
        this.hEl.type = "number";
        this.wEl.type = "number";
        this.wEl.value = (this.node.params.w || 10); 
        this.hEl.value = (this.node.params.h || 10); 
        this.root.appendChild(this.canvas, this.hEl, this.wEl);
        this.canvas.width = this.canvas.clientWidth * this.dpi;
        this.canvas.height = this.canvas.clientHeight * this.dpi;
        this.node.factor = Math.min(    Math.floor(this.canvas.width / (this.node.params.w + 80)),
                                        Math.floor(this.canvas.height / (this.node.params.h + 80))) 
        this.helpersSize *= this.node.factor; 
        this.ctx = this.canvas.getContext("2d");  
        this.update();
    }
}


document.addEventListener("DOMContentLoaded", () => {
    let we = new WE("we-cont", win2); 
    we.init();
    console.log(we); 
    addEventListener("resize", (event) => {
        we.update(); 
    });
});