import { Component, Renderer2, ViewChild } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { NativeStorage } from "@ionic-native/native-storage";
import { Events, IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { GlobalSettingsProvider } from "../../providers/global-settings/global-settings";
import { HomePage } from "../home/home";

import { HttpClient } from "@angular/common/http";
import { GooglePlus } from "@ionic-native/google-plus";
import { Toast } from "@ionic-native/toast";
import { PibAuthProvider } from "../../providers/pib-auth/pib-auth";

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-login",
  templateUrl: "login.html",
})
export class LoginPage {

  public node: string;
  @ViewChild("mainObject") public mainObject: any;
  public mainObjectElement: any;

  // Page URL is generated by appending the node to the global site URL.
  public pageUrl: SafeUrl;

  private loggedInInitially: boolean | undefined;
  private messageListener: () => void;

  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams,
              private sanitizer: DomSanitizer, private renderer: Renderer2, private nativeStorage: NativeStorage,
              private toast: Toast, private iab: InAppBrowser, private http: HttpClient, public events: Events,
              private settings: GlobalSettingsProvider, private googlePlus: GooglePlus,
              private pibAuth: PibAuthProvider) {

    this.platform.ready().then(() => {
      this.messageListener = this.renderer.listen(window, "message", (evt) => {
        this.receiveMessage(evt);
      });

      this.pageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.settings.siteUrl() + "/blog/blank");
    });

  }

  public receiveMessage(event) {
    console.log("receiving message: " + event.data);
    if (event.data === "googleLogin") {
      this.doGoogleLogin();
    } else if (event.data === "facebookLogin") {
      this.doFacebookLogin();
    } else if (event.data.message === "loginInfo") {
      if (typeof this.loggedInInitially === "undefined") {

        this.loggedInInitially = false;
        let node = "/accounts/login/?pib_mobile=true";
        if (this.pibAuth.isLoggedIn(event.data.data)) {
          node = "/accounts/logout/?pib_mobile=true";
          this.loggedInInitially = true;
        }

        const url = this.settings.siteUrl() + node;
        console.log(url);
        this.pageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      } else {
        const loggedInNow = this.pibAuth.isLoggedIn(event.data.data);
        if (this.loggedInInitially && !loggedInNow) {
          // successfully logged out
          this.events.publish("component:updateNav:login");
          this.navCtrl.setRoot(HomePage);
          this.messageListener();
        } else if (!this.loggedInInitially && loggedInNow) {
          // successfully logged in
          this.events.publish("component:updateNav:logout");
          this.navCtrl.setRoot(HomePage);
          this.messageListener();
        }
      }
    }
  }

  public doGoogleLogin() {
    console.log("googleLogin");
    const browser = this.iab.create(this.settings.siteUrl() + "/accounts/google/login/?process=");
  }

  public doFacebookLogin() {
    console.log("facebookLogin");
    const browser = this.iab.create(this.settings.siteUrl() + "/accounts/facebook/login/?process=");
  }

}
