import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { UsersService } from 'src/app/users.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent {

  usersList$:Observable<any>|undefined;

  constructor(private userService:UsersService) {}

  ngOnInit(){
    this.usersList$=this.userService.fetchUsers();
  }

}
