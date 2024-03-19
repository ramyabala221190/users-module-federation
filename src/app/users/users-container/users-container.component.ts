import { Component } from '@angular/core';
import { EnvConfigService, envConfigModel } from 'src/app/env-config.service';

@Component({
  selector: 'app-users-container',
  templateUrl: './users-container.component.html',
  styleUrls: ['./users-container.component.scss']
})
export class UsersContainerComponent {
  constructor(private envConfigService:EnvConfigService){}

  config:envConfigModel|undefined;

  ngOnInit(){
    this.config=this.envConfigService.fetchEnvConfig();
    }
}
