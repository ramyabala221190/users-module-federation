import { Component, Inject } from '@angular/core';
import { ModuleFederationConfigLibService, configModel } from 'module-federation-config-lib';
import { appName } from '../users.module';

@Component({
  selector: 'app-users-container',
  templateUrl: './users-container.component.html',
  styleUrls: ['./users-container.component.scss']
})
export class UsersContainerComponent {
  constructor(private envConfigService:ModuleFederationConfigLibService,@Inject(appName)public appName:string){}

  config:configModel|undefined;

  ngOnInit(){
    console.log(this.appName)
    console.log(this.envConfigService.getConfiguration(this.appName))
    this.config=this.envConfigService.getConfiguration(this.appName);
    }
}
