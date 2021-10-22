import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GoogleAuthService, GoogleApiService } from 'ng-gapi';
// import {GoogleAuthService} from "ng-gapi/lib/GoogleAuthService";
import GoogleUser = gapi.auth2.GoogleUser;
import GoogleAuth = gapi.auth2.GoogleAuth;
import { TableElement } from '../entity/tableElement';


@Injectable({
  providedIn: 'root'
})
export class ExcelsheetService {

  private API_KEY = "AIzaSyCCBWckrUoQcqJILzKAcWMiYyMH1w9aoN4"
  private CLIENT_ID = "288814605103-l52s8288c07v1gp53k78obsn8or7r5k8.apps.googleusercontent.com"
  private SHEET_ID = "16c6CXd-M8gxysiYAcnvfCM1HE634_ItLgn_l76kqqO4"

  public SESSION_STORAGE_KEY: string = "accessTokenBillBook";
  private user: GoogleUser = undefined;
  public result_set : Array<TableElement> = [];
  public max_BILL_NO: number = 0;
  public max_CUST_ID: number = 0;
  public max_INDEX: number = 0;

  constructor(private http: HttpClient, private ngZone: NgZone,
              private googleAuthService: GoogleAuthService,
              private gapiService: GoogleApiService) { 

    this.gapiService.onLoad().subscribe(() => {
      console.log("GAPI loaded successfully ...")
    });

    // Working get Sheet data code for My Excel sheet
    // console.log("Sheet API called"); 
    // this.http.get("https://sheets.googleapis.com/v4/spreadsheets/16c6CXd-M8gxysiYAcnvfCM1HE634_ItLgn_l76kqqO4?includeGridData=true&ranges=Sheet1&key=AIzaSyCCBWckrUoQcqJILzKAcWMiYyMH1w9aoN4").subscribe(res => {
    //   console.log("Response for sheet = ", res)
    // });
  }

  ngAfterViewInit() {
  }    

  public signIn() {
    this.googleAuthService.getAuth().subscribe((auth: any) => {
        console.log("Started singIn ", auth.currentUser)

        sessionStorage.setItem('access-token-billBook', auth.currentUser.Vd.Zb.access_token); // auth.currentUser.Td.Zb.access_token
        auth.signIn().then(res => {
          console.log("Got response = ", res)
          localStorage.setItem('access-token-billBook', res.getAuthResponse().access_token)
        })
        auth.signIn().then(res => this.signInSuccessHandler(res), err => this.signInErrorHandler(err));
    });
  }

  private signInSuccessHandler(res: GoogleUser) {
    this.ngZone.run(() => {
        this.user = res;
        localStorage.setItem('access-token-billBook', res.getAuthResponse().access_token)
        console.log("Sign In sucessfull === ", this.user)
    });
  }

  private signInErrorHandler(err) {
    console.log("error couured while sign in", err);
  }

  public isLoggedIn(): boolean {
    let session = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
    return  (session != "" || session != null);
  }

  getHeaders() {
    let token = sessionStorage.getItem("access-token-billBook")
    let headerDict = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    }

    let requestOptions = {                                                                                                                                                                                 
      headers: new HttpHeaders(headerDict)
    }

