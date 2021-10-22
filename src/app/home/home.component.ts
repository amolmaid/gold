import { AfterViewInit, Component, ChangeDetectorRef, ElementRef, ViewChild, Renderer2, Inject, NgZone } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ExcelsheetService } from '../service/excelsheet.service';
import { TableElement } from '../entity/tableElement';
import { ItemElement } from '../entity/itemEntity';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment/moment';
import {Observable, of} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { Workbook, Row, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import * as htmlToImage from 'html-to-image';
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router';

declare global {
  interface Window { saveAs: any; }
}


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {

  dataSource = new MatTableDataSource<TableElement>([]); // TableElement
  // displayedColumns: string[] = ['INDEX', 'DATE', 'BILL_NO', 'FIRST_NAME', 'LAST_NAME', 'VILLAGE', 'TALUKA', 'MOBILE', 'ITEM', 'ITEM_MATERIAL', 'WEIGHT', 'RATE', 'LABOR_CHARGE', 'TOTAL', 'PAID', 'RETURN', 'PAY_MEDIUM', 'CUST_ID'];
  displayedColumns: string[] = ['DATE', 'BILL_NO', 'FIRST_NAME', 'LAST_NAME', 'MOBILE', 'ITEM', 'ITEM_MATERIAL', 'HM', 'QUANTITY', 'WEIGHT', 'RATE', 'LABOR_CHARGE', 'TOTAL', 'PAID', 'RETURN', 'PAY_MEDIUM', 'CUST_ID', 'VILLAGE', 'TALUKA', 'INDEX'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  selectedRecord: TableElement = null;
  totalLeftover: number = 0;
  showSpinner: boolean = false;
  sessionExpirationTimeLeft_minutes: number = 59;
  sessionExpirationTimeLeft_seconds: number = 59;

  constructor(private sheetService: ExcelsheetService, private router: Router, public dialog: MatDialog, private cdRef: ChangeDetectorRef, private ngZone: NgZone, private elementRef: ElementRef,  private _renderer2: Renderer2) { 
    // console.log("Called getData from excelSheet service ")
    // this.sheetService.getSheet();

    setInterval(() => {
      this.sessionExpirationTimeLeft_seconds-- ;
      if(this.sessionExpirationTimeLeft_seconds == 0) {
        this.sessionExpirationTimeLeft_minutes--;
        this.sessionExpirationTimeLeft_seconds = 59;
      }
      if(this.sessionExpirationTimeLeft_minutes == 1 && this.sessionExpirationTimeLeft_seconds == 58)
        alert("Your session will expire in 2 minnutes, please save your work and login again")
      if(this.sessionExpirationTimeLeft_minutes < 0 ) { // i.e logged out
        sessionStorage.setItem('access-token-billBook', ""); //reset token
        this.router.navigate(["/login"]);
      }
    }, 1000);
  }


  logIn() {
    this.sheetService.signIn();
  }


  getData() {
    console.log("Called getData from excelSheet service ")
    this.sheetService.getSheet().subscribe(res => {
      this.sheetService.transformData(res);
    },
    err => {
      this.showSpinner = false;
      if(err.status == 401)
        alert("Session has expired, please clear Cache and Login back")
      else 
        alert("Something went wrong," + err.status + " : " + err.message + " Please clear Cache and try to Login back \n OR Contact Administrator (Amol Maid)")
    })
  }

  onRefreshClick() {
    this.showSpinner = true;
    this.sheetService.getSheet().subscribe(res => {
      this.sheetService.transformData(res);
      this.showData()
      // setTimeout(()=>{ this.showData()  }, 3000) // add some timeout if its taking loger
      this.showSpinner = false;
    },
    err => {
      console.log("Error ", err)
      this.showSpinner = false;
      if(err.status == 401)
        alert("Session has expired, please clear Cache and Login back")
      else 
        alert("Something went wrong," + err.status + " : " + err.message + " Please clear Cache and try to Login back \n OR Contact Administrator (Amol Maid)")

    })
    
  }

  showData() {
    console.log("Show excel ", this.sheetService.result_set)
    this.dataSource.data = this.sheetService.result_set;
    this.cdRef.detectChanges();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // addData() {
  //   this.sheetService.addRecord();
  // }

  InsertData() {
    this.openDialog()
  }


  openDialog(): void {
    const dialogRef = this.dialog.open(Popup, {
      disableClose: true,
      width: "77%",
      data: {name: "Amol"}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed ', result);
      this.showData(); // initilizes the resultSet with new entrie/s

      if(result && result.record) {
        this.selectedRecord = result.record;
        this.totalLeftover = result.totalLeftover;
        // this.dataSource.data = this.sheetService.result_set.filter(e => { (Number(e.CUST_ID) == Number(result.CUST_ID)) && (Number(e.RETURN) > 0) })
        this.dataSource.data = this.sheetService.result_set.filter((e)=> { return ((e.CUST_ID == result.record.CUST_ID) && (Number(e.RETURN) > 0 || Number(e.RETURN) < 0))});
        this.cdRef.detectChanges();
      }
    }); 
  }
  

  showFullData() {
    this.dataSource.data = this.sheetService.result_set;
    this.selectedRecord = null;
    // this.cdRef.detectChanges();
  }


  downloadData () {
    console.log("download called")
    let workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Bill book data', {"views": [{"state" : "frozen", "ySplit": 1 }]});
    		 	 						  	  	  						
    worksheet.columns = [
      { header: 'INDEX', key: 'INDEX', width: 10 },
      { header: 'DATE', key: 'DATE', width: 15 },
      { header: 'BILL_NO', key: 'BILL_NO', width: 10, outlineLevel: 1 },
      { header: 'FIRST_NAME', key: 'FIRST_NAME', width: 35 },
      { header: 'LAST_NAME', key: 'LAST_NAME', width: 20 },
      { header: 'VILLAGE', key: 'VILLAGE', width: 20 },
      { header: 'TALUKA', key: 'TALUKA', width: 15 },
      { header: 'MOBILE', key: 'MOBILE', width: 15 },
      { header: 'ITEM_MATERIAL', key: 'ITEM_MATERIAL', width: 15 },
      { header: 'ITEM', key: 'ITEM', width: 20 },
      { header: 'WEIGHT', key: 'WEIGHT', width: 15 },
      { header: 'RATE', key: 'RATE', width: 10 },
      { header: 'LABOR_CHARGE', key: 'LABOR_CHARGE', width: 10 },
      { header: 'TOTAL', key: 'TOTAL', width: 15 },
      { header: 'PAID', key: 'PAID', width: 15 },
      { header: 'DISCOUNT', key: 'DISCOUNT', width: 10 },
      { header: 'RETURN', key: 'RETURN', width: 15 },
      { header: 'PAY_MEDIUM', key: 'PAY_MEDIUM', width: 15 },
      { header: 'CUST_ID', key: 'CUST_ID', width: 10 },
    ];

    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {argb: '#e0c1c1'},
      bgColor: {argb: ''}
    }

    this.sheetService.result_set.forEach(e => {
      worksheet.addRow(e);
    })

    const buffer = workbook.xlsx.writeBuffer().then(res => {
      let blob = new Blob([res], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
      fs.saveAs(blob, "Bill-Book_backup" + moment(new Date()).format("DD-MM-YYYY HH:MM") + ".xlsx")
    })

  }

  downloadBill() {
    window.saveAs = window.saveAs || {};
    console.log("Downloading bill ");
    htmlToImage.toBlob(document.getElementById('my-node'))
  .then(function (blob) {
    window.saveAs(blob, 'my-node.png');
  });
  }

  ngAfterViewInit(): void {
    // this.onRefreshClick();  // enable at the time of deployment
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupFilter(column: string) {
    this.dataSource.filterPredicate = (d: TableElement, filter: string) => {
      const textToSearch = d[column] && d[column].toLowerCase() || '';
      return textToSearch.indexOf(filter) !== -1;
    };
  }

  // applyFilter(filterValue: string) {
  //   console.log(filterValue);
  //   this.dataSource.filter = filterValue.trim().toLowerCase();
  // }

}



@Component({
  selector: 'popup',
  templateUrl: 'popup.html',
  styleUrls: ['./popup.css']
})
export class Popup {

  customerDetails = new FormGroup({
    BILL_NO:  new FormControl(),
    MOBILE: new FormControl(),
    CUST_ID: new FormControl(),
    FIRST_NAME:  new FormControl(),
    LAST_NAME:  new FormControl(),
    VILLAGE:  new FormControl(),
    TALUKA:  new FormControl()
  }); 

  record: TableElement = null;
  items: TableElement[] = [];  //ItemElement
  blank_record: TableElement;

  currentDate = new Date();
  totalLeftover: number = 0;
  total: number = 0;
  isUserSelected: boolean = false;
  saveSpinner: boolean = false;
  isBillSaved: boolean = false;

  dateSelectFormControl : FormControl = new FormControl();
  paymentMethodFormControl: FormControl = new FormControl('Cash');
  itemMaterialFormControl: FormControl = new FormControl();
  itemTypesFormControl: FormControl = new FormControl();
  filteredOptions: Observable<TableElement[]>;
  
  itemTypes = ['Mangalsutra', 'Ring', 'Ring Ladies', 'Ring Gents', 'Topes Fancy', 'Topes Chain', 'Kan bali', 'Other', 'Clear UDHARI/Settlement']
  item_materials = ['Gold', 'Silver']
  payment_mediums = ['Cash', 'Credit Card', 'Gpay', 'PhonePe', 'PayTM', 'Amazon Pay', 'Ohter method']
  hm_codes = ["18 K", "20 K" , "21 K", "22 K", "24 K"] //[750, 833, 875, 916, 999]

  constructor( private sheetService: ExcelsheetService, private router: Router, public dialogRef: MatDialogRef<Popup>, private toaster: MatSnackBar, private cdRef: ChangeDetectorRef, @Inject(MAT_DIALOG_DATA) public data: any) {
    console.log("Record initilized")
    this.record = this.initilizeRecord();

    let obj = Object.assign({}, this.record);
    this.items.push(obj)
  } // cunstructor

  openSnackBar() {
    this.toaster.openFromComponent(ToasterComponent, {
      duration: 3000,
      horizontalPosition: "end",
      verticalPosition: "top",
      panelClass: ['snackbar_class']
    });
  }

  initilizeRecord() {
    return {   
      INDEX: "",
      DATE: "",
      BILL_NO: "",
      FIRST_NAME : "",
      LAST_NAME : "",
      VILLAGE: "",
      TALUKA : "",
      MOBILE : "",
      ITEM : "",
      ITEM_MATERIAL: "", 
      HM: "",
      QUANTITY : 1,
      WEIGHT: 0, 
      RATE: 0, 
      LABOR_CHARGE: 0, 
      TOTAL: 0, 
      TOTAL_BILL_AMOUNT : 0,
      PAID : 0,
      BARTER_MOD : 0,
      DISCOUNT: 0, 
      RETURN : 0,
      PAY_MEDIUM : "",
      CUST_ID : ""
    }
  }

  ngAfterViewInit() {      
    this.customerDetails.get('LAST_NAME').valueChanges.subscribe(key => {
      // this.total = key
      // console.log("self value changed LAST_NAME ", key)
      this.filteredOptions = of(key ? this._filter(key, 'LAST_NAME') : this.sheetService.result_set.slice())
    })

    this.customerDetails.get('FIRST_NAME').valueChanges.subscribe(key => {
      this.filteredOptions = of(key ? this._filter(key, 'FIRST_NAME') : this.sheetService.result_set.slice())
    })

    this.customerDetails.get('MOBILE').valueChanges.subscribe(key => {
      this.filteredOptions = of(key ? this._filter(key, 'MOBILE') : this.sheetService.result_set.slice())
    })

    this.customerDetails.get('CUST_ID').valueChanges.subscribe(key => {
      this.filteredOptions = of(key ? this._filter(key, 'CUST_ID') : this.sheetService.result_set.slice())
    })

    this.customerDetails.get('BILL_NO').valueChanges.subscribe(key => {
      this.filteredOptions = of(key ? this._filter(key, 'BILL_NO') : this.sheetService.result_set.slice())
    })

    this.customerDetails.get('VILLAGE').valueChanges.subscribe(key => {
      this.filteredOptions = of(key ? this._filter(key, 'VILLAGE') : this.sheetService.result_set.slice())
    })

    this.customerDetails.get('TALUKA').valueChanges.subscribe(key => {
      this.filteredOptions = of(key ? this._filter(key, 'TALUKA') : this.sheetService.result_set.slice())
    })
  }

  displayFn(record: TableElement): string {
    return record && record.BILL_NO ? record.BILL_NO : '';
  }

  displayFn2(record: TableElement): string {
    return record && record.MOBILE ? record.MOBILE : '';
  }

  displayFn3(record: TableElement): string {
    return record && record.CUST_ID ? record.CUST_ID : '';
  }

  displayFn4(record: TableElement): string {
    return record && record.FIRST_NAME ? record.FIRST_NAME : '';
  }

  displayFn5(record: TableElement): string {
    return record && record.LAST_NAME ? record.LAST_NAME : '';
  }

  displayFn6(record: TableElement): string {
    return record && record.VILLAGE ? record.VILLAGE : '';
  }

  displayFn7(record: TableElement): string {
    return record && record.TALUKA ? record.TALUKA : '';
  }

  private _filter(value: string, prop_type: string): TableElement[] {
    const filterValue = value.toLowerCase();
    console.log("_filter = ", value, " ", prop_type)
    return this.sheetService.result_set.filter(record => record[prop_type].toLowerCase().includes(filterValue));
  }

  dropDownValueChange(e, property_name, i) {
    console.log(" value cahange = ", property_name, " i = ", i);
    this.items[i][property_name] = e
  }

  valuechange(e, property_name, i = -1) {
    console.log("valueChange i=",i, " property_name= ",property_name, " ")
    if(i < 0)
      this.record[property_name] = e.target.value;  // main record assignment
    else 
      this.items[i][property_name] = e.target.value || e.value;  // each item assignment

    if(property_name === "PAID" || property_name === "DISCOUNT" || property_name === "BARTER_MOD") { 
      this.calculateFinalBillReturn();
    }
    else
      this.calculateFinalBill(i);
  }

  calculateFinalBill(index = -1) {
    this.record['TOTAL_BILL_AMOUNT'] = 0;
    // this.items.forEach(e => {
    for(let i=0; i<this.items.length; i++) {
      if(index >= 0 && index == i) {
        this.items[i]['TOTAL'] = (Number(this.items[i]['WEIGHT']) * Number(this.items[i]['RATE']) ) + (Number(this.items[i]['WEIGHT']) * Number(this.items[i]['LABOR_CHARGE']))
        this.items[i]['TOTAL'] = Number(this.items[i]['TOTAL']) * Number(this.items[i]['QUANTITY'])
      }
      this.record['TOTAL_BILL_AMOUNT'] += this.items[i].TOTAL; 
    }
    this.calculateFinalBillReturn();
  }

  calculateFinalBillReturn() {
    console.log("FinalBillReturn called ")
    this.record.RETURN = Number(this.record['TOTAL_BILL_AMOUNT']) - (Number(this.record['PAID']) + Number(this.record['BARTER_MOD']) + Number(this.record['DISCOUNT']));
  }


  customerSelected(cust) {
    console.log("Customer selected = ", cust)
    this.customerDetails.patchValue({
      BILL_NO: cust['BILL_NO'],
      MOBILE : cust['MOBILE'],
      CUST_ID: cust['CUST_ID'],
      FIRST_NAME : cust['FIRST_NAME'],
      LAST_NAME: cust['LAST_NAME'],
      VILLAGE : cust['VILLAGE'],
      TALUKA: cust['TALUKA'],
    }); 

    this.sheetService.result_set.forEach(e => {
      if(Number(e.CUST_ID === cust['CUST_ID'])) this.totalLeftover+= Number(e.RETURN);
    })
    this.isUserSelected = true;
    // this.record = cust;
    this.record.BILL_NO = cust['BILL_NO'],
    this.record.MOBILE = cust['MOBILE'],
    this.record.CUST_ID = cust['CUST_ID'],
    this.record.FIRST_NAME = cust['FIRST_NAME'],
    this.record.LAST_NAME = cust['LAST_NAME'],
    this.record.VILLAGE = cust['VILLAGE'],
    this.record.TALUKA = cust['TALUKA'],
    this.record.TOTAL_BILL_AMOUNT = 0
    this.record.RETURN = 0
    this.cdRef.detectChanges();
  }


  addItem() {
    // let obj = Object.assign({}, this.blank_record);
    let obj: TableElement = this.initilizeRecord();//
    // {
    //   INDEX: "",
    //   DATE: "",
    //   BILL_NO: "",
    //   FIRST_NAME : "",
    //   LAST_NAME : "",
    //   VILLAGE: "",
    //   TALUKA : "",
    //   MOBILE : "",
    //   ITEM : "",
    //   ITEM_MATERIAL: "", 
    //   QUANTITY : 1,
    //   WEIGHT: 0, 
    //   RATE: 0, 
    //   LABOR_CHARGE: 0, 
    //   TOTAL: 0, 
    //   TOTAL_BILL_AMOUNT : 0,
    //   PAID : 0,
    //   DISCOUNT: 0, 
    //   RETURN : 0,
    //   PAY_MEDIUM : "",
    //   CUST_ID : ""
    // }

    this.calculateFinalBill();
    this.items.push(obj);
    this.cdRef.detectChanges();
  }


  removeItem(i: number) {
    this.items.splice(i, 1);
    this.calculateFinalBill();
  }


  onEditClick() {
    this.isUserSelected = false;
    this.record = this.initilizeRecord();
  }

  onPrintClick() {
    localStorage.setItem('bill_record', JSON.stringify(this.record))
    localStorage.setItem('bill_items',JSON.stringify(this.items))

    this.router.navigate([]).then(result => {  window.open("/bill", '_blank'); });
  }

  showBillsClicked() {
    this.dialogRef.close({
      totalLeftover: this.totalLeftover,
      record: this.record
    });
  }


  onCloseClick(): void {
    // console.log("Popup data = ", this.items, "\n ", this.items[1]['QUANTITY'])
    this.dialogRef.close();
  }


  onFormSubmit () {
    // this.dialogRef.close();
    console.log("onFormSubmit clicked ", this.record)
  }


  onSaveBillClick() {
    console.log("Save clicked \n custID = ", this.record['CUST_ID'], " \ndate selected = ", this.dateSelectFormControl.value)
    if(this.record['CUST_ID'] === "" ||  this.record['CUST_ID'] === "0") {
      this.record.CUST_ID = (this.sheetService.max_CUST_ID + 1).toString();
      this.record.MOBILE = this.customerDetails.get('MOBILE').value
      this.record.FIRST_NAME = this.customerDetails.get('FIRST_NAME').value
      this.record.LAST_NAME = this.customerDetails.get('LAST_NAME').value
      this.record.VILLAGE = this.customerDetails.get('VILLAGE').value
      this.record.TALUKA = this.customerDetails.get('TALUKA').value
    }
    // else {
    //   this.record.CUST_ID = (this.sheetService.max_CUST_ID + 1).toString();
    // }

    if(!(this.record.CUST_ID && this.record.FIRST_NAME && this.record.LAST_NAME && this.record.VILLAGE && this.record.MOBILE) ) {
      alert("Please select a user or fill the user details first to proceed")
    }
    else {
      this.saveSpinner = true;

      this.record.INDEX = (this.sheetService.max_INDEX + 1).toString();
      this.record.BILL_NO = (this.sheetService.max_BILL_NO + 1).toString();
      this.record.DATE = this.dateSelectFormControl.value ? moment(this.dateSelectFormControl.value).format("DD/MM/YYYY") : moment(new Date()).format("DD/MM/YYYY")
      this.record.PAY_MEDIUM = this.paymentMethodFormControl.value;

      let reqObj = {
        "values": [
          // [
          //   "19",
          //   "1/12/2021",
          //   "11",
          //   "Dhanashree Maid"
          // ]
        ]
      }

      for(let i=0; i<this.items.length; i++) {
        console.log("item = ", this.items[i].ITEM);
        console.log("itemMaterial = ", this.items[i].ITEM_MATERIAL);
        let arr = []
        arr.push(Number(this.record.INDEX) + i);
        arr.push(this.record.DATE);
        arr.push(this.record.BILL_NO);     // this.sheetService.max_BILL_NO  Next bill number
        arr.push(this.record.FIRST_NAME);
        arr.push(this.record.LAST_NAME);
        arr.push(this.record.VILLAGE);
        arr.push(this.record.TALUKA);
        arr.push(this.record.MOBILE);

        // Also add data in UI Table, so need to call API again
        this.items[i].INDEX = this.record.INDEX
        this.items[i].DATE = this.record.DATE
        this.items[i].BILL_NO = this.record.BILL_NO
        this.items[i].FIRST_NAME = this.record.FIRST_NAME
        this.items[i].LAST_NAME = this.record.LAST_NAME
        this.items[i].VILLAGE = this.record.VILLAGE
        this.items[i].TALUKA = this.record.TALUKA
        this.items[i].MOBILE = this.record.MOBILE
        this.items[i].CUST_ID = this.record.CUST_ID

        arr.push(this.items[i].ITEM);
        arr.push(this.items[i].ITEM_MATERIAL);
        arr.push(this.items[i].HM ? this.items[i].HM : "");
        arr.push(this.items[i].QUANTITY);
        arr.push(this.items[i].WEIGHT);
        arr.push(this.items[i].RATE);
        arr.push(this.items[i].LABOR_CHARGE);
        arr.push(this.items[i].TOTAL);

        if(i === this.items.length-1) {  // in case of multi-item, populate following only for last bill entry 
          arr.push(this.record.TOTAL_BILL_AMOUNT);
          arr.push(this.record.PAID || 0);
          arr.push(this.record.BARTER_MOD);
          arr.push(this.record.DISCOUNT);
          arr.push(this.record.RETURN);
          arr.push(this.record.PAY_MEDIUM);

          // Also add data in UI Table, so need to call API again
          this.items[i].TOTAL_BILL_AMOUNT = this.record.TOTAL_BILL_AMOUNT
          this.items[i].PAID = this.record.PAID  || 0
          this.items[i].BARTER_MOD = this.record.BARTER_MOD
          this.items[i].DISCOUNT = this.record.DISCOUNT
          this.items[i].RETURN = this.record.RETURN
          this.items[i].PAY_MEDIUM = this.record.PAY_MEDIUM || 'Cash'
        } 
        else {
          arr.push("")
          arr.push("")
          arr.push("")
          arr.push("")
          arr.push("")
          this.items[i].PAY_MEDIUM = this.record.PAY_MEDIUM || 'Cash'
        }
        arr.push(this.record.CUST_ID); // || Number(this.sheetService.max_CUST_ID) + 1

        reqObj.values.push(arr);
      }

      console.log("reqObj = ", reqObj) 
      this.sheetService.addRecord(reqObj).subscribe(res => {
          this.items.forEach(e => {
            this.sheetService.result_set.unshift(e)
          })
          
          this.isBillSaved = true;
          this.sheetService.setNextIds();
          this.saveSpinner = false;
          this.openSnackBar();
        console.log("Sucessfully saved a new Bill")
      },
        // err => {
        //   alert("Your session has expired, Please Log In again")
        //   this.dialogRef.close()
        //   // redirect to the Login page
        //   this.router.navigate(['./login']);
        // }
        err => {
          if(err.status == 401)
            alert("Session has expired, please clear Cache and Login back")
          else 
            alert("Something went wrong," + err.status + " : " + err.message + " Please clear Cache and try to Login back \n OR Contact Administrator (Amol Maid)")
        }
      )
    }
  } // saveBill()

}




@Component({
  selector: 'snack-bar-component-example-snack',
  templateUrl: 'toaster-component-snack.html',
  styles: [`
    .example-pizza-party {
      color: black;
    }
  `],
})
export class ToasterComponent {}