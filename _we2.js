let win1 = {
    params: {
        factor: 1,
        w: 80,
        h: 120,
        maxw: 160, 
        minw: 30,
        maxh: 200,
        minh: 40, 
        col: [45],
        row: [],
    },
    pd: [10,3,7,3],
    grid: [2,2],
    child: [{
        w: "col-1",
        triangle: "left",
    },{
        triangle: "left",
    },{},{},{},{},{}]
}

class WE{
    constructor(containerId, node, dpi = 2){
        this.container  = document.getElementById(containerId);
        this.canvas     = document.createElement('canvas');
        this.hEl        = document.createElement('input');
        this.wEl        = document.createElement('input');
        this.colEl      = []; 
        this.rowEl      = []; 
        this.node       = node;
        this.ctx        = null; 
        this.dpi        = dpi;
    }
    
    drawNode(node, firstEntry = true){
        this.ctx.font = `${node.factor * 8}px sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.strokeStyle = "#000";
        this.ctx.fillStyle = `hsl(${node.bb[0]}deg, 60%, 70%)`;
        this.ctx.fillRect(  node.geom[0],
                            node.geom[1],
                            node.geom[2] - node.geom[0],
                            node.geom[3] - node.geom[1]);
        if (node.child)
            this.drawNode(node, false);
    }

    setNewLimit(dest = "width", type = "max", value = 200){
        
    }

    calcFactor(){
        
    }

    calcNode(node, parent = null, i = 0){
        let gridPosX = 0;
        let gridPosY = 0;
        if (!node.bb){
            node.bb = {x1: 0, y1: 0, x2: 0, y2: 0};
            node.geom = node.bb; 
        }
        if (!node.pd)
            node.pd = [0,0,0,0]; 
        if (!parent){
            node.bb = [0,0,this.node.params.w,this.node.params.h];
            node.geom = node.bb; 
        } else {
            if (parent.grid){
                gridPosX = i % parent.grid[0];
                gridPosY = Math.floor((i + 0.99) / parent.grid[0]);
                node.bb[0] = 0;
                node.bb[1] = 0;
                
                if (gridPosX > 0)
                    node.bb[0] = parent.child[i - 1].bb[2];
                if (gridPosY > 0)
                    node.bb[1] = parent.child[i - parent.grid[1]].bb[3];

                if (node.w){
                    let paramIndex = parseInt(node.w.split('-')[1]) - 1; 
                    if (paramIndex > -1 && paramIndex < this.node.params.col.length)
                        node.bb[2] = node.bb[0] + this.col[paramIndex];
                } else {
                    node.bb[2] = node.bb[0] + (parent.autoX || 0); 
                }

                if (node.h){
                    let paramIndex = parseInt(node.h.split('-')[1]) - 1; 
                    if (paramIndex > -1 && paramIndex < this.node.params.col.length)
                        node.bb[3] = node.bb[1] + this.row[paramIndex];
                } else {
                    node.bb[3] = node.bb[1] + (parent.autoY || 0); 
                }

                node.geom = parent.geom;
                if (parent.gap){
                    if (gridPosX > 0)
                        node.geom[0] += parent.gap / 2;
                    if (gridPosX < parent.grid[0])
                        node.geom[2] -= parent.gap / 2;
                    if (gridPosY > 0)
                        node.geom[1] += parent.gap / 2;
                    if (gridPosY < parent.grid[1])
                        node.geom[3] -= parent.gap / 2;
                }
            } else {
                node.bb = parent.geom; 
                node.geom = parent.geom;
            }
            node.geom[0] += parent.pd[3];
            node.geom[1] += parent.pd[0];
            node.geom[2] -= parent.pd[1];
            node.geom[3] -= parent.pd[2];
        }

        if (node.child.length > 1 && node.grid){
            let fixedX = node.child.reduce((acc, v) => {
                if (typeof v.w === 'string' || v.w instanceof String){
                    let paramIndex = parseInt(v.w.split('-')[1]) - 1; 
                    if (paramIndex > -1 && paramIndex < this.node.params.col.length)
                        acc += this.node.params.col[paramIndex];
                }
            }, 0);
            let fixedY = node.child.reduce((acc, v) => {
                if (typeof v.h === 'string' || v.h instanceof String){
                    let paramIndex = parseInt(v.h.split('-')[1]) - 1; 
                    if (paramIndex > -1 && paramIndex < this.node.params.col.length)
                        acc += this.node.params.col[paramIndex];
                }
            }, 0);
            node.autoX = ((node.bb[2] - node.bb[0]) - fixedX) / node.grid[0];
            node.autoY = ((node.bb[3] - node.bb[1]) - fixedY) / node.grid[1];
        }
        
        if (node.child)
            node.child.forEach((e, j) => this.calcNode(e, node, j));
    }

    updateButtons(){
        
    }

    update(){

    }

    updateScaling(){
        
    }

    initButtons(){
        this.colEl.map((v) => {v.remove()})
        this.rowEl.map((v) => {v.remove()})
        this.node.col.map((v, i) => {
            let inputEl     = document.createElement("input");
            this.hEl.setAttribute("id", "we-height");
            inputEl.type    = "number";
            inputEl.value   = (v.value || 40);
            inputEl.max     = (v.max || 500);
            inputEl.min     = (v.min || 10);
            this.colEl.push(inputEl);
        })
        this.node.row.map((v, i) => {
            let inputEl     = document.createElement("input");
            inputEl.type    = "number";
            inputEl.value   = (v.value || 40);
            inputEl.max     = (v.max || 500);
            inputEl.min     = (v.min || 10);
            this.rowEl.push(inputEl);
        })
    }

    init(){
        this.canvas.setAttribute("id", "we-canvas");
        this.canvas.width = this.canvas.clientWidth * this.dpi; 
        this.canvas.height = this.canvas.clientHeight * this.dpi; 
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.hEl.setAttribute("id", "we-height");
        this.hEl.type = "number";
        this.container.appendChild(this.hEl);
        this.wEl.setAttribute("id", "we-width");
        this.wEl.type = "number";
        this.container.appendChild(this.wEl);
    }
}