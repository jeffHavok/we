let we = null; 
function loadWeWindow(url){
    fetch(url)
        .then(res => res.json())
        .then(data => {
            we = new WE(data,2);
            we.init("editor-wrap");
            we.updateInputs();   
        })
}
document.addEventListener('DOMContentLoaded', () => {
    /*--- button events ---*/
    document.getElementById("we-height").addEventListener("change", (e) => {
        we.setParam("height", e.target.value); 
        we.updateInputs();
    })
    document.getElementById("we-width").addEventListener("change", (e) => {
        we.setParam("width", e.target.value); 
        we.updateInputs();
    })
    document.getElementById("we-col").addEventListener("change", (e) => {
        we.setParam("col", e.target.value); 
        we.updateInputs();
    })
    document.getElementById("we-row").addEventListener("change", (e) => {
        we.setParam("row", e.target.value); 
        we.updateInputs();
    })
    /*--- resize event ---*/
    addEventListener("resize", (event) => {
        we.update(); 
        we.updateInputs();
    });
});