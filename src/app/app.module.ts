import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Observable } from 'rxjs';
import { EnvConfigService } from './env-config.service';

function appInitialization(envConfigService:EnvConfigService) :()=>Observable<any>{
  return ()=>envConfigService.loadConfig();
}


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [{
    provide:APP_INITIALIZER,
    useFactory:appInitialization,
    deps:[EnvConfigService],
    multi:true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
