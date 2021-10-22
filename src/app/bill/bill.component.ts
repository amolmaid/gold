import { Component, OnInit } from '@angular/core';
import { TableElement } from '../entity/tableElement';
import { ExcelsheetService } from '../service/excelsheet.service';
import * as fs from 'file-saver';
import * as htmlToImage from 'html-to-image';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.css']
})
export class BillComponent implements OnInit {

  record: TableElement;
  items: TableElement[] = [];
  constructor(private sheetService: ExcelsheetService) { }

  ngOnInit(): void {
    this.record = JSON.parse(localStorage.getItem('bill_record'))
    this.items = JSON.parse(localStorage.getItem('bill_items'))

    console.log("Data in bill template", this.record, "\n", this.items)

  }

  downloadBill() {
    window.saveAs = window.saveAs || {};
    let bill_no = this.record.BILL_NO;
    console.log("Downloading bill ", this.record.BILL_NO);
    htmlToImage.toBlob(document.getElementById('bill-template'))
    .then(function (blob) {
      window.saveAs(blob, "Bill-" + bill_no + ".png");
    });
  }

  ngOnDestroy() {
    localStorage.setItem('bill_record', "")
    localStorage.setItem('bill_items', "")
  }


}
