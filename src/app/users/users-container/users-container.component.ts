import { Component } from '@angular/core';
import { ModuleFederationConfigLibService, configModel } from 'module-federation-config-lib';

@Component({
  selector: 'app-users-container',
  templateUrl: './users-container.component.html',
  styleUrls: ['./users-container.component.scss']
})
export class UsersContainerComponent {
  constructor(private envConfigService:ModuleFederationConfigLibService){}

  config:configModel|undefined;
  appName:string="usersApp";

  ngOnInit(){
    console.log(this.envConfigService.getConfiguration(this.appName))
    this.config=this.envConfigService.getConfiguration(this.appName);
    }
}
