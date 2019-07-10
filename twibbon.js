let twibbon = new Image();
let userPic = new Image();

let canvas = document.createElement('canvas');
canvas.id = 'twibbon-edit';
document.body.insertBefore(canvas, document.getElementById('slidercontainer'));
let ctx = canvas.getContext('2d');
let canvasToHtmlScale=1;

let userPicX = 0;
let userPicY = 0;
let userPicWidth = 0;
let userPicHeight = 0;
let scale = 1;

let twibbonFile = document.getElementById('twibbon');
let userPicFile = document.getElementById('userpic');
twibbonFile.addEventListener('change', (e) => {
  handleFileChange(e, twibbon);
});
userPicFile.addEventListener('change', (e) => {
  handleFileChange(e, userPic);
  userPicX = 0;
  userPicY = 0;
});

function handleFileChange(e, item){
  file = e.target.files[0];
  if(file.type.match('image.*')){
    item.src = URL.createObjectURL(e.target.files[0]);
  }
  else{
    alert('not an image file; broken file?');
  }
}

twibbon.addEventListener('load', (e) => initializeCanvas(e.target));
userPic.addEventListener('load', (e) =>{
  userPicWidth = userPic.width;
  userPicHeight = userPic.height;
  drawUserPic();
});

function initializeCanvas(image){
  canvas.width = image.width;
  canvas.height = image.height;
  canvasToHtmlScale = canvas.offsetWidth/image.width;
  ctx.drawImage(image, 0, 0);
}

function drawUserPic(){
  ctx.clearRect(0,0,twibbon.width,twibbon.height);
  if(userPic.src != ''){
    ctx.drawImage(userPic, userPicX, userPicY, userPicWidth*scale, userPicHeight*scale);
  }
  ctx.drawImage(twibbon, 0, 0);
}

let debounce = performance.now();
document.querySelector('#imagescaler').addEventListener('change', (e)=>{
  scale = e.target.value/25;
  if(performance.now() - debounce >= 50){
    debounce = performance.now();
    drawUserPic();
  } 
});

let offsetLeft = canvas.offsetLeft;
let offsetTop = canvas.offsetTop;
let lastX, lastY;
let isDraggingImage = false;

canvas.addEventListener('mousedown',(e) => handleDownEvent(e, e));
canvas.addEventListener('touchstart', (e)=> handleDownEvent(e.touches[0], e));
function handleDownEvent(pointer, e){
  if(contains(userPicX, userPicY, userPicWidth*scale, userPicHeight*scale,
    (pointer.clientX - offsetLeft)/canvasToHtmlScale, (pointer.clientY - offsetTop)/canvasToHtmlScale)){
    isDraggingSizer = false;
    isDraggingImage = true;
    lastX = pointer.clientX;
    lastY = pointer.clientY;
  }
}
canvas.addEventListener('mouseup', (e) => handleUpEvent());
canvas.addEventListener('touchend', (e) => handleUpEvent());
function handleUpEvent(){
  isDraggingImage = false;
}

canvas.addEventListener('mousemove', (e) => handleMoveEvent(e));
canvas.addEventListener('touchmove', (e) => {
  e.stopPropagation();
  e.preventDefault();
  handleMoveEvent(e.touches[0]);
});
function handleMoveEvent(pointer){
  if(isDraggingImage){
    let x = pointer.clientX;
    let y = pointer.clientY;
    let deltaX = x - lastX;
    let deltaY = y - lastY;
    userPicX += deltaX/canvasToHtmlScale;
    userPicY += deltaY/canvasToHtmlScale;
    if(performance.now() - debounce >= 50){
      drawUserPic();
      debounce = performance.now();
    }
    lastX = x;
    lastY = y;
  }
}
document.getElementById('get').addEventListener('click', (e)=>{
  window.open().location = canvas.toDataURL("image/jpeg");
});

function contains(imageX, imageY, imageWidth, imageHeight, x, y){
  return (x >= imageX && x <= imageX + imageWidth && y >= imageY && y <= imageY + imageHeight);
}