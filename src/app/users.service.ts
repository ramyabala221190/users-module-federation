import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http:HttpClient) { }
  
  fetchUsers(){
    return this.http.get('https://jsonplaceholder.typicode.com/users')
  }

  fetchUserDetail(id:number){
    return this.http.get(`https://jsonplaceholder.typicode.com/users?id=${id}`)

  }
}