    return requestOptions;
  }


  addRecord(reqObj: any) {
    // console.log("getData() Local storage data = ", sessionStorage.getItem("access-token-billBook"))
    // let api_key = "AIzaSyCCBWckrUoQcqJILzKAcWMiYyMH1w9aoN4"
    // let sheet_id = "16c6CXd-M8gxysiYAcnvfCM1HE634_ItLgn_l76kqqO4"

    let insert_uri= "https://sheets.googleapis.com/v4/spreadsheets/"  + this.SHEET_ID + 
                    "/values/Sheet1:append?valueInputOption=RAW&key=" + this.API_KEY

    let requestOptions = this.getHeaders();
  
    // let reqObj = {   // sample request format
    //   "values": [
    //     [
    //       "19",
    //       "1/12/2021",
    //       "11",
    //       "Dhanashree Maid"
    //     ]
    //   ]
    // }

    console.log("Insert API called = ", reqObj)
    return this.http.post(insert_uri, reqObj, requestOptions)
    // .subscribe(res => {
    //   console.log("Insert Response from Google = ", res)
    //   // alert("Saved successfully")
    // })

  }


  public getSheet() {
    let token = sessionStorage.getItem("access-token-billBook") // "ya29.a0ARrdaM-vgXbT3BdBvs7HWd1TrbZRJRhOV6_lwICM0RBOE1_JReeBG4-ZcDrD42p_1hl5-qRM2QdAyQMeyE5kmRGSXPZkKnUZo2djc0q3NN9ECZ1aVS2iD4C5E5XY79L4WC5Jeg55Z-pCsmqeKX28mxWgb-f-DA"
    let headerOptions = this.getHeaders();

    // let url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheet_id + "?includeGridData=true&ranges=Sheet1&key=" + api_key;  // AIzaSyDeBhdlFvu8wTfOLLWxTOtlL8NGQFBfycQ
    let url =  "https://sheets.googleapis.com/v4/spreadsheets/" + this.SHEET_ID + "/values:batchGet?ranges=Sheet1&valueRenderOption=FORMATTED_VALUE&key=" + this.API_KEY

    return this.http.get(url, headerOptions); 

    // this.http.get(url, headerOptions).subscribe((res: any) => 
  }
  
  
  public transformData(res: any) {
      const data = res.valueRanges[0].values;
      const returnArray: Array<any> = [];

      for(let i=data.length-1; i>0; i--) {
        let obj: TableElement = {   
            INDEX: data[i][0] == undefined ? "" : data[i][0].trim(),
            DATE: data[i][1] == undefined ? "" : data[i][1].trim(),
            BILL_NO:data[i][2] == undefined ? "" : data[i][2].trim(),
            FIRST_NAME : data[i][3] == undefined ? "" : data[i][3].trim(),
            LAST_NAME : data[i][4] == undefined ? "" : data[i][4].trim(),
            VILLAGE: data[i][5] == undefined ? "" : data[i][5].trim(),
            TALUKA : data[i][6] == undefined ? "" : data[i][6].trim(),
            MOBILE : data[i][7] == undefined ? "" : data[i][7].trim(),
            ITEM : data[i][8] == undefined ? "" : data[i][8].trim(),
            ITEM_MATERIAL:data[i][9] == undefined ? "" : data[i][9].trim(),
            HM: data[i][10] == undefined ? "" : data[i][10].trim(),    
            QUANTITY: data[i][11] == undefined ? "" : data[i][11].trim(), 
            WEIGHT: data[i][12] == undefined ? "" : data[i][12].trim(), 
            RATE: data[i][13] == undefined ? "" : data[i][13].trim(), 
            LABOR_CHARGE: data[i][14] == undefined ? "" : data[i][14].trim(), 
            TOTAL: data[i][15] == undefined ? "" : data[i][15].trim(),  
            TOTAL_BILL_AMOUNT : data[i][16] == undefined ? "" : data[i][16].trim(), 
            PAID : data[i][17] == undefined ? "" : data[i][17].trim(), 
            BARTER_MOD : data[i][18] == undefined ? "" : data[i][18].trim(), 
            DISCOUNT : data[i][19] == undefined ? "" : data[i][19].trim(), 
            RETURN : data[i][20] == undefined ? "" : data[i][20].trim(),
            PAY_MEDIUM : data[i][21] == undefined ? "" : data[i][21].trim(),
            CUST_ID : data[i][22] == undefined ? "" : data[i][22].trim()
          };

          returnArray.push(obj);
        } //) // forEach

        console.log("Generated JSON = ", returnArray)
        this.result_set = returnArray;
        this.setNextIds();

      return returnArray;
    }
  


  setNextIds() {
    this.result_set.forEach(e => { 
      if(Number(e.BILL_NO) > this.max_BILL_NO)  // first find Max value from available records
        this.max_BILL_NO = Number(e.BILL_NO);

      if(Number(e.CUST_ID) > this.max_CUST_ID)
        this.max_CUST_ID = Number(e.CUST_ID);

      if(Number(e.INDEX) > this.max_INDEX)
        this.max_INDEX = Number(e.INDEX);
    })
  }


}
