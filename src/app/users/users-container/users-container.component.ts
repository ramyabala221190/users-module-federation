import { Component, Inject } from '@angular/core';
import { ModuleFederationConfigLibModule, ModuleFederationConfigLibService, configModel } from 'module-federation-config-lib';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { appName } from '../users.module';

@Component({
  selector: 'app-users-container',
  templateUrl: './users-container.component.html',
  styleUrls: ['./users-container.component.scss']
})
export class UsersContainerComponent {
  constructor(private activeRoute:ActivatedRoute,@Inject(appName)public appName:string,private envConfigLibService:ModuleFederationConfigLibService){}

  config:Observable<any>|undefined; //for lazy method
  //config:configModel|undefined; //for eager method

  ngOnInit(){
    //this.config=this.envConfigLibService.getConfiguration(this.appName) //for eager method
    this.config=this.activeRoute.data; //for laxy method
    }
}
