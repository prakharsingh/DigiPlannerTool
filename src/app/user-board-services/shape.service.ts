import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { TextBoxService } from './text-box.service';
import {ShapeInterface} from '../user-board/user-board.component';

@Injectable({
  providedIn: 'root'
})

export class ShapeService {
 
 JSONarray=[];
 counter;
  constructor(private textService: TextBoxService) {
    this.counter=0;
   }
 
  addEllipse(canvas: fabric.Canvas, color: string): ShapeInterface{
    const ellipse = new fabric.Ellipse({
    originX:'center',
    originY:'center',
    fill : color,
    rx: 100,
    ry: 50,
    });
    console.log(ellipse);
    const text = this.textService.addText(ellipse, canvas);
    const group = this.textService.createGroup(ellipse, text, canvas, 100, 100);
   this.JSONarray.push(JSON.stringify(canvas));
    return {name: 'ellipse', object: group, text: text.text, connectingNodes: []};
  }

  addRectangle(canvas: fabric.Canvas, color: string) {
    const rect = new fabric.Rect({
      originX: 'center',
      originY: 'center',
      width: 200,
      height: 100,
      rx: 10,
      ry : 10,
      fill: color,
    });
    const text = this.textService.addText(rect, canvas);
    const group = this.textService.createGroup(rect, text, canvas, 100, 100);
       
    this.JSONarray.push(JSON.stringify(canvas));
    return {name: 'rect', object: group, text: text.text, connectingNodes: []};
  }

  addImage(canvas: fabric.Canvas){
    const image = fabric.Image.fromURL('', (img) => {
      const scale = 300 / img.width;
      img.set({
         scaleX: scale,
         scaleY: scale
      });
    });
    const text = this.textService.addText(image, canvas);
    const group = this.textService.createGroup(image, text, canvas, 100, 100);
    this.JSONarray.push(JSON.stringify(canvas));
    return {name: 'image', object: group, text: text.text, connectingNodes: []};
  }

 
    
 
   
}