import { LightningElement, api, wire } from 'lwc';
import getSimilarBoats from '@salesforce/apex/BoatDataService.getSimilarBoats';
import { NavigationMixin } from 'lightning/navigation'
export default class SimilarBoats extends NavigationMixin(LightningElement) {

    @api similarBy;
    relatedBoats;
    boatId;
    similarBy;
    error;
    

    // public
    @api
    get recordId() {
        return this.boatId;
    }
    set recordId(value) {
        // sets the boatId value
        this.boatId = value;
        // sets the boatId attribute
        this.setAttribute('boatId', value);
    }

    @wire(getSimilarBoats, { boatId: '$boatId', similarBy: '$similarBy'  })
    similarBoats({ error, data }) {
        if (data) {
            this.relatedBoats = data;
            this.error = undefined;
        } else if (error) {
            this.relatedBoats = undefined;
            this.error = error;
        }
    }
    get getTitle() {
        return 'Similar boats by ' + this.similarBy;
    }
    get noBoats() {
        return !(this.relatedBoats && this.relatedBoats.length > 0);
    }

    // Navigate to record page
    openBoatDetailPage(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail.boatId,
                objectApiName: boat__c,
                actionName: 'view'
            },
        });
    }

}