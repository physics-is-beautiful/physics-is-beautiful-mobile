import { Component, NgZone, Renderer2, ViewChild } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { NativeStorage } from "@ionic-native/native-storage";
import { Events, IonicPage, NavController, NavParams, Platform, ToastController } from "ionic-angular";
import { GlobalSettingsProvider } from "../../providers/global-settings/global-settings";
import { HomePage } from "../home/home";

import { HttpClient } from "@angular/common/http";
import { GooglePlus } from "@ionic-native/google-plus";
import { PibAuthProvider } from "../../providers/pib-auth/pib-auth";

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 // TODO use ?next= on login and logout pages (google and facebook included) to specify

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

  private triedSocialLogin: boolean = false;
  private loggedInInitially: boolean | undefined;
  private messageListener: () => void;

  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams,
              private sanitizer: DomSanitizer, private renderer: Renderer2, private nativeStorage: NativeStorage,
              private toastCtrl: ToastController, private iab: InAppBrowser, public events: Events,
              private settings: GlobalSettingsProvider, private pibAuth: PibAuthProvider, private zone: NgZone) {

    this.platform.ready().then(() => {

      this.updateUrl("/accounts/blank");

      this.messageListener = this.renderer.listen(window, "message", (evt) => {
        this.receiveMessage(evt);
      });
    });

  }

  public receiveMessage(evt) {
    console.log("login receive");
    console.log("receiving message: " + JSON.stringify(evt.data));
    console.log("loggedInInitially " + this.loggedInInitially);
    if (evt.data === "googleLogin") {
      this.doGoogleLogin();
    } else if (evt.data === "facebookLogin") {
      this.doFacebookLogin();
    } else if (evt.data.message === "loginInfo") {
      if (typeof this.loggedInInitially === "undefined") {

        this.loggedInInitially = false;
        let node = "/accounts/login/?pib_mobile=true";
        if (this.pibAuth.isLoggedIn(evt.data.data)) {
          node = "/accounts/logout/?pib_mobile=true&next=/accounts/blank";
          this.loggedInInitially = true;
        }

        this.updateUrl(node);
      } else {
        const loggedInNow = this.pibAuth.isLoggedIn(evt.data.data);
        if (this.loggedInInitially && !loggedInNow) {
          // successfully logged out
          this.events.publish("component:updateNav:login");
          this.navCtrl.setRoot(HomePage);
          this.presentToast("Successfully logged out.");
        } else if (!this.loggedInInitially && loggedInNow) {
          // successfully logged in
          this.events.publish("component:updateNav:logout");
          this.navCtrl.setRoot(HomePage);
          this.presentToast("Successfully logged in as " + evt.data.data.display_name + "!");
        } else if (this.triedSocialLogin) {
          this.updateUrl("/accounts/login/?pib_mobile=true");
          this.triedSocialLogin = false;
        }
      }
    }
  }

  public doGoogleLogin() {
    console.log("googleLogin");
    const browser = this.iab.create(this.settings.siteUrl() +
      "/accounts/google/login/?process=&next=/accounts/mobile-next");

    this.triedSocialLogin = true;

    browser.on("exit").subscribe(() => {
      this.updateUrl("/accounts/blank");
    });
  }

  public doFacebookLogin() {
    console.log("facebookLogin");
    const browser = this.iab.create(this.settings.siteUrl() +
      "/accounts/facebook/login/?process=&next=/accounts/mobile-next");

    this.triedSocialLogin = true;

    browser.on("exit").subscribe(() => {
      this.updateUrl("/accounts/blank");
    });
  }

  public ionViewWillLeave() {
    this.messageListener();
    console.log("login message listener removed");
  }

  private updateUrl(url: string) {
    this.pageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.settings.siteUrl() + url);
    this.zone.run(() => {});
  }

  private presentToast(msg: string) {
    const toast = this.toastCtrl.create({
      duration: 3000,
      message: msg,
    });
    toast.present();
  }

}
