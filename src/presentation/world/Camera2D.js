export class Camera2D {
 constructor(width){this.width=width;this.x=0;}
 follow(position,sceneWidth){this.x=Math.max(0,Math.min(Math.max(0,sceneWidth-this.width),position-this.width/2));return this.x;}
}
