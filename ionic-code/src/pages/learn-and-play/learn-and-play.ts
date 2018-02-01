import { Component } from '@angular/core';
import { MissionProvider, IMission } from '../../providers/mission';
import { NavController, ModalController, LoadingController, IonicPage } from 'ionic-angular';
import { GeLoggerProvider } from '../../providers/ge-logger';
import { GeToastErrorProvider, OFFLINE_ERROR_CODE, UNAUTHORIZED_ERROR_CODE } from '../../providers/ge-toast-error';
import { UserProvider, IUserMissionResult, UserProfile } from '../../providers/user';
import * as stackTrace from 'stacktrace-js';
import * as _ from 'lodash';
import { throttle } from 'lodash';

@IonicPage({
    name: 'learn-and-play',
    priority: 'high'
})
@Component({
    selector: 'page-learn-and-play',
    templateUrl: 'learn-and-play.html'
})
export class LearnAndPlayPage {

    userResults: IUserMissionResult [] = [];
    avalaibleMissions: IMission[] = [];
    showBeginHistoryMessage = false;
    throttledInitialize: any;

    private readonly _userResultsLimit: number = 10;
    private _userResultsOffset: number = 0;

    constructor(
        public missionService: MissionProvider,
        public modalCtrl: ModalController,
        public navCtrl: NavController,
        public _loadingCtrl: LoadingController,
        public _geLoggerProvider: GeLoggerProvider,
        private _geToastErrorProvider: GeToastErrorProvider,
        private userService: UserProvider
    ) { }

    ionViewWillEnter() {
        this._geLoggerProvider.addLog('LearnAndPlayPage', 'WILL_ENTER_PAGE');
    }

    ionViewWillLoad() {
        // We need to create this function as a throttled
        // one because we must prevent multiple initializations
        // due to the workaround for popping views where
        // ionic is not triggering the native ionViewDidEnter.
        this.throttledInitialize = throttle(() => {
            this.showBeginHistoryMessage = false;
            this._getMissions();
        }, 1000, {
            trailing: false
        });
    }

    /**
     * Funtion to get the data when the view has loaded
     */
    ionViewDidLoad() {
        // Uses this event emitter for viewDidEnter
        // because we're triggering manually from
        // navigation page
        // https://github.com/ionic-team/ionic/issues/9951
        this.navCtrl.viewDidEnter.subscribe(() => {
            this.throttledInitialize();
        });
    }

    ionViewDidEnter() {
        this.throttledInitialize();
    }

    /**
     * @TODO get missions
     */
    private _getMissions() {
        let loading = this._loadingCtrl.create();
        let langInUse: string;
        let loaded: boolean;

        this.userService.getUserProfile()
            .flatMap((profile: UserProfile) => {
                langInUse = this.userService.getUserTranslateLang(profile);
                return this.missionService.getMissions(langInUse);
            })
            .flatMap((avalaibleMissions) => {
                this.avalaibleMissions = avalaibleMissions;
                return this.userService.getUserMissionResults(this._userResultsLimit, this._userResultsOffset);
             })
             .finally(() => {
                    loading.dismiss();
                    loaded = true;
            }).subscribe(
                (results) => {
                    this.userResults = results;
                    // Showing 'Begin History Message' if we don't have completed missions
                    if (this.userResults.length === 0) {
                        this.showBeginHistoryMessage = true;
                    }
                },
                // On error request
                (error) => {
                    // Unauthorized
                    if (UNAUTHORIZED_ERROR_CODE === _.get(error, 'status')) {
                        return;
                    }

                    this._geToastErrorProvider.getErrorToast(error, () => {
                        this._getMissions();
                    });

                    // If we have an offline Error we wont log
                    if (OFFLINE_ERROR_CODE === _.get(error, 'status')) {
                        return;
                    }
                    // Track the error
                    let stack;
                    stackTrace
                        .get({offline: true}).then(_stack => stack = _stack)
                        .catch(err => this._geLoggerProvider.addLog(err, 'ERROR GETTING STACK'))
                        .then(() => this._geLoggerProvider.error('MissionProvider.getMissions() - Unexpected Error', error, stack));

            });


        if (!loaded) {
            loading.present();
        }

    }

    /**
    * @TODO Function to make infinite scroll
    */
    doInfinite(infiniteScroll) {
        let offset = this._userResultsOffset + this.userResults.length;
        let boundary = this._userResultsLimit + 1;
        this.userService
            .getUserMissionResults(boundary, offset)
            .finally(() => {
                infiniteScroll.complete();
            })
            .subscribe((results) => {
                let moreItems: boolean;
                if (results.length > this._userResultsLimit) {
                    moreItems = !!results.pop();
                }
                this.userResults = [...this.userResults, ...results];
                if (!moreItems) { this.showBeginHistoryMessage = true; }
            }, (error) => {
                // Unauthorized
                if (UNAUTHORIZED_ERROR_CODE === _.get(error, 'status')) {
                    return;
                }

                this._geToastErrorProvider.getErrorToast(error);

                // If we have an offline Error we wont log
                if (OFFLINE_ERROR_CODE === _.get(error, 'status')) {
                    return;
                }

                // Track the error
                let stack;
                stackTrace
                   .get({offline: true}).then(_stack => stack = _stack)
                   .catch(err => this._geLoggerProvider.addLog(err, 'ERROR GETTING STACK'))
                   .then(() => this._geLoggerProvider.error('UserService.getUserMissionResults() - Unexpected Error', error, stack));
            });
    }

    /**
     * Shows Mission Modal Page
     * @param {Mission[]} missions      List of missions to display in the slider
     * @param {number}    missionIndex  The mission index to set the inital slide
     */
    showMissionModal(missions: IMission[], missionIndex: number) {
        let missionModal = this.modalCtrl.create(
            'mission-modal', {
                missions: missions,
                missionIndex: missionIndex
            }, {
                // Enable backdrop/overlay
                showBackdrop: true,
                // Enable click on backdrop and close
                enableBackdropDismiss: true,
                cssClass: 'modal-ge'
            });
        // Call to modal
        missionModal.present();
    }

    showUserMissionResultModal(results: IUserMissionResult[]) {
        let missionModal = this.modalCtrl.create(
            'mission-modal', {
                userMissionsResults: results,
                missionIndex: 0
            }, {
                // Enable backdrop/overlay
                showBackdrop: true,
                // Enable click on backdrop and close
                enableBackdropDismiss: true,
                cssClass: 'modal-ge'
            });
        // Call to modal
        missionModal.present();
    }

    /**
     * Ionic webhook that runs when the page is about 
     * to leave and no longer be the active page.
     */
    ionViewWillLeave() {
        this._geToastErrorProvider.dismissAllToast();
    }
}
