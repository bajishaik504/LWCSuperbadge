import { LightningElement,wire,track,api} from 'lwc';
import { MessageContext,publish} from 'lightning/messageService';
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import { refreshApex } from '@salesforce/apex';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Length', fieldName: 'Length__c', type: 'number' },
    { label: 'Price__c', fieldName: 'Price__c', type: 'currency' },
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
];
export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = [];
  columns = columns;
  @api boatTypeId = '';
  @track boats;
  isLoading = false;
  @track draftValues = [];
  
  // wired message context
  @wire(MessageContext) messageContext;
  @wire(getBoats,{boatTypeId:'$boatTypeId'})  
  wiredBoats({error,data}) {
    if(data){
        this.boats = data;
        this.isLoading = false;
    }
    else if(error){
        this.isLoading =false;
    }
  
  }
  
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api searchBoats(boatTypeId) {
      this.boatTypeId = boatTypeId;
      this.notifyLoading(true);
  }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api refresh() { 
    refreshApex(this.boats);
  }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) { 
      this.selectedBoatId = event.detail.boatId;
      this.sendMessageService(this.selectedBoatId);

  }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    const payload = { recordId: boatId };
    publish(this.messageContext, BOATMC, payload);
  }
  
  // This method must save the changes in the Boat Editor
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
      const recordInputs = event.detail.draftValues.slice().map(draft => {
          const fields = Object.assign({}, draft);
          return { fields };
      });
      const promises = recordInputs.map(recordInput => updateRecord(recordInput));
      Promise.all(promises).then(boatrecs => {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Success',
                  message: 'Ship It!',
                  variant: 'success'
              })
          );
          // Clear all draft values
          this.draftValues = [];

          // Display fresh data in the datatable
          return refreshApex(this.boats);
      }).catch(error => {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: error.body.message,
                  variant: 'error'
              })
          );

      });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) { 
      if(isLoading){
          this.dispatchEvent(
               new CustomEvent('loading')
          );
      }
      else{
           this.dispatchEvent(
               new CustomEvent('doneloading')
          );
      }

  }
}