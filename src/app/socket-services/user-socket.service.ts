import { Injectable } from '@angular/core';
import { GroupService } from '../user-board-services/group.service';
import { ShapeService } from '../user-board-services/shape.service';
import { fabric } from 'fabric';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class UserSocketService {
  roomId;
  constructor(
    private groupService: GroupService,
    private shapeService: ShapeService,
    private socketService: SocketService
  ) { }
  init(canvas, renderer, roomId) {
    this.roomId = roomId;
    this.socketService.joinRoom(this.roomId);

    this.socketService.socket.on('groupAltered', (data) => {
      document.getElementById('deleteBtn')?.remove();
      for (const obj of canvas.getObjects()) {
        if (obj instanceof fabric.Group) {
          console.log('groupRecieved');
          if (obj.id === data.id) {
            console.log('groupSet');
            console.log(obj);
            obj.left = data.left;
            obj.top = data.top;
            obj.scaleX = data.scaleX,
              obj.scaleY = data.scaleY,
              obj.angle = data.angle || 0;
            this.groupService.moveLines(obj);
            obj.setCoords();
            canvas.renderAll();
          }
        }
      }
    });

    this.socketService.socket.on('addedObject', (data) => {
      console.log('obj added');
      console.log(data);
      if (data[0] === 'rect') {
        this.shapeService.addRectangle(canvas, renderer, data[1]);
      } else if (data[0] === 'ellipse') {
        this.shapeService.addEllipse(canvas, renderer, data[1]);
      } else {
        this.shapeService.addImage(canvas, '', renderer);
      }
    });

    this.socketService.socket.on('modifiedObject', (h) => {
      document.getElementById('deleteBtn')?.remove();

      console.log('obj modified');
      let gr;
      for (const ob of canvas._objects) {
        if (ob.id === h) {
          gr = ob;
          break;
        }
      }
      const text = gr._objects[1];
      this.groupService.unGroup(gr, canvas);
      // canvas.setActiveObject(text);
      text.lockMovementX = false;
      text.lockMovementY = false;
      // text.enterEditing();
      // text.selectAll();
    });

    this.socketService.socket.on('regrouping', (h: any) => {
      document.getElementById('deleteBtn')?.remove();

      // const dummy = new fabric.Canvas();
      // dummy.loadFromJSON(h, dummy.renderAll.bind(dummy));
      console.log('Regrouped');
      const gr = this.groupService.selectedGroup;
      const shape = gr._objects[0];
      var text = gr._objects[1];
      console.log(h);
      console.log(text);
      text.set('text', h);
      console.log(text);
      // let text;
      // let i = 0;
      // for (const obj of canvas._objects) {
      //   if (obj.id === gr.id) {
      //     text = obj;
      //     break;
      //   }
      //   i++;
      // }
      this.groupService.regroup(shape, text, canvas, renderer);
      console.log(canvas);
      console.log(text);
    });

    this.socketService.socket.on('clearCanvas', (can) => {
      canvas.clear();
      this.shapeService.setBackground(canvas, 'assets');
      document.getElementById('deleteBtn')?.remove();
    });

    this.socketService.socket.on('colorChange', (data) => {
      // canvas.selectedColor = data.color;
      let gr;
      for (const ob of canvas._objects) {
        if (ob.id === data[0]) {
          gr = ob;
          break;
        }
      }
      const text = gr._objects[1];
      const shape = gr._objects[0];
      shape.fill = data[1];
      this.groupService.unGroup(gr, canvas);
      this.groupService.regroup(shape, text, canvas, renderer);
    });

    this.socketService.socket.on('deleteGroup', (data) => {
      let gr;
      for (const ob of canvas._objects) {
        if (ob.id === data) {
          gr = ob;
          break;
        }
      }
      this.groupService.delete(canvas, gr);
    });

    this.socketService.socket.on('drawingLines', (data: any) => {
      // console.log(h.f);
      // console.log(h.s);
      const h = {
        f: data[0],
        s: data[1],
      };
      for (const obj of canvas._objects) {
        if (h.f === obj.id || h.s === obj.id) {
          canvas.selectedElements.push(obj);
        }
      }
      this.groupService.drawLineTwoPoints(canvas);
      canvas.selectedElements.splice(0, 2);
      console.log(canvas);
      console.log('drawing');
    });
  }
}
