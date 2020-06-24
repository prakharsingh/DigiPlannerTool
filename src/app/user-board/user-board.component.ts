import { Component, OnInit, Renderer2, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { fabric } from 'fabric';
import { ActivatedRoute, Router, NavigationStart, CanDeactivate } from '@angular/router';
import { ShapeService } from '../user-board-services/shape.service';
import { ConstantsService } from '../user-board-services/constants.service';
import { SocketService } from '../socket-services/socket.service';
import { UserSocketService } from '../socket-services/user-socket.service';
import { AuthService, SocialUser } from 'angularx-social-login';
import { GroupService } from '../user-board-services/group.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserDatabaseService } from '../user-board-services/user-database.service';
import { AdminBoardService } from '../admin-board services/admin-board.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-user-board',
  templateUrl: './user-board.component.html',
  styleUrls: ['./user-board.component.css'],
})
export class UserBoardComponent implements OnInit, OnDestroy, ICanComponentDeactivate {
  canvas: fabric.Canvas;
  boardTitle: string;
  isUserEditing: boolean;
  @ViewChild('canvasContent') canvasContent: ElementRef<HTMLElement>;

  constructor(
    private shapeService: ShapeService,
    private groupService: GroupService,
    private renderer: Renderer2,
    private route: ActivatedRoute,
    public constants: ConstantsService,
    private socketService: SocketService,
    private userSocketService: UserSocketService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private userDatabase: UserDatabaseService,
    private adminBoardService: AdminBoardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.constants.roomID = this.route.snapshot.queryParamMap.get('room_code') || 'unknown';
    this.isUserEditing = false;
    this.socketService.connect();
    this.canvas = this.shapeService.initCanvas(this.renderer);
    this.userSocketService.init(this.canvas, this.renderer, this.constants.roomID);
    this.authService.authState.subscribe((user) => {
      this.groupService.currentUser = user;
      this.constants.userID = user.email;
    });
    this.groupService.userEdit.subscribe((isEditing: boolean) => {
      this.isUserEditing = isEditing;
    });
    window.onbeforeunload = function(e) {
      if(this.isUserEditing){
        this.shapeService.windowClose.next();
      }
    }.bind(this);
  }

  ngOnDestroy(): void{
    // this.socketService.socket.emit('disconnect');
    this.socketService.disconnect();
  }

  addObj(shape) {
    this.socketService.somethingAdded(
      shape,
      this.canvas.selectedColor,
      this.constants.roomID,
    );
  }

  addEllipse() {
    this.shapeService.addEllipse(this.canvas, this.renderer);
    this.addObj('ellipse');
  }

  addRectangle() {
    this.shapeService.addRectangle(this.canvas, this.renderer);
    this.addObj('rect');
  }

  addTriangle() {
    this.shapeService.addTriangle(this.canvas, this.renderer);
    this.addObj('triangle');
  }

  clear() {
      this.canvas.clear();
      this.shapeService.setBackground(this.canvas, 'assets');
      this.socketService.clearCanvas(this.canvas, this.constants.roomID);
      document.getElementById('deleteBtn')?.remove();
      console.log(this.canvas.toJSON(['id', 'connections', 'givingId', 'editing']));
      this.userDatabase.sendingCanvas(this.canvas.toJSON(['id', 'connections', 'givingId', 'editing']));
  }

  showSnackBar(message: string, action: string): void {
    if(!this.isUserEditing){
      const snackBarRef = this.snackBar.open(message, action, {
        duration: 3000,
      });
      snackBarRef.onAction().subscribe(() => {
        this.clear();
      });
    }
  }

  connect() {
    if (this.canvas.connect) {
      this.canvas.connect = false;
      this.canvas.connectButtonText = this.constants.connectText;
    }
    else {
      while (this.canvas.selectedElements.length > 0) {
        this.canvas.selectedElements.pop();
      }
      this.canvas.connect = true;
      this.canvas.connectButtonText = this.constants.disconnectText;
    }
  }

  exportAsImage(canvasContent) {
    // for IE, Edge
    if (canvasContent.msToBlob) {
      const blob = canvasContent.msToBlob();
      window.navigator.msSaveBlob(blob, 'board-image.png');
    } else {
      // other browsers
      const image = canvasContent
        .toDataURL('image/png', 1.0)
        .replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.download = 'board-image.png';
      link.href = image;
      link.click();
    }
  }

  changeColor(color: string) {
    this.shapeService.changeColor(this.canvas, color, this.renderer);
  }

  canDeactivate(): boolean {
    return !this.isUserEditing;
  }
}

export interface ICanComponentDeactivate extends Component {
  canDeactivate: () => Observable<boolean> | boolean;
}
