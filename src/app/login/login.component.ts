import { Component, OnInit } from '@angular/core';
import { ExcelsheetService } from '../service/excelsheet.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private sheetService: ExcelsheetService) { }

  ngOnInit(): void {
  }

  logIn() {
    this.sheetService.signIn();
  }

}
