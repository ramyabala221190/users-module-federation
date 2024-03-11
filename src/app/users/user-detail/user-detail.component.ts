import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, mergeMap } from 'rxjs';
import { UsersService } from 'src/app/users.service';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent {
  constructor(private activeRoute:ActivatedRoute,private userService:UsersService){}

  userDetail$:Observable<any>|undefined;

  ngOnInit(){
    this.userDetail$=this.activeRoute.paramMap.pipe(
      mergeMap((params:any)=>{
      console.log(params.get('id'));
      return this.userService.fetchUserDetail(params.get('id'))
    }))
  }
}
