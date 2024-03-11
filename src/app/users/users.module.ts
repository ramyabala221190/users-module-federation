import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersContainerComponent } from './users-container/users-container.component';
import { UsersListComponent } from './users-list/users-list.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { RouterModule, Routes } from '@angular/router';

export const routes:Routes=[
  {
    path:"",
    component:UsersContainerComponent,
    children:[
      {
        path:"list",
        component:UsersListComponent
      },
      {
        path:"detail/:id",
        component:UserDetailComponent
      }
    ]
  }
]


@NgModule({
  declarations: [
    UsersContainerComponent,
    UsersListComponent,
    UserDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class UsersModule { }
