let twibbon = new Image();
let userPic = new Image();

let tempUserPic = new Image();
let tempUserCanvas = document.createElement('canvas');

let canvas = document.createElement('canvas');
canvas.id = 'twibbon-edit';
document.body.insertBefore(canvas, document.getElementById('slidercontainer'));
let ctx = canvas.getContext('2d');
let canvasToHtmlScale=1;
let rotation = 0;

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
  handleFileChange(e, tempUserPic, (orientation)=>{
    switch(orientation){
      case 1:
        rotation = 0;
        break;
      case 3:
        rotation = 180;
        break;
      case 6:
        rotation = 90;
        break;
      case 8:
        rotation = -90;
        break;
      default:
        rotation = 0;
        break;
    }
    drawUserPic();
  });
  tempUserPic.onload = (e) => {
    let ctx = tempUserCanvas.getContext('2d');
    if(rotation == 0){
      userPic.src = tempUserPic.src;
      return;
    }
    else if(rotation == 180){
      tempUserCanvas.width = tempUserPic.width;
      tempUserCanvas.height = tempUserPic.height;
    }
    else {
      tempUserCanvas.width = tempUserPic.height;
      tempUserCanvas.height = tempUserPic.width;
    }
    ctx.translate(tempUserPic.width/2, tempUserPic.height/2);
    ctx.rotate(rotation*Math.PI/180);
    ctx.translate(-tempUserPic.width/2, -tempUserPic.height/2);
    ctx.drawImage(tempUserPic, 0, 0);
    userPic.src = tempUserCanvas.toDataURL();
  }
  userPicX = 0;
  userPicY = 0;
});

function handleFileChange(e, item, callback){
  file = e.target.files[0];
  if(file.type.match('image.*')){
    let reader = new FileReader();
    reader.onload = (e) => {
      let view = new DataView(e.target.result);
      if(view.getUint16(0, false) != 0xFFD8){
        return callback(-2);
      }
      let length = view.byteLength, offset = 2;
      while(offset < length){
        if(view.getUint16(offset+2, false) <= 8) return callback(-1);
        let marker = view.getUint16(offset, false);
        offset += 2;
        if(marker == 0xFFE1){
          if(view.getUint32(offset += 2, false) != 0x45786966){
            return callback(-1);
          }
          let little = view.getUint16(offset += 6, false) == 0x4949;
          offset += view.getUint32(offset + 4, little);
          let tags = view.getUint16(offset, little);
          offset += 2;
          for(let i = 0; i < tags; i++){
            if(view.getUint16(offset + (i * 12), little) == 0x0112){
              return callback(view.getUint16(offset + (i * 12) + 8, little));
            }
          }
        }
        else if((marker&0xFF00) != 0xFF00) break;
        else offset += view.getUint16(offset, false);
      }
      return callback(-1);
    }
    reader.readAsArrayBuffer(e.target.files[0]);
    item.src = URL.createObjectURL(e.target.files[0]);
  }
  else{
    alert('not an image file; broken file?');
  }
}

twibbon.addEventListener('load', (e) => initializeCanvas(e.target));
userPic.addEventListener('load', (e) =>{
  if(userPic.width >= userPic.height){
    userPicHeight = canvas.height;
    userPicWidth = userPic.width * (canvas.height/userPic.height);
  }
  else{
    userPicWidth = canvas.width;
    userPicHeight = userPic.height * (canvas.width/userPic.width);
  }
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
  scale = .75+e.target.value/25;
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
  let dlLink = document.querySelector('#dl-link');
  dlLink.href =  canvas.toDataURL('image/jpeg');
});

function contains(imageX, imageY, imageWidth, imageHeight, x, y){
  return (x >= imageX && x <= imageX + imageWidth && y >= imageY && y <= imageY + imageHeight);
}