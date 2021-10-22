import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent, Popup } from './home/home.component';
import { ExcelsheetService } from './service/excelsheet.service';
import { BillComponent } from './bill/bill.component';

import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material/material/material.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule, Routes } from '@angular/router'


import {
  GoogleApiModule, 
  GoogleApiService, 
  GoogleAuthService, 
  NgGapiClientConfig, 
  NG_GAPI_CONFIG,
  GoogleApiConfig
} from "ng-gapi";

let gapiClientConfig: NgGapiClientConfig = {
  client_id: "288814605103-l52s8288c07v1gp53k78obsn8or7r5k8.apps.googleusercontent.com",
  discoveryDocs: [],
  ux_mode: "redirect",
  // redirect_uri: "http://localhost:4200/home",
  redirect_uri: "https://amolmaid.github.io/gold/home",
  scope: [
    'https://www.googleapis.com/auth/spreadsheets'
  ].join(" ")
};

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'bill', component: BillComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
]

@NgModule({
  imports: [
    BrowserModule, 
    BrowserAnimationsModule,
    FormsModule, 
    AppRoutingModule, 
    HttpClientModule,
    GoogleApiModule.forRoot({
      provide: NG_GAPI_CONFIG,
      useValue: gapiClientConfig
    }),
    MaterialModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule.forRoot(routes)
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    Popup,
    LoginComponent,
    BillComponent
  ],
  providers: [ExcelsheetService, MatDatepickerModule, MatNativeDateModule],
  entryComponents: [
    Popup,
    
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
